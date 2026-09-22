'use client';

import type { RunRecord } from '@context-lab/runner/browser';
import type { RenderStatus } from './Preview';
import { Badge, Stat } from './ui';

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
  if (cost === null) return '—';
  return cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(3)}`;
}

interface LintFinding {
  severity: string;
  rule: string;
  line: number;
  message: string;
}

function groupLint(findings: LintFinding[]): { rule: string; severity: string; message: string; lines: number[] }[] {
  const grouped = new Map<string, { rule: string; severity: string; message: string; lines: number[] }>();
  for (const finding of findings) {
    const key = `${finding.rule}|${finding.message}`;
    const existing = grouped.get(key);
    if (existing) existing.lines.push(finding.line);
    else grouped.set(key, { rule: finding.rule, severity: finding.severity, message: finding.message, lines: [finding.line] });
  }
  return [...grouped.values()];
}

function Invented({ title, names }: { title: string; names: string[] }) {
  if (names.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <span className="jx-label">{title}</span>
      <div className="flex flex-wrap gap-1.5">
        {names.map((name) => (
          <Badge key={name} tone="bad">
            {name}
          </Badge>
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
    <div className="flex flex-col gap-6">
      <div className="jx-card flex flex-col gap-6">
        <div className="card-head">
          <Badge tone={passed ? 'ok' : 'bad'} dot>
            {passed ? 'проверки пройдены' : 'есть проблемы'}
          </Badge>
          <span className="dim">
            {MODE_LABELS[record.mode] ?? record.mode} · {record.model} · {DRIVER_LABELS[record.driver] ?? record.driver}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          <Stat label="Контекст до задачи" value={`~${record.context.tokens.toLocaleString('ru-RU')}`} tone="accent" />
          <Stat label="Токенов на прогон" value={tokens > 0 ? tokens.toLocaleString('ru-RU') : '—'} />
          <Stat label="Цена" value={formatCost(record.costUsd)} />
          <Stat
            label="Ошибок компилятора"
            value={checks ? String(checks.tsc.errors.length) : '—'}
            tone={checks && checks.tsc.errors.length > 0 ? 'bad' : 'ok'}
          />
        </div>
      </div>

      {!checks && <p className="muted text-sm">В ответе не нашлось блока кода, проверять нечего.</p>}

      {checks && (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="jx-card flex flex-col gap-4">
            <h3>Компилятор</h3>
            {checks.tsc.errors.length === 0 ? (
              <p className="muted text-sm">Ошибок нет: все компоненты и пропсы существуют.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {checks.tsc.errors.map((error, position) => (
                  <li key={position} className="codebox text-[12.5px]">
                    <span className="dim">
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

          <section className="jx-card flex flex-col gap-4">
            <h3>Линтер и покрытие</h3>
            {lintErrors.length === 0 && lintWarnings.length === 0 ? (
              <p className="muted text-sm">Замечаний нет.</p>
            ) : (
              <ul className="flex flex-col gap-3 text-sm">
                {groupLint([...lintErrors, ...lintWarnings]).map((finding, position) => (
                  <li key={position} className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={finding.severity === 'error' ? 'bad' : 'warn'}>
                        {finding.rule}
                      </Badge>
                      <span className="dim mono text-[12.5px]">
                        {finding.lines.length > 1 ? 'строки' : 'строка'} {finding.lines.join(', ')}
                      </span>
                    </div>
                    <span className="muted">{finding.message}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col gap-1.5">
              <span className="jx-label">Компоненты библиотеки</span>
              <p className="text-sm">{checks.usedComponents.length > 0 ? checks.usedComponents.join(', ') : 'ни одного'}</p>
              {record.task.expects.length > 0 && (
                <p className="dim">
                  ожидались {record.task.expects.join(', ')} · покрытие {Math.round(checks.expectedCoverage * 100)}%
                </p>
              )}
            </div>
            {render && (
              <p className="text-sm" style={{ color: render.ok ? 'var(--jx-text-3)' : 'var(--jx-danger)' }}>
                Рендер: {render.ok ? 'без ошибок' : `упал (${render.error ?? 'ошибка'})`}
              </p>
            )}
          </section>
        </div>
      )}

      {toolCalls.length > 0 && (
        <section className="flex flex-col gap-2">
          <span className="jx-label">Вызовы инструментов · {toolCalls.length}</span>
          <ol className="flex flex-col gap-1">
            {toolCalls.map((call, position) => (
              <li key={position} className="codebox code--row text-[12.5px]">
                <span style={{ color: 'var(--jx-accent)' }}>{call.name.replace('mcp__context-lab__', '')}</span>
                <span className="dim">({JSON.stringify(call.input)})</span>
                <span className="muted">
                  {' → '}~{call.resultTokens} токенов{call.isError ? ' · ошибка' : ''}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="flex flex-col gap-1.5">
        <span className="jx-label">Контекст</span>
        <p className="muted text-sm">
          {record.context.sources.length > 0
            ? record.context.sources.map((source) => `${source.kind} (${source.id}, ~${source.tokens})`).join(' · ')
            : 'только формулировка задачи'}
        </p>
        {tokens > 0 ? (
          <p className="dim">
            вход {record.usage.input.toLocaleString('ru-RU')} · выход {record.usage.output.toLocaleString('ru-RU')} · из кэша{' '}
            {record.usage.cacheRead.toLocaleString('ru-RU')} · в кэш {record.usage.cacheCreation.toLocaleString('ru-RU')}
            {record.durationMs > 0 && ` · ${Math.round(record.durationMs / 1000)} с`}
          </p>
        ) : (
          <p className="dim">Расход токенов не записан: драйвер {record.driver} его не сообщает.</p>
        )}
      </section>
    </div>
  );
}
