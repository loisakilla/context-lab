import { describe, expect, it } from 'vitest';
import { estimateTokens, fitToBudget, renderComponent } from '../src/format.ts';
import { createTools, runTool, serverInstructions, toJsonSchemaTools, TOOL_NAMES, type RulesQuery } from '../src/tools.ts';
import { sampleIndex } from './helpers.ts';

const index = sampleIndex();
const tools = createTools(index);

describe('инструменты поверх индекса', () => {
  it('объявляют четыре инструмента с JSON Schema для Claude API', () => {
    const schemas = toJsonSchemaTools(tools);
    expect(schemas.map((tool) => tool.name)).toEqual(['search_components', 'get_component_api', 'get_component_examples', 'list_design_tokens']);
    const search = schemas[0]?.input_schema as { properties?: Record<string, unknown>; required?: string[] };
    expect(search.properties).toHaveProperty('query');
    expect(search.required).toEqual(['query']);
  });

  it('search_components отвечает карточками и футером с оценкой токенов', () => {
    const result = runTool(tools, 'search_components', { query: 'модальное окно' });
    expect(result.isError).toBeUndefined();
    expect(result.text).toMatch(/JxModal/);
    expect(result.text).toMatch(/токенов контекста/);
  });

  it('get_component_api показывает дефолты, union-значения и наследование', () => {
    const result = runTool(tools, 'get_component_api', { name: 'JxButton' });
    expect(result.text).toMatch(/variant\?: "primary" \| "danger" = 'primary'/);
    expect(result.text).toMatch(/values: "primary" \| "danger"/);
    expect(result.text).toMatch(/extends: ButtonHTMLAttributes<HTMLButtonElement>/);
    expect(result.text).toMatch(/css: jx-btn jx-btn--primary/);
  });

  it('несуществующий компонент даёт ошибку с подсказкой, а не выдумку', () => {
    const result = runTool(tools, 'get_component_api', { name: 'Modul' });
    expect(result.isError).toBe(true);
    expect(result.text).toMatch(/JxModal/);
    expect(result.text).toMatch(/Не выдумывайте пропсы/);
  });

  it('неверные аргументы отклоняются схемой', () => {
    const result = runTool(tools, 'search_components', { query: '' });
    expect(result.isError).toBe(true);
  });

  it('list_design_tokens фильтрует по группе и показывает значения по темам', () => {
    const result = runTool(tools, 'list_design_tokens', { group: 'color' });
    expect(result.text).toMatch(/--jx-accent: #7747d4/);
    expect(result.text).toMatch(/\[data-theme="dark"\]: #c9a3ff/);
    expect(result.text).not.toMatch(/--jx-r:/);
  });
});

describe('документация и правила как инструменты', () => {
  const docs: Record<string, string> = {
    'llms.txt': '# sample-kit\n\nОбзор.',
    'components/JxModal.md': '# JxModal\n\nМодальное окно.\n\n## Пропсы\n\ntitle',
  };
  const queries: RulesQuery[] = [];
  const full = createTools(index, {
    docs: (relative) => docs[relative],
    rules: {
      defaultSet: 'sample',
      resolve(query) {
        queries.push(query);
        if (query.set === 'missing') throw new Error('Набора «missing» в реестре нет');
        return 'Правила набора sample';
      },
    },
  });

  it('добавляют get_docs и get_rules, только когда им есть что отдавать', () => {
    expect(full.map((tool) => tool.name)).toEqual([...TOOL_NAMES]);
    expect(createTools(index, { docs: (relative) => docs[relative] }).map((tool) => tool.name)).not.toContain('get_rules');
  });

  it('get_docs находит документ по имени компонента без префикса и в любом регистре', () => {
    expect(runTool(full, 'get_docs', { component: 'modal' }).text).toMatch(/^# JxModal/);
    expect(runTool(full, 'get_docs', {}).text).toMatch(/^# sample-kit/);
  });

  it('get_docs отвечает ошибкой с подсказкой на выдуманное имя и не ходит по путям', () => {
    const result = runTool(full, 'get_docs', { component: '../../README' });
    expect(result.isError).toBe(true);
    expect(result.text).toMatch(/нет/);
  });

  it('get_rules передаёт запрос источнику правил и превращает его ошибку в isError', () => {
    expect(runTool(full, 'get_rules', { task: 'ui' }).text).toMatch(/^Правила набора sample/);
    expect(queries.at(-1)).toEqual({ task: 'ui', budget: 2000 });
    const failed = runTool(full, 'get_rules', { set: 'missing' });
    expect(failed.isError).toBe(true);
    expect(failed.text).toMatch(/missing/);
  });

  it('инструкции сервера называют библиотеку и число компонентов', () => {
    expect(serverInstructions(index)).toMatch(new RegExp(`${index.components.length} компонентов`));
    expect(serverInstructions(index)).toMatch(/get_rules/);
  });
});

describe('бюджет контекста', () => {
  it('режет по секциям и сообщает, сколько опущено', () => {
    const sections = ['a'.repeat(360), 'b'.repeat(360), 'c'.repeat(360)];
    const result = fitToBudget(sections, 150);
    expect(result.omittedSections).toBe(2);
    expect(result.text).toMatch(/опущено разделов: 2/);
    expect(result.usedTokens).toBe(estimateTokens(sections[0] ?? ''));
  });

  it('никогда не выбрасывает первую секцию, но говорит, что она сама превышает бюджет', () => {
    const result = fitToBudget(['x'.repeat(3600)], 10);
    expect(result.omittedSections).toBe(0);
    expect(result.text.startsWith('x')).toBe(true);
    expect(result.text).toMatch(/не помещается в бюджет 10/);
  });

  it('называет опущенные разделы и не берёт поздний раздел вместо раннего', () => {
    const result = fitToBudget(['Шапка\n' + 'a'.repeat(300), 'Обязательные пропсы (1)\n' + 'b'.repeat(400), 'Необязательные пропсы (1)\nc'], 120);
    expect(result.text).not.toMatch(/Необязательные пропсы \(1\)\nc/);
    expect(result.text).toMatch(/опущено разделов: 2 \(Обязательные пропсы \(1\); Необязательные пропсы \(1\)\)/);
  });

  it('примеры и токены тоже укладываются в бюджет', () => {
    const examples = runTool(tools, 'get_component_examples', { name: 'JxModal', maxTokens: 100 });
    expect(examples.isError).toBeUndefined();
    const tokens = runTool(tools, 'list_design_tokens', { maxTokens: 100 });
    expect(tokens.text).toMatch(/--jx-/);
  });

  it('сигнатура умещается в одну строку и помечает deprecated', () => {
    const modal = index.components.find((component) => component.name === 'JxModal');
    const dropdown = index.components.find((component) => component.name === 'JxDropdown');
    expect(renderComponent(modal!, 'signature')).toBe('<JxModal title: ReactNode; open?: boolean />');
    expect(renderComponent(dropdown!, 'signature')).toMatch(/DEPRECATED: используйте JxMenu/);
  });
});
