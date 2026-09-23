import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { buildNodeTypeBundle, createChecker, runChecks } from '@context-lab/checks';
import { loadConfig, loadIndex, resolveFrom, type LabConfig } from '@context-lab/docgen/load';
import { apiDriver } from './drivers/api.ts';
import { claudeCodeDriver, type ClaudeCodeDriverOptions } from './drivers/claude-code.ts';
import { findClaudeBinary } from './find-claude.ts';
import { buildMatrix, libraryKey } from './matrix.ts';
import { commandMcpServer, repoMcpServer } from './mcp-config.ts';
import { runFileName, runTask, type CodeChecker } from './run.ts';
import { agentSandbox } from './sandbox.ts';
import { loadSources, loadTasks } from './sources.ts';
import { libraryFolders, readRunFolder, runsFolder } from './store.ts';
import { CONTEXT_MODES, DRIVER_NAMES, type ContextMode, type Driver, type DriverName, type RunRecord, type Task } from './types.ts';

const USAGE = `context-lab runner

Команды:
  run      Прогнать задачи через агента и записать результаты в data/runs/<версия библиотеки>
  matrix   Собрать data/matrix.json из прогонов одной версии библиотеки
  tasks    Показать список задач

Опции run:
  -t, --task <id|all>          Задача из data/tasks.json, по умолчанию all
  -m, --mode <mode|all>        Режим контекста: ${CONTEXT_MODES.join(', ')} или all
  -d, --driver <name>          claude-code | api, по умолчанию claude-code
      --model <model>          Модель, по умолчанию claude-opus-5
      --effort <level>         Уровень усилий модели: low, medium, high
  -r, --repeat <n>             Сколько повторов на ячейку, по умолчанию 1
      --resume                 Пропускать ячейки, для которых запись уже есть
      --rules <file>           Скомпилированные правила для режима docs+rules
      --mcp-command <cmd>      Команда MCP-сервера для режима mcp (по умолчанию из репозитория)

Опции matrix:
  -d, --driver <name>          Учитывать только прогоны этого драйвера
      --model <model>          Учитывать только прогоны этой модели
      --library <key>          Версия библиотеки, по умолчанию текущая из индекса: 0.1.0 или 0.1.0@63b81b6
  -o, --out <file>             Куда записать матрицу, по умолчанию из конфига`;

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function buildChecker(config: LabConfig): CodeChecker {
  const bundle = buildNodeTypeBundle({
    packageRoot: resolveFrom(config, config.library.packageRoot),
    packageName: config.library.package ?? '@jinx-ui/react',
    nodeModules: resolveFrom(config, 'node_modules'),
  });
  const checker = createChecker(bundle);
  return { check: (code, expects) => runChecks(checker, code, expects) };
}

function driverFor(name: DriverName, mode: ContextMode, config: LabConfig, mcpCommand?: string): Driver {
  if (name === 'api') return apiDriver();
  const options: ClaudeCodeDriverOptions = { binary: findClaudeBinary(), cwd: agentSandbox() };
  if (mode === 'mcp') options.mcpServer = mcpCommand ? commandMcpServer(mcpCommand) : repoMcpServer(config.root);
  return claudeCodeDriver(options);
}

function pickModes(value: string | undefined): ContextMode[] {
  if (!value || value === 'all') return [...CONTEXT_MODES];
  const modes = value.split(',').map((mode) => mode.trim()) as ContextMode[];
  for (const mode of modes) if (!CONTEXT_MODES.includes(mode)) fail(`Неизвестный режим "${mode}". Доступны: ${CONTEXT_MODES.join(', ')}`);
  return modes;
}

function pickTasks(all: Task[], value: string | undefined): Task[] {
  if (!value || value === 'all') return all;
  const ids = value.split(',').map((id) => id.trim());
  return ids.map((id) => all.find((task) => task.id === id) ?? fail(`Задачи "${id}" нет в data/tasks.json`));
}

function summary(record: RunRecord): string {
  const tokens = record.usage.input + record.usage.output + record.usage.cacheRead + record.usage.cacheCreation;
  const cost = record.costUsd === null ? 'цена n/a' : `$${record.costUsd.toFixed(4)}`;
  const tsc = record.checks ? `tsc ${record.checks.tsc.errors.length}, lint ${record.checks.lint.filter((finding) => finding.severity === 'error').length}` : 'без кода';
  return `${record.verdict.passed ? '✓' : '✗'} ${record.task.id} ${record.mode} r${record.repeat}: ${tsc}, покрытие ${record.checks?.expectedCoverage ?? 0}, токенов ${tokens}, ${cost}, ${Math.round(record.durationMs / 1000)}с`;
}

async function commandRun(config: LabConfig, values: Record<string, string | boolean | undefined>): Promise<void> {
  const driverName = (values.driver as DriverName | undefined) ?? 'claude-code';
  if (!DRIVER_NAMES.includes(driverName)) fail(`Неизвестный драйвер "${driverName}"`);
  if (driverName === 'subagent') fail('Драйвер subagent сам модель не вызывает: ответы субагентов собираются через npm run prompts и npm run record.');
  const model = (values.model as string | undefined) ?? 'claude-opus-5';
  const repeats = Number.parseInt((values.repeat as string | undefined) ?? '1', 10);
  const resume = values.resume === true;
  const effort = values.effort as string | undefined;
  const sources = loadSources(config, values.rules as string | undefined);
  const tasks = pickTasks(loadTasks(config), values.task as string | undefined);
  const modes = pickModes(values.mode as string | undefined);
  const runsDir = runsFolder(resolveFrom(config, config.runs), sources.index.library);
  mkdirSync(runsDir, { recursive: true });

  process.stderr.write(`Собираю бандл типов для проверок...\n`);
  const checker = buildChecker(config);
  process.stderr.write(
    `Прогон: задач ${tasks.length}, режимов ${modes.length}, повторов ${repeats}, драйвер ${driverName}, модель ${model}, библиотека ${libraryKey(sources.index.library)}.\n`,
  );

  let done = 0;
  let skipped = 0;
  let failed = 0;
  for (const mode of modes) {
    const driver = driverFor(driverName, mode, config, values['mcp-command'] as string | undefined);
    for (const task of tasks) {
      for (let repeat = 1; repeat <= repeats; repeat += 1) {
        const file = path.join(runsDir, runFileName(task, mode, driverName, model, repeat, effort));
        if (resume && existsSync(file)) {
          skipped += 1;
          continue;
        }
        try {
          const record = await runTask({ driver, mode, task, sources, model, ...(effort ? { effort } : {}), repeat, checker });
          writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
          done += 1;
          process.stderr.write(`${summary(record)}\n`);
        } catch (error) {
          failed += 1;
          process.stderr.write(`✗ ${task.id} ${mode} r${repeat}: ${error instanceof Error ? error.message : String(error)}\n`);
        }
      }
    }
  }
  process.stderr.write(`Готово: записано ${done}, пропущено ${skipped}, с ошибкой ${failed}.\n`);
  if (failed > 0) process.exit(1);
}

function commandMatrix(config: LabConfig, values: Record<string, string | boolean | undefined>): void {
  const runsRoot = resolveFrom(config, config.runs);
  const driver = values.driver as string | undefined;
  const model = values.model as string | undefined;
  const library = (values.library as string | undefined) ?? libraryKey(loadIndex(resolveFrom(config, config.index)).library);
  const available = libraryFolders(runsRoot);
  if (!available.includes(library)) {
    fail(`Прогонов против ${library} нет. Записаны версии: ${available.length > 0 ? available.join(', ') : 'никакие'}. Выберите версию через --library.`);
  }
  const runs = readRunFolder(path.join(runsRoot, library)).filter((run) => (!driver || run.driver === driver) && (!model || run.model === model));
  if (runs.length === 0) fail('Нет ни одной записи прогона под заданные фильтры');
  let matrix: ReturnType<typeof buildMatrix>;
  try {
    matrix = buildMatrix(runs);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
  const out = values.out as string | undefined;
  const target = out ? path.resolve(config.root, out) : resolveFrom(config, config.matrix);
  writeFileSync(target, `${JSON.stringify(matrix, null, 2)}\n`, 'utf8');
  process.stderr.write(`Матрица записана в ${path.relative(config.root, target)}: прогонов ${runs.length}, ячеек ${matrix.cells.length}, режимов ${matrix.modes.length}.\n`);
  for (const cell of matrix.cells) {
    process.stderr.write(`  ${cell.taskId.padEnd(18)} ${cell.mode.padEnd(11)} pass ${cell.passRate}  tsc ${cell.medianTscErrors}  tokens ${Math.round(cell.medianTokens)}\n`);
  }
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      config: { type: 'string', short: 'c' },
      task: { type: 'string', short: 't' },
      mode: { type: 'string', short: 'm' },
      driver: { type: 'string', short: 'd' },
      model: { type: 'string' },
      library: { type: 'string' },
      effort: { type: 'string' },
      repeat: { type: 'string', short: 'r' },
      resume: { type: 'boolean' },
      out: { type: 'string', short: 'o' },
      rules: { type: 'string' },
      'mcp-command': { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.help) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }

  const config = loadConfig(values.config);
  const command = positionals[0] ?? 'run';
  switch (command) {
    case 'run':
      await commandRun(config, values);
      return;
    case 'matrix':
      commandMatrix(config, values);
      return;
    case 'tasks':
      for (const task of loadTasks(config)) process.stdout.write(`${task.id.padEnd(18)} ${task.title}  [${task.expects.join(', ')}]\n`);
      return;
    default:
      fail(`Неизвестная команда "${command}".\n\n${USAGE}`);
  }
}

main().catch((error: unknown) => fail(error instanceof Error ? error.message : String(error)));
