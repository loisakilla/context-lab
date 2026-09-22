import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

function source(relative: string): string {
  return readFileSync(path.join(root, relative), 'utf8');
}

describe('изоляция превью', () => {
  const preview = source('apps/lab/src/components/Preview.tsx');
  const shell = source('scripts/build-preview.ts');

  it('держит iframe в песочнице без общего происхождения', () => {
    expect(preview).toContain('sandbox="allow-scripts"');
    expect(preview).not.toContain('allow-same-origin');
  });

  it('отдаёт страницу превью через srcDoc, а не по адресу', () => {
    expect(preview).toContain('srcDoc');
    expect(preview).not.toMatch(/<iframe[^>]*\bsrc=/);
  });

  it('запрещает странице превью любые сетевые запросы', () => {
    expect(shell).toContain("default-src 'none'");
    expect(shell).toContain("connect-src 'none'");
    expect(shell).toContain("form-action 'none'");
  });
});

describe('ключ посетителя', () => {
  const keyStore = source('apps/lab/src/lib/key-store.ts');
  const browserRun = source('apps/lab/src/lib/browser-run.ts');
  const checkRoute = source('apps/lab/src/app/api/check/route.ts');

  it('хранится только в браузере', () => {
    expect(keyStore).toMatch(/localStorage|sessionStorage/);
    expect(keyStore).not.toContain('fetch(');
  });

  it('не уходит на сервер лаборатории: на проверку идут только код и ожидания', () => {
    expect(browserRun).toContain('JSON.stringify({ code, expects })');
    expect(browserRun).not.toMatch(/body: JSON\.stringify\([^)]*apiKey/);
  });

  it('роут проверки ничего не знает о ключе', () => {
    expect(checkRoute).not.toMatch(/apiKey|anthropic/i);
  });
});

describe('прогон агента', () => {
  const driver = source('packages/runner/src/drivers/claude-code.ts');

  it('идёт без унаследованных MCP-серверов и без встроенных инструментов', () => {
    expect(driver).toContain("'--strict-mcp-config'");
    expect(driver).toContain("'--tools',\n    '',");
    expect(driver).toContain("'--setting-sources',\n    '',");
  });

  it('в режиме MCP разрешает только инструменты сервера', () => {
    expect(driver).toContain("args.push('--allowedTools', options.mcpServer.tools.map((tool) => `mcp__${options.mcpServer!.name}__${tool}`).join(','));");
  });
});
