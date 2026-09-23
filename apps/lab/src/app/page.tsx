import { Lab } from '@/components/Lab';
import { TopBar } from '@/components/TopBar';
import { Badge } from '@/components/ui';
import { loadHomeData } from '@/lib/data';
import { plural } from '@/lib/labels';

export default function HomePage() {
  const data = loadHomeData();
  return (
    <>
      <TopBar current="lab" />
      <main className="wrap wrap--wide flex flex-col gap-12 pt-10 pb-24">
        <header className="flex flex-col gap-5">
          <h1>Что меняет контекст в коде агента</h1>
          <p className="lede">
            Одна и та же задача, одна и та же модель, разный контекст. Агент пишет компонент на библиотеке {data.library.name}, а компилятор и линтер
            показывают, где ему не хватило контекста.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge>{data.componentCount} компонентов в библиотеке</Badge>
            {data.matrix && <Badge>{data.matrix.generatedFrom} записанных прогонов</Badge>}
            <Badge>
              {data.modes.length} {plural(data.modes.length, 'режим', 'режима', 'режимов')} контекста
            </Badge>
          </div>
        </header>
        <Lab library={data.library} tasks={data.tasks} modes={data.modes} previews={data.previews} matrix={data.matrix} localRunEnabled={data.localRunEnabled} />
      </main>
    </>
  );
}
