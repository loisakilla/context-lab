import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

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

const shell = `<!doctype html>
<html lang="ru" data-theme="dark" data-style="brutal">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src data: blob:; connect-src 'none'; form-action 'none'" />
    <title>Preview</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" />
    <style>
${styles}
      html, body { margin: 0; background: var(--jx-bg); color: var(--jx-text); font-family: var(--jx-font-sans, system-ui, sans-serif); }
      #root { padding: 16px; }
      .preview-error { white-space: pre-wrap; padding: 12px; border: 2px solid var(--jx-danger); border-radius: var(--jx-r, 4px); color: var(--jx-danger); font: 13px/1.4 var(--jx-font-mono, monospace); }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
${script}
    </script>
  </body>
</html>
`;

mkdirSync(outDir, { recursive: true });
for (const stale of ['preview.js', 'preview.css']) {
  rmSync(path.join(outDir, stale), { force: true });
}
writeFileSync(path.join(outDir, 'index.html'), shell, 'utf8');

const size = (text: string) => `${(text.length / 1024).toFixed(0)} KB`;
process.stderr.write(`Превью собрано в один файл: apps/lab/public/preview/index.html (скрипт ${size(script)}, стили ${size(styles)})\n`);
