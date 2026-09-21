import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as JsxRuntime from 'react/jsx-runtime';
import * as JinxReact from '@jinx-ui/react';
import { transform } from 'sucrase';
import '@jinx-ui/tokens';
import '@jinx-ui/core';

interface RenderMessage {
  type: 'render';
  code: string;
  theme?: string;
  style?: string;
}

interface RenderedMessage {
  type: 'rendered';
  ok: boolean;
  error?: string;
  height?: number;
}

const modules: Record<string, unknown> = {
  react: React,
  'react/jsx-runtime': JsxRuntime,
  'react-dom': ReactDOM,
  'react-dom/client': ReactDOMClient,
  '@jinx-ui/react': JinxReact,
  '@jinx-ui/react/runtime': JinxReact,
};

const container = document.getElementById('root') as HTMLElement;
let root: ReactDOMClient.Root | undefined;
let lastError: string | undefined;

function reply(message: RenderedMessage, source: MessageEventSource | null): void {
  if (source) (source as Window).postMessage(message, '*');
  else window.parent.postMessage(message, '*');
}

function requireShim(name: string): unknown {
  const found = modules[name];
  if (found === undefined) throw new Error(`Неизвестный модуль "${name}": доступны ${Object.keys(modules).join(', ')}`);
  return found;
}

function evaluate(code: string): React.ComponentType {
  const compiled = transform(code, { transforms: ['typescript', 'jsx', 'imports'], jsxRuntime: 'automatic', production: true }).code;
  const module: { exports: Record<string, unknown> } = { exports: {} };
  const factory = new Function('require', 'module', 'exports', compiled) as (require: typeof requireShim, module: unknown, exports: unknown) => void;
  factory(requireShim, module, module.exports);
  const candidate = module.exports.default ?? Object.values(module.exports).find((value) => typeof value === 'function');
  if (typeof candidate !== 'function') throw new Error('В коде нет default-экспорта компонента');
  return candidate as React.ComponentType;
}

class Boundary extends React.Component<{ children: React.ReactNode }, { error?: string }> {
  override state: { error?: string } = {};

  static getDerivedStateFromError(error: unknown): { error: string } {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  override componentDidCatch(error: unknown): void {
    lastError = error instanceof Error ? error.message : String(error);
  }

  override render(): React.ReactNode {
    if (this.state.error) return React.createElement('pre', { className: 'preview-error' }, this.state.error);
    return this.props.children;
  }
}

function applyMode(theme?: string, style?: string): void {
  const html = document.documentElement;
  if (theme) html.setAttribute('data-theme', theme);
  if (style) html.setAttribute('data-style', style);
}

function render(message: RenderMessage, source: MessageEventSource | null): void {
  lastError = undefined;
  applyMode(message.theme, message.style);
  try {
    const Component = evaluate(message.code);
    root ??= ReactDOMClient.createRoot(container);
    root.render(React.createElement(Boundary, null, React.createElement(Component)));
    window.setTimeout(() => {
      const error = lastError;
      reply({ type: 'rendered', ok: !error, ...(error ? { error } : {}), height: document.body.scrollHeight }, source);
    }, 120);
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    container.innerHTML = '';
    root = undefined;
    const pre = document.createElement('pre');
    pre.className = 'preview-error';
    pre.textContent = text;
    container.appendChild(pre);
    reply({ type: 'rendered', ok: false, error: text, height: document.body.scrollHeight }, source);
  }
}

window.addEventListener('message', (event: MessageEvent<RenderMessage>) => {
  if (!event.data || event.data.type !== 'render' || typeof event.data.code !== 'string') return;
  render(event.data, event.source);
});

const params = new URLSearchParams(window.location.search);
applyMode(params.get('theme') ?? 'dark', params.get('style') ?? 'brutal');
window.parent.postMessage({ type: 'preview-ready' }, '*');
