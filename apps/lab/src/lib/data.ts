import 'server-only';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { loadConfig, loadIndex, resolveFrom, type LabConfig } from '@context-lab/docgen';
import type { LibraryIndex } from '@context-lab/index-tools';
import type { Matrix, RunRecord, Task } from '@context-lab/runner/browser';

export interface LabData {
  index: LibraryIndex;
  tasks: Task[];
  readme: string;
  docs: string;
  rules: string | null;
  matrix: Matrix | null;
  localRunEnabled: boolean;
}

let cachedConfig: LabConfig | undefined;

export function labConfig(): LabConfig {
  cachedConfig ??= loadConfig(path.resolve(process.cwd(), '..', '..', 'context-lab.config.json'));
  return cachedConfig;
}

function readText(file: string): string | null {
  return existsSync(file) ? readFileSync(file, 'utf8') : null;
}

export function loadLabData(): LabData {
  const config = labConfig();
  const index = loadIndex(resolveFrom(config, config.index));
  const tasks = JSON.parse(readFileSync(resolveFrom(config, config.tasks), 'utf8')) as Task[];
  const docs = readText(path.join(resolveFrom(config, config.docs), index.library.version, 'llms-full.txt')) ?? '';
  const readme = (config.library.readme ? readText(resolveFrom(config, config.library.readme)) : null) ?? '';
  const rules = readText(resolveFrom(config, 'rules/compiled/jinx-ui.md'));
  const matrixText = readText(resolveFrom(config, config.matrix));
  return {
    index,
    tasks,
    readme,
    docs,
    rules,
    matrix: matrixText ? (JSON.parse(matrixText) as Matrix) : null,
    localRunEnabled: process.env.CONTEXT_LAB_LOCAL === '1',
  };
}

export function loadRuns(): RunRecord[] {
  const config = labConfig();
  const dir = resolveFrom(config, config.runs);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(readFileSync(path.join(dir, file), 'utf8')) as RunRecord)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function loadRun(id: string): RunRecord | null {
  const config = labConfig();
  const file = path.join(resolveFrom(config, config.runs), `${id}.json`);
  if (!/^[\w.-]+$/.test(id) || !existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf8')) as RunRecord;
}
