import type { CheckReport } from '@context-lab/checks';
import { apiDriver, runTask, type ContextMode, type ContextSources, type RunRecord, type Task } from '@context-lab/runner/browser';
import { contextSources, type BrowserSources } from './tool-sources';

export interface BrowserRunOptions {
  apiKey: string;
  mode: ContextMode;
  task: Task;
  model: string;
  effort?: string;
  signal?: AbortSignal;
  onText?: (delta: string) => void;
}

let sourcesPromise: Promise<ContextSources> | undefined;

function loadSources(): Promise<ContextSources> {
  sourcesPromise ??= fetch('/api/sources')
    .then(async (response) => {
      if (!response.ok) throw new Error(`Контекст библиотеки не загрузился: ${response.status}`);
      return contextSources((await response.json()) as BrowserSources);
    })
    .catch((error: unknown) => {
      sourcesPromise = undefined;
      throw error;
    });
  return sourcesPromise;
}

export async function checkOnServer(code: string, expects: string[]): Promise<CheckReport> {
  const response = await fetch('/api/check', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ code, expects }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `Проверка не удалась: ${response.status}`);
  }
  return (await response.json()) as CheckReport;
}

export async function runInBrowser(options: BrowserRunOptions): Promise<RunRecord> {
  const sources = await loadSources();
  return runTask({
    driver: apiDriver({ apiKey: options.apiKey, dangerouslyAllowBrowser: true }),
    mode: options.mode,
    task: options.task,
    sources,
    model: options.model,
    ...(options.effort ? { effort: options.effort } : {}),
    checker: { check: checkOnServer },
    ...(options.signal ? { signal: options.signal } : {}),
    ...(options.onText ? { onText: options.onText } : {}),
  });
}
