import type { ReactNode } from 'react';
import { Note } from '@/components/ui';
import { CompareControls } from '@/components/CompareControls';
import { RunPane } from '@/components/RunPane';
import { TopBar } from '@/components/TopBar';
import { MODE_LABELS } from '@/lib/labels';
import { currentLibrary, forDisplay, loadLabTasks, loadMatrix, loadRun, pickRunId, type ShownRun } from '@/lib/data';
import { libraryKey } from '@context-lab/runner/browser';

export const dynamic = 'force-dynamic';

function MissingRun({ task, mode }: { task: string; mode: string }) {
  return (
    <Note title="Прогона нет">
      Для этой задачи в режиме «{MODE_LABELS[mode] ?? mode}» записи нет. Выберите другой режим выше или запишите прогон:{' '}
      <code>
        npm run run -- --task {task} --mode {mode}
      </code>
      .
    </Note>
  );
}

function first(value: string | string[] | undefined, fallback: string): string {
  return (Array.isArray(value) ? value[0] : value) ?? fallback;
}

function recordFor(library: string, id: string | null): ShownRun | null {
  const record = id ? loadRun(library, id) : null;
  return record ? forDisplay(record) : null;
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <>
      <TopBar current="compare" />
      <main className="wrap wrap--wide flex flex-col gap-10 pt-10 pb-24">
        <header className="flex flex-col gap-4">
          <h1>Один запрос, разный контекст</h1>
          <p className="lede">
            Слева и справа — записанные прогоны одной задачи в двух режимах: та же модель, тот же промпт, разный контекст. Сравнивайте не только вердикт, но и
            цену.
          </p>
        </header>
        {children}
      </main>
    </>
  );
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const matrix = loadMatrix();
  if (!matrix?.library) {
    return (
      <Frame>
        <Note title="Сравнивать пока нечего">
          Матрица ещё не записана: запишите прогоны командой <code>npm run run</code> и соберите таблицу через <code>npm run matrix</code>.
        </Note>
      </Frame>
    );
  }

  const library = libraryKey(matrix.library);
  const tasks = loadLabTasks()
    .filter((task) => matrix.cells.some((cell) => cell.taskId === task.id))
    .map((task) => ({ id: task.id, title: task.title }));
  const task = first(params.task, tasks[0]?.id ?? '');
  const left = first(params.left, 'none');
  const right = first(params.right, 'mcp');

  const leftRun = recordFor(library, pickRunId(matrix, task, left));
  const rightRun = recordFor(library, pickRunId(matrix, task, right));
  const prompt = leftRun?.record.task.prompt ?? rightRun?.record.task.prompt ?? '';
  const current = currentLibrary();
  const staleLibrary = (leftRun || rightRun) && library !== current ? library : null;

  return (
    <Frame>
      <div className="jx-card flex flex-col gap-6">
        <CompareControls tasks={tasks} modes={matrix.modes} task={task} left={left} right={right} />
        {prompt && (
          <>
            <hr className="rule" />
            <div className="flex flex-col gap-2">
              <span className="jx-label">Формулировка задачи</span>
              <p className="max-w-[80ch]">{prompt}</p>
            </div>
          </>
        )}
      </div>

      {staleLibrary && (
        <Note title="Прогоны сделаны против другой версии библиотеки">
          Эти прогоны записаны против jinx-ui {staleLibrary}, а лаборатория сейчас собирает контекст из {current}. Они показывают, как контекст работал на той
          версии; чтобы сравнивать на текущей, перезапишите прогоны.
        </Note>
      )}

      <section className="grid items-start gap-10 xl:grid-cols-2 xl:gap-12">
        {leftRun ? <RunPane record={leftRun.record} compiled={leftRun.compiled} title={MODE_LABELS[left] ?? left} /> : <MissingRun task={task} mode={left} />}
        {rightRun ? <RunPane record={rightRun.record} compiled={rightRun.compiled} title={MODE_LABELS[right] ?? right} /> : <MissingRun task={task} mode={right} />}
      </section>
    </Frame>
  );
}
