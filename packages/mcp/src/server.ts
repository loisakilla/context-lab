import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { createTools, estimateTokens, findComponent, fitToBudget, libraryOverview, libraryRulesPrompt, suggestNames, withFooter, type LibraryIndex, type ToolResult } from '@context-lab/index-tools';
import { renderRulesText, resolveRules, type Registry, type RuleTarget } from '@context-lab/rules';

export interface ServerOptions {
  index: LibraryIndex;
  registry?: Registry;
  rulesSet?: string;
  docsDir?: string;
  version?: string;
}

const DEFAULT_DOCS_BUDGET = 2500;

function textResult(result: ToolResult) {
  return {
    content: [{ type: 'text' as const, text: result.text }],
    ...(result.isError ? { isError: true } : {}),
  };
}

function readDoc(docsDir: string | undefined, relative: string): string | undefined {
  if (!docsDir) return undefined;
  const file = path.resolve(docsDir, relative);
  const inside = path.relative(path.resolve(docsDir), file);
  if (inside.startsWith('..') || path.isAbsolute(inside)) return undefined;
  return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
}

export function createServer(options: ServerOptions): McpServer {
  const { index } = options;
  const rulesSet = options.rulesSet ?? index.library.name;
  const server = new McpServer(
    { name: 'context-lab', version: options.version ?? '0.1.0' },
    {
      instructions:
        `MCP-сервер Context Lab по библиотеке ${index.library.name} (${index.library.package}@${index.library.version}): ${index.components.length} компонентов, ${index.tokens.length} токенов. ` +
        'Перед тем как писать разметку с этими компонентами, возьмите их реальный API через get_component_api, а правила работы через get_rules. ' +
        'Пропсы, которых нет в ответе сервера, в библиотеке не существуют.',
    },
  );

  for (const spec of createTools(index)) {
    server.registerTool(spec.name, { title: spec.title, description: spec.description, inputSchema: spec.shape }, async (args) => textResult(spec.run(args as never)));
  }

  server.registerTool(
    'get_docs',
    {
      title: 'AI-документация библиотеки',
      description:
        'Отдаёт сгенерированную документацию: обзор llms.txt, документ конкретного компонента или таблицу токенов. Документация собирается из исходников в CI и соответствует версии библиотеки.',
      inputSchema: {
        component: z.string().optional().describe('Имя компонента, например JxModal; без него вернётся обзор llms.txt'),
        section: z.enum(['overview', 'tokens']).optional().describe('overview — llms.txt, tokens — таблица токенов'),
        maxTokens: z.number().int().min(200).max(20000).optional().describe('Бюджет ответа, по умолчанию 2500'),
      },
    },
    async ({ component, section, maxTokens }) => {
      const found = component ? findComponent(index, component) : undefined;
      if (component && !found) {
        const suggestions = suggestNames(index, component);
        const hint = suggestions.length > 0 ? `Похожие компоненты: ${suggestions.join(', ')}.` : 'Проверьте имя через search_components.';
        return textResult({ text: `Компонента "${component}" в библиотеке ${index.library.name} нет. ${hint}`, isError: true });
      }
      const relative = found ? `components/${found.name}.md` : section === 'tokens' ? 'tokens.md' : 'llms.txt';
      const text = readDoc(options.docsDir, relative);
      if (!text) {
        return textResult({ text: found ? `Документа для ${found.name} нет: выполните npm run docs:build.` : 'Документация не собрана: выполните npm run docs:build.', isError: true });
      }
      const budget = fitToBudget(text.split(/\n(?=#{1,3} )/), maxTokens ?? DEFAULT_DOCS_BUDGET, 'Запросите документ конкретного компонента через get_docs с параметром component.');
      return textResult({ text: withFooter(budget.text) });
    },
  );

  server.registerTool(
    'get_rules',
    {
      title: 'Правила для агента',
      description:
        'Возвращает эффективный набор правил работы с библиотекой и проектом: с наследованием от общих правил, приоритетами и провенансом. Вызывайте перед задачей на вёрстку и подставляйте правила в контекст.',
      inputSchema: {
        set: z.string().optional().describe(`Набор правил, по умолчанию ${rulesSet}`),
        task: z.string().optional().describe('Тип задачи: ui, fix, refactor, docs, test'),
        file: z.string().optional().describe('Путь файла, для которого нужны правила'),
        target: z.enum(['claude', 'cursor', 'copilot', 'agents']).optional().describe('Агент, для которого собираются правила'),
        budget: z.number().int().min(100).max(20000).optional().describe('Бюджет токенов на набор'),
      },
    },
    async ({ set, task, file, target, budget }) => {
      if (!options.registry) return textResult({ text: 'Реестр правил не подключён.', isError: true });
      try {
        const resolution = resolveRules(options.registry, set ?? rulesSet, {
          ...(task ? { taskType: task } : {}),
          ...(file ? { filePath: file } : {}),
          ...(target ? { target: target as RuleTarget } : {}),
          ...(budget ? { budget } : {}),
        });
        const provenance = resolution.rules.map((rule) => `${rule.qualifiedId}@${rule.version} ← ${rule.definedIn}${rule.overrides ? `, переопределяет ${rule.overrides}` : ''}`).join('\n');
        return textResult({ text: withFooter(`${renderRulesText(resolution)}\nПровенанс:\n${provenance}`) });
      } catch (error) {
        return textResult({ text: error instanceof Error ? error.message : String(error), isError: true });
      }
    },
  );

  server.registerPrompt(
    'jinx_rules',
    {
      title: 'Правила работы с библиотекой',
      description: 'Версионированные правила для ассистента: как пользоваться библиотекой компонентов и инструментами сервера, чтобы не выдумывать API.',
      argsSchema: { task: z.string().optional().describe('Задача, которую предстоит решить') },
    },
    ({ task }) => {
      const base = libraryRulesPrompt(index, task);
      const registryText = options.registry ? `\n\n${renderRulesText(resolveRules(options.registry, rulesSet, { taskType: 'ui', target: 'claude' }))}` : '';
      return { messages: [{ role: 'user' as const, content: { type: 'text' as const, text: `${base}${registryText}` } }] };
    },
  );

  server.registerResource(
    'library-overview',
    'context-lab://library',
    { title: `Обзор библиотеки ${index.library.name}`, description: 'Однострочные сигнатуры всех компонентов: дешёвый обзор всей библиотеки.', mimeType: 'text/plain' },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/plain', text: libraryOverview(index) }] }),
  );

  const llms = readDoc(options.docsDir, 'llms.txt');
  if (llms) {
    server.registerResource(
      'llms-txt',
      'context-lab://llms.txt',
      { title: 'llms.txt', description: `AI-документация ${index.library.name}: обзор, ~${estimateTokens(llms)} токенов.`, mimeType: 'text/markdown' },
      async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: llms }] }),
    );
  }

  return server;
}
