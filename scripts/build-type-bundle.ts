import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildNodeTypeBundle, serializeBundle } from '@context-lab/checks';
import { loadConfig, resolveFrom } from '@context-lab/docgen';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = loadConfig(path.join(root, 'context-lab.config.json'));
const bundle = buildNodeTypeBundle({
  packageRoot: resolveFrom(config, config.library.packageRoot),
  packageName: config.library.package ?? '@jinx-ui/react',
  nodeModules: resolveFrom(config, 'node_modules'),
});

const skip = /^\/lib\.(webworker|scripthost|esnext|es2023|es2024|decorators)/;
for (const name of Object.keys(bundle.files)) {
  if (skip.test(name)) delete bundle.files[name];
}

const target = path.join(root, 'apps/lab/src/generated/type-bundle.json');
mkdirSync(path.dirname(target), { recursive: true });
const json = serializeBundle(bundle);
writeFileSync(target, json, 'utf8');
process.stderr.write(`Бандл типов записан в ${path.relative(root, target)}: файлов ${Object.keys(bundle.files).length}, ${(json.length / 1024 / 1024).toFixed(1)} МБ.\n`);
