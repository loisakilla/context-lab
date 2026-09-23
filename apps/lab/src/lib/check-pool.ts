import { Worker } from 'node:worker_threads';

export class CheckTimeoutError extends Error {}

export class CheckBusyError extends Error {}

export interface WorkerPoolOptions {
  workerFile: string;
  workerData?: unknown;
  timeoutMs: number;
  startupTimeoutMs?: number;
  maxQueue: number;
}

export interface WorkerPool<Payload, Result> {
  run(payload: Payload): Promise<Result>;
  close(): Promise<void>;
}

interface Job<Payload, Result> {
  payload: Payload;
  resolve: (result: Result) => void;
  reject: (error: Error) => void;
}

type WorkerMessage<Result> = { type: 'ready' } | { type: 'result'; result: Result } | { type: 'error'; message: string };

export function createWorkerPool<Payload, Result>(options: WorkerPoolOptions): WorkerPool<Payload, Result> {
  const queue: Job<Payload, Result>[] = [];
  let worker: Worker | undefined;
  let ready = false;
  let current: Job<Payload, Result> | undefined;
  let timer: NodeJS.Timeout | undefined;

  const stopTimer = (): void => {
    if (timer) clearTimeout(timer);
    timer = undefined;
  };

  const takeCurrent = (): Job<Payload, Result> | undefined => {
    const job = current;
    current = undefined;
    stopTimer();
    return job;
  };

  const discard = (instance: Worker): void => {
    if (worker !== instance) return;
    worker = undefined;
    ready = false;
    void instance.terminate();
  };

  const failEverything = (error: Error): void => {
    takeCurrent()?.reject(error);
    for (const waiting of queue.splice(0)) waiting.reject(error);
  };

  const spawn = (): void => {
    const instance = new Worker(options.workerFile, { workerData: options.workerData });
    instance.unref();
    worker = instance;
    ready = false;
    timer = setTimeout(() => {
      discard(instance);
      failEverything(new Error(`Проверка не запустилась за ${Math.round((options.startupTimeoutMs ?? 30_000) / 1000)} с`));
    }, options.startupTimeoutMs ?? 30_000);

    instance.on('message', (message: WorkerMessage<Result>) => {
      if (worker !== instance) return;
      if (message.type === 'ready') {
        ready = true;
        stopTimer();
        pump();
        return;
      }
      const job = takeCurrent();
      if (message.type === 'result') job?.resolve(message.result);
      else job?.reject(new Error(message.message));
      pump();
    });

    instance.on('error', (error) => {
      if (worker !== instance) return;
      const startingUp = !ready;
      discard(instance);
      if (startingUp) {
        failEverything(error);
        return;
      }
      takeCurrent()?.reject(error);
      pump();
    });

    instance.on('exit', (code) => {
      if (worker !== instance) return;
      const startingUp = !ready;
      worker = undefined;
      ready = false;
      const error = new Error(`Процесс проверки завершился с кодом ${code}`);
      if (startingUp) {
        failEverything(error);
        return;
      }
      takeCurrent()?.reject(error);
      pump();
    });
  };

  const pump = (): void => {
    if (current || queue.length === 0) return;
    if (!worker) {
      spawn();
      return;
    }
    if (!ready) return;
    const job = queue.shift();
    if (!job) return;
    current = job;
    const instance = worker;
    timer = setTimeout(() => {
      discard(instance);
      takeCurrent()?.reject(new CheckTimeoutError(`Проверка не уложилась в ${Math.round(options.timeoutMs / 1000)} с`));
      pump();
    }, options.timeoutMs);
    instance.postMessage(job.payload);
  };

  return {
    run(payload: Payload): Promise<Result> {
      if (queue.length >= options.maxQueue) return Promise.reject(new CheckBusyError('Проверок в очереди слишком много, повторите через несколько секунд'));
      return new Promise<Result>((resolve, reject) => {
        queue.push({ payload, resolve, reject });
        pump();
      });
    },
    async close(): Promise<void> {
      const instance = worker;
      worker = undefined;
      ready = false;
      failEverything(new Error('Проверка остановлена'));
      if (instance) await instance.terminate();
    },
  };
}
