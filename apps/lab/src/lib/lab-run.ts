import type { ContextMode, RunRecord } from '@context-lab/runner/browser';
import type { BrowserRunOptions } from './browser-run';

export async function runWithKey(options: BrowserRunOptions): Promise<RunRecord> {
  const { runInBrowser } = await import('./browser-run');
  return runInBrowser(options);
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
