import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig, loadIndex, resolveFrom } from '@context-lab/docgen';
import { buildContext, contextTokens, CONTEXT_MODES, type ContextSources, type Task } from '@context-lab/runner';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = loadConfig(path.join(root, 'context-lab.config.json'));
const index = loadIndex(resolveFrom(config, config.index));
const tasks = JSON.parse(readFileSync(resolveFrom(config, config.tasks), 'utf8')) as Task[];

const sources: ContextSources = {
  index,
  readme: readFileSync(resolveFrom(config, config.library.readme ?? 'node_modules/@jinx-ui/react/README.md'), 'utf8'),
  docs: readFileSync(path.join(resolveFrom(config, config.docs), index.library.version, 'llms-full.txt'), 'utf8'),
  rules: readFileSync(resolveFrom(config, 'rules/compiled/jinx-ui.md'), 'utf8'),
};

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
