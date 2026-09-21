import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = path.join(root, 'apps/lab/preview/main.ts');
const outDir = path.join(root, 'apps/lab/public/preview');

const result = await build({
  entryPoints: [entry],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2022'],
  minify: true,
  sourcemap: false,
  outfile: path.join(outDir, 'preview.js'),
  loader: { '.css': 'css' },
  define: { 'process.env.NODE_ENV': '"production"' },
  jsx: 'automatic',
  logLevel: 'error',
  metafile: true,
});

const outputs = Object.entries(result.metafile.outputs).map(([file, meta]) => `${path.relative(root, file)} ${(meta.bytes / 1024).toFixed(0)} KB`);
process.stderr.write(`Превью собрано:\n  ${outputs.join('\n  ')}\n`);
