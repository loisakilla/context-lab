import { CheckBusyError, CheckTimeoutError } from '@/lib/check-pool';
import { checkCode } from '@/lib/checker';
import { clientAddress, createRateLimiter, readJsonObject, sameOrigin } from '@/lib/request-guard';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_CODE_LENGTH = 20_000;
const limited = createRateLimiter(20, 60_000);

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return Response.json({ error: 'Проверка доступна только со страниц лаборатории' }, { status: 403 });
  if (limited(clientAddress(request))) {
    return Response.json({ error: 'Слишком много проверок подряд: подождите минуту' }, { status: 429, headers: { 'retry-after': '60' } });
  }

  const body = await readJsonObject(request);
  if (!body) return Response.json({ error: 'Ожидается JSON-объект с полем code' }, { status: 400 });
  const code = typeof body.code === 'string' ? body.code : '';
  if (code.length === 0 || code.length > MAX_CODE_LENGTH) {
    return Response.json({ error: `Поле code должно быть непустой строкой не длиннее ${MAX_CODE_LENGTH} символов` }, { status: 400 });
  }
  const expects = Array.isArray(body.expects) ? body.expects.filter((item): item is string => typeof item === 'string') : [];

  try {
    return Response.json(await checkCode(code, expects));
  } catch (error) {
    if (error instanceof CheckTimeoutError) return Response.json({ error: error.message }, { status: 422 });
    if (error instanceof CheckBusyError) return Response.json({ error: error.message }, { status: 503, headers: { 'retry-after': '5' } });
    return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
