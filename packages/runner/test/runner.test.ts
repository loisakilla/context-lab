import { describe, expect, it } from 'vitest';
import { lintCode, usedComponents } from '@context-lab/checks';
import { sampleIndex } from '../../index-tools/test/helpers.ts';
import { buildContext, contextTokens } from '../src/context.ts';
import { buildClaudeArgs, composePrompt, parseStreamJson } from '../src/drivers/claude-code.ts';
import { extractCode } from '../src/extract-code.ts';
import { buildMatrix, median } from '../src/matrix.ts';
import { priceOf } from '../src/price.ts';
import { runTask } from '../src/run.ts';
import type { Driver, RunRecord, Task } from '../src/types.ts';

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
});
