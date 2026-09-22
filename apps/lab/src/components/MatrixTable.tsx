import Link from 'next/link';
import { JxTable } from '@jinx-ui/react';
import type { Matrix } from '@context-lab/runner/browser';
import { formatCost } from './Report';

export const MODE_LABELS: Record<string, string> = {
  none: 'без контекста',
  readme: 'README',
  docs: 'доки',
  'docs+rules': 'доки + правила',
  mcp: 'MCP',
};

export function MatrixTable({ matrix }: { matrix: Matrix }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        {matrix.generatedFrom} прогонов · драйвер {matrix.driver === 'claude-code' ? 'Claude Code' : matrix.driver} · модель {matrix.model} · библиотека {matrix.library?.name}@{matrix.library?.version}. В ячейке: доля прогонов без ошибок, медиана токенов и стоимости.
      </p>
      <div className="overflow-x-auto">
        <JxTable>
          <thead>
            <tr>
              <th>Задача</th>
              {matrix.modes.map((mode) => (
                <th key={mode}>{MODE_LABELS[mode] ?? mode}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.tasks.map((task) => (
              <tr key={task.id}>
                <td>{task.title}</td>
                {matrix.modes.map((mode) => {
                  const cell = matrix.cells.find((candidate) => candidate.taskId === task.id && candidate.mode === mode);
                  if (!cell) return <td key={mode}>—</td>;
                  const first = cell.runs[0];
                  return (
                    <td key={mode}>
                      <div className="flex flex-col gap-1 text-sm">
                        <span style={{ color: cell.passRate === 1 ? 'var(--jx-success)' : cell.passRate === 0 ? 'var(--jx-danger)' : 'var(--jx-warning)' }}>
                          {Math.round(cell.passRate * 100)}% без ошибок
                        </span>
                        <span className="opacity-70">
                          {cell.medianTokens > 0
                            ? `${Math.round(cell.medianTokens).toLocaleString('ru-RU')} ток. · ${formatCost(cell.medianCostUsd)}`
                            : `контекст ~${Math.round(cell.medianContextTokens).toLocaleString('ru-RU')} ток.`}
                        </span>
                        {cell.medianTurns > 0 && (
                          <span className="opacity-70">
                            {cell.medianTurns} ход. · {cell.medianToolCalls} выз. · {cell.medianSeconds} с
                          </span>
                        )}
                        {first && (
                          <Link href={`/run/${first}`} className="underline">
                            прогоны ({cell.runs.length})
                          </Link>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </JxTable>
      </div>
    </div>
  );
}
