import { Note } from '@/components/ui';
import { CompareControls } from '@/components/CompareControls';
import { RunPane } from '@/components/RunPane';
import { TopBar } from '@/components/TopBar';
import { MODE_LABELS } from '@/lib/labels';
import { loadLabData, loadRun, loadRunIndex, pickRun } from '@/lib/data';
import { libraryKey } from '@context-lab/runner/browser';

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
  const currentLibrary = libraryKey(data.index.library);
  const leftLibrary = leftRun ? libraryKey(leftRun.library) : null;
  const rightLibrary = rightRun ? libraryKey(rightRun.library) : null;
  const splitLibrary = leftLibrary !== null && rightLibrary !== null && leftLibrary !== rightLibrary;
  const staleLibrary = [leftLibrary, rightLibrary].find((key) => key !== null && key !== currentLibrary) ?? null;

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

        <div className="jx-card flex flex-col gap-6">
          <CompareControls tasks={tasks} modes={modes} task={task} left={left} right={right} />
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

        {mismatched && leftRun && rightRun && (
          <Note title="Прогоны сделаны по-разному">
            Слева {leftRun.model} через {leftRun.driver}, справа {rightRun.model} через {rightRun.driver}. Сравнивать их между собой некорректно: перезапишите
            недостающие ячейки одной моделью.
          </Note>
        )}

        {splitLibrary && (
          <Note title="Прогоны сделаны против разных версий библиотеки">
            Слева jinx-ui {leftLibrary}, справа {rightLibrary}. У версий разный набор компонентов и пропсов, поэтому разница в вердикте может объясняться
            библиотекой, а не контекстом.
          </Note>
        )}

        {!splitLibrary && staleLibrary && (
          <Note title="Прогоны сделаны против другой версии библиотеки">
            Эти прогоны записаны против jinx-ui {staleLibrary}, а лаборатория сейчас собирает контекст из {currentLibrary}. Они показывают, как контекст работал
            на той версии; чтобы сравнивать на текущей, перезапишите прогоны.
          </Note>
        )}

        <section className="grid items-start gap-10 xl:grid-cols-2 xl:gap-12">
          {leftRun ? (
            <RunPane record={leftRun} title={MODE_LABELS[left] ?? left} />
          ) : (
            <Note title="Прогона нет">Для этой задачи в режиме «{MODE_LABELS[left] ?? left}» записи нет.</Note>
          )}
          {rightRun ? (
            <RunPane record={rightRun} title={MODE_LABELS[right] ?? right} />
          ) : (
            <Note title="Прогона нет">Для этой задачи в режиме «{MODE_LABELS[right] ?? right}» записи нет.</Note>
          )}
        </section>
      </main>
    </>
  );
}
