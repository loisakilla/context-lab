const KEY = 'contextlab.anthropicKey';

export type KeyScope = 'local' | 'session';

function storage(scope: KeyScope): Storage | undefined {
  try {
    return scope === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function readKey(): { key: string; scope: KeyScope } | null {
  for (const scope of ['session', 'local'] as const) {
    const value = storage(scope)?.getItem(KEY);
    if (value) return { key: value, scope };
  }
  return null;
}

export function saveKey(key: string, scope: KeyScope): void {
  forgetKey();
  storage(scope)?.setItem(KEY, key);
}

export function forgetKey(): void {
  storage('local')?.removeItem(KEY);
  storage('session')?.removeItem(KEY);
}

export function maskKey(key: string): string {
  if (key.length <= 12) return '••••';
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}
