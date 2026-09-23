import { readFileSync } from 'node:fs';
import { parentPort, workerData } from 'node:worker_threads';
import { createChecker, parseBundle, runChecks } from '@context-lab/checks';

interface CheckJob {
  code: string;
  expects: string[];
}

const { bundlePath } = workerData as { bundlePath: string };
const checker = createChecker(parseBundle(readFileSync(bundlePath, 'utf8')));
runChecks(checker, 'export {};\n');

parentPort?.on('message', (job: CheckJob) => {
  try {
    parentPort?.postMessage({ type: 'result', result: runChecks(checker, job.code, job.expects) });
  } catch (error) {
    parentPort?.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
});

parentPort?.postMessage({ type: 'ready' });
