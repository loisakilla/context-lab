import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, resolveFrom } from '@context-lab/docgen';
import { MODE_LABELS, type Matrix, type MatrixCell } from '@context-lab/runner';

const DRIVER_PHRASES: Record<string, string> = {
  'claude-code': 'Claude Code по подписке',
  api: 'Anthropic API',
  subagent: 'агенты-исполнители',
};

const START = '<!-- matrix:start -->';
const END = '<!-- matrix:end -->';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = loadConfig(path.join(root, 'context-lab.config.json'));
const matrixFile = resolveFrom(config, config.matrix);
if (!existsSync(matrixFile)) {
  process.stderr.write(`Матрицы ${config.matrix} нет: сначала выполните npm run matrix\n`);
  process.exit(1);
}

const matrix = JSON.parse(readFileSync(matrixFile, 'utf8')) as Matrix;
const matrixDir = path.dirname(matrixFile);
const others = readdirSync(matrixDir)
  .filter((file) => /^matrix-.+\.json$/.test(file))
  .map((file) => JSON.parse(readFileSync(path.join(matrixDir, file), 'utf8')) as Matrix)
  .filter((other) => other.model !== matrix.model);

const modes = matrix.modes;
const withUsage = matrix.cells.some((cell) => cell.medianTokens > 0);
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

const headers = [
  'Режим',
  'Контекст до задачи',
  ...(withUsage ? ['Токенов на задачу'] : []),
  ...(withCost ? ['Цена задачи'] : []),
  ...(withTurns ? ['Ходов', 'Секунд'] : []),
  'Задач, где прошли все прогоны',
  'Ошибок компилятора на задачу',
  'Нарушений правил',
  'Покрытие нужных компонентов',
];

const summary: string[] = [`| ${headers.join(' | ')} |`, `|${headers.map(() => '---').join('|')}|`];
for (const mode of modes) {
  const columns = [
    MODE_LABELS[mode] ?? mode,
    `~${tokens(mean(matrix, mode, (cell) => cell.medianContextTokens))}`,
    ...(withUsage ? [tokens(mean(matrix, mode, (cell) => cell.medianTokens))] : []),
    ...(withCost ? [meanCost(matrix, mode)] : []),
    ...(withTurns ? [mean(matrix, mode, (cell) => cell.medianTurns).toFixed(1), mean(matrix, mode, (cell) => cell.medianSeconds).toFixed(0)] : []),
    share(matrix, mode),
    mean(matrix, mode, (cell) => cell.medianTscErrors).toFixed(1),
    mean(matrix, mode, (cell) => cell.medianLintErrors).toFixed(1),
    `${Math.round(mean(matrix, mode, (cell) => cell.meanCoverage) * 100)}%`,
  ];
  summary.push(`| ${columns.join(' | ')} |`);
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
    '| Модель | Режим | Задач, где прошли все прогоны | Ошибок компилятора на задачу | Цена задачи |',
    '|---|---|---|---|---|',
  );
  for (const source of [matrix, ...others]) {
    for (const mode of source.modes) {
      byModel.push(
        `| ${source.model} | ${MODE_LABELS[mode] ?? mode} | ${share(source, mode)} | ${mean(source, mode, (cell) => cell.medianTscErrors).toFixed(1)} | ${meanCost(source, mode)} |`,
      );
    }
  }
  byModel.push('', '</details>');
}

const runsPerCell = matrix.cells.length > 0 ? matrix.generatedFrom / matrix.cells.length : 0;
const repeats = Number.isInteger(runsPerCell) && runsPerCell > 1 ? `, по ${runsPerCell} прогона на ячейку` : '';
const driver = matrix.driver ? `, драйвер ${DRIVER_PHRASES[matrix.driver] ?? matrix.driver}` : '';

const block = [
  START,
  '',
  `Модель ${matrix.model}, библиотека ${matrix.library?.name}@${matrix.library?.version}${driver}, прогонов ${matrix.generatedFrom}, задач ${matrix.tasks.length}${repeats}. В ячейках медианы.`,
  '',
  ...summary,
  ...perTask,
  ...byModel,
  '',
  END,
].join('\n');

const readmeFile = path.join(root, 'README.md');
const readme = readFileSync(readmeFile, 'utf8');
const start = readme.indexOf(START);
const end = readme.indexOf(END);
if (start === -1 || end === -1) {
  process.stderr.write(`В README нет маркеров ${START} и ${END}\n`);
  process.exit(1);
}

writeFileSync(readmeFile, `${readme.slice(0, start)}${block}${readme.slice(end + END.length)}`, 'utf8');
process.stderr.write(`README обновлён: режимов ${modes.length}, задач ${matrix.tasks.length}, прогонов ${matrix.generatedFrom}${others.length > 0 ? `, моделей ${others.length + 1}` : ''}.\n`);
