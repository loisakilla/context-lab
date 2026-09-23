import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { buildIndex, serializeIndex } from './build.ts';
import { buildOptionsFromConfig, loadConfig, resolveFrom } from './config.ts';

const USAGE = `context-lab docgen

Команды:
  build   Собрать индекс компонентов и токенов по context-lab.config.json
  check   Проверить, что закоммиченный индекс не разошёлся с библиотекой (для CI)

Опции:
  -c, --config <file>   Путь к конфигу, по умолчанию context-lab.config.json
  -h, --help            Показать справку`;

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function main(): void {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      config: { type: 'string', short: 'c' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.help) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }

  const config = loadConfig(values.config);
  const target = resolveFrom(config, config.index);
  const command = positionals[0] ?? 'build';
  const started = Date.now();
  const fresh = serializeIndex(buildIndex(buildOptionsFromConfig(config)));
  const index = JSON.parse(fresh) as { components: unknown[]; hooks: unknown[]; tokens: unknown[]; library: { version: string; commit: string } };
  const summary = `компонентов ${index.components.length}, хуков ${index.hooks.length}, токенов ${index.tokens.length}, версия ${index.library.version}${index.library.commit ? `@${index.library.commit.slice(0, 7)}` : ''}`;

  switch (command) {
    case 'build': {
      mkdirSync(path.dirname(target), { recursive: true });
      writeFileSync(target, fresh, 'utf8');
      process.stderr.write(`Индекс записан в ${path.relative(config.root, target)} за ${Date.now() - started} мс: ${summary}.\n`);
      return;
    }
    case 'check': {
      let committed = '';
      try {
        committed = readFileSync(target, 'utf8');
      } catch {
        fail(`Индекс ${config.index} не найден. Соберите его: npm run index`);
      }
      if (committed !== fresh) fail(`Индекс ${config.index} разошёлся с библиотекой. Пересоберите его: npm run index`);
      process.stderr.write(`Индекс ${config.index} соответствует библиотеке: ${summary}.\n`);
      return;
    }
    default:
      fail(`Неизвестная команда "${command}".\n\n${USAGE}`);
  }
}

main();
