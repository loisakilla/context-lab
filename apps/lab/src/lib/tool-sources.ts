import { docsReader } from '@context-lab/docs/render';
import type { ContextSources } from '@context-lab/runner/browser';
import { registryFromSets, rulesToolSource, type RuleSet } from '@context-lab/rules/browser';

export type BrowserSources = Omit<ContextSources, 'tools'> & { ruleSets: RuleSet[] };

export function contextSources({ ruleSets, ...sources }: BrowserSources): ContextSources {
  const registry = registryFromSets(ruleSets);
  const name = sources.index.library.name;
  return {
    ...sources,
    tools: {
      docs: docsReader(sources.index),
      ...(registry.sets.has(name) ? { rules: rulesToolSource(registry, name) } : {}),
    },
  };
}
