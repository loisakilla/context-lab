'use client';

import { useCallback, useState } from 'react';
import type { RunRecord } from '@context-lab/runner/browser';
import { CodeBlock } from './ui';
import { Preview, type RenderStatus } from './Preview';
import { Report } from './Report';

export function RunView({ record }: { record: RunRecord }) {
  const [render, setRender] = useState<RenderStatus | null>(null);
  const onRendered = useCallback((status: RenderStatus) => setRender(status), []);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-4">
        <h1>{record.task.title}</h1>
        <p className="lede">{record.task.prompt}</p>
        <p className="dim mono text-[13px]">
          {record.id} · {new Date(record.createdAt).toLocaleString('ru-RU')}
        </p>
      </header>

      <Report record={record} render={render} />

      {record.output.code ? (
        <>
          <section className="flex flex-col gap-3">
            <h2>Рендер</h2>
            <Preview code={record.output.code} onRendered={onRendered} />
          </section>
          <section className="flex flex-col gap-3">
            <h2>Код компонента</h2>
            <CodeBlock code={record.output.code} />
          </section>
        </>
      ) : (
        <pre className="codebox">{record.output.text}</pre>
      )}
    </div>
  );
}
