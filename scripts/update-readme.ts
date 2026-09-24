import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, resolveFrom } from '@context-lab/docgen/load';
import { libraryKey, MODE_LABELS, SOURCE_LABELS, type Matrix, type MatrixCell } from '@context-lab/runner';

const DRIVER_PHRASES: Record<string, string> = {
  'claude-code': 'Claude Code по подписке',
  api: 'Anthropic API',
  subagent: 'агенты-исполнители',
};

const MODE_CONTENTS: Record<string, string> = {
  none: 'только формулировка задачи и требования к ответу',
  readme: 'README npm-пакета `@jinx-ui/react`: установка, модель состояния, `ref`, клавиатура; компоненты названы мимоходом, пропсов нет',
  docs: 'сгенерированный `llms-full.txt`',
  'docs+rules': 'то же плюс правила из реестра',
  mcp: 'описания шести инструментов сервера; API и правила агент берёт сам через `search_components`, `get_component_api` и `get_rules`',
};

const MATRIX_START = '<!-- matrix:start -->';
const MATRIX_END = '<!-- matrix:end -->';
const MODES_START = '<!-- modes:start -->';
const MODES_END = '<!-- modes:end -->';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = loadConfig(path.join(root, 'context-lab.config.json'));
const matrixFile = resolveFrom(config, config.matrix);
if (!existsSync(matrixFile)) {
  process.stderr.write(`Матрицы ${config.matrix} нет: сначала выполните npm run matrix\n`);
  process.exit(1);
}

const matrix = JSON.parse(readFileSync(matrixFile, 'utf8')) as Matrix;
const library = matrix.library ? libraryKey(matrix.library) : '';
const matrixDir = path.dirname(matrixFile);
const others = readdirSync(matrixDir)
  .filter((file) => /^matrix-.+\.json$/.test(file))
  .map((file) => JSON.parse(readFileSync(path.join(matrixDir, file), 'utf8')) as Matrix)
  .filter((other) => other.model !== matrix.model && other.driver === matrix.driver && (other.library ? libraryKey(other.library) : '') === library);

const modes = matrix.modes;
const withUsage = matrix.cells.some((cell) => cell.medianTokens > 0);
const withPrompt = matrix.cells.some((cell) => (cell.medianPromptTokens ?? 0) > 0);
const withPeak = matrix.cells.some((cell) => (cell.medianPeakPromptTokens ?? 0) > 0);
const withCost = matrix.cells.some((cell) => cell.medianCostUsd !== null);
const withTurns = matrix.cells.some((cell) => cell.medianTurns > 0);

function cellsOf(source: Matrix, mode: string): MatrixCell[] {
  return source.cells.filter((cell) => cell.mode === mode);
}

function share(source: Matrix, mode: string): string {
  const cells = cellsOf(source, mode);
  if (cells.length === 0) return '—';
  return `${cells.filter((cell) => cell.passRate === 1).length} из ${cells.length}`;
}

function mean(source: Matrix, mode: string, pick: (cell: MatrixCell) => number): number {
  const cells = cellsOf(source, mode);
  if (cells.length === 0) return 0;
  return cells.reduce((sum, cell) => sum + pick(cell), 0) / cells.length;
}

function meanCost(source: Matrix, mode: string): string {
  const cells = cellsOf(source, mode).filter((cell) => cell.medianCostUsd !== null);
  if (cells.length === 0) return '—';
  return `$${(cells.reduce((sum, cell) => sum + (cell.medianCostUsd ?? 0), 0) / cells.length).toFixed(3)}`;
}

function tokens(value: number): string {
  return `${Math.round(value).toLocaleString('ru-RU')} ток.`;
}

function thousands(value: number): string {
  return `${(value / 1000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })}k`;
}

const prompt = (mode: string) => mean(matrix, mode, (cell) => cell.medianPromptTokens ?? 0);
const baseline = prompt('none');
const added = (mode: string) => prompt(mode) - baseline;

function table(headers: string[], rows: string[][]): string[] {
  return [`| ${headers.join(' | ')} |`, `|${headers.map(() => '---').join('|')}|`, ...rows.map((row) => `| ${row.join(' | ')} |`)];
}

const quality = table(
  ['Режим', 'Задач, где прошли все прогоны', 'Ошибок компилятора на задачу', 'Нарушений правил', 'Покрытие нужных компонентов'],
  modes.map((mode) => [
    MODE_LABELS[mode] ?? mode,
    share(matrix, mode),
    mean(matrix, mode, (cell) => cell.medianTscErrors).toFixed(1),
    mean(matrix, mode, (cell) => cell.medianLintErrors).toFixed(1),
    `${Math.round(mean(matrix, mode, (cell) => cell.meanCoverage) * 100)}%`,
  ]),
);

const consumption = table(
  [
    'Режим',
    ...(withPrompt ? ['Вход первого вызова', 'Из них контекст режима'] : ['Контекст до задачи']),
    ...(withPeak ? ['Самый большой запрос'] : []),
    ...(withUsage ? ['Новых токенов на задачу', 'Из кэша'] : []),
    ...(withCost ? ['Цена задачи'] : []),
    ...(withTurns ? ['Вызовов модели', 'Секунд'] : []),
  ],
  modes.map((mode) => [
    MODE_LABELS[mode] ?? mode,
    ...(withPrompt ? [tokens(prompt(mode)), mode === 'none' ? '—' : `+${tokens(added(mode))}`] : [`~${tokens(mean(matrix, mode, (cell) => cell.medianContextTokens))}`]),
    ...(withPeak ? [tokens(mean(matrix, mode, (cell) => cell.medianPeakPromptTokens ?? 0))] : []),
    ...(withUsage ? [tokens(mean(matrix, mode, (cell) => cell.medianFreshTokens ?? 0)), tokens(mean(matrix, mode, (cell) => cell.medianCacheReadTokens ?? 0))] : []),
    ...(withCost ? [meanCost(matrix, mode)] : []),
    ...(withTurns ? [mean(matrix, mode, (cell) => cell.medianTurns).toFixed(1), mean(matrix, mode, (cell) => cell.medianSeconds).toFixed(0)] : []),
  ]),
);

const summary = [...quality, '', ...consumption];

const notes: string[] = [];
if (withPrompt) {
  notes.push(
    `Вход первого вызова — сколько токенов получил первый запрос к модели, по записанному расходу. У Claude Code в него входит собственный системный промпт, поэтому даже без контекста это ${thousands(baseline)}; контекст режима — разница с режимом без контекста.`,
  );
}
if (withPeak) {
  notes.push('Самый большой запрос — наибольший вход одного вызова модели за задачу: столько места режим занимает в окне контекста.');
}
if (withUsage) {
  notes.push(
    'Новых токенов — то, что модель за задачу получила впервые или написала сама: вход мимо кэша, запись в кэш и вывод. Из кэша — то, что каждый следующий вызов отправляет заново и модель перечитывает за десятую часть цены входа: системный промпт, описания инструментов и прошлые ответы инструментов.',
  );
}
if (withCost) {
  notes.push('Цена посчитана из записанного расхода токенов по тарифу Anthropic для модели прогона.');
}
for (const [kind, revisions] of Object.entries(matrix.sourceRevisions ?? {})) {
  if (revisions.length < 2) continue;
  const parts = revisions.map((revision) => `${revision.runs} видели редакцию на ~${thousands(revision.tokens)} оценочных токенов`);
  notes.push(`Источник «${SOURCE_LABELS[kind] ?? kind}» менялся во время записи: из прогонов с ним ${parts.join(', ')}. Контекст режима выше — среднее по ним.`);
}

const perTask: string[] = [
  '',
  '<details><summary>По задачам: сколько прогонов прошли проверки и медиана ошибок компилятора</summary>',
  '',
  `| Задача | ${modes.map((mode) => MODE_LABELS[mode] ?? mode).join(' | ')} |`,
  `|---|${modes.map(() => '---').join('|')}|`,
];
for (const task of matrix.tasks) {
  const cells = modes.map((mode) => {
    const cell = matrix.cells.find((candidate) => candidate.taskId === task.id && candidate.mode === mode);
    if (!cell) return '—';
    const total = cell.runs.length;
    const passed = Math.round(cell.passRate * total);
    const icon = cell.passRate === 1 ? '✅' : cell.passRate === 0 ? '❌' : '⚠️';
    return `${icon} ${passed}/${total} · ${cell.medianTscErrors} ош.`;
  });
  perTask.push(`| ${task.title} | ${cells.join(' | ')} |`);
}
perTask.push('', '</details>');

const byModel: string[] = [];
if (others.length > 0) {
  byModel.push(
    '',
    '<details><summary>Те же задачи на другой модели</summary>',
    '',
    '| Модель | Режим | Задач, где прошли все прогоны | Ошибок компилятора на задачу | Вызовов модели | Цена задачи |',
    '|---|---|---|---|---|---|',
  );
  for (const source of [matrix, ...others]) {
    for (const mode of source.modes) {
      byModel.push(
        `| ${source.model} | ${MODE_LABELS[mode] ?? mode} | ${share(source, mode)} | ${mean(source, mode, (cell) => cell.medianTscErrors).toFixed(1)} | ${mean(source, mode, (cell) => cell.medianTurns).toFixed(1)} | ${meanCost(source, mode)} |`,
      );
    }
  }
  byModel.push('', '</details>');
}

const runsPerCell = matrix.cells.length > 0 ? matrix.generatedFrom / matrix.cells.length : 0;
const repeats = Number.isInteger(runsPerCell) && runsPerCell > 1 ? `, по ${runsPerCell} прогона на ячейку` : '';
const driver = matrix.driver ? `, драйвер ${DRIVER_PHRASES[matrix.driver] ?? matrix.driver}` : '';

const matrixBlock = [
  MATRIX_START,
  '',
  `Модель ${matrix.model}, библиотека ${matrix.library?.name} ${library}${driver}, прогонов ${matrix.generatedFrom}, задач ${matrix.tasks.length}${repeats}. В ячейках медианы.`,
  '',
  ...summary,
  ...notes.flatMap((note) => ['', note]),
  ...perTask,
  ...byModel,
  '',
  MATRIX_END,
].join('\n');

const modesTable = [
  MODES_START,
  '',
  '| Режим | Что в контексте | Сколько добавляет к запросу |',
  '|---|---|---|',
  ...modes.map((mode) => {
    const cost = !withPrompt ? '—' : mode === 'none' ? 'ничего' : `~${thousands(added(mode))} токенов${mode === 'mcp' ? ' плюс ответы инструментов' : ''}`;
    return `| ${MODE_LABELS[mode] ?? mode} | ${MODE_CONTENTS[mode] ?? ''} | ${cost} |`;
  }),
  '',
  MODES_END,
].join('\n');

function replaceBlock(text: string, start: string, end: string, block: string): string {
  const from = text.indexOf(start);
  const to = text.indexOf(end);
  if (from === -1 || to === -1) {
    process.stderr.write(`В README нет маркеров ${start} и ${end}\n`);
    process.exit(1);
  }
  return `${text.slice(0, from)}${block}${text.slice(to + end.length)}`;
}

const readmeFile = path.join(root, 'README.md');
const readme = readFileSync(readmeFile, 'utf8');
writeFileSync(readmeFile, replaceBlock(replaceBlock(readme, MODES_START, MODES_END, modesTable), MATRIX_START, MATRIX_END, matrixBlock), 'utf8');
process.stderr.write(`README обновлён: режимов ${modes.length}, задач ${matrix.tasks.length}, прогонов ${matrix.generatedFrom}${others.length > 0 ? `, моделей ${others.length + 1}` : ''}.\n`);
