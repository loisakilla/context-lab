'use client';

import { useCallback, useState } from 'react';
import type { RunRecord } from '@context-lab/runner/browser';
import { useAppearance } from '@/lib/theme';
import { Preview, type RenderStatus } from './Preview';
import { Report } from './Report';

export function RunView({ record }: { record: RunRecord }) {
  const [render, setRender] = useState<RenderStatus | null>(null);
  const onRendered = useCallback((status: RenderStatus) => setRender(status), []);
  const appearance = useAppearance();

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">{record.task.title}</h1>
        <p className="text-sm opacity-70">
          {record.id} · {new Date(record.createdAt).toLocaleString('ru-RU')}
        </p>
        <p>{record.task.prompt}</p>
      </section>
      <Report record={record} render={render} />
      {record.output.code ? (
        <>
          <h2 className="text-xl font-bold">Рендер</h2>
          <Preview code={record.output.code} theme={appearance.theme} style={appearance.style} onRendered={onRendered} />
          <h2 className="text-xl font-bold">Код</h2>
          <pre className="code-block overflow-auto">{record.output.code}</pre>
        </>
      ) : (
        <pre className="code-block whitespace-pre-wrap">{record.output.text}</pre>
      )}
    </div>
  );
}
