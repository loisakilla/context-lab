import postcss from 'postcss';
import type { TokenDoc } from '@context-lab/index-tools';

const COLOR_VALUE = /^(#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(|oklab\(|color\()/i;

const GROUP_BY_PREFIX: Array<[RegExp, string]> = [
  [/^--jx-r(-|$)/, 'radius'],
  [/^--jx-shadow/, 'shadow'],
  [/^--jx-font/, 'font'],
  [/^--jx-(ease|dur|motion)/, 'motion'],
  [/^--jx-(space|gap|size)/, 'spacing'],
];

export function groupOf(name: string, value: string): string {
  for (const [pattern, group] of GROUP_BY_PREFIX) {
    if (pattern.test(name)) return group;
  }
  if (COLOR_VALUE.test(value.trim())) return 'color';
  return 'other';
}

export function parseTokensCss(css: string): TokenDoc[] {
  const root = postcss.parse(css);
  const tokens = new Map<string, TokenDoc>();

  root.walkRules((rule) => {
    const selectors = rule.selector.split(',').map((selector) => selector.replace(/\s+/g, ' ').trim());
    rule.walkDecls((declaration) => {
      if (!declaration.prop.startsWith('--')) return;
      const token = tokens.get(declaration.prop) ?? {
        name: declaration.prop,
        group: groupOf(declaration.prop, declaration.value),
        value: '',
        scopes: {},
      };
      for (const selector of selectors) token.scopes[selector] = declaration.value.trim();
      tokens.set(declaration.prop, token);
    });
  });

  const list = [...tokens.values()];
  for (const token of list) {
    token.value = token.scopes[':root'] ?? Object.values(token.scopes)[0] ?? '';
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}
