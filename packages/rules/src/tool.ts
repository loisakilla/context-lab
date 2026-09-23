import type { RulesQuery, ToolSources } from '@context-lab/index-tools';
import { renderRulesText } from './compile.ts';
import { resolveRules } from './resolve.ts';
import type { Registry } from './types.ts';

export function rulesToolText(registry: Registry, defaultSet: string, query: RulesQuery): string {
  const resolution = resolveRules(registry, query.set ?? defaultSet, {
    ...(query.task ? { taskType: query.task } : {}),
    ...(query.file ? { filePath: query.file } : {}),
    ...(query.target ? { target: query.target } : {}),
    ...(query.budget ? { budget: query.budget } : {}),
  });
  const provenance = resolution.rules
    .map((rule) => `${rule.qualifiedId}@${rule.version} ← ${rule.definedIn}${rule.overrides ? `, переопределяет ${rule.overrides}` : ''}`)
    .join('\n');
  return `${renderRulesText(resolution)}\nПровенанс:\n${provenance}`;
}

export function rulesToolSource(registry: Registry, defaultSet: string): NonNullable<ToolSources['rules']> {
  return { defaultSet, resolve: (query) => rulesToolText(registry, defaultSet, query) };
}
