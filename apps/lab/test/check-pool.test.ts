import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { CheckBusyError, CheckTimeoutError, createWorkerPool, type WorkerPool } from '../src/lib/check-pool';

const WORKER_SOURCE = `
const { parentPort, workerData } = require('node:worker_threads');
if (workerData && workerData.failStartup) throw new Error('проверка не собрана');
parentPort.on('message', (job) => {
  if (job.spin) {
    const end = Date.now() + job.spin;
    while (Date.now() < end) {}
  }
  if (job.fail) {
    parentPort.postMessage({ type: 'error', message: job.fail });
    return;
  }
  parentPort.postMessage({ type: 'result', result: { echo: job.value } });
});
parentPort.postMessage({ type: 'ready' });
`;

interface Job {
  value?: number;
  spin?: number;
  fail?: string;
}

const dir = mkdtempSync(path.join(tmpdir(), 'check-pool-'));
const workerFile = path.join(dir, 'worker.cjs');
writeFileSync(workerFile, WORKER_SOURCE, 'utf8');

const pools: WorkerPool<Job, { echo: number }>[] = [];

function pool(options: { timeoutMs?: number; maxQueue?: number; workerData?: unknown } = {}): WorkerPool<Job, { echo: number }> {
  const created = createWorkerPool<Job, { echo: number }>({ workerFile, timeoutMs: options.timeoutMs ?? 2000, maxQueue: options.maxQueue ?? 4, workerData: options.workerData });
  pools.push(created);
  return created;
}

afterEach(async () => {
  await Promise.all(pools.splice(0).map((created) => created.close()));
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('пул проверки кода', () => {
  it('возвращает результат, посчитанный в отдельном потоке', async () => {
    await expect(pool().run({ value: 7 })).resolves.toEqual({ echo: 7 });
  });

  it('обрывает зависшую проверку по таймауту и принимает следующую', async () => {
    const checks = pool({ timeoutMs: 200 });
    await expect(checks.run({ spin: 5000 })).rejects.toBeInstanceOf(CheckTimeoutError);
    await expect(checks.run({ value: 2 })).resolves.toEqual({ echo: 2 });
  });

  it('отказывает сразу, когда очередь заполнена', async () => {
    const checks = pool({ maxQueue: 1 });
    const first = checks.run({ value: 1 });
    await expect(checks.run({ value: 2 })).rejects.toBeInstanceOf(CheckBusyError);
    await expect(first).resolves.toEqual({ echo: 1 });
  });

  it('передаёт ошибку проверки вызывающему', async () => {
    await expect(pool().run({ fail: 'сломалось' })).rejects.toThrow('сломалось');
  });

  it('сообщает об ошибке запуска всем ожидающим проверкам', async () => {
    const checks = pool({ workerData: { failStartup: true } });
    const results = await Promise.allSettled([checks.run({ value: 1 }), checks.run({ value: 2 })]);
    expect(results.map((result) => result.status)).toEqual(['rejected', 'rejected']);
    expect(String((results[0] as PromiseRejectedResult).reason)).toContain('проверка не собрана');
  });
});
