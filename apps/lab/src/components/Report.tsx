'use client';

import { JxBadge } from '@jinx-ui/react';
import type { RunRecord } from '@context-lab/runner/browser';
import type { RenderStatus } from './Preview';

interface ReportProps {
  record: RunRecord;
  render?: RenderStatus | null;
}

const DRIVER_LABELS: Record<string, string> = {
  'claude-code': 'Claude Code',
  api: 'Anthropic API',
  subagent: 'агент-исполнитель',
};

const MODE_LABELS: Record<string, string> = {
  none: 'без контекста',
  readme: 'README',
  docs: 'доки',
  'docs+rules': 'доки + правила',
  mcp: 'MCP',
};

function tokensOf(record: RunRecord): number {
  return record.usage.input + record.usage.output + record.usage.cacheRead + record.usage.cacheCreation;
}

export function formatCost(cost: number | null): string {
  if (cost === null) return 'цена неизвестна';
  return cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(3)}`;
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: 'accent' | 'danger' | 'success' }) {
  const color = tone === 'danger' ? 'var(--jx-danger)' : tone === 'success' ? 'var(--jx-success)' : tone === 'accent' ? 'var(--jx-accent)' : 'var(--lab-ink)';
  return (
    <div className="flex flex-col gap-1">
      <span className="lab-label">{label}</span>
      <span className="font-mono text-base" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function Invented({ title, names }: { title: string; names: string[] }) {
  if (names.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="lab-label">{title}</span>
      <div className="flex flex-wrap gap-2">
        {names.map((name) => (
          <JxBadge key={name} tone="danger">
            {name}
          </JxBadge>
        ))}
      </div>
    </div>
  );
}

export function Report({ record, render }: ReportProps) {
  const checks = record.checks;
  const lintErrors = checks?.lint.filter((finding) => finding.severity === 'error') ?? [];
  const lintWarnings = checks?.lint.filter((finding) => finding.severity === 'warning') ?? [];
  const passed = record.verdict.passed && render?.ok !== false;
  const tokens = tokensOf(record);
  const toolCalls = record.turns.flatMap((turn) => turn.toolCalls);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <JxBadge tone={passed ? 'success' : 'danger'} dot>
          {passed ? 'Проверки пройдены' : 'Есть проблемы'}
        </JxBadge>
        <span className="lab-muted text-sm">
          {MODE_LABELS[record.mode] ?? record.mode} · {record.model} · {DRIVER_LABELS[record.driver] ?? record.driver}
        </span>
      </div>

      <div className="lab-panel grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <Figure label="Контекст до задачи" value={`~${record.context.tokens.toLocaleString('ru-RU')}`} tone="accent" />
        <Figure label="Токенов на прогон" value={tokens > 0 ? tokens.toLocaleString('ru-RU') : '—'} />
        <Figure label="Цена" value={record.costUsd === null ? '—' : formatCost(record.costUsd)} />
        <Figure
          label="Ошибок компилятора"
          value={checks ? String(checks.tsc.errors.length) : '—'}
          tone={checks && checks.tsc.errors.length > 0 ? 'danger' : 'success'}
        />
      </div>

      {!checks && <p className="lab-muted text-sm">В ответе не нашлось блока кода, проверять нечего.</p>}

      {checks && (
        <div className="grid items-start gap-4 md:grid-cols-2">
          <section className="lab-panel flex min-w-0 flex-col gap-4">
            <h3 className="text-base font-bold">Компилятор</h3>
            {checks.tsc.errors.length === 0 ? (
              <p className="lab-muted text-sm">Ошибок нет: все компоненты и пропсы существуют.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {checks.tsc.errors.map((error, position) => (
                  <li key={position} className="code-block break-words whitespace-pre-wrap">
                    <span className="lab-quiet">
                      строка {error.line} · TS{error.code}
                    </span>
                    <br />
                    {error.message.split('\n')[0]}
                  </li>
                ))}
              </ul>
            )}
            <Invented title="Выдуманные компоненты" names={checks.tsc.unknownComponents} />
            <Invented title="Выдуманные пропсы" names={checks.tsc.unknownProps.map((item) => `${item.component}.${item.prop}`)} />
          </section>

          <section className="lab-panel flex min-w-0 flex-col gap-4">
            <h3 className="text-base font-bold">Линтер и покрытие</h3>
            {lintErrors.length === 0 && lintWarnings.length === 0 ? (
              <p className="lab-muted text-sm">Замечаний нет.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {[...lintErrors, ...lintWarnings].map((finding, position) => (
                  <li key={position} className="flex flex-wrap items-baseline gap-2">
                    <JxBadge tone={finding.severity === 'error' ? 'danger' : 'warning'}>{finding.rule}</JxBadge>
                    <span className="lab-muted">
                      строка {finding.line}: {finding.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col gap-2 text-sm">
              <span className="lab-label">Компоненты библиотеки</span>
              <p className="lab-muted">
                {checks.usedComponents.length > 0 ? checks.usedComponents.join(', ') : 'ни одного'}
                {record.task.expects.length > 0 && (
                  <>
                    <br />
                    ожидались {record.task.expects.join(', ')} · покрытие {Math.round(checks.expectedCoverage * 100)}%
                  </>
                )}
              </p>
            </div>
            {render && (
              <p className="text-sm" style={{ color: render.ok ? 'var(--lab-ink-2)' : 'var(--jx-danger)' }}>
                Рендер: {render.ok ? 'без ошибок' : `упал (${render.error ?? 'ошибка'})`}
              </p>
            )}
          </section>
        </div>
      )}

      {toolCalls.length > 0 && (
        <section className="flex flex-col gap-2">
          <span className="lab-label">Вызовы инструментов · {toolCalls.length}</span>
          <ol className="flex flex-col gap-1 text-sm">
            {toolCalls.map((call, position) => (
              <li key={position} className="code-block break-words whitespace-pre-wrap">
                <span style={{ color: 'var(--jx-accent)' }}>{call.name.replace('mcp__context-lab__', '')}</span>
                <span className="lab-quiet">({JSON.stringify(call.input)})</span>
                <span className="lab-muted"> → ~{call.resultTokens} токенов{call.isError ? ' · ошибка' : ''}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="flex flex-col gap-2 text-sm">
        <span className="lab-label">Контекст</span>
        <p className="lab-muted">
          {record.context.sources.length > 0
            ? record.context.sources.map((source) => `${source.kind} (${source.id}, ~${source.tokens})`).join(' · ')
            : 'только формулировка задачи'}
        </p>
        {tokens > 0 ? (
          <p className="lab-quiet">
            вход {record.usage.input.toLocaleString('ru-RU')} · выход {record.usage.output.toLocaleString('ru-RU')} · из кэша{' '}
            {record.usage.cacheRead.toLocaleString('ru-RU')} · в кэш {record.usage.cacheCreation.toLocaleString('ru-RU')}
            {record.durationMs > 0 && ` · ${Math.round(record.durationMs / 1000)} с`}
          </p>
        ) : (
          <p className="lab-quiet">Расход токенов не записан: драйвер {record.driver} его не сообщает.</p>
        )}
      </section>
    </div>
  );
}
