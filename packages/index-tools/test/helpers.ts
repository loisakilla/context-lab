import type { ComponentDoc, LibraryIndex } from '../src/types.ts';

export function component(overrides: Partial<ComponentDoc> & { name: string }): ComponentDoc {
  return {
    file: `src/components/${overrides.name}.tsx`,
    line: 1,
    keywords: [],
    status: 'stable',
    props: [],
    inheritsFrom: [],
    cssClasses: [],
    examples: [],
    ...overrides,
  };
}

export function sampleIndex(): LibraryIndex {
  return {
    schemaVersion: 2,
    library: { name: 'sample-kit', package: '@sample/react', version: '1.2.3', commit: 'abc123' },
    hooks: [],
    tokens: [
      { name: '--jx-accent', group: 'color', value: '#7747d4', scopes: { ':root': '#7747d4', '[data-theme="dark"]': '#c9a3ff' } },
      { name: '--jx-r', group: 'radius', value: '4px', scopes: { ':root': '4px' } },
    ],
    components: [
      component({
        name: 'JxButton',
        description: 'Кнопка действия с вариантами оформления.',
        keywords: ['кнопка', 'button', 'действие'],
        props: [
          { name: 'variant', type: '"primary" | "danger"', required: false, defaultValue: "'primary'", unionValues: ['"primary"', '"danger"'] },
          { name: 'iconOnly', type: 'boolean', required: false },
        ],
        inheritsFrom: ['ButtonHTMLAttributes<HTMLButtonElement>'],
        cssClasses: ['jx-btn', 'jx-btn--primary'],
      }),
      component({
        name: 'JxModal',
        description: 'Модальное окно с ловушкой фокуса.',
        keywords: ['модальное окно', 'модалка', 'dialog', 'диалог'],
        props: [
          { name: 'title', type: 'ReactNode', required: true },
          { name: 'open', type: 'boolean', required: false },
        ],
        examples: [{ title: 'Подтверждение удаления', code: '<JxModal title="Удалить?" open />' }],
      }),
      component({
        name: 'JxDropdown',
        description: 'Старое выпадающее меню.',
        keywords: ['dropdown'],
        status: 'deprecated',
        deprecated: 'используйте JxMenu',
      }),
      component({
        name: 'JxMenu',
        description: 'Меню действий.',
        keywords: ['меню', 'menu', 'dropdown'],
      }),
    ],
  };
}
