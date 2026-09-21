import { describe, expect, it } from 'vitest';
import { estimateTokens, fitToBudget, renderComponent } from '../src/format.ts';
import { createTools, runTool, toJsonSchemaTools } from '../src/tools.ts';
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

describe('бюджет контекста', () => {
  it('режет по секциям и сообщает, сколько опущено', () => {
    const sections = ['a'.repeat(360), 'b'.repeat(360), 'c'.repeat(360)];
    const result = fitToBudget(sections, 150);
    expect(result.omittedSections).toBe(2);
    expect(result.text).toMatch(/опущено разделов: 2/);
    expect(result.usedTokens).toBe(estimateTokens(sections[0] ?? ''));
  });

  it('никогда не выбрасывает первую секцию', () => {
    const result = fitToBudget(['x'.repeat(3600)], 10);
    expect(result.omittedSections).toBe(0);
    expect(result.text.startsWith('x')).toBe(true);
  });

  it('сигнатура умещается в одну строку и помечает deprecated', () => {
    const modal = index.components.find((component) => component.name === 'JxModal');
    const dropdown = index.components.find((component) => component.name === 'JxDropdown');
    expect(renderComponent(modal!, 'signature')).toBe('<JxModal title: ReactNode; open?: boolean />');
    expect(renderComponent(dropdown!, 'signature')).toMatch(/DEPRECATED: используйте JxMenu/);
  });
});
