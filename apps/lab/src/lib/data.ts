import 'server-only';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { loadConfig, loadIndex, resolveFrom, type LabConfig } from '@context-lab/docgen/load';
import type { LibraryMeta } from '@context-lab/index-tools';
import { loadRegistry, resolveRules, type Resolution } from '@context-lab/rules';
import {
  buildContext,
  CONTEXT_MODES,
  contextTokens,
  libraryKey,
  loadSources,
  loadTasks,
  type ContextMode,
  type ContextSources,
  type Matrix,
  type RunRecord,
  type Task,
} from '@context-lab/runner';
import { compilePreview } from './compile-preview';
import type { ModePreview } from './mode-preview';
import type { BrowserSources } from './tool-sources';

export interface HomeData {
  library: LibraryMeta;
  componentCount: number;
  tasks: Task[];
  modes: ContextMode[];
  previews: Record<ContextMode, ModePreview>;
  matrix: Matrix | null;
  localRunEnabled: boolean;
}

const PREVIEW_BODY_LIMIT = 4000;
const PROMPT_SLOT = '\u0000';

let cachedConfig: LabConfig | undefined;

export function labConfig(): LabConfig {
  cachedConfig ??= loadConfig(path.resolve(process.cwd(), '..', '..', 'context-lab.config.json'));
  return cachedConfig;
}

function readText(file: string): string | null {
  return existsSync(file) ? readFileSync(file, 'utf8') : null;
}

function previewOf(mode: ContextMode, sources: ContextSources): ModePreview {
  try {
    const built = buildContext(mode, { id: 'preview', title: 'preview', prompt: PROMPT_SLOT, taskType: 'ui', expects: [] }, sources);
    const body = built.contextText.length > 0 ? built.contextText : built.system;
    const [before = '', after = ''] = built.taskText.split(PROMPT_SLOT);
    return {
      mode,
      tokens: contextTokens(built),
      sources: built.sources,
      tools: built.tools ? built.tools.map(({ name, description }) => ({ name, description })) : null,
      body: body.slice(0, PREVIEW_BODY_LIMIT),
      bodyLength: body.length,
      taskAround: [before, after],
    };
  } catch (error) {
    return { mode, error: error instanceof Error ? error.message : String(error) };
  }
}

export function loadMatrix(): Matrix | null {
  const config = labConfig();
  const text = readText(resolveFrom(config, config.matrix));
  return text ? (JSON.parse(text) as Matrix) : null;
}

export function loadLabTasks(): Task[] {
  return loadTasks(labConfig());
}

export function currentLibrary(): string {
  const config = labConfig();
  return libraryKey(loadIndex(resolveFrom(config, config.index)).library);
}

export function loadHomeData(): HomeData {
  const config = labConfig();
  const sources = loadSources(config);
  return {
    library: sources.index.library,
    componentCount: sources.index.components.length,
    tasks: loadTasks(config),
    modes: CONTEXT_MODES.filter((mode) => mode !== 'docs+rules' || sources.rules !== undefined),
    previews: Object.fromEntries(CONTEXT_MODES.map((mode) => [mode, previewOf(mode, sources)])) as Record<ContextMode, ModePreview>,
    matrix: loadMatrix(),
    localRunEnabled: process.env.CONTEXT_LAB_LOCAL === '1',
  };
}

export function loadBrowserSources(): BrowserSources {
  const config = labConfig();
  const { index, readme, docs, rules } = loadSources(config);
  const ruleSets = [...loadRegistry(resolveFrom(config, 'rules')).sets.values()].map((set) => ({
    ...set,
    dir: set.name,
    rules: set.rules.map((rule) => ({ ...rule, file: `${set.name}/${path.basename(rule.file)}` })),
  }));
  return { index, readme, docs, rules, ruleSets };
}

const LIBRARY_KEY = /^[\w+-][\w.+@-]*$/;
const RUN_ID = /^[\w+-][\w.+-]*$/;

export function loadRun(library: string, id: string): RunRecord | null {
  if (!LIBRARY_KEY.test(library) || !RUN_ID.test(id)) return null;
  const config = labConfig();
  const file = path.join(resolveFrom(config, config.runs), library, `${id}.json`);
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as RunRecord) : null;
}

export function pickRunId(matrix: Matrix, taskId: string, mode: string): string | null {
  return matrix.cells.find((cell) => cell.taskId === taskId && cell.mode === mode)?.runs[0] ?? null;
}

export interface ShownRun {
  record: RunRecord;
  compiled: string | null;
}

function compiledOrNull(code: string): string | null {
  if (!code) return null;
  try {
    return compilePreview(code);
  } catch {
    return null;
  }
}

export function forDisplay(record: RunRecord): ShownRun {
  return {
    record: { ...record, output: { code: record.output.code, text: record.output.code ? '' : record.output.text } },
    compiled: compiledOrNull(record.output.code),
  };
}

export function loadRuleResolution(set: string, taskType: string): { resolution: Resolution | null; sets: string[] } {
  const config = labConfig();
  const registry = loadRegistry(resolveFrom(config, 'rules'));
  const sets = [...registry.sets.keys()].sort();
  if (!registry.sets.has(set)) return { resolution: null, sets };
  return { resolution: resolveRules(registry, set, { taskType }), sets };
}
