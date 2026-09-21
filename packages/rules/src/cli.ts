import path from 'node:path';
import { parseArgs } from 'node:util';
import { findDrift, writeCompiled } from './check.ts';
import { compileAll } from './compile.ts';
import { lintRegistry } from './lint.ts';
import { loadRegistry } from './parse.ts';
import { describeProvenance, resolveRules } from './resolve.ts';
import { COMPILE_TARGETS, type CompileTarget, type ResolveOptions, type RuleTarget } from './types.ts';

const USAGE = `context-lab rules

Команды:
  resolve <set>    Показать эффективный набор правил с провенансом
  compile <set>    Скомпилировать набор в файлы для агентов (CLAUDE.md, AGENTS.md, Cursor, Copilot, текст)
  check <set>      Проверить, что скомпилированные файлы не разошлись с источником (для CI)
  lint             Проверить реестр: дубликаты, конфликты, размер, расплывчатые формулировки

Опции:
  -r, --root <dir>       Папка реестра, по умолчанию rules
  -o, --out <dir>        Куда компилировать, по умолчанию rules/compiled/<set>
      --task <type>      Тип задачи для фильтра (ui, refactor, fix, docs, test)
      --file <path>      Путь файла для фильтра по applies_to
      --target <name>    Агент: claude, cursor, copilot, agents
      --budget <tokens>  Бюджет токенов на набор
      --targets <list>   Цели компиляции через запятую, по умолчанию все
  -h, --help             Показать справку`;

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function main(): void {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      root: { type: 'string', short: 'r' },
      out: { type: 'string', short: 'o' },
      task: { type: 'string' },
      file: { type: 'string' },
      target: { type: 'string' },
      budget: { type: 'string' },
      targets: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.help) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }

  const root = path.resolve(values.root ?? 'rules');
  const registry = loadRegistry(root);
  const command = positionals[0] ?? 'lint';
  const setName = positionals[1];

  const options: ResolveOptions = {};
  if (values.task) options.taskType = values.task;
  if (values.file) options.filePath = values.file;
  if (values.target) options.target = values.target as RuleTarget;
  if (values.budget) options.budget = Number.parseInt(values.budget, 10);

  const targets = (values.targets ? values.targets.split(',').map((item) => item.trim()) : [...COMPILE_TARGETS]) as CompileTarget[];
  for (const target of targets) if (!COMPILE_TARGETS.includes(target)) fail(`Неизвестная цель "${target}". Доступны: ${COMPILE_TARGETS.join(', ')}`);

  switch (command) {
    case 'resolve': {
      if (!setName) fail('Укажите набор: contextlab rules resolve <set>');
      const resolution = resolveRules(registry, setName, options);
      process.stdout.write(`Набор ${setName}, цепочка ${resolution.chain.join(' → ')}, правил ${resolution.rules.length}, ~${resolution.tokens} токенов\n`);
      for (const line of describeProvenance(resolution)) process.stdout.write(`  ${line}\n`);
      if (resolution.omitted.length > 0) process.stdout.write(`Не вошли в бюджет: ${resolution.omitted.map((rule) => rule.qualifiedId).join(', ')}\n`);
      return;
    }
    case 'compile': {
      if (!setName) fail('Укажите набор: contextlab rules compile <set>');
      const outDir = path.resolve(values.out ?? path.join(root, 'compiled', setName));
      const files = compileAll(resolveRules(registry, setName, options), targets);
      const written = writeCompiled(files, outDir);
      process.stderr.write(`Скомпилировано ${written.length} файлов в ${path.relative(process.cwd(), outDir)}: ${written.join(', ')}\n`);
      return;
    }
    case 'check': {
      if (!setName) fail('Укажите набор: contextlab rules check <set>');
      const outDir = path.resolve(values.out ?? path.join(root, 'compiled', setName));
      const drifted = findDrift(compileAll(resolveRules(registry, setName, options), targets), outDir);
      if (drifted.length > 0) fail(`Скомпилированные правила ${setName} разошлись с источником: ${drifted.join(', ')}. Выполните npm run rules:compile`);
      process.stderr.write(`Скомпилированные правила ${setName} соответствуют источнику.\n`);
      return;
    }
    case 'lint': {
      const issues = lintRegistry(registry);
      for (const issue of issues) process.stderr.write(`${issue.level === 'error' ? 'ОШИБКА' : 'внимание'}  ${issue.set}${issue.rule ? `/${issue.rule}` : ''}: ${issue.message}\n`);
      const errors = issues.filter((issue) => issue.level === 'error').length;
      process.stderr.write(`Реестр: наборов ${registry.sets.size}, правил ${[...registry.sets.values()].reduce((sum, set) => sum + set.rules.length, 0)}, ошибок ${errors}, предупреждений ${issues.length - errors}.\n`);
      if (errors > 0) process.exit(1);
      return;
    }
    default:
      fail(`Неизвестная команда "${command}".\n\n${USAGE}`);
  }
}

main();
