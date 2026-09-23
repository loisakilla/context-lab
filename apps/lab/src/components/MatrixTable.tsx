import Link from 'next/link';
import { JxBadge, JxTable } from '@jinx-ui/react';
import { libraryKey, type Matrix } from '@context-lab/runner/browser';
import { MODE_LABELS, plural } from '@/lib/labels';
import { formatCost } from './Report';

function decimal(value: number): string {
  return value.toLocaleString('ru-RU', { maximumFractionDigits: 1 });
}

function tone(passRate: number): 'success' | 'danger' | 'warning' {
  if (passRate === 1) return 'success';
  if (passRate === 0) return 'danger';
  return 'warning';
}

export function MatrixTable({ matrix }: { matrix: Matrix }) {
  const library = matrix.library ? libraryKey(matrix.library) : null;
  return (
    <div className="overflow-x-auto">
      <JxTable>
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
                    <td key={mode} className="muted">
                      —
                    </td>
                  );
                }
                const first = cell.runs[0];
                const passed = Math.round(cell.passRate * cell.runs.length);
                const body = (
                  <>
                    <JxBadge tone={tone(cell.passRate)}>
                      {passed}/{cell.runs.length}
                    </JxBadge>
                    <span className="muted mono text-[12px] leading-snug">
                      {cell.medianTokens > 0
                        ? `${Math.round(cell.medianTokens).toLocaleString('ru-RU')} ток · ${formatCost(cell.medianCostUsd)}`
                        : `контекст ~${Math.round(cell.medianContextTokens).toLocaleString('ru-RU')}`}
                      {cell.medianTurns > 0 && (
                        <>
                          <br />
                          {decimal(cell.medianTurns)} {plural(cell.medianTurns, 'вызов', 'вызова', 'вызовов')} модели · {decimal(cell.medianSeconds)} с
                        </>
                      )}
                    </span>
                  </>
                );
                return (
                  <td key={mode}>
                    {first && library ? (
                      <Link href={`/run/${library}/${first}`} className="cell" aria-label={`${task.title}, режим «${MODE_LABELS[mode] ?? mode}»: открыть прогон`}>
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
      </JxTable>
    </div>
  );
}
