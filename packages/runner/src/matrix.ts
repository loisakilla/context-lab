import { CONTEXT_MODES, type ContextMode, type RunRecord } from './types.ts';

export interface MatrixCell {
  taskId: string;
  mode: ContextMode;
  runs: string[];
  passRate: number;
  medianTokens: number;
  medianContextTokens: number;
  medianCostUsd: number | null;
  medianTscErrors: number;
  medianLintErrors: number;
  meanCoverage: number;
}

export interface Matrix {
  library: { name: string; version: string; commit: string } | null;
  driver: string | null;
  model: string | null;
  tasks: Array<{ id: string; title: string }>;
  modes: ContextMode[];
  cells: MatrixCell[];
  generatedFrom: number;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2 : sorted[middle] ?? 0;
}

export function buildMatrix(runs: RunRecord[]): Matrix {
  const first = runs[0];
  const tasks = new Map<string, string>();
  const groups = new Map<string, RunRecord[]>();
  for (const run of runs) {
    tasks.set(run.task.id, run.task.title);
    const key = `${run.task.id}::${run.mode}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(run);
    groups.set(key, bucket);
  }

  const modes = CONTEXT_MODES.filter((mode) => runs.some((run) => run.mode === mode));
  const cells: MatrixCell[] = [];
  for (const [key, bucket] of groups) {
    const [taskId, mode] = key.split('::') as [string, ContextMode];
    const costs = bucket.map((run) => run.costUsd).filter((cost): cost is number => cost !== null);
    cells.push({
      taskId,
      mode,
      runs: bucket.map((run) => run.id),
      passRate: Number((bucket.filter((run) => run.verdict.passed).length / bucket.length).toFixed(2)),
      medianTokens: median(bucket.map((run) => run.usage.input + run.usage.output + run.usage.cacheRead + run.usage.cacheCreation)),
      medianContextTokens: median(bucket.map((run) => run.context.tokens)),
      medianCostUsd: costs.length > 0 ? median(costs) : null,
      medianTscErrors: median(bucket.map((run) => run.checks?.tsc.errors.length ?? 0)),
      medianLintErrors: median(bucket.map((run) => run.checks?.lint.filter((finding) => finding.severity === 'error').length ?? 0)),
      meanCoverage: Number((bucket.reduce((sum, run) => sum + (run.checks?.expectedCoverage ?? 0), 0) / bucket.length).toFixed(2)),
    });
  }
  cells.sort((a, b) => (a.taskId === b.taskId ? CONTEXT_MODES.indexOf(a.mode) - CONTEXT_MODES.indexOf(b.mode) : a.taskId.localeCompare(b.taskId)));

  return {
    library: first ? { ...first.library } : null,
    driver: first?.driver ?? null,
    model: first?.model ?? null,
    tasks: [...tasks.entries()].map(([id, title]) => ({ id, title })).sort((a, b) => a.id.localeCompare(b.id)),
    modes,
    cells,
    generatedFrom: runs.length,
  };
}
