import { Note } from '@/components/ui';
import { CompareControls } from '@/components/CompareControls';
import { MODE_LABELS } from '@/components/MatrixTable';
import { RunPane } from '@/components/RunPane';
import { TopBar } from '@/components/TopBar';
import { loadLabData, loadRun, loadRunIndex, pickRun } from '@/lib/data';

export const dynamic = 'force-dynamic';

function first(value: string | string[] | undefined, fallback: string): string {
  return (Array.isArray(value) ? value[0] : value) ?? fallback;
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const data = loadLabData();
  const runs = loadRunIndex();
  const tasks = data.tasks.filter((task) => runs.some((run) => run.taskId === task.id)).map((task) => ({ id: task.id, title: task.title }));
  const modes = data.matrix?.modes ?? [...new Set(runs.map((run) => run.mode))];

  const task = first(params.task, tasks[0]?.id ?? '');
  const left = first(params.left, 'none');
  const right = first(params.right, 'mcp');

  const leftPick = pickRun(runs, task, left, data.matrix);
  const rightPick = pickRun(runs, task, right, data.matrix);
  const leftRun = leftPick ? loadRun(leftPick.id) : null;
  const rightRun = rightPick ? loadRun(rightPick.id) : null;
  const prompt = leftRun?.task.prompt ?? rightRun?.task.prompt ?? '';
  const mismatched = leftRun && rightRun && (leftRun.model !== rightRun.model || leftRun.driver !== rightRun.driver);

  return (
    <main className="mx-auto flex max-w-[104rem] flex-col gap-10 px-4 py-8 sm:px-6">
      <TopBar current="compare" />

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold">Один и тот же запрос, разный контекст</h1>
        <p className="muted max-w-[62ch] text-lg">
          Слева и справа — записанные прогоны одной задачи в двух режимах: та же модель, тот же промпт, разный контекст. Сравнивайте не только вердикт, но и цену.
        </p>
      </div>

      <CompareControls tasks={tasks} modes={modes} task={task} left={left} right={right} />

      {prompt && (
        <div className="panel flex flex-col gap-2">
          <span className="field-label">Задача</span>
          <p className="max-w-[80ch]">{prompt}</p>
        </div>
      )}

      {mismatched && leftRun && rightRun && (
        <Note title="Прогоны сделаны по-разному">
          Слева {leftRun.model} через {leftRun.driver}, справа {rightRun.model} через {rightRun.driver}. Сравнивать их между собой некорректно: перезапишите недостающие ячейки одной моделью.
        </Note>
      )}

      <section className="grid items-start gap-10 xl:grid-cols-2 xl:gap-14">
        {leftRun ? (
          <RunPane record={leftRun} title={MODE_LABELS[left] ?? left} />
        ) : (
          <Note title="Прогона нет">
            Для этой задачи в режиме «{MODE_LABELS[left] ?? left}» записи нет.
          </Note>
        )}
        {rightRun ? (
          <RunPane record={rightRun} title={MODE_LABELS[right] ?? right} />
        ) : (
          <Note title="Прогона нет">
            Для этой задачи в режиме «{MODE_LABELS[right] ?? right}» записи нет.
          </Note>
        )}
      </section>
    </main>
  );
}
