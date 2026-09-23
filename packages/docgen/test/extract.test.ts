import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { buildIndex } from '../src/build.ts';
import { extract } from '../src/extract.ts';
import { createLibraryProgram } from '../src/program.ts';
import { classNamesFromCss } from '../src/tokens.ts';

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

  it('показывает пересечение с DOM-атрибутом, когда оно сужает тип пропса', () => {
    const alert = byName.get('JxAlert');
    expect(alert?.props.find((prop) => prop.name === 'title')).toMatchObject({ type: 'ReactNode & string', required: true });
    expect(alert?.props.find((prop) => prop.name === 'children')?.type).toBe('ReactNode');
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

  it('раскрывает классы-модификаторы из шаблонов по union-типу пропса и оставляет только те, что есть в CSS', () => {
    const css = (file: string) => readFileSync(path.resolve(here, '../../../node_modules/@jinx-ui/core/src', file), 'utf8');
    const knownClasses = new Set([...classNamesFromCss(css('jinx-app.css')), ...classNamesFromCss(css('jinx-skins.css'))]);
    const withCss = new Map(extract(lib, { entry: 'dist/runtime.d.ts', knownClasses }).components.map((component) => [component.name, component]));
    expect(withCss.get('JxAlert')?.cssClasses).toEqual(expect.arrayContaining(['jx-alert--danger', 'jx-alert--info', 'jx-alert--success', 'jx-alert--warning']));
    expect(withCss.get('JxToast')?.cssClasses).toContain('jx-toast--danger');
    expect(withCss.get('JxToast')?.cssClasses).not.toContain('jx-toast--default');
    expect(withCss.get('JxSelect')?.cssClasses).toContain('jx-select-menu');
    expect(withCss.get('JxTagInput')?.cssClasses).toEqual(expect.arrayContaining(['jx-chip', 'jx-chip--active']));
  });

  it('падает с понятной ошибкой, когда точки входа в пакете нет', () => {
    expect(() => extract(lib, { entry: 'dist/runtme.d.ts' })).toThrow(/Точки входа dist\/runtme\.d\.ts нет/);
  });
});

describe('выбор способа разбора и пустой индекс', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'docgen-'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('разбирает опубликованные типы по entry .d.ts, даже если в пакете лежит tsconfig.json', () => {
    const copy = path.join(dir, 'with-tsconfig');
    cpSync(jinx, copy, { recursive: true });
    writeFileSync(path.join(copy, 'tsconfig.json'), JSON.stringify({ include: ['src/**/*'] }), 'utf8');
    const lib = createLibraryProgram({ packageRoot: copy, entry: 'dist/runtime.d.ts' });
    expect(lib.mode).toBe('package');
    expect(extract(lib, { entry: 'dist/runtime.d.ts' }).components.length).toBeGreaterThanOrEqual(40);
  });

  it('не записывает индекс без единого компонента', () => {
    const empty = path.join(dir, 'empty');
    mkdirSync(empty, { recursive: true });
    writeFileSync(path.join(empty, 'package.json'), JSON.stringify({ name: 'empty-kit', version: '1.0.0' }), 'utf8');
    writeFileSync(path.join(empty, 'index.d.ts'), 'export declare const version: string;\n', 'utf8');
    expect(() => buildIndex({ packageRoot: empty, entry: 'index.d.ts', library: { name: 'empty-kit' } })).toThrow(/ни одного компонента/);
  });
});
