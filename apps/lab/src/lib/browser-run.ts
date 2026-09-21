import type { CheckReport } from '@context-lab/checks';
import { apiDriver, runTask, type ContextMode, type ContextSources, type RunRecord, type Task } from '@context-lab/runner/browser';

export interface BrowserRunOptions {
  apiKey: string;
  mode: ContextMode;
  task: Task;
  sources: ContextSources;
  model: string;
  effort?: string;
  signal?: AbortSignal;
  onText?: (delta: string) => void;
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

export function runInBrowser(options: BrowserRunOptions): Promise<RunRecord> {
  const driver = apiDriver({ apiKey: options.apiKey, dangerouslyAllowBrowser: true });
  return runTask({
    driver,
    mode: options.mode,
    task: options.task,
    sources: options.sources,
    model: options.model,
    ...(options.effort ? { effort: options.effort } : {}),
    checker: { check: checkOnServer },
    ...(options.signal ? { signal: options.signal } : {}),
    ...(options.onText ? { onText: options.onText } : {}),
  });
}

export async function runLocally(body: { taskId?: string; prompt?: string; expects?: string[]; mode: ContextMode; model: string }, signal?: AbortSignal): Promise<RunRecord> {
  const response = await fetch('/api/local-run', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  });
  const payload = (await response.json()) as RunRecord | { error: string };
  if (!response.ok || 'error' in payload) throw new Error('error' in payload ? payload.error : `Локальный прогон не удался: ${response.status}`);
  return payload;
}

export function describeApiError(error: unknown): string {
  if (error instanceof Error) {
    const status = (error as { status?: number }).status;
    if (status === 401) return 'Ключ не принят: проверьте, что это ключ Anthropic API и он не отозван.';
    if (status === 429) return 'Лимит запросов исчерпан, подождите и повторите.';
    if (status === 400) return `Запрос отклонён: ${error.message}`;
    if (error.name === 'AbortError') return 'Прогон отменён.';
    return error.message;
  }
  return String(error);
}
