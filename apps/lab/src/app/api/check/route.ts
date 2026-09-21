import { checkCode } from '@/lib/checker';

export const runtime = 'nodejs';

const MAX_CODE_LENGTH = 60_000;

export async function POST(request: Request): Promise<Response> {
  let body: { code?: unknown; expects?: unknown };
  try {
    body = (await request.json()) as { code?: unknown; expects?: unknown };
  } catch {
    return Response.json({ error: 'Ожидается JSON с полем code' }, { status: 400 });
  }
  const code = typeof body.code === 'string' ? body.code : '';
  if (code.length === 0 || code.length > MAX_CODE_LENGTH) {
    return Response.json({ error: `Поле code должно быть непустой строкой не длиннее ${MAX_CODE_LENGTH} символов` }, { status: 400 });
  }
  const expects = Array.isArray(body.expects) ? body.expects.filter((item): item is string => typeof item === 'string') : [];
  return Response.json(checkCode(code, expects));
}
