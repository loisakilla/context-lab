import { Lab } from '@/components/Lab';
import { TopBar } from '@/components/TopBar';
import { Badge } from '@/components/ui';
import { loadLabData } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const data = loadLabData();
  return (
    <>
      <TopBar current="lab" />
      <main className="wrap wrap--wide flex flex-col gap-12 pt-10 pb-24">
        <header className="flex flex-col gap-5">
          <h1>Что меняет контекст в коде агента</h1>
          <p className="lede">
            Одна и та же задача, одна и та же модель, разный контекст. Агент пишет компонент на библиотеке {data.index.library.name}, а компилятор и линтер
            показывают, где ему не хватило контекста.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge>{data.index.components.length} компонентов в библиотеке</Badge>
            {data.matrix && <Badge>{data.matrix.generatedFrom} записанных прогонов</Badge>}
            <Badge>5 режимов контекста</Badge>
          </div>
        </header>
        <Lab index={data.index} tasks={data.tasks} readme={data.readme} docs={data.docs} rules={data.rules} ruleSets={data.ruleSets} matrix={data.matrix} localRunEnabled={data.localRunEnabled} />
      </main>
    </>
  );
}
