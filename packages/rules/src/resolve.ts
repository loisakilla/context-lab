import picomatch from 'picomatch';
import { estimateTokens } from '@context-lab/index-tools';
import type { Provenance, Registry, ResolveOptions, ResolvedRule, Resolution, RuleDefinition, RuleSet } from './types.ts';

export function qualify(set: string, id: string): string {
  return `${set}/${id}`;
}

function stamp(set: RuleSet, rule: RuleDefinition): string {
  return `${set.name}/${rule.id}@${rule.version}`;
}

export function inheritanceChain(registry: Registry, setName: string): string[] {
  const chain: string[] = [];
  const visiting = new Set<string>();
  const visit = (name: string): void => {
    if (chain.includes(name)) return;
    if (visiting.has(name)) throw new Error(`Циклическое наследование наборов правил: ${[...visiting, name].join(' → ')}`);
    const set = registry.sets.get(name);
    if (!set) throw new Error(`Набор правил "${name}" не найден`);
    visiting.add(name);
    for (const parent of set.extends) visit(parent);
    visiting.delete(name);
    chain.push(name);
  };
  visit(setName);
  return chain;
}

function matchesFile(rule: RuleDefinition, filePath: string | undefined): boolean {
  if (!filePath || rule.appliesTo.length === 0) return true;
  return picomatch(rule.appliesTo, { dot: true })(filePath.replace(/\\/g, '/'));
}

function matchesTask(rule: RuleDefinition, taskType: string | undefined): boolean {
  if (!taskType || rule.taskTypes.length === 0) return true;
  return rule.taskTypes.includes(taskType);
}

function matchesTarget(rule: RuleDefinition, target: ResolveOptions['target']): boolean {
  if (!target) return true;
  return rule.targets.includes(target);
}

export function mergeRules(registry: Registry, chain: string[]): { rules: ResolvedRule[]; provenance: Provenance[] } {
  const merged = new Map<string, ResolvedRule>();
  const provenance: Provenance[] = [];

  for (const setName of chain) {
    const set = registry.sets.get(setName);
    if (!set) continue;
    for (const rule of set.rules) {
      const previous = merged.get(rule.id);
      const entry: ResolvedRule = {
        ...rule,
        qualifiedId: qualify(setName, rule.id),
        definedIn: `${setName}@${set.version}`,
        tokens: estimateTokens(rule.body),
      };
      if (previous) entry.overrides = `${previous.qualifiedId}@${previous.version}`;
      if (rule.extends) {
        const [parentSet, parentId] = rule.extends.includes('/') ? rule.extends.split('/', 2) : [undefined, rule.extends];
        const parent = [...merged.values()].find((candidate) => candidate.id === parentId && (!parentSet || candidate.set === parentSet));
        if (!parent) throw new Error(`Правило ${entry.qualifiedId} расширяет несуществующее ${rule.extends}`);
        entry.refines = `${parent.qualifiedId}@${parent.version}`;
        if (entry.appliesTo.length === 0) entry.appliesTo = [...parent.appliesTo];
        if (entry.taskTypes.length === 0) entry.taskTypes = [...parent.taskTypes];
        entry.body = `${parent.body}\n\n${entry.body}`.trim();
        entry.tokens = estimateTokens(entry.body);
        merged.delete(parent.id);
      }
      merged.set(rule.id, entry);
    }
  }

  for (const rule of merged.values()) {
    const item: Provenance = { id: rule.qualifiedId, version: rule.version, definedIn: rule.definedIn };
    if (rule.overrides) item.overrides = rule.overrides;
    if (rule.refines) item.refines = rule.refines;
    provenance.push(item);
  }

  return { rules: [...merged.values()], provenance };
}

export function resolveRules(registry: Registry, setName: string, options: ResolveOptions = {}): Resolution {
  const chain = inheritanceChain(registry, setName);
  const { rules, provenance } = mergeRules(registry, chain);

  const applicable = rules
    .filter((rule) => matchesTask(rule, options.taskType) && matchesFile(rule, options.filePath) && matchesTarget(rule, options.target))
    .sort((a, b) => (b.priority === a.priority ? a.qualifiedId.localeCompare(b.qualifiedId) : b.priority - a.priority));

  const kept: ResolvedRule[] = [];
  const omitted: ResolvedRule[] = [];
  let tokens = 0;
  for (const rule of applicable) {
    if (options.budget !== undefined && kept.length > 0 && tokens + rule.tokens > options.budget) {
      omitted.push(rule);
      continue;
    }
    kept.push(rule);
    tokens += rule.tokens;
  }

  return { set: setName, chain, rules: kept, omitted, provenance, tokens, options };
}

export function describeProvenance(resolution: Resolution): string[] {
  return resolution.rules.map((rule) => {
    const parts = [`${rule.qualifiedId}@${rule.version}`, `из ${rule.definedIn}`];
    if (rule.overrides) parts.push(`переопределяет ${rule.overrides}`);
    if (rule.refines) parts.push(`уточняет ${rule.refines}`);
    parts.push(`приоритет ${rule.priority}`, `~${rule.tokens} токенов`);
    return parts.join(' · ');
  });
}

export function stampOf(set: RuleSet, rule: RuleDefinition): string {
  return stamp(set, rule);
}
