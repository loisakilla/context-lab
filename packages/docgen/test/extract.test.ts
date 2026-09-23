import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { extract } from '../src/extract.ts';
import { createLibraryProgram } from '../src/program.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = path.join(here, 'fixtures', 'ui-kit');
const jinx = path.resolve(here, '../../../node_modules/@jinx-ui/react');

describe('экстрактор на фикстуре с JSDoc, forwardRef и наследованием', () => {
  const lib = createLibraryProgram({ packageRoot: fixture });
  const { components } = extract(lib);
  const byName = new Map(components.map((component) => [component.name, component]));

  it('находит компоненты и не принимает внутренние типы за компоненты', () => {
    expect([...byName.keys()]).toEqual(['Button', 'DataTable', 'Dropdown', 'Modal', 'Select', 'Tabs', 'Toast']);
  });

  it('разворачивает пропсы forwardRef-компонента с дефолтами и union-значениями', () => {
    const button = byName.get('Button');
    const variant = button?.props.find((prop) => prop.name === 'variant');
    expect(variant).toMatchObject({
      required: false,
      defaultValue: '"primary"',
      unionValues: ['"primary"', '"secondary"', '"ghost"', '"danger"'],
      description: 'Визуальный стиль кнопки.',
    });
    expect(button?.props.find((prop) => prop.name === 'children')?.required).toBe(true);
    expect(button?.props.map((prop) => prop.name)).not.toContain('onClick');
    expect(button?.inheritsFrom).toEqual(['ButtonHTMLAttributes<HTMLButtonElement>']);
  });

  it('берёт описание, ключевые слова и примеры из JSDoc', () => {
    const modal = byName.get('Modal');
    expect(modal?.description).toMatch(/^Модальное окно с блокировкой прокрутки/);
    expect(modal?.keywords).toContain('модалка');
    expect(modal?.examples[0]).toMatchObject({ title: 'Диалог подтверждения удаления' });
    expect(modal?.examples[0]?.code).toMatch(/^<Modal/);
  });

  it('помечает deprecated-компоненты и deprecated-пропсы', () => {
    expect(byName.get('Dropdown')).toMatchObject({ status: 'deprecated' });
    expect(byName.get('Dropdown')?.deprecated).toMatch(/Используйте Select/);
    expect(byName.get('Button')?.props.find((prop) => prop.name === 'color')?.deprecated).toMatch(/токенов/);
  });

  it('указывает файл и строку объявления относительно корня библиотеки', () => {
    expect(byName.get('Dropdown')).toMatchObject({ file: 'legacy/Dropdown.tsx' });
    expect(byName.get('Button')?.line).toBeGreaterThan(20);
  });
});

describe('экстрактор на опубликованном пакете Jinx UI из node_modules', () => {
  const lib = createLibraryProgram({ packageRoot: jinx });
  const { components, hooks } = extract(lib, { entry: 'dist/runtime.d.ts' });
  const byName = new Map(components.map((component) => [component.name, component]));

  it('находит все экспортированные компоненты рантайма', () => {
    expect(lib.mode).toBe('package');
    expect(components.length).toBeGreaterThanOrEqual(40);
    expect(byName.has('JxButton')).toBe(true);
    expect(byName.has('JxToastViewport')).toBe(true);
    expect(byName.has('useJxToastQueue')).toBe(false);
  });

  it('у JxButton три собственных пропса: типы из .d.ts, значения по умолчанию и классы из скомпилированного .js', () => {
    const button = byName.get('JxButton');
    expect(button?.props.map((prop) => prop.name).sort()).toEqual(['iconOnly', 'size', 'variant']);
    expect(button?.props.find((prop) => prop.name === 'variant')?.unionValues).toEqual(['"primary"', '"secondary"', '"ghost"', '"outline"', '"danger"']);
    expect(button?.props.find((prop) => prop.name === 'size')?.defaultValue).toBe("'md'");
    expect(button?.inheritsFrom).toEqual(['ButtonHTMLAttributes<HTMLButtonElement>']);
    expect(button?.cssClasses).toContain('jx-btn--danger');
    expect(button?.file).toBe('dist/components/Button.d.ts');
  });

  it('обязательные пропсы объектных типов помечаются как required', () => {
    const select = byName.get('JxSelect');
    expect(select?.props.find((prop) => prop.name === 'options')).toMatchObject({ required: true, type: 'JxSelectOption[]' });
    expect(select?.props.find((prop) => prop.name === 'onValueChange')?.type).toBe('(value: string) => void');
  });

  it('показывает объявленный тип пропса, а не пересечение с DOM-атрибутом', () => {
    const alert = byName.get('JxAlert');
    expect(alert?.props.find((prop) => prop.name === 'title')).toMatchObject({ type: 'ReactNode', required: true });
    expect(alert?.props.find((prop) => prop.name === 'intent')?.unionValues).toEqual(['"danger"', '"warning"', '"info"', '"success"']);
  });

  it('хуки попадают в отдельный список с сигнатурой', () => {
    const hook = hooks.find((candidate) => candidate.name === 'useControllableState');
    expect(hook?.signature).toMatch(/controlledValue/);
    expect(hook?.file).toBe('dist/hooks/useControllableState.d.ts');
  });

  it('идёт за классами во внутренний компонент того же файла, которым рендерится экспортируемый', () => {
    const calendar = byName.get('JxCalendar');
    expect(calendar?.cssClasses).toEqual(expect.arrayContaining(['jx-calendar', 'jx-cal-grid', 'jx-cal-day--selected']));
    const range = byName.get('JxDateRangePicker');
    expect(range?.cssClasses).toEqual(expect.arrayContaining(['jx-daterange-field', 'jx-cal-day--range-start', 'jx-cal-day--in-range']));
  });
});
