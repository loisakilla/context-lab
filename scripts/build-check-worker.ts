import { mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = path.join(root, 'apps/lab/src/lib/check-worker.ts');
const target = path.join(root, 'apps/lab/src/generated/check-worker.cjs');

mkdirSync(path.dirname(target), { recursive: true });
await build({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: ['node20'],
  outfile: target,
  logLevel: 'error',
  legalComments: 'none',
});

process.stderr.write(`Проверка кода собрана в ${path.relative(root, target)}: ${(statSync(target).size / 1024 / 1024).toFixed(1)} МБ.\n`);
