import type { CheckReport } from '@context-lab/checks';
import { buildContext, contextTokens, type ContextSources } from './context.ts';
import { extractCode } from './extract-code.ts';
import { priceOf } from './price.ts';
import type { ContextMode, Driver, RunRecord, Task } from './types.ts';

export interface CodeChecker {
  check(code: string, expects: string[]): CheckReport | Promise<CheckReport>;
}

export interface RunOptions {
  driver: Driver;
  mode: ContextMode;
  task: Task;
  sources: ContextSources;
  model: string;
  effort?: string;
  repeat?: number;
  checker?: CodeChecker;
  maxTurns?: number;
  signal?: AbortSignal;
  onText?: (delta: string) => void;
}

export function modelSlug(model: string): string {
  return slugify(model);
}

export function slugify(value: string): string {
  return value.replace(/[^a-z0-9.-]+/gi, '-');
}

export function runFileName(task: Task, mode: ContextMode, driver: string, model: string, repeat: number): string {
  return `${task.id}__${slugify(mode)}__${driver}__${modelSlug(model)}__${repeat}.json`;
}

export function scoreOf(record: Pick<RunRecord, 'checks'>): number {
  const checks = record.checks;
  if (!checks) return 0;
  const errors = checks.tsc.errors.length + checks.lint.filter((finding) => finding.severity === 'error').length;
  const base = checks.passed ? 1 : Math.max(0, 1 - errors * 0.2);
  return Number((base * 0.7 + checks.expectedCoverage * 0.3).toFixed(2));
}

export async function runTask(options: RunOptions): Promise<RunRecord> {
  const started = Date.now();
  const repeat = options.repeat ?? 1;
  const context = buildContext(options.mode, options.task, options.sources);
  const generation = await options.driver.generate({
    model: options.model,
    ...(options.effort ? { effort: options.effort } : {}),
    system: context.system,
    contextText: context.contextText,
    taskText: context.taskText,
    ...(context.tools ? { tools: context.tools } : {}),
    ...(context.runTool ? { runTool: context.runTool } : {}),
    maxTurns: options.maxTurns ?? 8,
    ...(options.signal ? { signal: options.signal } : {}),
    ...(options.onText ? { onText: options.onText } : {}),
  });

  const code = extractCode(generation.text);
  const checks = options.checker && code.length > 0 ? await options.checker.check(code, options.task.expects) : null;
  const priced = generation.costUsd ?? priceOf(options.model, generation.usage);

  const record: RunRecord = {
    id: runFileName(options.task, options.mode, options.driver.name, options.model, repeat).replace(/\.json$/, ''),
    createdAt: new Date().toISOString(),
    repeat,
    durationMs: Date.now() - started,
    driver: options.driver.name,
    library: { ...options.sources.index.library },
    model: options.model,
    mode: options.mode,
    task: options.task,
    context: { tokens: contextTokens(context), sources: context.sources },
    turns: generation.turns,
    usage: generation.usage,
    costUsd: priced ?? null,
    stopReason: generation.stopReason,
    output: { code, text: generation.text },
    checks,
    verdict: { passed: checks?.passed ?? false, score: 0 },
  };
  if (options.effort) record.effort = options.effort;
  record.verdict.score = scoreOf(record);
  return record;
}
