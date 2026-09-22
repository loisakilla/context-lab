'use client';

import { useMemo } from 'react';
import { Note } from './ui';
import { buildContext, contextTokens, type ContextMode, type ContextSources, type Task } from '@/lib/runner-browser';
import { MODE_LABELS } from './MatrixTable';

interface ContextPreviewProps {
  mode: ContextMode;
  task: Task;
  sources: ContextSources;
}

const MODE_NOTES: Record<string, string> = {
  none: 'Ничего, кроме формулировки задачи и требований к ответу: агент опирается только на то, что запомнил при обучении.',
  readme: 'README библиотеки целиком: обзор и философия, но без API компонентов.',
  docs: 'Сгенерированный llms-full.txt: все компоненты с пропсами, значениями union-типов и примерами.',
  'docs+rules': 'Та же документация плюс скомпилированный набор правил jinx-ui.',
  mcp: 'Только описания инструментов. API нужных компонентов агент запрашивает сам по ходу работы, поэтому контекст до задачи маленький.',
};

const SOURCE_LABELS: Record<string, string> = {
  readme: 'README',
  docs: 'документация',
  rules: 'правила',
  tools: 'инструменты',
};

const BODY_LIMIT = 4000;

function shorten(text: string): string {
  const stop = text.search(/[.:]\s/);
  return stop > 0 ? text.slice(0, stop + 1) : text;
}

export function ContextPreview({ mode, task, sources }: ContextPreviewProps) {
  const built = useMemo(() => {
    try {
      return buildContext(mode, task, sources);
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }, [mode, task, sources]);

  if (typeof built === 'string') {
    return (
      <Note title="Контекст не собрался">
        {built}
      </Note>
    );
  }

  const body = built.contextText.length > 0 ? built.contextText : built.system;
  const rest = body.length - BODY_LIMIT;

  return (
    <div className="flex flex-col gap-5">
      <div className="panel flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h2 className="text-lg font-bold">Что уйдёт в модель</h2>
          <span className="font-mono text-base" style={{ color: 'var(--accent)' }}>
            ~{contextTokens(built).toLocaleString('ru-RU')} токенов
          </span>
        </div>
        <p className="muted text-sm">{MODE_NOTES[mode] ?? ''}</p>
        {built.sources.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm">
            {built.sources.map((source) => (
              <li key={`${source.kind}-${source.id}`} className="flex items-baseline justify-between gap-4">
                <span className="muted">{SOURCE_LABELS[source.kind] ?? source.kind}</span>
                <span className="quiet font-mono">~{source.tokens.toLocaleString('ru-RU')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {built.tools && (
        <section className="flex flex-col gap-2">
          <span className="field-label">Инструменты · {built.tools.length}</span>
          <ul className="flex flex-col gap-1 text-sm">
            {built.tools.map((tool) => (
              <li key={tool.name} className="flex flex-wrap gap-x-2">
                <code className="font-mono" style={{ color: 'var(--accent)' }}>
                  {tool.name}
                </code>
                <span className="muted">{shorten(tool.description)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <span className="field-label">Задача агенту</span>
        <pre className="code max-h-72 overflow-auto whitespace-pre-wrap">{built.taskText}</pre>
      </section>

      <details>
        <summary className="field-label cursor-pointer">Текст контекста · {body.length.toLocaleString('ru-RU')} символов</summary>
        <pre className="code mt-2 max-h-96 overflow-auto whitespace-pre-wrap">
          {body.slice(0, BODY_LIMIT)}
          {rest > 0 ? `\n\n… и ещё ${rest.toLocaleString('ru-RU')} символов` : ''}
        </pre>
      </details>
    </div>
  );
}
