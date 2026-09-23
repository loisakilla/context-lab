import 'server-only';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { CheckReport } from '@context-lab/checks';
import { createWorkerPool, type WorkerPool } from './check-pool';

const GENERATED = path.join(process.cwd(), 'src', 'generated');
const WORKER_FILE = path.join(GENERATED, 'check-worker.cjs');
const BUNDLE_FILE = path.join(GENERATED, 'type-bundle.json');

let pool: WorkerPool<{ code: string; expects: string[] }, CheckReport> | undefined;

export function checkCode(code: string, expects: string[] = []): Promise<CheckReport> {
  if (!pool) {
    if (!existsSync(WORKER_FILE) || !existsSync(BUNDLE_FILE)) {
      return Promise.reject(new Error('Проверка не собрана: выполните npm run lab:prepare в корне репозитория'));
    }
    pool = createWorkerPool({ workerFile: WORKER_FILE, workerData: { bundlePath: BUNDLE_FILE }, timeoutMs: 5_000, maxQueue: 8 });
  }
  return pool.run({ code, expects });
}
