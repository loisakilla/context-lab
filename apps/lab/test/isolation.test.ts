import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CheckReport } from '@context-lab/checks';
import type { Task } from '@context-lab/runner/browser';
import { previewShell } from '../preview/shell';
import { Preview } from '../src/components/Preview';
import { runInBrowser } from '../src/lib/browser-run';
import { forgetKey, readKey, saveKey } from '../src/lib/key-store';
import type { BrowserSources } from '../src/lib/tool-sources';

const KEY = 'sk-ant-api03-visitor-key';

function directives(policy: string): Map<string, string[]> {
  return new Map(
    policy
      .split(';')
      .map((part) => part.trim().split(/\s+/))
      .filter((words): words is [string, ...string[]] => Boolean(words[0]))
      .map(([name, ...values]) => [name, values]),
  );
}

class MemoryStorage implements Storage {
  private readonly items = new Map<string, string>();

  get length(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  key(position: number): string | null {
    return [...this.items.keys()][position] ?? null;
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }
}

function eventStream(text: string): string {
  const events: Array<[string, unknown]> = [
    [
      'message_start',
      {
        type: 'message_start',
        message: {
          id: 'msg_test',
          type: 'message',
          role: 'assistant',
          model: 'claude-opus-5',
          content: [],
          stop_reason: null,
          stop_sequence: null,
          usage: { input_tokens: 40, output_tokens: 1 },
        },
      },
    ],
    ['content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }],
    ['content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } }],
    ['content_block_stop', { type: 'content_block_stop', index: 0 }],
    ['message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 30 } }],
    ['message_stop', { type: 'message_stop' }],
  ];
  return events.map(([name, data]) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`).join('');
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('изоляция превью', () => {
  it('держит сгенерированный код в iframe-песочнице без общего происхождения и без адреса', () => {
    const markup = renderToStaticMarkup(createElement(Preview, { code: 'export default function Demo() { return null; }' }));
    const frame = markup.match(/<iframe[^>]*>/)?.[0] ?? '';
    expect(frame).toContain('sandbox="allow-scripts"');
    expect(frame).not.toMatch(/\ssrc=/);
  });

  it('запрещает странице превью сеть и отправку форм', () => {
    const shell = previewShell('', '');
    const policy = directives(shell.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '');
    expect(policy.get('default-src')).toEqual(["'none'"]);
    expect(policy.get('connect-src')).toEqual(["'none'"]);
    expect(policy.get('form-action')).toEqual(["'none'"]);
    expect(policy.get('script-src')).toEqual(["'unsafe-inline'", "'unsafe-eval'"]);
  });
});

describe('ключ посетителя', () => {
  it('хранится только в хранилище браузера и переезжает между сессионным и постоянным', () => {
    const local = new MemoryStorage();
    const session = new MemoryStorage();
    const network = vi.fn();
    vi.stubGlobal('window', { localStorage: local, sessionStorage: session });
    vi.stubGlobal('fetch', network);

    saveKey(KEY, 'session');
    expect(readKey()).toEqual({ key: KEY, scope: 'session' });
    saveKey(KEY, 'local');
    expect(readKey()).toEqual({ key: KEY, scope: 'local' });
    expect(session.length).toBe(0);
    forgetKey();
    expect(readKey()).toBeNull();
    expect(local.length + session.length).toBe(0);
    expect(network).not.toHaveBeenCalled();
  });

  it('уходит только в Anthropic: серверу лаборатории достаются код и ожидания', async () => {
    const task: Task = { id: 'demo', title: 'Кнопка', prompt: 'Сделай кнопку сохранения', taskType: 'ui', expects: ['JxButton'] };
    const sources: BrowserSources = {
      index: { schemaVersion: 2, library: { name: 'jinx-ui', package: '@jinx-ui/react', version: '0.1.0', commit: '' }, components: [], hooks: [], tokens: [] },
      ruleSets: [],
    };
    const report: CheckReport = {
      tsc: { errors: [], unknownComponents: [], unknownProps: [] },
      lint: [],
      usedComponents: ['JxButton'],
      expectedCoverage: 1,
      passed: true,
    };
    const answer = "```tsx\nimport { JxButton } from '@jinx-ui/react';\n\nexport default function Save() {\n  return <JxButton>Сохранить</JxButton>;\n}\n```";
    const calls: Array<{ url: string; headers: Headers; body: string }> = [];
    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      calls.push({ url, headers: new Headers(init?.headers), body: typeof init?.body === 'string' ? init.body : '' });
      if (url === '/api/sources') return Response.json(sources);
      if (url === '/api/check') return Response.json(report);
      if (url.startsWith('https://api.anthropic.com/')) return new Response(eventStream(answer), { headers: { 'content-type': 'text/event-stream' } });
      return new Response('нет такого адреса', { status: 404 });
    });

    const record = await runInBrowser({ apiKey: KEY, mode: 'none', task, model: 'claude-opus-5' });

    expect(record.output.code).toContain('<JxButton>Сохранить</JxButton>');
    expect(record.checks).toEqual(report);
    const anthropic = calls.filter((call) => call.url.startsWith('https://api.anthropic.com/'));
    expect(anthropic).toHaveLength(1);
    expect(anthropic[0]?.headers.get('x-api-key')).toBe(KEY);
    const lab = calls.filter((call) => !call.url.startsWith('https://api.anthropic.com/'));
    expect(lab.map((call) => call.url)).toEqual(['/api/sources', '/api/check']);
    for (const call of lab) {
      expect(JSON.stringify([call.url, call.body, [...call.headers]])).not.toContain(KEY);
    }
    expect(JSON.parse(lab[1]?.body ?? '')).toEqual({ code: record.output.code, expects: task.expects });
  });
});
