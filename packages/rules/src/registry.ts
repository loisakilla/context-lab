import type { Registry, RuleSet } from './types.ts';

export function registryFromSets(sets: RuleSet[], root = '/virtual'): Registry {
  return { sets: new Map(sets.map((set) => [set.name, set])), root };
}
