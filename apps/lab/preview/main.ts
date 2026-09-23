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
let generation = 0;

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

function reply(message: RenderedMessage): void {
  window.parent.postMessage(message, '*');
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

function compile(code: string): string {
  return transform(code, { transforms: ['typescript', 'jsx', 'imports'], jsxRuntime: 'automatic', production: true }).code;
}

function evaluate(compiled: string): React.ComponentType {
  const module: { exports: Record<string, unknown> } = { exports: {} };
  const factory = new Function('require', 'module', 'exports', compiled) as (require: typeof requireShim, module: unknown, exports: unknown) => void;
  factory(requireShim, module, module.exports);
  const candidate = module.exports.default ?? Object.values(module.exports).find((value) => typeof value === 'function');
  if (typeof candidate !== 'function') throw new Error('В коде нет default-экспорта компонента');
  return candidate as React.ComponentType;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function missingExports(compiled: string): string[] {
  const library = JinxReact as unknown as Record<string, unknown>;
  const bindings = [...compiled.matchAll(/var\s+([\w$]+)\s*=\s*require\(\s*['"]@jinx-ui\/react(?:\/runtime)?['"]\s*\)/g)].map((match) => match[1] ?? '');
  const names = new Set<string>();
  for (const binding of bindings.filter(Boolean)) {
    for (const match of compiled.matchAll(new RegExp(`${escapeRegExp(binding)}\\.([A-Za-z_$][\\w$]*)`, 'g'))) {
      if (match[1]) names.add(match[1]);
    }
  }
  return [...names].filter((name) => library[name] === undefined).sort();
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

function unmount(): void {
  root?.unmount();
  root = undefined;
  container.replaceChildren();
}

function render(message: RenderMessage): void {
  generation += 1;
  const current = generation;
  applyMode(message.theme, message.style);
  try {
    const compiled = compile(message.code);
    const missing = missingExports(compiled);
    if (missing.length > 0) {
      throw new Error(`В библиотеке @jinx-ui/react нет: ${missing.join(', ')}. Превью не строится, пока компонент ссылается на то, чего не существует.`);
    }
    const Component = evaluate(compiled);
    mount(Component);
    window.setTimeout(() => {
      if (current !== generation) return;
      const failed = lastError;
      const names = failed ? requiredPropNames(message.code) : [];
      if (!failed || names.length === 0) {
        reply({ type: 'rendered', ok: !failed, ...(failed ? { error: failed } : {}), height: contentHeight() });
        watchHeight();
        return;
      }
      mount(Component, fillProps(names));
      window.setTimeout(() => {
        if (current !== generation) return;
        const error = lastError;
        reply({ type: 'rendered', ok: !error, ...(error ? { error } : {}), ...(error ? {} : { filledProps: names }), height: contentHeight() });
        watchHeight();
      }, 120);
    }, 120);
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    unmount();
    const pre = document.createElement('pre');
    pre.className = 'preview-error';
    pre.textContent = text;
    container.appendChild(pre);
    reply({ type: 'rendered', ok: false, error: text, height: contentHeight() });
  }
}

window.addEventListener('message', (event: MessageEvent<RenderMessage>) => {
  if (event.source !== window.parent) return;
  if (!event.data || event.data.type !== 'render' || typeof event.data.code !== 'string') return;
  render(event.data);
});

window.parent.postMessage({ type: 'preview-ready' }, '*');
