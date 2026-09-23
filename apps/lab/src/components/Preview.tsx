'use client';

import { useEffect, useRef, useState } from 'react';
import { JxAlert } from '@jinx-ui/react';

export interface RenderStatus {
  ok: boolean;
  error?: string;
  filledProps?: string[];
}

interface PreviewProps {
  code: string;
  onRendered?: (status: RenderStatus) => void;
}

interface PreviewMessage {
  type?: string;
  ok?: boolean;
  error?: string;
  height?: number;
  filledProps?: string[];
}

const MIN_HEIGHT = 200;
const MAX_HEIGHT = 1200;

let shellPromise: Promise<string> | undefined;

function loadShell(): Promise<string> {
  shellPromise ??= fetch('/preview/index.html').then((response) => {
    if (!response.ok) throw new Error(`Страница превью не загрузилась: ${response.status}`);
    return response.text();
  });
  return shellPromise;
}

function clamp(height: number): number {
  return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, height + 8));
}

export function Preview({ code, onRendered }: PreviewProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [shell, setShell] = useState<string | null>(null);
  const [readyCount, setReadyCount] = useState(0);
  const [height, setHeight] = useState(MIN_HEIGHT);
  const [status, setStatus] = useState<RenderStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadShell()
      .then((html) => {
        if (active) setShell(html);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : String(error));
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent<PreviewMessage>) => {
      if (event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === 'preview-ready') setReadyCount((count) => count + 1);
      if (event.data?.type === 'height' && typeof event.data.height === 'number') setHeight(clamp(event.data.height));
      if (event.data?.type === 'rendered') {
        const next: RenderStatus = {
          ok: event.data.ok === true,
          ...(event.data.error ? { error: event.data.error } : {}),
          ...(event.data.filledProps ? { filledProps: event.data.filledProps } : {}),
        };
        setStatus(next);
        if (typeof event.data.height === 'number') setHeight(clamp(event.data.height));
        onRendered?.(next);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onRendered]);

  useEffect(() => {
    if (readyCount === 0 || !code) return;
    setStatus(null);
    frame.current?.contentWindow?.postMessage({ type: 'render', code, theme: 'light', style: 'brutal' }, '*');
  }, [readyCount, code]);

  if (loadError) return <pre className="codebox" style={{ color: 'var(--jx-danger)' }}>{loadError}</pre>;

  const broken = status !== null && !status.ok;

  return (
    <div className="flex flex-col gap-2">
      <iframe
        ref={frame}
        title="Превью сгенерированного компонента"
        sandbox="allow-scripts"
        {...(shell ? { srcDoc: shell } : {})}
        style={{
          height: broken ? 0 : height,
          width: '100%',
          border: broken ? 'none' : '2px solid var(--jx-border)',
          borderRadius: 'var(--jx-r)',
          background: 'var(--jx-bg)',
          display: 'block',
        }}
      />
      {broken && (
        <JxAlert intent="danger" title="Превью не построено">
          {status?.error}
        </JxAlert>
      )}
      {status?.filledProps && status.filledProps.length > 0 && (
        <p className="dim">Компонент требует пропсы, превью подставило пустые значения: {status.filledProps.join(', ')}.</p>
      )}
    </div>
  );
}
