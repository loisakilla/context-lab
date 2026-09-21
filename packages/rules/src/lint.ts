import { estimateTokens } from '@context-lab/index-tools';
import { inheritanceChain, mergeRules } from './resolve.ts';
import type { LintIssue, Registry } from './types.ts';

const VAGUE = ['по возможности', 'старайся', 'старайтесь', 'желательно', 'если можно', 'если получится', 'как правило', 'try to', 'maybe', 'if possible', 'ideally'];
const DEFAULT_MAX_TOKENS = 200;

export interface LintOptions {
  maxTokensPerRule?: number;
}

export function lintRegistry(registry: Registry, options: LintOptions = {}): LintIssue[] {
  const issues: LintIssue[] = [];
  const maxTokens = options.maxTokensPerRule ?? DEFAULT_MAX_TOKENS;

  for (const set of registry.sets.values()) {
    const seen = new Set<string>();
    for (const rule of set.rules) {
      if (seen.has(rule.id)) issues.push({ level: 'error', set: set.name, rule: rule.id, message: 'дубликат id внутри набора' });
      seen.add(rule.id);

      const tokens = estimateTokens(rule.body);
      if (tokens > maxTokens) issues.push({ level: 'warning', set: set.name, rule: rule.id, message: `правило длиннее бюджета: ~${tokens} токенов при лимите ${maxTokens}` });
      if (rule.body.length === 0) issues.push({ level: 'error', set: set.name, rule: rule.id, message: 'пустой текст правила' });

      const lowered = rule.body.toLowerCase();
      for (const word of VAGUE) {
        if (lowered.includes(word)) issues.push({ level: 'warning', set: set.name, rule: rule.id, message: `расплывчатая формулировка «${word}»: агент не поймёт, обязательно это или нет` });
      }
    }

    for (const parent of set.extends) {
      if (!registry.sets.has(parent)) issues.push({ level: 'error', set: set.name, message: `наследует несуществующий набор "${parent}"` });
    }

    try {
      const chain = inheritanceChain(registry, set.name);
      const { rules } = mergeRules(registry, chain);
      const ids = new Set(rules.map((rule) => rule.id));
      for (const rule of rules) {
        for (const conflict of rule.conflictsWith) {
          if (ids.has(conflict)) issues.push({ level: 'error', set: set.name, rule: rule.id, message: `конфликтует с правилом ${conflict}, оба активны в наборе ${set.name}` });
        }
      }
      const titles = new Map<string, string>();
      for (const rule of rules) {
        const key = rule.title.trim().toLowerCase();
        const other = titles.get(key);
        if (other) issues.push({ level: 'warning', set: set.name, rule: rule.id, message: `одинаковый заголовок с ${other}, возможно дубль` });
        titles.set(key, rule.qualifiedId);
      }
    } catch (error) {
      issues.push({ level: 'error', set: set.name, message: error instanceof Error ? error.message : String(error) });
    }
  }

  return issues.sort((a, b) => (a.level === b.level ? a.set.localeCompare(b.set) : a.level === 'error' ? -1 : 1));
}
