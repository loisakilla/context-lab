import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, resolveFrom } from '@context-lab/docgen';
import type { Matrix } from '@context-lab/runner';

const MODE_LABELS: Record<string, string> = {
  none: 'без контекста',
  readme: 'README',
  docs: 'доки',
  'docs+rules': 'доки + правила',
  mcp: 'MCP',
};

const DRIVER_LABELS: Record<string, string> = {
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
const modes = matrix.modes;
const withUsage = matrix.cells.some((cell) => cell.medianTokens > 0);
const withCost = matrix.cells.some((cell) => cell.medianCostUsd !== null);

function cellsOf(mode: string) {
  return matrix.cells.filter((cell) => cell.mode === mode);
}

function share(mode: string, predicate: (value: number) => boolean, pick: (cell: Matrix['cells'][number]) => number): string {
  const cells = cellsOf(mode);
  if (cells.length === 0) return '—';
  return `${Math.round((cells.filter((cell) => predicate(pick(cell))).length / cells.length) * 100)}%`;
}

function mean(mode: string, pick: (cell: Matrix['cells'][number]) => number): number {
  const cells = cellsOf(mode);
  if (cells.length === 0) return 0;
  return cells.reduce((sum, cell) => sum + pick(cell), 0) / cells.length;
}

function meanCost(mode: string): string {
  const cells = cellsOf(mode).filter((cell) => cell.medianCostUsd !== null);
  if (cells.length === 0) return '—';
  return `$${(cells.reduce((sum, cell) => sum + (cell.medianCostUsd ?? 0), 0) / cells.length).toFixed(3)}`;
}

const headers = [
  'Режим',
  'Контекст до задачи',
  ...(withUsage ? ['Токенов на задачу'] : []),
  ...(withCost ? ['Цена задачи'] : []),
  'Задач без ошибок',
  'Ошибок компилятора на задачу',
  'Нарушений правил',
  'Покрытие нужных компонентов',
];

const summary: string[] = [`| ${headers.join(' | ')} |`, `|${headers.map(() => '---').join('|')}|`];
for (const mode of modes) {
  const columns = [
    MODE_LABELS[mode] ?? mode,
    `~${Math.round(mean(mode, (cell) => cell.medianContextTokens)).toLocaleString('ru-RU')} ток.`,
    ...(withUsage ? [`${Math.round(mean(mode, (cell) => cell.medianTokens)).toLocaleString('ru-RU')} ток.`] : []),
    ...(withCost ? [meanCost(mode)] : []),
    share(mode, (value) => value === 1, (cell) => cell.passRate),
    mean(mode, (cell) => cell.medianTscErrors).toFixed(1),
    mean(mode, (cell) => cell.medianLintErrors).toFixed(1),
    `${Math.round(mean(mode, (cell) => cell.meanCoverage) * 100)}%`,
  ];
  summary.push(`| ${columns.join(' | ')} |`);
}

const perTask: string[] = ['', '<details><summary>По задачам: ошибок компилятора в каждой ячейке</summary>', '', `| Задача | ${modes.map((mode) => MODE_LABELS[mode] ?? mode).join(' | ')} |`, `|---|${modes.map(() => '---').join('|')}|`];
for (const task of matrix.tasks) {
  const cells = modes.map((mode) => {
    const cell = matrix.cells.find((candidate) => candidate.taskId === task.id && candidate.mode === mode);
    if (!cell) return '—';
    return cell.passRate === 1 ? '✅ 0' : `${cell.passRate > 0 ? '⚠️' : '❌'} ${cell.medianTscErrors}`;
  });
  perTask.push(`| ${task.title} | ${cells.join(' | ')} |`);
}
perTask.push('', '</details>');

const runsPerCell = matrix.cells.length > 0 ? matrix.generatedFrom / matrix.cells.length : 0;
const repeats = Number.isInteger(runsPerCell) && runsPerCell > 1 ? `, по ${runsPerCell} прогона на ячейку` : '';
const driver = matrix.driver ? `, драйвер ${DRIVER_LABELS[matrix.driver] ?? matrix.driver}` : '';

const block = [
  START,
  '',
  `Модель ${matrix.model}, библиотека ${matrix.library?.name}@${matrix.library?.version}${driver}, прогонов ${matrix.generatedFrom}, задач ${matrix.tasks.length}${repeats}. В ячейках медианы.`,
  '',
  ...summary,
  ...perTask,
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
process.stderr.write(`README обновлён: режимов ${modes.length}, задач ${matrix.tasks.length}, прогонов ${matrix.generatedFrom}.\n`);
