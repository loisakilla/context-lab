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

function tone(passRate: number): string {
  if (passRate === 1) return 'chip chip--ok chip--mono';
  if (passRate === 0) return 'chip chip--bad chip--mono';
  return 'chip chip--warn chip--mono';
}

export function MatrixTable({ matrix }: { matrix: Matrix }) {
  return (
    <div className="card card--flush">
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Задача</th>
              {matrix.modes.map((mode) => (
                <th key={mode} scope="col">
                  {MODE_LABELS[mode] ?? mode}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.tasks.map((task) => (
              <tr key={task.id}>
                <th scope="row">{task.title}</th>
                {matrix.modes.map((mode) => {
                  const cell = matrix.cells.find((candidate) => candidate.taskId === task.id && candidate.mode === mode);
                  if (!cell) {
                    return (
                      <td key={mode} className="dim">
                        —
                      </td>
                    );
                  }
                  const first = cell.runs[0];
                  const passed = Math.round(cell.passRate * cell.runs.length);
                  const body = (
                    <>
                      <span className={tone(cell.passRate)}>
                        {passed}/{cell.runs.length}
                      </span>
                      <span className="muted mono text-[12.5px] leading-snug">
                        {cell.medianTokens > 0
                          ? `${Math.round(cell.medianTokens).toLocaleString('ru-RU')} ток · ${formatCost(cell.medianCostUsd)}`
                          : `контекст ~${Math.round(cell.medianContextTokens).toLocaleString('ru-RU')}`}
                        {cell.medianTurns > 0 && (
                          <>
                            <br />
                            {cell.medianTurns} ход · {cell.medianSeconds} с
                          </>
                        )}
                      </span>
                    </>
                  );
                  return (
                    <td key={mode}>
                      {first ? (
                        <Link href={`/run/${first}`} className="cell" aria-label={`${task.title}, режим «${MODE_LABELS[mode] ?? mode}»: открыть прогон`}>
                          {body}
                        </Link>
                      ) : (
                        <div className="cell">{body}</div>
                      )}
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
