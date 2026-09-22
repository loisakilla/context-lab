'use client';

import { useCallback, useState } from 'react';
import type { RunRecord } from '@context-lab/runner/browser';
import { Preview, type RenderStatus } from './Preview';
import { Report } from './Report';

export function RunPane({ record, title }: { record: RunRecord; title: string }) {
  const [render, setRender] = useState<RenderStatus | null>(null);
  const onRendered = useCallback((status: RenderStatus) => setRender(status), []);

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Report record={record} render={render} />
      {record.output.code ? (
        <>
          <div className="flex flex-col gap-2">
            <span className="lab-label">Рендер</span>
            <Preview code={record.output.code} onRendered={onRendered} />
          </div>
          <details>
            <summary className="lab-label cursor-pointer">Код</summary>
            <pre className="code-block mt-2 max-h-[32rem] overflow-auto">{record.output.code}</pre>
          </details>
        </>
      ) : (
        <pre className="code-block max-h-72 overflow-auto whitespace-pre-wrap">{record.output.text}</pre>
      )}
    </div>
  );
}
