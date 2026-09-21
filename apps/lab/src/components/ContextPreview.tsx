'use client';

import { useMemo } from 'react';
import { JxAlert, JxBadge } from '@jinx-ui/react';
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
      <JxAlert intent="warning" title="Контекст не собрался">
        {built}
      </JxAlert>
    );
  }

  const body = built.contextText.length > 0 ? built.contextText : built.system;
  const rest = body.length - BODY_LIMIT;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold">Что уйдёт в модель</h2>
        <p className="text-sm opacity-70">
          Режим «{MODE_LABELS[mode] ?? mode}». {MODE_NOTES[mode] ?? ''}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <JxBadge tone="info">~{contextTokens(built).toLocaleString('ru-RU')} токенов до задачи</JxBadge>
        {built.sources.map((source) => (
          <JxBadge key={`${source.kind}-${source.id}`} tone="default">
            {SOURCE_LABELS[source.kind] ?? source.kind} · ~{source.tokens.toLocaleString('ru-RU')} ток.
          </JxBadge>
        ))}
      </div>

      {built.tools && (
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold">Инструменты ({built.tools.length})</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {built.tools.map((tool) => (
              <li key={tool.name}>
                <code className="font-mono">{tool.name}</code> — <span className="opacity-70">{shorten(tool.description)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <details>
        <summary className="cursor-pointer font-semibold">Текст контекста ({body.length.toLocaleString('ru-RU')} символов)</summary>
        <pre className="code-block mt-2 max-h-96 overflow-auto whitespace-pre-wrap">
          {body.slice(0, BODY_LIMIT)}
          {rest > 0 ? `\n\n… и ещё ${rest.toLocaleString('ru-RU')} символов` : ''}
        </pre>
      </details>

      <section className="flex flex-col gap-2">
        <h3 className="font-semibold">Задача агенту</h3>
        <pre className="code-block max-h-72 overflow-auto whitespace-pre-wrap">{built.taskText}</pre>
      </section>
    </div>
  );
}
