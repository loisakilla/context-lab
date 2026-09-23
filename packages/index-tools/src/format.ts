import type { ComponentDoc, HookDoc, PropDoc, SearchHit, TokenDoc } from './types.ts';

const CHARS_PER_TOKEN = 3.6;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function indent(text: string, pad: string): string {
  return text
    .split('\n')
    .map((line) => (line.length > 0 ? pad + line : line))
    .join('\n');
}

function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function firstSentence(text: string): string {
  const flat = collapse(text);
  const match = /^(.{0,140}?[.!?])(\s|$)/.exec(flat);
  if (match && match[1]) return match[1];
  return flat.length > 140 ? `${flat.slice(0, 137)}...` : flat;
}

function propSignature(prop: PropDoc): string {
  const optional = prop.required ? '' : '?';
  const value = prop.defaultValue ? ` = ${prop.defaultValue}` : '';
  return `${prop.name}${optional}: ${prop.type}${value}`;
}

function sortedProps(component: ComponentDoc): PropDoc[] {
  return [...component.props].sort((a, b) => {
    if (a.required !== b.required) return a.required ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export function renderSignature(component: ComponentDoc): string {
  const props = sortedProps(component).map(propSignature).join('; ');
  const head = props.length > 0 ? `<${component.name} ${props} />` : `<${component.name} />`;
  const deprecated = component.status === 'deprecated' ? `\nDEPRECATED: ${component.deprecated ?? 'не использовать в новом коде'}` : '';
  return head + deprecated;
}

export function renderSearchHit(hit: SearchHit): string {
  const { component } = hit;
  const summary = component.description ? firstSentence(component.description) : 'без описания';
  const flags: string[] = [`${component.props.length} props`];
  if (component.examples.length > 0) flags.push(`${component.examples.length} examples`);
  if (component.status === 'deprecated') flags.push('DEPRECATED');

  return [
    `${component.name} — ${summary}`,
    `  ${component.file}:${component.line} · ${flags.join(' · ')} · match: ${hit.matchedOn.join(', ') || 'n/a'}`,
    `  ${renderSignature(component).split('\n')[0]}`,
  ].join('\n');
}

function renderPropBlock(prop: PropDoc): string {
  const lines = [`  ${propSignature(prop)}`];
  if (prop.unionValues && prop.unionValues.length > 0) {
    lines.push(`      values: ${prop.unionValues.join(' | ')}`);
  }
  if (prop.description) lines.push(indent(collapse(prop.description), '      '));
  if (prop.deprecated) lines.push(`      DEPRECATED: ${prop.deprecated}`);
  return lines.join('\n');
}

export function renderExampleSections(component: ComponentDoc): string[] {
  if (component.examples.length === 0) return [`${component.name}: примеров в документации нет.`];

  const blocks = component.examples.map((example, position) => {
    const title = example.title ?? `Пример ${position + 1}`;
    return `${title}\n${indent(example.code, '  ')}`;
  });
  return [`${component.name} — примеры использования`, ...blocks];
}

export function renderExamples(component: ComponentDoc): string {
  return renderExampleSections(component).join('\n\n');
}

export function renderComponentSections(component: ComponentDoc): string[] {
  const sections: string[] = [];
  const header = [component.name, `src: ${component.file}:${component.line}`];
  if (component.description) header.splice(1, 0, collapse(component.description));
  if (component.status === 'deprecated') header.push(`DEPRECATED: ${component.deprecated ?? 'не использовать в новом коде'}`);
  if (component.keywords.length > 0) header.push(`keywords: ${component.keywords.join(', ')}`);
  if (component.inheritsFrom.length > 0) {
    header.push(`extends: ${component.inheritsFrom.join(', ')} — стандартные пропсы наследуются и здесь не перечислены`);
  }
  if (component.cssClasses.length > 0) header.push(`css: ${component.cssClasses.join(' ')}`);
  sections.push(header.join('\n'));

  const props = sortedProps(component);
  const required = props.filter((prop) => prop.required);
  const optional = props.filter((prop) => !prop.required);

  if (required.length > 0) {
    sections.push([`Обязательные пропсы (${required.length})`, ...required.map(renderPropBlock)].join('\n'));
  }
  if (optional.length > 0) {
    sections.push([`Необязательные пропсы (${optional.length})`, ...optional.map(renderPropBlock)].join('\n'));
  }
  if (props.length === 0) sections.push('Собственных пропсов не объявлено.');

  if (component.examples.length > 0) sections.push(renderExamples(component));

  return sections;
}

export function renderComponent(component: ComponentDoc, detail: 'signature' | 'full'): string {
  if (detail === 'signature') return renderSignature(component);
  return renderComponentSections(component).join('\n\n');
}

export function renderHook(hook: HookDoc): string {
  const lines = [`${hook.name}${hook.signature}`, `  src: ${hook.file}:${hook.line}`];
  if (hook.description) lines.push(indent(collapse(hook.description), '  '));
  return lines.join('\n');
}

export function renderTokens(tokens: TokenDoc[]): string {
  if (tokens.length === 0) return 'Токенов не найдено.';

  const groups = new Map<string, TokenDoc[]>();
  for (const token of tokens) {
    const bucket = groups.get(token.group);
    if (bucket) bucket.push(token);
    else groups.set(token.group, [token]);
  }

  const blocks: string[] = [];
  for (const [group, entries] of groups) {
    const lines = entries.map((token) => {
      const global = token.scopes[':root'] !== undefined;
      const scopes = Object.entries(token.scopes)
        .filter(([selector, value]) => selector !== ':root' && (!global || value !== token.value))
        .map(([selector, value]) => `${selector}: ${value}`);
      const description = token.description ? `  — ${collapse(token.description)}` : '';
      if (!global) return `  ${token.name}: только ${scopes.join('; ')}${description}`;
      const suffix = scopes.length > 0 ? `  (${scopes.join('; ')})` : '';
      return `  ${token.name}: ${token.value}${suffix}${description}`;
    });
    blocks.push([`${group} (${entries.length})`, ...lines].join('\n'));
  }
  return blocks.join('\n\n');
}

export interface BudgetResult {
  text: string;
  usedTokens: number;
  omittedSections: number;
}

function sectionTitle(section: string): string {
  const first = (section.split('\n', 1)[0] ?? '').replace(/^#+\s*/, '').trim();
  return first.length > 60 ? `${first.slice(0, 57)}…` : first;
}

export function fitToBudget(sections: string[], maxTokens: number, hint = 'Запросите недостающее точечно через get_component_api или get_component_examples.'): BudgetResult {
  const kept: string[] = [];
  const omitted: string[] = [];
  let used = 0;

  for (const section of sections) {
    const cost = estimateTokens(section);
    if (omitted.length > 0 || (kept.length > 0 && used + cost > maxTokens)) {
      omitted.push(sectionTitle(section));
      continue;
    }
    kept.push(section);
    used += cost;
  }

  if (used > maxTokens) {
    kept.push(`[первый раздел занимает ~${used} токенов и один не помещается в бюджет ${maxTokens}: он отдан целиком, чтобы не обрывать его на середине]`);
  }
  if (omitted.length > 0) {
    kept.push(`[опущено разделов: ${omitted.length} (${omitted.join('; ')}) — бюджет ${maxTokens} токенов исчерпан. ${hint}]`);
  }

  return { text: kept.join('\n\n'), usedTokens: used, omittedSections: omitted.length };
}

export function withFooter(text: string): string {
  return `${text}\n\n[~${estimateTokens(text)} токенов контекста]`;
}
