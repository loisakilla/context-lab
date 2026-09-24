'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LibraryMeta } from '@context-lab/index-tools';
import { knownModels, libraryKey, type ContextMode, type Matrix, type RunRecord, type Task } from '@context-lab/runner/browser';
import { describeApiError, runLocally, runWithKey } from '@/lib/lab-run';
import type { ModePreview } from '@/lib/mode-preview';
import { ContextPreview } from './ContextPreview';
import { KeyForm } from './KeyForm';
import { MODE_LABELS } from '@/lib/labels';
import { MatrixTable } from './MatrixTable';
import { Preview, type RenderStatus } from './Preview';
import { Report } from './Report';
import { createTextStream, StreamBox } from './StreamBox';
import { Button, CodeBlock, Note, Select, Tabs, Textarea } from './ui';

export interface LabProps {
  library: LibraryMeta;
  tasks: Task[];
  modes: ContextMode[];
  previews: Record<ContextMode, ModePreview>;
  matrix: Matrix | null;
  localRunEnabled: boolean;
}

type Engine = 'local' | 'byok';

export function Lab({ library, tasks, modes, previews, matrix, localRunEnabled }: LabProps) {
  const [taskId, setTaskId] = useState(tasks[0]?.id ?? 'custom');
  const [prompt, setPrompt] = useState(tasks[0]?.prompt ?? '');
  const [mode, setMode] = useState<ContextMode>('none');
  const [model, setModel] = useState('claude-opus-5');
  const [engine, setEngine] = useState<Engine>(localRunEnabled ? 'local' : 'byok');
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [stream] = useState(createTextStream);
  const [record, setRecord] = useState<RunRecord | null>(null);
  const [render, setRender] = useState<RenderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const preview = previews[mode];
  const currentLibrary = libraryKey(library);
  const matrixLibrary = matrix?.library ? libraryKey(matrix.library) : currentLibrary;

  const task: Task = useMemo(() => {
    const known = tasks.find((candidate) => candidate.id === taskId);
    if (known && known.prompt === prompt.trim()) return known;
    return { id: known ? known.id : 'custom', title: known?.title ?? 'Своя задача', prompt: prompt.trim(), taskType: 'ui', expects: known?.expects ?? [] };
  }, [tasks, taskId, prompt]);

  const pickTask = (value: string) => {
    setTaskId(value);
    const known = tasks.find((candidate) => candidate.id === value);
    setPrompt(known?.prompt ?? '');
  };

  const onRendered = useCallback((status: RenderStatus) => setRender(status), []);

  useEffect(() => () => abort.current?.abort(), []);

  const start = async () => {
    setError(null);
    setRecord(null);
    setRender(null);
    stream.clear();
    setRunning(true);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const result =
        engine === 'local'
          ? await runLocally({ taskId: task.id === 'custom' ? undefined : task.id, prompt: task.prompt, expects: task.expects, mode, model }, controller.signal)
          : await runWithKey({
              apiKey: apiKey ?? '',
              mode,
              task,
              model,
              signal: controller.signal,
              onText: stream.append,
            });
      setRecord(result);
    } catch (caught) {
      setError(controller.signal.aborted ? 'Прогон отменён.' : describeApiError(caught));
    } finally {
      setRunning(false);
      abort.current = null;
    }
  };

  const canRun = !running && task.prompt.length > 0 && (engine === 'local' || (apiKey !== null && apiKey.length > 0));

  return (
    <div className="flex flex-col gap-12">
      <section className="jx-card flex flex-col gap-6">
        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <Select
            label="Задача"
            options={[...tasks.map((item) => ({ value: item.id, label: item.title })), { value: 'custom', label: 'Своя задача' }]}
            value={taskId}
            onValueChange={pickTask}
          />
          <Select label="Модель" options={knownModels().map((name) => ({ value: name, label: name }))} value={model} onValueChange={setModel} />
        </div>

        <Textarea label="Формулировка" rows={3} value={prompt} onChange={(event) => setPrompt(event.target.value)} />

        <div className="flex flex-col gap-3">
          {localRunEnabled && (
            <>
              <span className="jx-label">Как запускать</span>
              <div className="scroller">
                <Tabs
                  ariaLabel="Движок"
                  items={[
                    { value: 'local', label: 'Claude Code' },
                    { value: 'byok', label: 'Свой ключ API' },
                  ]}
                  value={engine}
                  onValueChange={(value) => setEngine(value as Engine)}
                />
              </div>
            </>
          )}
          {engine === 'local' ? (
            <p className="dim max-w-[68ch]">Прогон делает установленный на этой машине Claude Code по подписке, без ключа API.</p>
          ) : (
            <KeyForm onChange={setApiKey} />
          )}
        </div>

        <hr className="rule" />

        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
          <div className="jx-field">
            <span className="jx-label">Режим контекста</span>
            <div className="scroller">
              <Tabs
                ariaLabel="Режим контекста"
                items={modes.map((candidate) => ({ value: candidate, label: MODE_LABELS[candidate] ?? candidate }))}
                value={modes.includes(mode) ? mode : 'none'}
                onValueChange={(value) => setMode(value as ContextMode)}
              />
            </div>
            <span className="dim">
              {mode === 'mcp'
                ? engine === 'local'
                  ? 'Claude Code берёт контекст через MCP-сервер репозитория.'
                  : 'Инструменты MCP вызываются через tool use по ходу генерации.'
                : 'error' in preview
                  ? 'Контекст для этого режима не собрался.'
                  : `≈ ${preview.tokens.toLocaleString('ru-RU')} токенов контекста до задачи.`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {running && (
              <Button variant="ghost" onClick={() => abort.current?.abort()}>
                Отменить
              </Button>
            )}
            <Button variant="primary" onClick={start} disabled={!canRun}>
              {running ? 'Генерируем…' : 'Запустить'}
            </Button>
          </div>
        </div>

        {error && (
          <Note tone="bad" title="Не получилось">
            {error}
          </Note>
        )}
      </section>

      <section className="flex flex-col gap-6">
        {!record && !running && <ContextPreview preview={preview} prompt={task.prompt} />}
        {running && <StreamBox stream={stream} placeholder={engine === 'local' ? 'Claude Code думает… обычно 20–60 секунд.' : 'Ждём первые токены…'} />}
        {record && (
          <>
            <Report record={record} render={render} />
            {record.output.code ? (
              <>
                <div className="flex flex-col gap-3">
                  <h2>Рендер на Jinx UI</h2>
                  <Preview code={record.output.code} onRendered={onRendered} />
                </div>
                <details>
                  <summary>Код компонента</summary>
                  <div className="mt-3">
                    <CodeBlock code={record.output.code} maxHeight={512} />
                  </div>
                </details>
              </>
            ) : (
              <pre className="codebox">{record.output.text}</pre>
            )}
          </>
        )}
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h2>Записанные прогоны</h2>
          {matrix ? (
            <p className="muted max-w-[72ch] text-sm">
              {matrix.generatedFrom} прогонов · модель {matrix.model} · библиотека {matrix.library?.name} {matrixLibrary}
              {matrixLibrary !== currentLibrary ? ` (контекст выше собирается из ${currentLibrary})` : ''}. В ячейке: доля засчитанных прогонов, медианы
              новых токенов и прочитанных из кэша, цены, вызовов модели и времени.
            </p>
          ) : (
            <p className="muted text-sm">
              Матрица ещё не записана: запишите прогоны командой <code>npm run run</code> и соберите таблицу через <code>npm run matrix</code>.
            </p>
          )}
        </div>
        {matrix && <MatrixTable matrix={matrix} />}
      </section>
    </div>
  );
}
