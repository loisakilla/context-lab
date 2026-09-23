import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '@context-lab/docgen';
import { buildContext, contextTokens, CONTEXT_MODES, loadSources, loadTasks } from '@context-lab/runner';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = loadConfig(path.join(root, 'context-lab.config.json'));
const tasks = loadTasks(config);
const sources = loadSources(config);

const outDir = path.join(root, 'data', 'prompts');
mkdirSync(outDir, { recursive: true });

const manifest: Array<{ task: string; mode: string; file: string; contextTokens: number }> = [];

for (const task of tasks) {
  for (const mode of CONTEXT_MODES) {
    const context = buildContext(mode, task, sources);
    const body = [context.system, '', context.contextText, '', context.taskText].filter((part) => part.length > 0).join('\n');
    const file = path.join(outDir, `${task.id}__${mode}.md`);
    writeFileSync(file, `${body}\n`, 'utf8');
    manifest.push({ task: task.id, mode, file: path.relative(root, file).replace(/\\/g, '/'), contextTokens: contextTokens(context) });
  }
}

writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
process.stderr.write(`Заданий записано: ${manifest.length} в data/prompts\n`);
for (const mode of CONTEXT_MODES) {
  const sample = manifest.find((item) => item.mode === mode);
  process.stderr.write(`  ${mode.padEnd(11)} ~${sample?.contextTokens ?? 0} токенов контекста\n`);
}
