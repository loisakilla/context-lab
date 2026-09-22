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

function tokensOf(record: RunRecord): number {
  return record.usage.input + record.usage.output + record.usage.cacheRead + record.usage.cacheCreation;
}

export function formatCost(cost: number | null): string {
  if (cost === null) return 'цена неизвестна';
  return cost < 0.01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(3)}`;
}

export function Report({ record, render }: ReportProps) {
  const checks = record.checks;
  const lintErrors = checks?.lint.filter((finding) => finding.severity === 'error') ?? [];
  const lintWarnings = checks?.lint.filter((finding) => finding.severity === 'warning') ?? [];
  const passed = record.verdict.passed && render?.ok !== false;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <JxBadge tone={passed ? 'success' : 'danger'} dot>
          {passed ? 'Проверки пройдены' : 'Есть проблемы'}
        </JxBadge>
        <JxBadge tone="default">{record.mode}</JxBadge>
        <JxBadge tone="default">{record.model}</JxBadge>
        <JxBadge tone="default">{DRIVER_LABELS[record.driver] ?? record.driver}</JxBadge>
        <JxBadge tone="info">
          {tokensOf(record) > 0 ? `${tokensOf(record).toLocaleString('ru-RU')} токенов` : `контекст ~${record.context.tokens.toLocaleString('ru-RU')} токенов`}
        </JxBadge>
        {record.costUsd !== null && <JxBadge tone="info">{formatCost(record.costUsd)}</JxBadge>}
        {record.durationMs > 0 && <JxBadge tone="default">{Math.round(record.durationMs / 1000)} с</JxBadge>}
        {record.stopReason !== 'end_turn' && <JxBadge tone="warning">stop: {record.stopReason}</JxBadge>}
      </div>

      {!checks && <p className="text-sm">В ответе не нашлось блока кода, проверять нечего.</p>}

      {checks && (
        <div className="grid gap-4 md:grid-cols-2">
          <section className="flex flex-col gap-2">
            <h3 className="font-semibold">Компилятор</h3>
            {checks.tsc.errors.length === 0 ? (
              <p className="text-sm">Ошибок нет: все компоненты и пропсы существуют.</p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {checks.tsc.errors.map((error, position) => (
                  <li key={position} className="code-block break-words whitespace-pre-wrap">
                    <span className="opacity-60">строка {error.line} · TS{error.code}</span>
                    <br />
                    {error.message.split('\n')[0]}
                  </li>
                ))}
              </ul>
            )}
            {checks.tsc.unknownComponents.length > 0 && (
              <p className="text-sm">
                Выдуманные компоненты:{' '}
                {checks.tsc.unknownComponents.map((name) => (
                  <JxBadge key={name} tone="danger">
                    {name}
                  </JxBadge>
                ))}
              </p>
            )}
            {checks.tsc.unknownProps.length > 0 && (
              <p className="text-sm">
                Выдуманные пропсы:{' '}
                {checks.tsc.unknownProps.map((item) => (
                  <JxBadge key={`${item.component}.${item.prop}`} tone="danger">
                    {item.component}.{item.prop}
                  </JxBadge>
                ))}
              </p>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="font-semibold">Линтер и покрытие</h3>
            {lintErrors.length === 0 && lintWarnings.length === 0 && <p className="text-sm">Замечаний нет.</p>}
            {[...lintErrors, ...lintWarnings].map((finding, position) => (
              <div key={position} className="text-sm">
                <JxBadge tone={finding.severity === 'error' ? 'danger' : 'warning'}>{finding.rule}</JxBadge> строка {finding.line}: {finding.message}
              </div>
            ))}
            <p className="text-sm">
              Использованы: {checks.usedComponents.length > 0 ? checks.usedComponents.join(', ') : 'ничего из библиотеки'}
              {record.task.expects.length > 0 && <> · ожидались {record.task.expects.join(', ')} · покрытие {Math.round(checks.expectedCoverage * 100)}%</>}
            </p>
            {render && <p className="text-sm">Рендер: {render.ok ? 'без ошибок' : `упал (${render.error ?? 'ошибка'})`}</p>}
          </section>
        </div>
      )}

      {record.turns.some((turn) => turn.toolCalls.length > 0) && (
        <section className="flex flex-col gap-2">
          <h3 className="font-semibold">Вызовы инструментов</h3>
          <ol className="flex flex-col gap-1 text-sm">
            {record.turns.flatMap((turn, turnIndex) =>
              turn.toolCalls.map((call, callIndex) => (
                <li key={`${turnIndex}-${callIndex}`} className="code-block break-words whitespace-pre-wrap">
                  {call.name}({JSON.stringify(call.input)}) → ~{call.resultTokens} токенов{call.isError ? ' · ошибка' : ''}
                </li>
              )),
            )}
          </ol>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h3 className="font-semibold">Контекст</h3>
        <p className="text-sm">
          ~{record.context.tokens.toLocaleString('ru-RU')} токенов контекста
          {record.context.sources.length > 0 && <>: {record.context.sources.map((source) => `${source.kind} (${source.id}, ~${source.tokens})`).join(', ')}</>}
        </p>
        {tokensOf(record) > 0 ? (
          <p className="text-sm">
            Вход {record.usage.input.toLocaleString('ru-RU')} · выход {record.usage.output.toLocaleString('ru-RU')} · из кэша {record.usage.cacheRead.toLocaleString('ru-RU')} · в кэш {record.usage.cacheCreation.toLocaleString('ru-RU')}
          </p>
        ) : (
          <p className="text-sm">Расход токенов для этого прогона не записан: драйвер {record.driver} его не сообщает.</p>
        )}
      </section>
    </div>
  );
}
