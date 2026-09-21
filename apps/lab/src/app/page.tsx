import { Lab } from '@/components/Lab';
import { loadLabData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const data = loadLabData();
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Context Lab</h1>
        <p className="max-w-3xl">
            Одна и та же задача, одна и та же модель, разный контекст. Агент пишет компонент на библиотеке {data.index.library.name} ({data.index.components.length} компонентов), а компилятор и линтер показывают, где ему не хватило контекста.
        </p>
      </header>
      <Lab index={data.index} tasks={data.tasks} readme={data.readme} docs={data.docs} rules={data.rules} matrix={data.matrix} localRunEnabled={data.localRunEnabled} />
    </main>
  );
}
