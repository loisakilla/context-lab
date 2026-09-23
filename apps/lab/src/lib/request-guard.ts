export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function clientAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'local';
}

export function sendsJson(request: Request): boolean {
  return (request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json');
}

export function createRateLimiter(limit: number, windowMs: number): (key: string, now?: number) => boolean {
  const windows = new Map<string, { start: number; count: number }>();
  return (key, now = Date.now()) => {
    if (windows.size > 1000) {
      for (const [stored, window] of windows) if (now - window.start >= windowMs) windows.delete(stored);
    }
    const window = windows.get(key);
    if (!window || now - window.start >= windowMs) {
      windows.set(key, { start: now, count: 1 });
      return false;
    }
    window.count += 1;
    return window.count > limit;
  };
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
