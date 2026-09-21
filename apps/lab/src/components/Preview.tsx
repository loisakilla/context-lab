'use client';

import { useEffect, useRef, useState } from 'react';

export interface RenderStatus {
  ok: boolean;
  error?: string;
}

interface PreviewProps {
  code: string;
  theme?: 'light' | 'dark';
  style?: 'brutal' | 'glass' | 'minimal';
  onRendered?: (status: RenderStatus) => void;
}

interface PreviewMessage {
  type?: string;
  ok?: boolean;
  error?: string;
  height?: number;
}

let shellPromise: Promise<string> | undefined;

function loadShell(): Promise<string> {
  shellPromise ??= fetch('/preview/index.html').then((response) => {
    if (!response.ok) throw new Error(`Страница превью не загрузилась: ${response.status}`);
    return response.text();
  });
  return shellPromise;
}

export function Preview({ code, theme = 'light', style = 'brutal', onRendered }: PreviewProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [shell, setShell] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [height, setHeight] = useState(240);
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
      if (event.data?.type === 'preview-ready') setReady(true);
      if (event.data?.type === 'rendered') {
        const next: RenderStatus = { ok: event.data.ok === true, ...(event.data.error ? { error: event.data.error } : {}) };
        setStatus(next);
        if (typeof event.data.height === 'number') setHeight(Math.min(900, Math.max(160, event.data.height + 24)));
        onRendered?.(next);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onRendered]);

  useEffect(() => {
    if (!ready || !code) return;
    frame.current?.contentWindow?.postMessage({ type: 'render', code, theme, style }, '*');
  }, [ready, code, theme, style]);

  if (loadError) return <pre className="code-block text-[var(--jx-danger)]">{loadError}</pre>;

  return (
    <div className="flex flex-col gap-2">
      <iframe
        ref={frame}
        title="Превью сгенерированного компонента"
        sandbox="allow-scripts"
        onLoad={() => setReady(true)}
        {...(shell ? { srcDoc: shell } : {})}
        style={{ height, width: '100%', border: '2px solid var(--jx-border)', borderRadius: 'var(--jx-r, 4px)', background: 'var(--jx-bg)' }}
      />
      {status && !status.ok && <pre className="code-block text-[var(--jx-danger)]">{status.error}</pre>}
    </div>
  );
}
