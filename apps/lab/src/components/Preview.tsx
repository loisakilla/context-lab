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

export function Preview({ code, theme = 'light', style = 'brutal', onRendered }: PreviewProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [height, setHeight] = useState(240);
  const [status, setStatus] = useState<RenderStatus | null>(null);

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

  return (
    <div className="flex flex-col gap-2">
      <iframe
        ref={frame}
        title="Превью сгенерированного компонента"
        sandbox="allow-scripts"
        src={`/preview/index.html?theme=${theme}&style=${style}`}
        style={{ height, width: '100%', border: '2px solid var(--jx-border)', borderRadius: 'var(--jx-r, 4px)', background: 'var(--jx-bg)' }}
      />
      {status && !status.ok && <pre className="code-block text-[var(--jx-danger)]">{status.error}</pre>}
    </div>
  );
}
