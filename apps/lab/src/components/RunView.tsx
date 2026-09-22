'use client';

import { useCallback, useState } from 'react';
import type { RunRecord } from '@context-lab/runner/browser';
import { Preview, type RenderStatus } from './Preview';
import { Report } from './Report';

export function RunView({ record }: { record: RunRecord }) {
  const [render, setRender] = useState<RenderStatus | null>(null);
  const onRendered = useCallback((status: RenderStatus) => setRender(status), []);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold">{record.task.title}</h1>
        <p className="max-w-[80ch]">{record.task.prompt}</p>
        <p className="lab-quiet font-mono text-sm">
          {record.id} · {new Date(record.createdAt).toLocaleString('ru-RU')}
        </p>
      </section>

      <Report record={record} render={render} />

      {record.output.code ? (
        <>
          <section className="flex flex-col gap-2">
            <span className="lab-label">Рендер</span>
            <Preview code={record.output.code} onRendered={onRendered} />
          </section>
          <section className="flex flex-col gap-2">
            <span className="lab-label">Код</span>
            <pre className="code-block overflow-auto">{record.output.code}</pre>
          </section>
        </>
      ) : (
        <pre className="code-block whitespace-pre-wrap">{record.output.text}</pre>
      )}
    </div>
  );
}
