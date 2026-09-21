import { describe, expect, it } from 'vitest';
import { parseDescription } from '../src/descriptions.ts';
import { groupOf, parseTokensCss } from '../src/tokens.ts';

describe('parseTokensCss', () => {
  const css = `
:root,
[data-theme="dark"] {
  --jx-bg: #0c0a14;
  --jx-accent-soft: rgba(201, 163, 255, 0.14);
  --jx-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.6);
}
[data-theme="light"] {
  --jx-bg: #f5f2e9;
}
:root {
  --jx-r: 14px;
  --jx-font-display: "Fraunces", ui-serif, serif;
  --jx-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
[data-style="brutal"] {
  --jx-r: 4px;
}
`;
  const tokens = parseTokensCss(css);
  const byName = new Map(tokens.map((token) => [token.name, token]));

  it('собирает значения по селекторам и берёт :root как основное', () => {
    expect(byName.get('--jx-bg')).toMatchObject({
      value: '#0c0a14',
      scopes: { ':root': '#0c0a14', '[data-theme="dark"]': '#0c0a14', '[data-theme="light"]': '#f5f2e9' },
    });
    expect(byName.get('--jx-r')?.scopes).toEqual({ ':root': '14px', '[data-style="brutal"]': '4px' });
  });

  it('раскладывает токены по группам', () => {
    expect(byName.get('--jx-bg')?.group).toBe('color');
    expect(byName.get('--jx-accent-soft')?.group).toBe('color');
    expect(byName.get('--jx-shadow')?.group).toBe('shadow');
    expect(byName.get('--jx-r')?.group).toBe('radius');
    expect(byName.get('--jx-font-display')?.group).toBe('font');
    expect(byName.get('--jx-ease-out')?.group).toBe('motion');
    expect(groupOf('--jx-gap-2', '8px')).toBe('spacing');
    expect(groupOf('--jx-z-modal', '100')).toBe('other');
  });
});

describe('parseDescription', () => {
  const markdown = `---
component: JxButton
keywords: [кнопка, button, действие]
---
Кнопка действия. Варианты маппятся на классы jx-btn--*.

## Props
- variant: визуальный стиль
- iconOnly — квадратная кнопка под иконку

## Examples
### Основное действие
\`\`\`tsx
<JxButton variant="primary">Сохранить</JxButton>
\`\`\`

\`\`\`tsx
<JxButton iconOnly aria-label="Закрыть">×</JxButton>
\`\`\`
`;
  const parsed = parseDescription(markdown, 'Fallback');

  it('читает frontmatter, описание, пропсы и примеры', () => {
    expect(parsed.component).toBe('JxButton');
    expect(parsed.keywords).toEqual(['кнопка', 'button', 'действие']);
    expect(parsed.description).toBe('Кнопка действия. Варианты маппятся на классы jx-btn--*.');
    expect(parsed.props).toEqual({ variant: 'визуальный стиль', iconOnly: 'квадратная кнопка под иконку' });
    expect(parsed.examples).toEqual([
      { title: 'Основное действие', code: '<JxButton variant="primary">Сохранить</JxButton>' },
      { code: '<JxButton iconOnly aria-label="Закрыть">×</JxButton>' },
    ]);
  });

  it('берёт имя из файла, если frontmatter пустой, и понимает deprecated', () => {
    const minimal = parseDescription('---\ndeprecated: используйте JxMenu\n---\nСтарое меню.\n', 'JxDropdown');
    expect(minimal.component).toBe('JxDropdown');
    expect(minimal.status).toBe('deprecated');
    expect(minimal.deprecated).toBe('используйте JxMenu');
  });
});
