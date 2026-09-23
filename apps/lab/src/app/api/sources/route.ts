import { loadBrowserSources } from '@/lib/data';

export const dynamic = 'force-static';

export function GET(): Response {
  return Response.json(loadBrowserSources());
}
