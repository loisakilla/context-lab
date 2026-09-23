import { Note } from './ui';
import { SOURCE_LABELS } from '@/lib/labels';
import { taskTextOf, type ModePreview } from '@/lib/mode-preview';

interface ContextPreviewProps {
  preview: ModePreview;
  prompt: string;
}

const MODE_NOTES: Record<string, string> = {
  none: 'Ничего, кроме формулировки задачи и требований к ответу: агент опирается только на то, что запомнил при обучении.',
  readme: 'README npm-пакета целиком: установка, модель состояния и клавиатура. Из компонентов в нём названы только JxButton и JxModal, пропсов нет.',
  docs: 'Сгенерированный llms-full.txt: все компоненты с пропсами, значениями union-типов и примерами.',
  'docs+rules': 'Та же документация плюс скомпилированный набор правил jinx-ui.',
  mcp: 'Только описания шести инструментов: поиск, API компонента, примеры, токены, документация и правила. Всё нужное агент запрашивает сам по ходу работы, поэтому контекст до задачи маленький.',
};

function shorten(text: string): string {
  const stop = text.search(/[.:]\s/);
  return stop > 0 ? text.slice(0, stop + 1) : text;
}

export function ContextPreview({ preview, prompt }: ContextPreviewProps) {
  if ('error' in preview) {
    return <Note title="Контекст не собрался">{preview.error}</Note>;
  }

  const rest = preview.bodyLength - preview.body.length;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="jx-card flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <span className="jx-label">Контекст до задачи</span>
          <span className="mono text-[28px] leading-none" style={{ color: 'var(--jx-accent)' }}>
            ~{preview.tokens.toLocaleString('ru-RU')}
            <span className="dim text-[15px]"> токенов</span>
          </span>
        </div>
        <p className="muted text-sm">{MODE_NOTES[preview.mode] ?? ''}</p>
        {preview.sources.length > 0 && (
          <>
            <hr className="rule" />
            <ul className="flex flex-col gap-2">
              {preview.sources.map((source) => (
                <li key={`${source.kind}-${source.id}`} className="flex items-baseline justify-between gap-4 text-sm">
                  <span>{SOURCE_LABELS[source.kind] ?? source.kind}</span>
                  <span className="dim mono text-[13px]">~{source.tokens.toLocaleString('ru-RU')}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {preview.tools && (
          <section className="flex flex-col gap-3">
            <span className="jx-label">Инструменты · {preview.tools.length}</span>
            <ul className="flex flex-col gap-2 text-sm">
              {preview.tools.map((tool) => (
                <li key={tool.name} className="flex flex-wrap items-baseline gap-x-2">
                  <code className="mono text-[13px]" style={{ color: 'var(--jx-accent)' }}>
                    {tool.name}
                  </code>
                  <span className="muted">{shorten(tool.description)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-3">
          <span className="jx-label">Задача агенту</span>
          <pre className="codebox max-h-80 overflow-auto">{taskTextOf(preview, prompt)}</pre>
        </section>

        <details>
          <summary>Текст контекста · {preview.bodyLength.toLocaleString('ru-RU')} символов</summary>
          <pre className="codebox mt-3 max-h-96 overflow-auto">
            {preview.body}
            {rest > 0 ? `\n\n… и ещё ${rest.toLocaleString('ru-RU')} символов` : ''}
          </pre>
        </details>
      </div>
    </div>
  );
}
