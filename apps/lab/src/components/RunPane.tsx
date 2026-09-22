'use client';

import { useCallback, useState } from 'react';
import type { RunRecord } from '@context-lab/runner/browser';
import { CodeBlock } from './ui';
import { Preview, type RenderStatus } from './Preview';
import { Report } from './Report';

export function RunPane({ record, title }: { record: RunRecord; title: string }) {
  const [render, setRender] = useState<RenderStatus | null>(null);
  const onRendered = useCallback((status: RenderStatus) => setRender(status), []);

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <h2 className="text-[24px] leading-tight">{title}</h2>
      <Report record={record} render={render} />
      {record.output.code ? (
        <>
          <section className="flex flex-col gap-3">
            <span className="jx-label">Рендер</span>
            <Preview code={record.output.code} onRendered={onRendered} />
          </section>
          <details>
            <summary>Код компонента</summary>
            <div className="mt-3">
              <CodeBlock code={record.output.code} maxHeight={512} />
            </div>
          </details>
        </>
      ) : (
        <pre className="codebox max-h-72 overflow-auto">{record.output.text}</pre>
      )}
    </div>
  );
}
