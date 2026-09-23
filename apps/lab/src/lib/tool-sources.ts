import { docsReader } from '@context-lab/docs/render';
import type { LibraryIndex, ToolSources } from '@context-lab/index-tools';
import { registryFromSets, rulesToolSource, type RuleSet } from '@context-lab/rules/browser';

export function browserToolSources(index: LibraryIndex, ruleSets: RuleSet[]): ToolSources {
  const registry = registryFromSets(ruleSets);
  return {
    docs: docsReader(index),
    ...(registry.sets.has(index.library.name) ? { rules: rulesToolSource(registry, index.library.name) } : {}),
  };
}
