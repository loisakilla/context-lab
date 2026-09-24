import { CONTEXT_MODES, type ContextMode, type RunRecord, type Turn, type Usage } from './types.ts';

export interface MatrixCell {
  taskId: string;
  mode: ContextMode;
  runs: string[];
  passRate: number;
  medianTokens: number;
  medianFreshTokens: number;
  medianCacheReadTokens: number;
  medianContextTokens: number;
  medianPromptTokens: number;
  medianPeakPromptTokens: number;
  medianCostUsd: number | null;
  medianTscErrors: number;
  medianLintErrors: number;
  meanCoverage: number;
  medianTurns: number;
  medianToolCalls: number;
  medianSeconds: number;
}

export interface Matrix {
  library: { name: string; version: string; commit: string } | null;
  driver: string | null;
  model: string | null;
  tasks: Array<{ id: string; title: string }>;
  modes: ContextMode[];
  cells: MatrixCell[];
  sourceRevisions: Record<string, SourceRevision[]>;
  generatedFrom: number;
}

export interface SourceRevision {
  hash: string | null;
  tokens: number;
  runs: number;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2 : sorted[middle] ?? 0;
}

export function libraryKey(library: { version: string; commit: string }): string {
  return library.commit ? `${library.version}@${library.commit.slice(0, 7)}` : library.version;
}

function promptTokensOf(turn: Turn): number {
  return turn.usage.input + turn.usage.cacheRead + turn.usage.cacheCreation;
}

export function firstPromptTokens(run: Pick<RunRecord, 'turns'>): number {
  const turn = run.turns[0];
  return turn ? promptTokensOf(turn) : 0;
}

export function peakPromptTokens(run: Pick<RunRecord, 'turns'>): number {
  return run.turns.reduce((peak, turn) => Math.max(peak, promptTokensOf(turn)), 0);
}

export function freshTokens(usage: Usage): number {
  return usage.input + usage.cacheCreation + usage.output;
}

function sourceRevisions(runs: RunRecord[]): Record<string, SourceRevision[]> {
  const revisions = new Map<string, Map<string, SourceRevision>>();
  for (const run of runs) {
    for (const source of run.context.sources) {
      const byKind = revisions.get(source.kind) ?? new Map<string, SourceRevision>();
      const key = source.hash ?? `tokens:${source.tokens}`;
      const revision = byKind.get(key) ?? { hash: source.hash ?? null, tokens: source.tokens, runs: 0 };
      revision.runs += 1;
      byKind.set(key, revision);
      revisions.set(source.kind, byKind);
    }
  }
  return Object.fromEntries([...revisions.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([kind, byKind]) => [kind, [...byKind.values()].sort((a, b) => a.tokens - b.tokens)]));
}

export function buildMatrix(runs: RunRecord[]): Matrix {
  const libraries = [...new Set(runs.map((run) => libraryKey(run.library)))];
  if (libraries.length > 1) {
    throw new Error(
      `Прогоны сделаны против разных версий библиотеки: ${libraries.join(', ')}. В одной матрице их сравнивать нельзя — выберите одну через --library.`
    );
  }
  const models = [...new Set(runs.map((run) => run.model))];
  const drivers = [...new Set(runs.map((run) => run.driver))];
  const efforts = [...new Set(runs.map((run) => run.effort ?? 'по умолчанию'))];
  if (models.length > 1 || drivers.length > 1 || efforts.length > 1) {
    throw new Error(
      `В одну матрицу попали прогоны разных моделей (${models.join(', ')}), драйверов (${drivers.join(', ')}) или уровней усилий (${efforts.join(', ')}). Выберите одну модель и один драйвер через --model и --driver.`,
    );
  }
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
      medianFreshTokens: median(bucket.map((run) => freshTokens(run.usage))),
      medianCacheReadTokens: median(bucket.map((run) => run.usage.cacheRead)),
      medianContextTokens: median(bucket.map((run) => run.context.tokens)),
      medianPromptTokens: median(bucket.map(firstPromptTokens).filter((tokens) => tokens > 0)),
      medianPeakPromptTokens: median(bucket.map(peakPromptTokens).filter((tokens) => tokens > 0)),
      medianCostUsd: costs.length > 0 ? median(costs) : null,
      medianTscErrors: median(bucket.map((run) => run.checks?.tsc.errors.length ?? 0)),
      medianLintErrors: median(bucket.map((run) => run.checks?.lint.filter((finding) => finding.severity === 'error').length ?? 0)),
      meanCoverage: Number((bucket.reduce((sum, run) => sum + (run.checks?.expectedCoverage ?? 0), 0) / bucket.length).toFixed(2)),
      medianTurns: median(bucket.map((run) => run.turns.length)),
      medianToolCalls: median(bucket.map((run) => run.turns.reduce((sum, turn) => sum + turn.toolCalls.length, 0))),
      medianSeconds: Number(median(bucket.map((run) => run.durationMs / 1000)).toFixed(1)),
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
    sourceRevisions: sourceRevisions(runs),
    generatedFrom: runs.length,
  };
}
