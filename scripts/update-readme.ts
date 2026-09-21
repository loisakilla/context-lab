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

const summary: string[] = [
  '| Режим | Контекст до задачи | Задач без ошибок | Ошибок компилятора на задачу | Нарушений правил | Покрытие нужных компонентов |',
  '|---|---|---|---|---|---|',
];
for (const mode of modes) {
  summary.push(
    `| ${MODE_LABELS[mode] ?? mode} | ~${Math.round(mean(mode, (cell) => cell.medianContextTokens)).toLocaleString('ru-RU')} ток. | ${share(mode, (value) => value === 1, (cell) => cell.passRate)} | ${mean(mode, (cell) => cell.medianTscErrors).toFixed(1)} | ${mean(mode, (cell) => cell.medianLintErrors).toFixed(1)} | ${Math.round(mean(mode, (cell) => cell.meanCoverage) * 100)}% |`,
  );
}

const perTask: string[] = ['', '<details><summary>По задачам: ошибок компилятора в каждой ячейке</summary>', '', `| Задача | ${modes.map((mode) => MODE_LABELS[mode] ?? mode).join(' | ')} |`, `|---|${modes.map(() => '---').join('|')}|`];
for (const task of matrix.tasks) {
  const cells = modes.map((mode) => {
    const cell = matrix.cells.find((candidate) => candidate.taskId === task.id && candidate.mode === mode);
    if (!cell) return '—';
    return cell.passRate === 1 ? '✅ 0' : `❌ ${cell.medianTscErrors}`;
  });
  perTask.push(`| ${task.title} | ${cells.join(' | ')} |`);
}
perTask.push('', '</details>');

const block = [
  START,
  '',
  `Модель ${matrix.model}, библиотека ${matrix.library?.name}@${matrix.library?.version}, прогонов ${matrix.generatedFrom}, задач ${matrix.tasks.length}.`,
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
