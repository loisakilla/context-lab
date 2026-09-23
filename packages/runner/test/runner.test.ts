import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { lintCode, usedComponents } from '@context-lab/checks';
import { sampleIndex } from '../../index-tools/test/helpers.ts';
import { buildContext, contextTokens } from '../src/context.ts';
import { buildClaudeArgs, claudeCodeDriver, composePrompt, parseStreamJson } from '../src/drivers/claude-code.ts';
import { extractCode } from '../src/extract-code.ts';
import { textHash } from '../src/hash.ts';
import { buildMatrix, firstPromptTokens, libraryKey, median } from '../src/matrix.ts';
import { priceOf } from '../src/price.ts';
import { runFileName, runTask } from '../src/run.ts';
import { libraryFolders, readRunFolder, runsFolder } from '../src/store.ts';
import type { Driver, GenerationRequest, RunRecord, Task } from '../src/types.ts';

const index = sampleIndex();
const task: Task = { id: 'confirm', title: 'Подтверждение', prompt: 'Сделай окно подтверждения', taskType: 'ui', expects: ['JxModal', 'JxButton'] };

const stubChecker = {
  check(code: string, expects: string[]) {
    const invented = code.includes('color=');
    const used = usedComponents(code);
    return {
      tsc: {
        errors: invented ? [{ code: 2322, line: 1, message: "Property 'color' does not exist on type 'JxButtonProps'" }] : [],
        unknownComponents: [],
        unknownProps: invented ? [{ component: 'JxButton', prop: 'color' }] : [],
      },
      lint: lintCode(code),
      usedComponents: used,
      expectedCoverage: expects.length === 0 ? 1 : Number((expects.filter((name) => used.includes(name)).length / expects.length).toFixed(2)),
      passed: !invented,
    };
  },
};

function fakeDriver(text: string): Driver {
  return {
    name: 'api',
    async generate() {
      return { text, turns: [{ usage: { input: 1200, output: 300, cacheRead: 0, cacheCreation: 0 }, toolCalls: [] }], usage: { input: 1200, output: 300, cacheRead: 0, cacheCreation: 0 }, stopReason: 'end_turn', durationMs: 10 };
    },
  };
}

describe('buildContext', () => {
  const sources = { index, readme: '# README', docs: '# docs', rules: '- правило' };

  it('режим none не добавляет контекста, задача и контракт вывода всегда на месте', () => {
    const context = buildContext('none', task, sources);
    expect(context.contextText).toBe('');
    expect(context.taskText).toMatch(/Задача: Сделай окно подтверждения/);
    expect(context.taskText).toMatch(/один блок кода ```tsx/);
    expect(context.sources).toEqual([]);
  });

  it('режимы readme, docs и docs+rules оборачивают источники в теги и считают токены', () => {
    expect(buildContext('readme', task, sources).contextText).toMatch(/<library_readme>\n# README\n<\/library_readme>/);
    const withRules = buildContext('docs+rules', task, sources);
    expect(withRules.contextText).toMatch(/<library_docs>[\s\S]*<rules>/);
    expect(withRules.sources.map((source) => source.kind)).toEqual(['docs', 'rules']);
    expect(contextTokens(withRules)).toBeGreaterThan(0);
  });

  it('режим mcp отдаёт инструменты, исполнитель и правила в системном промпте', () => {
    const context = buildContext('mcp', task, sources);
    expect(context.tools?.map((tool) => tool.name)).toEqual(['search_components', 'get_component_api', 'get_component_examples', 'list_design_tokens']);
    expect(context.system).toMatch(/search_components/);
    expect(context.runTool?.('get_component_api', { name: 'JxModal' }).text).toMatch(/title: ReactNode/);
    expect(context.contextText).toBe('');
  });

  it('в режиме mcp с источниками документации и правил даёт все шесть инструментов и записывает их в контекст', () => {
    const context = buildContext('mcp', task, { ...sources, tools: { docs: () => '# doc', rules: { defaultSet: 'sample', resolve: () => 'правила' } } });
    expect(context.tools?.map((tool) => tool.name)).toEqual(['search_components', 'get_component_api', 'get_component_examples', 'list_design_tokens', 'get_docs', 'get_rules']);
    expect(context.sources[0]?.id).toBe('search_components,get_component_api,get_component_examples,list_design_tokens,get_docs,get_rules');
    expect(context.system).toMatch(/правила работы через get_rules/);
    expect(context.runTool?.('get_rules', { task: 'ui' }).text).toMatch(/^правила/);
  });

  it('падает, если для режима нет источника', () => {
    expect(() => buildContext('docs', task, { index })).toThrow(/llms-full/);
  });
});

describe('extractCode', () => {
  it('берёт блок с default-экспортом, а не первый попавшийся', () => {
    const text = 'Вот:\n```tsx\nconst a = 1;\n```\nи компонент\n```tsx\nexport default function A() { return null }\n```';
    expect(extractCode(text)).toMatch(/^export default/);
  });

  it('принимает голый код без ограждений и возвращает пустую строку для прозы', () => {
    expect(extractCode("import { JxButton } from '@jinx-ui/react';\nexport default () => <JxButton />;")).toMatch(/^import/);
    expect(extractCode('Не могу помочь.')).toBe('');
  });
});

describe('runTask', () => {
  it('собирает запись прогона с проверками, ценой и вердиктом', async () => {
    const good = '```tsx\nimport { JxButton, JxModal } from \'@jinx-ui/react\';\nexport default () => <JxModal title="x"><JxButton>ok</JxButton></JxModal>;\n```';
    const record = await runTask({ driver: fakeDriver(good), mode: 'none', task, sources: { index }, model: 'claude-sonnet-5', checker: stubChecker });
    expect(record.id).toBe('confirm__none__api__claude-sonnet-5__1');
    expect(record.verdict).toEqual({ passed: true, score: 1 });
    expect(record.checks?.usedComponents).toEqual(['JxButton', 'JxModal']);
    expect(record.costUsd).toBe(priceOf('claude-sonnet-5', record.usage));
    expect(record.library.name).toBe('sample-kit');
  });

  it('сохраняет ответ модели, даже если проверка кода упала', async () => {
    const good = '```tsx\nimport { JxButton } from \'@jinx-ui/react\';\nexport default () => <JxButton>ok</JxButton>;\n```';
    const broken = { check: async () => Promise.reject(new Error('Проверка не уложилась в 5 с')) };
    const record = await runTask({ driver: fakeDriver(good), mode: 'none', task, sources: { index }, model: 'claude-sonnet-5', checker: broken });
    expect(record.output.code).toMatch(/JxButton/);
    expect(record.checks).toBeNull();
    expect(record.checkError).toBe('Проверка не уложилась в 5 с');
    expect(record.verdict.passed).toBe(false);
  });

  it('различает прогоны с разным уровнем усилий в имени записи', () => {
    expect(runFileName(task, 'docs', 'api', 'claude-sonnet-5', 1)).toBe('confirm__docs__api__claude-sonnet-5__1.json');
    expect(runFileName(task, 'docs', 'api', 'claude-sonnet-5', 1, 'low')).toBe('confirm__docs__api__claude-sonnet-5__effort-low__1.json');
  });

  it('проваливает прогон с выдуманным пропсом и снижает счёт', async () => {
    const bad = '```tsx\nimport { JxButton } from \'@jinx-ui/react\';\nexport default () => <JxButton color="red">ok</JxButton>;\n```';
    const record = await runTask({ driver: fakeDriver(bad), mode: 'none', task, sources: { index }, model: 'claude-sonnet-5', checker: stubChecker, repeat: 2 });
    expect(record.verdict.passed).toBe(false);
    expect(record.verdict.score).toBeLessThan(1);
    expect(record.checks?.tsc.unknownProps).toEqual([{ component: 'JxButton', prop: 'color' }]);
    expect(record.repeat).toBe(2);
  });
});

describe('драйвер claude-code', () => {
  it('разбирает stream-json: текст, usage по ходам, вызовы инструментов, стоимость', () => {
    const lines = [
      JSON.stringify({ type: 'system', subtype: 'init' }),
      JSON.stringify({ type: 'assistant', message: { content: [{ type: 'tool_use', id: 't1', name: 'mcp__context-lab__search_components', input: { query: 'modal' } }], usage: { input_tokens: 100, output_tokens: 20 } } }),
      JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', tool_use_id: 't1', content: 'JxModal — окно' }] } }),
      JSON.stringify({ type: 'assistant', message: { content: [{ type: 'text', text: '```tsx\nexport default () => null;\n```' }], usage: { input_tokens: 200, output_tokens: 50, cache_read_input_tokens: 80 }, stop_reason: 'end_turn' } }),
      JSON.stringify({ type: 'result', subtype: 'success', result: '```tsx\nexport default () => null;\n```', usage: { input_tokens: 300, output_tokens: 70, cache_read_input_tokens: 80, cache_creation_input_tokens: 0 }, total_cost_usd: 0.0123, duration_ms: 4200, is_error: false }),
    ];
    const parsed = parseStreamJson(lines.join('\n'));
    expect(parsed.text).toMatch(/export default/);
    expect(parsed.turns).toHaveLength(2);
    expect(parsed.turns[0]?.toolCalls[0]).toMatchObject({ name: 'mcp__context-lab__search_components', input: { query: 'modal' } });
    expect(parsed.turns[0]?.toolCalls[0]?.resultTokens).toBeGreaterThan(0);
    expect(parsed.usage).toEqual({ input: 300, output: 70, cacheRead: 80, cacheCreation: 0 });
    expect(parsed.costUsd).toBe(0.0123);
    expect(parsed.durationMs).toBe(4200);
    expect(parsed.isError).toBe(false);
  });

  it('помечает ошибочный результат', () => {
    const parsed = parseStreamJson(JSON.stringify({ type: 'result', subtype: 'error_during_execution', is_error: true, result: 'boom' }));
    expect(parsed.isError).toBe(true);
    expect(parsed.errorText).toBe('boom');
  });

  it('считает ходом один вызов модели, даже если его блоки пришли отдельными событиями', () => {
    const usage = { input_tokens: 2, output_tokens: 7, cache_read_input_tokens: 8233, cache_creation_input_tokens: 411 };
    const lines = [
      JSON.stringify({ type: 'assistant', message: { id: 'msg_1', content: [{ type: 'thinking', thinking: '...' }], usage } }),
      JSON.stringify({ type: 'assistant', message: { id: 'msg_1', content: [{ type: 'tool_use', id: 't1', name: 'mcp__context-lab__search_components', input: { query: 'modal' } }], usage } }),
      JSON.stringify({ type: 'assistant', message: { id: 'msg_1', content: [{ type: 'tool_use', id: 't2', name: 'mcp__context-lab__get_component_api', input: { name: 'JxModal' } }], usage } }),
      JSON.stringify({ type: 'assistant', message: { id: 'msg_2', content: [{ type: 'text', text: 'готово' }], usage: { ...usage, cache_read_input_tokens: 9000 } } }),
    ];
    const parsed = parseStreamJson(lines.join('\n'));
    expect(parsed.turns).toHaveLength(2);
    expect(parsed.turns[0]?.toolCalls.map((call) => call.name)).toEqual(['mcp__context-lab__search_components', 'mcp__context-lab__get_component_api']);
    expect(parsed.usage.cacheRead).toBe(8233 + 9000);
  });

  it('записывает прогон, упёршийся в лимит ходов, как провал, а не как сбой', () => {
    const parsed = parseStreamJson(JSON.stringify({ type: 'result', subtype: 'error_max_turns', is_error: true, num_turns: 9 }));
    expect(parsed.isError).toBe(false);
    expect(parsed.stopReason).toBe('max_turns');
  });

  it('берёт причину остановки из итогового события', () => {
    const parsed = parseStreamJson(JSON.stringify({ type: 'result', subtype: 'success', result: 'текст', stop_reason: 'max_tokens', usage: { input_tokens: 1, output_tokens: 1 } }));
    expect(parsed.stopReason).toBe('max_tokens');
  });

  it('строит аргументы без встроенных инструментов и с MCP-сервером', () => {
    const request = { model: 'sonnet', system: 'sys', contextText: 'ctx', taskText: 'task', maxTurns: 6 };
    const bare = buildClaudeArgs(request, {});
    expect(bare).toContain('--strict-mcp-config');
    expect(bare[bare.indexOf('--tools') + 1]).toBe('');
    expect(bare[bare.indexOf('--setting-sources') + 1]).toBe('');
    expect(bare[bare.indexOf('--mcp-config') + 1]).toBe('{"mcpServers":{}}');
    expect(bare).not.toContain('--allowedTools');
    const withMcp = buildClaudeArgs(request, { mcpServer: { name: 'context-lab', config: { command: 'node', args: ['mcp.js'] }, tools: ['search_components'] } });
    expect(withMcp).toContain('--strict-mcp-config');
    expect(withMcp[withMcp.indexOf('--tools') + 1]).toBe('');
    expect(withMcp[withMcp.indexOf('--allowedTools') + 1]).toBe('mcp__context-lab__search_components');
    expect(composePrompt(request)).toBe('ctx\n\ntask');
  });
});

describe('матрица', () => {
  it('считает медианы, долю успешных и покрытие по ячейкам', () => {
    const base = (overrides: Partial<RunRecord>): RunRecord => ({
      id: 'x',
      createdAt: '',
      repeat: 1,
      durationMs: 1,
      driver: 'api',
      library: { name: 'k', version: '1', commit: '' },
      model: 'claude-sonnet-5',
      mode: 'none',
      task,
      context: { tokens: 0, sources: [] },
      turns: [],
      usage: { input: 100, output: 10, cacheRead: 0, cacheCreation: 0 },
      costUsd: 0.01,
      stopReason: 'end_turn',
      output: { code: '', text: '' },
      checks: null,
      verdict: { passed: false, score: 0 },
      ...overrides,
    });
    const runs = [
      base({ id: 'a', verdict: { passed: true, score: 1 }, costUsd: 0.02 }),
      base({ id: 'b', verdict: { passed: false, score: 0.4 }, usage: { input: 300, output: 30, cacheRead: 0, cacheCreation: 0 } }),
      base({ id: 'c', mode: 'docs', verdict: { passed: true, score: 1 } }),
    ];
    const matrix = buildMatrix(runs);
    expect(matrix.modes).toEqual(['none', 'docs']);
    const none = matrix.cells.find((cell) => cell.mode === 'none');
    expect(none).toMatchObject({ passRate: 0.5, medianTokens: 220, medianContextTokens: 0, medianCostUsd: 0.015, runs: ['a', 'b'] });
    expect(median([3, 1, 2])).toBe(2);
    expect(median([])).toBe(0);
  });

  it('берёт реальный вход первого вызова модели из usage первого хода', () => {
    const run = (id: string, turns: RunRecord['turns']): RunRecord => ({
      id,
      createdAt: '',
      repeat: 1,
      durationMs: 1,
      driver: 'claude-code',
      library: { name: 'k', version: '1', commit: '' },
      model: 'claude-opus-5',
      mode: 'docs',
      task,
      context: { tokens: 100, sources: [] },
      turns,
      usage: { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 },
      costUsd: null,
      stopReason: 'end_turn',
      output: { code: '', text: '' },
      checks: null,
      verdict: { passed: false, score: 0 },
    });
    const first = (cacheRead: number): RunRecord['turns'] => [{ usage: { input: 2, output: 50, cacheRead, cacheCreation: 8 }, toolCalls: [] }];
    const matrix = buildMatrix([run('a', first(1000)), run('b', first(3000)), run('c', [])]);
    expect(firstPromptTokens(run('a', first(1000)))).toBe(1010);
    expect(matrix.cells[0]?.medianPromptTokens).toBe(2010);
  });

  it('отличает редакции одного источника по отпечатку текста, а в старых записях по числу токенов', () => {
    const run = (id: string, source: RunRecord['context']['sources'][number]): RunRecord => ({
      id,
      createdAt: '',
      repeat: 1,
      durationMs: 1,
      driver: 'claude-code',
      library: { name: 'k', version: '1', commit: '' },
      model: 'claude-opus-5',
      mode: 'docs',
      task,
      context: { tokens: source.tokens, sources: [source] },
      turns: [],
      usage: { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 },
      costUsd: null,
      stopReason: 'end_turn',
      output: { code: '', text: '' },
      checks: null,
      verdict: { passed: false, score: 0 },
    });
    const docs = (tokens: number, hash?: string) => ({ kind: 'docs' as const, id: 'llms-full.txt', version: '1', tokens, ...(hash ? { hash } : {}) });
    const matrix = buildMatrix([run('a', docs(16514)), run('b', docs(18550)), run('c', docs(18550)), run('d', docs(20066, textHash('новая редакция')))]);
    expect(matrix.sourceRevisions.docs?.map((revision) => [revision.tokens, revision.runs])).toEqual([
      [16514, 1],
      [18550, 2],
      [20066, 1],
    ]);
    expect(textHash('новая редакция')).toBe(textHash('новая редакция'));
    expect(textHash('новая редакция')).not.toBe(textHash('новая редакция.'));
  });

  it('не смешивает в одной матрице прогоны против разных версий библиотеки', () => {
    const run = (id: string, library: RunRecord['library']): RunRecord => ({
      id,
      createdAt: '',
      repeat: 1,
      durationMs: 1,
      driver: 'api',
      library,
      model: 'claude-sonnet-5',
      mode: 'none',
      task,
      context: { tokens: 0, sources: [] },
      turns: [],
      usage: { input: 1, output: 1, cacheRead: 0, cacheCreation: 0 },
      costUsd: null,
      stopReason: 'end_turn',
      output: { code: '', text: '' },
      checks: null,
      verdict: { passed: true, score: 1 },
    });
    const sourceBuild = { name: 'jinx-ui', version: '0.1.0', commit: '63b81b611c5912463052a5eda0da76ddfd1eb931' };
    const published = { name: 'jinx-ui', version: '0.1.0', commit: '' };

    expect(libraryKey(sourceBuild)).toBe('0.1.0@63b81b6');
    expect(libraryKey(published)).toBe('0.1.0');
    expect(() => buildMatrix([run('old', sourceBuild), run('new', published)])).toThrow(/0\.1\.0@63b81b6, 0\.1\.0/);
    expect(buildMatrix([run('a', published), run('b', published)]).library).toEqual(published);
  });

  it('не смешивает в одной матрице разные модели, драйверы и уровни усилий', () => {
    const run = (id: string, overrides: Partial<RunRecord>): RunRecord => ({
      id,
      createdAt: '',
      repeat: 1,
      durationMs: 1,
      driver: 'claude-code',
      library: { name: 'jinx-ui', version: '0.1.0', commit: '' },
      model: 'claude-opus-5',
      mode: 'none',
      task,
      context: { tokens: 0, sources: [] },
      turns: [],
      usage: { input: 1, output: 1, cacheRead: 0, cacheCreation: 0 },
      costUsd: null,
      stopReason: 'end_turn',
      output: { code: '', text: '' },
      checks: null,
      verdict: { passed: false, score: 0 },
      ...overrides,
    });
    expect(() => buildMatrix([run('a', {}), run('b', { model: 'claude-sonnet-5' })])).toThrow(/claude-opus-5, claude-sonnet-5/);
    expect(() => buildMatrix([run('a', {}), run('b', { driver: 'subagent' })])).toThrow(/claude-code, subagent/);
    expect(() => buildMatrix([run('a', {}), run('b', { effort: 'low' })])).toThrow(/уровней усилий/);
    expect(buildMatrix([run('a', {}), run('b', {})]).model).toBe('claude-opus-5');
  });
});

describe('хранилище прогонов', () => {
  it('раскладывает прогоны по папкам версий и читает только папку своей версии', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'runs-'));
    const oldBuild = { version: '0.1.0', commit: '63b81b611c5912463052a5eda0da76ddfd1eb931' };
    const published = { version: '0.1.0', commit: '' };
    expect(runsFolder(dir, oldBuild)).toBe(path.join(dir, '0.1.0@63b81b6'));
    expect(runsFolder(dir, published)).toBe(path.join(dir, '0.1.0'));

    mkdirSync(runsFolder(dir, oldBuild), { recursive: true });
    mkdirSync(runsFolder(dir, published), { recursive: true });
    writeFileSync(path.join(runsFolder(dir, oldBuild), 'b.json'), JSON.stringify({ id: 'b' }), 'utf8');
    writeFileSync(path.join(runsFolder(dir, oldBuild), 'a.json'), JSON.stringify({ id: 'a' }), 'utf8');
    writeFileSync(path.join(runsFolder(dir, published), 'a.json'), JSON.stringify({ id: 'new' }), 'utf8');

    expect(libraryFolders(dir)).toEqual(['0.1.0', '0.1.0@63b81b6']);
    expect(readRunFolder(runsFolder(dir, oldBuild)).map((run) => run.id)).toEqual(['a', 'b']);
    expect(readRunFolder(runsFolder(dir, published)).map((run) => run.id)).toEqual(['new']);
    expect(readRunFolder(path.join(dir, 'missing'))).toEqual([]);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('драйвер claude-code как процесс', () => {
  const fake = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'fake-claude.mjs');
  const request = (taskText: string, extra: Partial<GenerationRequest> = {}): GenerationRequest => ({ model: 'm', system: 's', contextText: '', taskText, maxTurns: 8, ...extra });

  it('возвращает ответ процесса и передаёт ему уровень усилий', async () => {
    const result = await claudeCodeDriver({ binary: fake }).generate(request('обычная задача', { effort: 'low' }));
    expect(result.text).toBe('effort:low');
    expect(result.stopReason).toBe('end_turn');
  });

  it('помечает прогон, убитый по таймауту, а не выдаёт его за обычный', async () => {
    const result = await claudeCodeDriver({ binary: fake, timeoutMs: 500 }).generate(request('HANG'));
    expect(result.stopReason).toBe('timeout');
    expect(result.turns).toHaveLength(1);
  });

  it('возвращает прогон, упёршийся в лимит ходов, вместо ошибки', async () => {
    const result = await claudeCodeDriver({ binary: fake }).generate(request('MAX_TURNS'));
    expect(result.stopReason).toBe('max_turns');
    expect(result.turns[0]?.toolCalls).toHaveLength(1);
  });

  it('отменённый прогон завершается ошибкой, и процесс не остаётся висеть', async () => {
    const controller = new AbortController();
    const pending = claudeCodeDriver({ binary: fake }).generate(request('HANG', { signal: controller.signal }));
    setTimeout(() => controller.abort(), 200);
    await expect(pending).rejects.toThrow('Прогон отменён');
  });
});
