import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { loadIndex, resolveFrom, type LabConfig } from '@context-lab/docgen/load';
import { docsDirReader } from '@context-lab/docs';
import { loadRegistry, rulesToolSource } from '@context-lab/rules';
import type { ContextSources } from './context.ts';
import type { Task } from './types.ts';

export const COMPILED_RULES = 'rules/compiled/jinx-ui.md';

function readOptional(file: string | undefined): string | undefined {
  if (!file || !existsSync(file)) return undefined;
  return readFileSync(file, 'utf8');
}

export function loadTasks(config: LabConfig): Task[] {
  return JSON.parse(readFileSync(resolveFrom(config, config.tasks), 'utf8')) as Task[];
}

export function loadSources(config: LabConfig, rulesFile?: string): ContextSources {
  const index = loadIndex(resolveFrom(config, config.index));
  const docsDir = path.join(resolveFrom(config, config.docs), index.library.version);
  const readme = readOptional(config.library.readme ? resolveFrom(config, config.library.readme) : undefined);
  const docs = readOptional(path.join(docsDir, 'llms-full.txt'));
  const rules = readOptional(rulesFile ?? resolveFrom(config, COMPILED_RULES));
  const registry = loadRegistry(resolveFrom(config, 'rules'));
  return {
    index,
    ...(readme ? { readme } : {}),
    ...(docs ? { docs } : {}),
    ...(rules ? { rules } : {}),
    tools: {
      docs: docsDirReader(docsDir),
      ...(registry.sets.has(config.library.name) ? { rules: rulesToolSource(registry, config.library.name) } : {}),
    },
  };
}
