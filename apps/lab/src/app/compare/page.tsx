import Link from 'next/link';
import { JxAlert } from '@jinx-ui/react';
import { CompareControls } from '@/components/CompareControls';
import { MODE_LABELS } from '@/components/MatrixTable';
import { RunPane } from '@/components/RunPane';
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

  return (
    <main className="mx-auto flex max-w-[110rem] flex-col gap-8 px-4 py-10">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/" className="text-sm underline">
          ← к лаборатории
        </Link>
        <Link href="/rules" className="text-sm underline">
          реестр правил
        </Link>
      </div>

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Один и тот же запрос, разный контекст</h1>
        <p className="max-w-3xl">
          Слева и справа — записанные прогоны одной задачи в двух режимах: та же модель, тот же промпт задачи, разный контекст. Сравнивайте не только вердикт, но и цену: сколько токенов ушло до задачи и сколько стоил ответ.
        </p>
      </header>

      <CompareControls tasks={tasks} modes={modes} task={task} left={left} right={right} />

      {prompt && <p className="max-w-4xl">{prompt}</p>}

      <section className="grid items-start gap-8 xl:grid-cols-2">
        {leftRun ? (
          <RunPane record={leftRun} title={MODE_LABELS[left] ?? left} />
        ) : (
          <JxAlert intent="warning" title="Прогона нет">
            Для этой задачи в режиме «{MODE_LABELS[left] ?? left}» записи нет. Запишите её: npm run run -- --task {task} --mode {left}
          </JxAlert>
        )}
        {rightRun ? (
          <RunPane record={rightRun} title={MODE_LABELS[right] ?? right} />
        ) : (
          <JxAlert intent="warning" title="Прогона нет">
            Для этой задачи в режиме «{MODE_LABELS[right] ?? right}» записи нет. Запишите её: npm run run -- --task {task} --mode {right}
          </JxAlert>
        )}
      </section>
    </main>
  );
}
