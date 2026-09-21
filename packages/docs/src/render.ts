import type { ComponentDoc, HookDoc, LibraryIndex, PropDoc, TokenDoc } from '@context-lab/index-tools';
import { renderSignature } from '@context-lab/index-tools';

function collapse(text: string | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

function escapeCell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function propRow(prop: PropDoc): string {
  const type = prop.unionValues && prop.unionValues.length > 0 ? prop.unionValues.join(' \\| ') : prop.type;
  const cells = [
    `\`${prop.name}\``,
    `\`${escapeCell(type)}\``,
    prop.required ? 'да' : 'нет',
    prop.defaultValue ? `\`${escapeCell(prop.defaultValue)}\`` : '',
    [prop.deprecated ? `**DEPRECATED:** ${collapse(prop.deprecated)}` : '', collapse(prop.description)].filter(Boolean).join(' '),
  ];
  return `| ${cells.join(' | ')} |`;
}

export function renderComponentDoc(component: ComponentDoc, index: LibraryIndex): string {
  const lines: string[] = [`# ${component.name}`, ''];
  if (component.status === 'deprecated') lines.push(`> **DEPRECATED.** ${collapse(component.deprecated) || 'Не использовать в новом коде.'}`, '');
  if (component.description) lines.push(collapse(component.description), '');
  lines.push(`Импорт: \`import { ${component.name} } from '${index.library.package}'\`  `);
  lines.push(`Источник: \`${component.file}:${component.line}\``);
  if (component.keywords.length > 0) lines.push(`Ключевые слова: ${component.keywords.join(', ')}`);
  lines.push('', '## Сигнатура', '', '```tsx', renderSignature(component).split('\n')[0] ?? '', '```', '');

  if (component.inheritsFrom.length > 0) {
    lines.push(`Наследует ${component.inheritsFrom.map((base) => `\`${base}\``).join(', ')}: стандартные DOM-пропсы (className, onClick, aria-*) доступны, но здесь не перечислены.`, '');
  }

  lines.push('## Пропсы', '');
  if (component.props.length === 0) {
    lines.push('Собственных пропсов нет.', '');
  } else {
    lines.push('| Проп | Тип | Обязателен | По умолчанию | Описание |', '|---|---|---|---|---|');
    const ordered = [...component.props].sort((a, b) => (a.required === b.required ? a.name.localeCompare(b.name) : a.required ? -1 : 1));
    for (const prop of ordered) lines.push(propRow(prop));
    lines.push('');
  }

  if (component.cssClasses.length > 0) {
    lines.push('## CSS-классы', '', component.cssClasses.map((name) => `\`${name}\``).join(', '), '');
  }

  if (component.examples.length > 0) {
    lines.push('## Примеры', '');
    component.examples.forEach((example, position) => {
      lines.push(`### ${example.title ?? `Пример ${position + 1}`}`, '', '```tsx', example.code, '```', '');
    });
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

export function renderHookDoc(hook: HookDoc): string {
  const lines = [`- \`${hook.name}${hook.signature}\``];
  if (hook.description) lines.push(`  ${collapse(hook.description)}`);
  lines.push(`  Источник: \`${hook.file}:${hook.line}\``);
  return lines.join('\n');
}

export function renderTokensDoc(tokens: TokenDoc[]): string {
  const lines: string[] = ['# Токены дизайн-системы', '', 'Используйте `var(--токен)` вместо значений: цвета меняются по `data-theme`, радиусы по `data-style`.', ''];
  const groups = new Map<string, TokenDoc[]>();
  for (const token of tokens) {
    const bucket = groups.get(token.group) ?? [];
    bucket.push(token);
    groups.set(token.group, bucket);
  }
  for (const [group, entries] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`## ${group}`, '', '| Токен | Значение | Переопределения |', '|---|---|---|');
    for (const token of entries) {
      const overrides = Object.entries(token.scopes)
        .filter(([selector, value]) => selector !== ':root' && value !== token.value)
        .map(([selector, value]) => `\`${selector}\`: \`${escapeCell(value)}\``)
        .join('; ');
      lines.push(`| \`${token.name}\` | \`${escapeCell(token.value)}\` | ${overrides} |`);
    }
    lines.push('');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

export function renderLlmsTxt(index: LibraryIndex): string {
  const { library } = index;
  const groups = new Map<string, number>();
  for (const token of index.tokens) groups.set(token.group, (groups.get(token.group) ?? 0) + 1);

  const lines: string[] = [
    `# ${library.name} (${library.package}@${library.version})`,
    '',
    `> Библиотека React-компонентов: ${index.components.length} компонентов, ${index.hooks.length} хуков, ${index.tokens.length} CSS-токенов. Версия ${library.version}, коммит ${library.commit.slice(0, 7) || 'n/a'}.`,
    '',
    '## Как пользоваться',
    '',
    `- Импорт: \`import { JxButton } from '${library.package}'\`; стили подключаются пакетами \`@jinx-ui/tokens\` и \`@jinx-ui/core\`.`,
    '- Используйте только перечисленные ниже компоненты и их собственные пропсы. Стандартные DOM-пропсы доступны у компонентов с пометкой extends.',
    '- Цвета, радиусы, тени и шрифты берите из токенов через `var(--jx-*)`, не хардкодом.',
    '- Компоненты с пометкой DEPRECATED в новом коде не используйте.',
    '',
    '## Компоненты',
    '',
  ];

  for (const component of index.components) {
    const summary = component.description ? ` — ${collapse(component.description).split(/(?<=[.!?])\s/)[0]}` : '';
    const signature = renderSignature(component).split('\n')[0] ?? '';
    const extendsNote = component.inheritsFrom.length > 0 ? ` extends ${component.inheritsFrom.join(' & ')}` : '';
    const deprecated = component.status === 'deprecated' ? ' **DEPRECATED**' : '';
    lines.push(`- **${component.name}**${deprecated}${summary}`);
    lines.push(`  \`${signature}\`${extendsNote}`);
  }

  if (index.hooks.length > 0) {
    lines.push('', '## Хуки', '');
    for (const hook of index.hooks) lines.push(renderHookDoc(hook));
  }

  if (index.tokens.length > 0) {
    lines.push('', '## Токены', '');
    for (const [group, count] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const names = index.tokens.filter((token) => token.group === group).map((token) => token.name);
      lines.push(`- ${group} (${count}): ${names.join(', ')}`);
    }
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

export function renderLlmsFull(index: LibraryIndex): string {
  const parts = [renderLlmsTxt(index), ...index.components.map((component) => renderComponentDoc(component, index))];
  if (index.tokens.length > 0) parts.push(renderTokensDoc(index.tokens));
  return parts.join('\n---\n\n');
}
