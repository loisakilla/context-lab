import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { createTools, runTool } from '@context-lab/index-tools';
import { loadIndex } from '@context-lab/docgen';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const tsx = path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs');

let client: Client;

function textOf(result: unknown): string {
  const content = (result as { content?: Array<{ type: string; text?: string }> }).content ?? [];
  return content.filter((part) => part.type === 'text').map((part) => part.text ?? '').join('\n');
}

beforeAll(async () => {
  client = new Client({ name: 'context-lab-tests', version: '0.1.0' });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [tsx, path.join(root, 'packages/mcp/src/cli.ts'), 'serve', '--config', path.join(root, 'context-lab.config.json')],
      cwd: root,
      stderr: 'ignore',
    }),
  );
}, 60_000);

afterAll(async () => {
  await client.close();
});

describe('MCP-сервер по stdio', () => {
  it('объявляет инструменты поиска, API, примеров, токенов, документации и правил', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual(['get_component_api', 'get_component_examples', 'get_docs', 'get_rules', 'list_design_tokens', 'search_components']);
  });

  it('search_components понимает русский запрос', async () => {
    const text = textOf(await client.callTool({ name: 'search_components', arguments: { query: 'модальное окно подтверждения' } }));
    expect(text).toMatch(/JxModal/);
    expect(text).toMatch(/токенов контекста/);
  });

  it('get_component_api отдаёт реальные пропсы JxButton с дефолтами и наследованием', async () => {
    const text = textOf(await client.callTool({ name: 'get_component_api', arguments: { name: 'JxButton' } }));
    expect(text).toMatch(/variant\?: JxButtonVariant = 'primary'/);
    expect(text).toMatch(/values: "primary" \| "secondary" \| "ghost" \| "outline" \| "danger"/);
    expect(text).toMatch(/extends: ButtonHTMLAttributes<HTMLButtonElement>/);
  });

  it('несуществующий компонент возвращает ошибку с подсказками', async () => {
    const result = await client.callTool({ name: 'get_component_api', arguments: { name: 'JxDialog' } });
    expect((result as { isError?: boolean }).isError).toBe(true);
    expect(textOf(result)).toMatch(/Не выдумывайте пропсы/);
  });

  it('get_rules отдаёт правила с наследованием от org и провенансом', async () => {
    const text = textOf(await client.callTool({ name: 'get_rules', arguments: { task: 'ui' } }));
    expect(text).toMatch(/Сначала реальный API, потом разметка/);
    expect(text).toMatch(/Внешние действия только по просьбе/);
    expect(text).toMatch(/org\/ask-before-publish@1\.0\.0 ← org@1\.0\.0/);
    expect(text).toMatch(/Контраст текста не ниже 4\.5:1/);
  });

  it('get_docs отдаёт документ компонента и режет обзор по бюджету', async () => {
    const component = textOf(await client.callTool({ name: 'get_docs', arguments: { component: 'JxModal' } }));
    expect(component).toMatch(/^# JxModal/);
    const overview = textOf(await client.callTool({ name: 'get_docs', arguments: { maxTokens: 400 } }));
    expect(overview).toMatch(/опущено разделов/);
  });

  it('get_docs принимает имя компонента без префикса и в любом регистре', async () => {
    const text = textOf(await client.callTool({ name: 'get_docs', arguments: { component: 'modal' } }));
    expect(text).toMatch(/^# JxModal/);
  });

  it('get_docs не выходит за каталог документации', async () => {
    const result = await client.callTool({ name: 'get_docs', arguments: { component: '../../../../../README' } });
    expect((result as { isError?: boolean }).isError).toBe(true);
    expect(textOf(result)).not.toMatch(/Context Lab/);
  });

  it('промпт и ресурсы доступны', async () => {
    const prompt = await client.getPrompt({ name: 'jinx_rules', arguments: { task: 'сверстать форму настроек' } });
    const text = prompt.messages.map((message) => (message.content as { text?: string }).text ?? '').join('\n');
    expect(text).toMatch(/get_component_api/);
    expect(text).toMatch(/сверстать форму настроек/);
    expect(text).toMatch(/Только токены дизайн-системы/);

    const overview = await client.readResource({ uri: 'context-lab://library' });
    expect((overview.contents[0] as { text?: string }).text).toMatch(/<JxButton /);
    const llms = await client.readResource({ uri: 'context-lab://llms.txt' });
    expect((llms.contents[0] as { text?: string }).text).toMatch(/^# jinx-ui/);
  });

  it('ответ MCP совпадает с браузерной реализацией того же инструмента', async () => {
    const index = loadIndex(path.join(root, 'data/index/jinx-ui.json'));
    const local = runTool(createTools(index), 'get_component_api', { name: 'JxSelect', detail: 'signature' });
    const remote = textOf(await client.callTool({ name: 'get_component_api', arguments: { name: 'JxSelect', detail: 'signature' } }));
    expect(remote).toBe(local.text);
  });
});
