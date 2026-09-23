import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { previewShell } from '../apps/lab/preview/shell.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entry = path.join(root, 'apps/lab/preview/main.ts');
const outDir = path.join(root, 'apps/lab/public/preview');

const result = await build({
  entryPoints: [entry],
  bundle: true,
  write: false,
  format: 'iife',
  platform: 'browser',
  target: ['es2022'],
  minify: true,
  sourcemap: false,
  outdir: outDir,
  loader: { '.css': 'css' },
  define: { 'process.env.NODE_ENV': '"production"' },
  jsx: 'automatic',
  logLevel: 'error',
});

const script = result.outputFiles.find((file) => file.path.endsWith('.js'))?.text ?? '';
const styles = result.outputFiles.find((file) => file.path.endsWith('.css'))?.text ?? '';
if (script.length === 0) throw new Error('esbuild не собрал скрипт превью');

const shell = previewShell(script, styles);

mkdirSync(outDir, { recursive: true });
for (const stale of ['preview.js', 'preview.css']) {
  rmSync(path.join(outDir, stale), { force: true });
}
writeFileSync(path.join(outDir, 'index.html'), shell, 'utf8');

const size = (text: string) => `${(text.length / 1024).toFixed(0)} KB`;
process.stderr.write(`Превью собрано в один файл: apps/lab/public/preview/index.html (скрипт ${size(script)}, стили ${size(styles)})\n`);
