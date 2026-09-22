import Link from 'next/link';
import type { Matrix } from '@context-lab/runner/browser';
import { formatCost } from './Report';

export const MODE_LABELS: Record<string, string> = {
  none: 'без контекста',
  readme: 'README',
  docs: 'доки',
  'docs+rules': 'доки + правила',
  mcp: 'MCP',
};

function verdictColor(passRate: number): string {
  if (passRate === 1) return 'var(--ok)';
  if (passRate === 0) return 'var(--bad)';
  return 'var(--warn)';
}

export function MatrixTable({ matrix }: { matrix: Matrix }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="muted max-w-[70ch] text-sm">
        {matrix.generatedFrom} прогонов · модель {matrix.model} · библиотека {matrix.library?.name}@{matrix.library?.version}. В ячейке: доля прогонов без
        ошибок, медиана токенов и цены, ходы и время.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="field-label border-b px-3 py-2 text-left" style={{ borderColor: 'var(--line)' }}>
                Задача
              </th>
              {matrix.modes.map((mode) => (
                <th key={mode} className="field-label border-b px-3 py-2 text-left" style={{ borderColor: 'var(--line)' }}>
                  {MODE_LABELS[mode] ?? mode}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.tasks.map((task) => (
              <tr key={task.id}>
                <td className="border-b px-3 py-3 align-top" style={{ borderColor: 'var(--line)' }}>
                  {task.title}
                </td>
                {matrix.modes.map((mode) => {
                  const cell = matrix.cells.find((candidate) => candidate.taskId === task.id && candidate.mode === mode);
                  if (!cell) {
                    return (
                      <td key={mode} className="quiet border-b px-3 py-3 align-top" style={{ borderColor: 'var(--line)' }}>
                        —
                      </td>
                    );
                  }
                  const first = cell.runs[0];
                  const passed = Math.round(cell.passRate * cell.runs.length);
                  return (
                    <td key={mode} className="border-b px-3 py-3 align-top" style={{ borderColor: 'var(--line)' }}>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono" style={{ color: verdictColor(cell.passRate) }}>
                          {passed}/{cell.runs.length} без ошибок
                        </span>
                        <span className="muted">
                          {cell.medianTokens > 0
                            ? `${Math.round(cell.medianTokens).toLocaleString('ru-RU')} ток. · ${formatCost(cell.medianCostUsd)}`
                            : `контекст ~${Math.round(cell.medianContextTokens).toLocaleString('ru-RU')} ток.`}
                        </span>
                        {cell.medianTurns > 0 && (
                          <span className="quiet">
                            {cell.medianTurns} ход. · {cell.medianSeconds} с
                          </span>
                        )}
                        {first && (
                          <Link href={`/run/${first}`} className="link link--accent">
                            прогон
                          </Link>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
