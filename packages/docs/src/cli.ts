import path from 'node:path';
import { parseArgs } from 'node:util';
import { loadConfig, loadDescriptions, loadIndex, resolveFrom } from '@context-lab/docgen';
import { lintDocs } from './lint.ts';
import { docsVersionDir, findDocsDrift, writeDocs } from './write.ts';

const USAGE = `context-lab docs

Команды:
  build   Сгенерировать llms.txt, llms-full.txt и Markdown по компонентам из индекса
  check   Проверить, что сгенерированные файлы не разошлись с индексом (для CI)
  lint    Проверить описания компонентов в docs/components против типов

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
  const index = loadIndex(resolveFrom(config, config.index));
  const outDir = docsVersionDir(resolveFrom(config, config.docs), index);
  const shown = path.relative(config.root, outDir);
  const command = positionals[0] ?? 'build';

  switch (command) {
    case 'build': {
      const written = writeDocs(index, outDir);
      process.stderr.write(`Документация записана в ${shown}: файлов ${written.length}.\n`);
      return;
    }
    case 'check': {
      const drifted = findDocsDrift(index, outDir);
      if (drifted.length > 0) {
        fail(`Документация в ${shown} разошлась с индексом (${drifted.length} файлов, например ${drifted[0]}). Пересоберите: npm run docs:build`);
      }
      process.stderr.write(`Документация в ${shown} соответствует индексу.\n`);
      return;
    }
    case 'lint': {
      const docsDir = config.library.docsDir ? resolveFrom(config, config.library.docsDir) : undefined;
      if (!docsDir) fail('В конфиге не задан library.docsDir');
      const issues = lintDocs(index, loadDescriptions(docsDir));
      for (const issue of issues) process.stderr.write(`${issue.level === 'error' ? 'ОШИБКА' : 'внимание'}  ${issue.component}: ${issue.message}\n`);
      const errors = issues.filter((issue) => issue.level === 'error').length;
      process.stderr.write(`Проверка описаний: ошибок ${errors}, предупреждений ${issues.length - errors}.\n`);
      if (errors > 0) process.exit(1);
      return;
    }
    default:
      fail(`Неизвестная команда "${command}".\n\n${USAGE}`);
  }
}

main();
