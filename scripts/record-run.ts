import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildNodeTypeBundle, createChecker, runChecks } from '@context-lab/checks';
import { loadConfig, resolveFrom } from '@context-lab/docgen';
import { buildContext, contextTokens, CONTEXT_MODES, extractCode, loadSources, loadTasks, runFileName, runsFolder, scoreOf, type ContextMode, type RunRecord } from '@context-lab/runner';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = loadConfig(path.join(root, 'context-lab.config.json'));
const tasks = loadTasks(config);
const sources = loadSources(config);
const index = sources.index;

const outputsDir = path.join(root, 'data', 'outputs');
const runsDir = runsFolder(resolveFrom(config, config.runs), index.library);
mkdirSync(runsDir, { recursive: true });

const model = process.env.CONTEXT_LAB_MODEL ?? 'claude-opus-5';
const driver = 'subagent';

const checker = createChecker(
  buildNodeTypeBundle({
    packageRoot: resolveFrom(config, config.library.packageRoot),
    packageName: config.library.package ?? '@jinx-ui/react',
    nodeModules: resolveFrom(config, 'node_modules'),
  }),
);

const files = existsSync(outputsDir) ? readdirSync(outputsDir).filter((file) => file.endsWith('.txt') || file.endsWith('.tsx')) : [];
if (files.length === 0) {
  process.stderr.write(`В ${path.relative(root, outputsDir)} нет ответов агента.\n`);
  process.exit(1);
}

let written = 0;
let skipped = 0;

for (const file of files.sort()) {
  const base = file.replace(/\.(txt|tsx)$/, '');
  const [taskId, mode, repeatRaw] = base.split('__');
  const task = tasks.find((candidate) => candidate.id === taskId);
  if (!task || !mode || !CONTEXT_MODES.includes(mode as ContextMode)) {
    process.stderr.write(`пропуск ${file}: имя не разбирается как <task>__<mode>__<repeat>\n`);
    skipped += 1;
    continue;
  }
  const repeat = Number.parseInt(repeatRaw ?? '1', 10) || 1;
  const text = readFileSync(path.join(outputsDir, file), 'utf8');
  const code = extractCode(text);
  const checks = code.length > 0 ? runChecks(checker, code, task.expects) : null;
  const context = buildContext(mode as ContextMode, task, sources);

  const record: RunRecord = {
    id: runFileName(task, mode as ContextMode, driver, model, repeat).replace(/\.json$/, ''),
    createdAt: new Date().toISOString(),
    repeat,
    durationMs: 0,
    driver: driver as RunRecord['driver'],
    library: { ...index.library },
    model,
    mode: mode as ContextMode,
    task,
    context: { tokens: contextTokens(context), sources: context.sources },
    turns: [],
    usage: { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 },
    costUsd: null,
    stopReason: 'end_turn',
    output: { code, text },
    checks,
    verdict: { passed: checks?.passed ?? false, score: 0 },
  };
  record.verdict.score = scoreOf(record);

  writeFileSync(path.join(runsDir, `${record.id}.json`), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
  written += 1;
  const errors = checks ? checks.tsc.errors.length : -1;
  process.stderr.write(`${record.verdict.passed ? '✓' : '✗'} ${record.id}: tsc ${errors}, lint ${checks?.lint.filter((finding) => finding.severity === 'error').length ?? 0}, покрытие ${checks?.expectedCoverage ?? 0}\n`);
}

process.stderr.write(`Записей создано: ${written}, пропущено: ${skipped}.\n`);
