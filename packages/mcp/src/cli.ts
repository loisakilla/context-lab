import path from 'node:path';
import { parseArgs } from 'node:util';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { loadConfig, loadIndex, resolveFrom } from '@context-lab/docgen';
import { loadRegistry } from '@context-lab/rules';
import { createServer } from './server.ts';

const USAGE = `context-lab mcp

Команды:
  serve   Запустить MCP-сервер по stdio

Опции:
  -c, --config <file>   context-lab.config.json; из него берутся индекс, документация и правила
  -i, --index <file>    Индекс компонентов, если конфига нет
  -d, --docs <dir>      Папка сгенерированной документации конкретной версии
  -r, --rules <dir>     Папка реестра правил
  -h, --help            Показать справку`;

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      config: { type: 'string', short: 'c' },
      index: { type: 'string', short: 'i' },
      docs: { type: 'string', short: 'd' },
      rules: { type: 'string', short: 'r' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.help) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }
  const command = positionals[0] ?? 'serve';
  if (command !== 'serve') fail(`Неизвестная команда "${command}".\n\n${USAGE}`);

  let indexFile = values.index;
  let docsDir = values.docs;
  let rulesDir = values.rules;
  if (values.config || !indexFile) {
    const config = loadConfig(values.config);
    indexFile ??= resolveFrom(config, config.index);
    const index = loadIndex(indexFile);
    docsDir ??= path.join(resolveFrom(config, config.docs), index.library.version);
    rulesDir ??= resolveFrom(config, 'rules');
  }
  if (!indexFile) fail('Укажите --config или --index');

  const index = loadIndex(indexFile);
  const registry = rulesDir ? loadRegistry(rulesDir) : undefined;
  const server = createServer({ index, ...(registry ? { registry } : {}), ...(docsDir ? { docsDir } : {}) });
  await server.connect(new StdioServerTransport());
  process.stderr.write(`context-lab mcp запущен: ${index.library.name}@${index.library.version}, компонентов ${index.components.length}, наборов правил ${registry?.sets.size ?? 0}.\n`);
}

main().catch((error: unknown) => fail(error instanceof Error ? error.message : String(error)));
