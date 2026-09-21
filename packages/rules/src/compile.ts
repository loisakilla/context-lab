import type { CompiledFile, CompileTarget, ResolvedRule, Resolution } from './types.ts';

function banner(resolution: Resolution, target: string): string {
  return `<!-- Сгенерировано context-lab rules: набор ${resolution.set} (цепочка ${resolution.chain.join(' → ')}), цель ${target}. Правки вносите в rules/, затем npm run rules:compile. -->`;
}

function scoped(rule: ResolvedRule): boolean {
  return rule.appliesTo.length > 0 && !rule.appliesTo.every((glob) => glob === '**' || glob === '**/*');
}

function ruleBlock(rule: ResolvedRule, withScope: boolean): string {
  const lines = [`## ${rule.title}`, '', rule.body];
  const meta: string[] = [];
  if (withScope && scoped(rule)) meta.push(`Применяется к: ${rule.appliesTo.join(', ')}`);
  if (rule.taskTypes.length > 0) meta.push(`Тип задач: ${rule.taskTypes.join(', ')}`);
  if (meta.length > 0) lines.push('', meta.map((item) => `_${item}_`).join('  '));
  lines.push('', `<!-- ${rule.qualifiedId}@${rule.version}${rule.overrides ? `, переопределяет ${rule.overrides}` : ''}${rule.refines ? `, уточняет ${rule.refines}` : ''} -->`);
  return lines.join('\n');
}

function markdownDocument(title: string, resolution: Resolution, rules: ResolvedRule[], target: string, withScope: boolean): string {
  const parts = [banner(resolution, target), '', `# ${title}`, ''];
  for (const rule of rules) parts.push(ruleBlock(rule, withScope), '');
  if (resolution.omitted.length > 0) parts.push(`<!-- Не вошли в бюджет: ${resolution.omitted.map((rule) => rule.qualifiedId).join(', ')} -->`, '');
  return `${parts.join('\n').trimEnd()}\n`;
}

function plainText(resolution: Resolution): string {
  const parts: string[] = [`Правила набора ${resolution.set} (${resolution.rules.length} правил, ~${resolution.tokens} токенов):`, ''];
  resolution.rules.forEach((rule, position) => {
    const scope = scoped(rule) ? ` [${rule.appliesTo.join(', ')}]` : '';
    parts.push(`${position + 1}. ${rule.title}${scope}`, rule.body.replace(/^/gm, '   '), '');
  });
  if (resolution.omitted.length > 0) parts.push(`(не вошли в бюджет: ${resolution.omitted.map((rule) => rule.title).join('; ')})`);
  return `${parts.join('\n').trimEnd()}\n`;
}

function frontmatter(fields: Record<string, string | boolean | string[]>): string {
  const lines = Object.entries(fields).map(([key, value]) => {
    if (Array.isArray(value)) return `${key}: [${value.map((item) => JSON.stringify(item)).join(', ')}]`;
    if (typeof value === 'boolean') return `${key}: ${value ? 'true' : 'false'}`;
    return `${key}: ${JSON.stringify(value)}`;
  });
  return `---\n${lines.join('\n')}\n---\n`;
}

export function compile(resolution: Resolution, target: CompileTarget): CompiledFile[] {
  const rules = resolution.rules;
  switch (target) {
    case 'text':
      return [{ path: `${resolution.set}.md`, content: plainText(resolution) }];
    case 'agents':
      return [{ path: 'AGENTS.md', content: markdownDocument(`Правила для агентов: ${resolution.set}`, resolution, rules, target, true) }];
    case 'claude': {
      const global = rules.filter((rule) => !scoped(rule));
      const files: CompiledFile[] = [{ path: 'CLAUDE.md', content: markdownDocument(`Правила проекта ${resolution.set}`, resolution, global, target, false) }];
      for (const rule of rules.filter(scoped)) {
        files.push({ path: `.claude/rules/${rule.id}.md`, content: `${frontmatter({ paths: rule.appliesTo })}${ruleBlock(rule, false)}\n` });
      }
      return files;
    }
    case 'cursor':
      return rules.map((rule) => ({
        path: `.cursor/rules/${rule.id}.mdc`,
        content: `${frontmatter({ description: rule.title, globs: scoped(rule) ? rule.appliesTo : [], alwaysApply: !scoped(rule) })}${ruleBlock(rule, false)}\n`,
      }));
    case 'copilot': {
      const global = rules.filter((rule) => !scoped(rule));
      const files: CompiledFile[] = [{ path: '.github/copilot-instructions.md', content: markdownDocument(`Инструкции для Copilot: ${resolution.set}`, resolution, global, target, false) }];
      for (const rule of rules.filter(scoped)) {
        files.push({ path: `.github/instructions/${rule.id}.instructions.md`, content: `${frontmatter({ applyTo: rule.appliesTo.join(', ') })}${ruleBlock(rule, false)}\n` });
      }
      return files;
    }
    default:
      throw new Error(`Неизвестная цель компиляции ${String(target)}`);
  }
}

export function compileAll(resolution: Resolution, targets: readonly CompileTarget[]): CompiledFile[] {
  return targets.flatMap((target) => compile(resolution, target));
}

export function renderRulesText(resolution: Resolution): string {
  return plainText(resolution);
}
