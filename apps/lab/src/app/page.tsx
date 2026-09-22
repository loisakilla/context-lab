import { Lab } from '@/components/Lab';
import { TopBar } from '@/components/TopBar';
import { loadLabData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const data = loadLabData();
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6">
      <TopBar current="lab" home />
      <p className="lab-muted max-w-[62ch] text-lg">
        Одна и та же задача, одна и та же модель, разный контекст. Агент пишет компонент на библиотеке {data.index.library.name} ({data.index.components.length} компонентов), а компилятор и линтер показывают, где ему не хватило контекста.
      </p>
      <Lab index={data.index} tasks={data.tasks} readme={data.readme} docs={data.docs} rules={data.rules} matrix={data.matrix} localRunEnabled={data.localRunEnabled} />
    </main>
  );
}
