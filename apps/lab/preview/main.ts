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
  filledProps?: string[];
}

const modules: Record<string, unknown> = {
  react: React,
  'react/jsx-runtime': JsxRuntime,
  'react-dom': ReactDOM,
  'react-dom/client': ReactDOMClient,
  '@jinx-ui/react': JinxReact,
  '@jinx-ui/react/runtime': JinxReact,
};

const MIN_HEIGHT = 320;
const MAX_HEIGHT = 1200;
const OVERLAY_PADDING = 120;

const container = document.getElementById('root') as HTMLElement;
let root: ReactDOMClient.Root | undefined;
let lastError: string | undefined;
let watching = false;
let attempt = 0;

function contentHeight(): number {
  let height = Math.max(document.body.scrollHeight, container.scrollHeight + 32);
  for (const element of document.body.querySelectorAll<HTMLElement>('*')) {
    const position = window.getComputedStyle(element).position;
    if (position !== 'fixed' && position !== 'sticky' && position !== 'absolute') continue;
    for (const child of element.children) {
      height = Math.max(height, child.getBoundingClientRect().height + OVERLAY_PADDING);
    }
  }
  return Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.ceil(height)));
}

function reply(message: RenderedMessage, source: MessageEventSource | null): void {
  if (source) (source as Window).postMessage(message, '*');
  else window.parent.postMessage(message, '*');
}

function watchHeight(): void {
  if (watching) return;
  watching = true;
  let reported = 0;
  let scheduled = false;
  const send = () => {
    scheduled = false;
    const height = contentHeight();
    if (height === reported) return;
    reported = height;
    window.parent.postMessage({ type: 'height', height }, '*');
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.setTimeout(send, 60);
  };
  new ResizeObserver(schedule).observe(document.body);
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'open', 'aria-hidden'] });
  document.addEventListener('click', () => window.setTimeout(schedule, 220), true);
  document.addEventListener('keyup', () => window.setTimeout(schedule, 220), true);
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

function missingExports(code: string): string[] {
  const library = JinxReact as unknown as Record<string, unknown>;
  const groups = [...code.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]@jinx-ui\/react(?:\/runtime)?['"]/g)];
  const names = groups
    .flatMap((group) => (group[1] ?? '').split(','))
    .map((part) => part.split(' as ')[0]?.replace(/\btype\b/, '').trim() ?? '')
    .filter((name) => /^[A-Za-z_$][\w$]*$/.test(name));
  return [...new Set(names.filter((name) => library[name] === undefined))];
}

function requiredPropNames(code: string): string[] {
  const signature = code.match(/export\s+default\s+function\s+\w*\s*\(\s*\{([^}]*)\}/);
  if (!signature?.[1]) return [];
  return signature[1]
    .split(',')
    .filter((part) => !part.includes('='))
    .map((part) => part.split(':')[0]?.trim() ?? '')
    .filter((name) => /^[A-Za-z_$][\w$]*$/.test(name));
}

function guessProp(name: string): unknown {
  if (/^on[A-Z]/.test(name)) return () => undefined;
  if (/^(is|has|can|should)[A-Z]/.test(name)) return false;
  if (/(s|list|data|rows|items|options|columns)$/i.test(name)) return [];
  if (/(count|total|index|page|size|step)$/i.test(name)) return 0;
  return '';
}

function fillProps(names: string[]): Record<string, unknown> {
  return Object.fromEntries(names.map((name) => [name, guessProp(name)]));
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

function mount(Component: React.ComponentType, props?: Record<string, unknown>): void {
  lastError = undefined;
  root ??= ReactDOMClient.createRoot(container);
  attempt += 1;
  root.render(React.createElement(Boundary, { key: String(attempt), children: React.createElement(Component, props) }));
}

function render(message: RenderMessage, source: MessageEventSource | null): void {
  applyMode(message.theme, message.style);
  try {
    const missing = missingExports(message.code);
    if (missing.length > 0) {
      throw new Error(`В библиотеке @jinx-ui/react нет: ${missing.join(', ')}. Превью не строится, пока компонент ссылается на то, чего не существует.`);
    }
    const Component = evaluate(message.code);
    mount(Component);
    window.setTimeout(() => {
      const failed = lastError;
      const names = failed ? requiredPropNames(message.code) : [];
      if (!failed || names.length === 0) {
        reply({ type: 'rendered', ok: !failed, ...(failed ? { error: failed } : {}), height: contentHeight() }, source);
        watchHeight();
        return;
      }
      mount(Component, fillProps(names));
      window.setTimeout(() => {
        const error = lastError;
        reply(
          { type: 'rendered', ok: !error, ...(error ? { error } : {}), ...(error ? {} : { filledProps: names }), height: contentHeight() },
          source,
        );
        watchHeight();
      }, 120);
    }, 120);
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    container.innerHTML = '';
    root = undefined;
    const pre = document.createElement('pre');
    pre.className = 'preview-error';
    pre.textContent = text;
    container.appendChild(pre);
    reply({ type: 'rendered', ok: false, error: text, height: contentHeight() }, source);
  }
}

window.addEventListener('message', (event: MessageEvent<RenderMessage>) => {
  if (!event.data || event.data.type !== 'render' || typeof event.data.code !== 'string') return;
  render(event.data, event.source);
});

const params = new URLSearchParams(window.location.search);
applyMode(params.get('theme') ?? 'dark', params.get('style') ?? 'brutal');
window.parent.postMessage({ type: 'preview-ready' }, '*');
