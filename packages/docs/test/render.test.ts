import { describe, expect, it } from 'vitest';
import type { ComponentDescription } from '@context-lab/docgen';
import { sampleIndex } from '../../index-tools/test/helpers.ts';
import { lintDocs } from '../src/lint.ts';
import { renderComponentDoc, renderLlmsFull, renderLlmsTxt } from '../src/render.ts';
import { renderDocsBundle } from '../src/write.ts';

const index = sampleIndex();

describe('llms.txt', () => {
  const text = renderLlmsTxt(index);

  it('начинается с заголовка, сводки и правил использования', () => {
    expect(text.startsWith('# sample-kit (@sample/react@1.2.3)')).toBe(true);
    expect(text).toMatch(/> Библиотека React-компонентов: 4 компонентов/);
    expect(text).toMatch(/var\(--jx-\*\)/);
  });

  it('перечисляет компоненты с сигнатурой, наследованием и пометкой deprecated', () => {
    expect(text).toMatch(/- \*\*JxButton\*\* — Кнопка действия с вариантами оформления\.\n {2}`<JxButton iconOnly\?: boolean; variant\?: "primary" \| "danger" = 'primary' \/>` extends ButtonHTMLAttributes<HTMLButtonElement>/);
    expect(text).toMatch(/- \*\*JxDropdown\*\* \*\*DEPRECATED\*\*/);
  });

  it('группирует токены по группам', () => {
    expect(text).toMatch(/- color \(1\): --jx-accent/);
    expect(text).toMatch(/- radius \(1\): --jx-r/);
  });
});

describe('документ компонента', () => {
  const modal = index.components.find((component) => component.name === 'JxModal')!;
  const doc = renderComponentDoc(modal, index);

  it('содержит импорт, таблицу пропсов и примеры', () => {
    expect(doc).toMatch(/^# JxModal/);
    expect(doc).toMatch(/import \{ JxModal \} from '@sample\/react'/);
    expect(doc).toMatch(/\| `title` \| `ReactNode` \| да \|/);
    expect(doc).toMatch(/\| `open` \| `boolean` \| нет \|/);
    expect(doc).toMatch(/### Подтверждение удаления\n\n```tsx\n<JxModal title="Удалить\?" open \/>\n```/);
  });

  it('llms-full содержит все документы, а бандл — файл на каждый компонент', () => {
    const full = renderLlmsFull(index);
    for (const component of index.components) expect(full).toContain(`# ${component.name}`);
    const bundle = renderDocsBundle(index);
    expect(Object.keys(bundle.files).sort()).toEqual([
      'components/JxButton.md',
      'components/JxDropdown.md',
      'components/JxMenu.md',
      'components/JxModal.md',
      'index.json',
      'llms-full.txt',
      'llms.txt',
      'tokens.md',
    ]);
  });
});

describe('lintDocs', () => {
  it('ловит описание несуществующего компонента и несуществующего пропса', () => {
    const descriptions = new Map<string, ComponentDescription>([
      ['JxButton', { component: 'JxButton', description: 'ок', keywords: [], props: { variant: 'стиль', colour: 'нет такого' }, examples: [{ code: '<JxButton />' }] }],
      ['JxGhost', { component: 'JxGhost', description: 'призрак', keywords: [], props: {}, examples: [] }],
    ]);
    const issues = lintDocs(index, descriptions);
    expect(issues.filter((issue) => issue.level === 'error').map((issue) => issue.message)).toEqual([
      'в описании есть проп colour, которого нет в типах компонента',
      'описание есть, а компонента JxGhost в библиотеке нет',
    ]);
    expect(issues.filter((issue) => issue.level === 'warning').map((issue) => issue.component)).toEqual(['JxDropdown', 'JxMenu', 'JxModal']);
  });
});
