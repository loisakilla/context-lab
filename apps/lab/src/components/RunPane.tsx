'use client';

import { useCallback, useState } from 'react';
import type { RunRecord } from '@context-lab/runner/browser';
import { Preview, type RenderStatus } from './Preview';
import { Report } from './Report';

export function RunPane({ record, title }: { record: RunRecord; title: string }) {
  const [render, setRender] = useState<RenderStatus | null>(null);
  const onRendered = useCallback((status: RenderStatus) => setRender(status), []);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <h2 className="text-xl font-bold">{title}</h2>
      <Report record={record} render={render} />
      {record.output.code ? (
        <>
          <Preview code={record.output.code} onRendered={onRendered} />
          <details>
            <summary className="cursor-pointer font-semibold">Код</summary>
            <pre className="code-block mt-2 max-h-[32rem] overflow-auto">{record.output.code}</pre>
          </details>
        </>
      ) : (
        <pre className="code-block max-h-72 overflow-auto whitespace-pre-wrap">{record.output.text}</pre>
      )}
    </div>
  );
}
