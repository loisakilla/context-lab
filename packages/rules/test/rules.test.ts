import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { findDrift, findOrphans, removeOrphans, writeCompiled } from '../src/check.ts';
import { compile, compileAll, renderRulesText } from '../src/compile.ts';
import { lintRegistry } from '../src/lint.ts';
import { parseRule, registryFromSets } from '../src/parse.ts';
import { inheritanceChain, resolveRules } from '../src/resolve.ts';
import { COMPILE_TARGETS, type RuleSet } from '../src/types.ts';

function rule(set: string, front: string, body: string) {
  return parseRule(`---\n${front}\n---\n${body}\n`, set, `${set}/${front.match(/id: (.*)/)?.[1]}.md`);
}

function set(name: string, extendsFrom: string[], rules: RuleSet['rules'], version = '1.0.0'): RuleSet {
  return { name, version, extends: extendsFrom, rules, dir: `/virtual/${name}` };
}

const org = set('org', [], [
  rule('org', 'id: no-comments\nversion: 1.1.0\ntitle: Без комментариев\npriority: 90', 'Не пиши комментарии.'),
  rule('org', 'id: ask-before-publish\nversion: 1.0.0\ntitle: Внешние действия по просьбе\npriority: 95', 'Не пуши без просьбы.'),
  rule('org', 'id: memory\nversion: 1.0.0\ntitle: Память\npriority: 40\ntargets: [claude]', 'Ищи в Obsidian.'),
]);

const project = set('project', ['org'], [
  rule('project', 'id: no-comments\nversion: 2.0.0\ntitle: Без комментариев, кроме TODO\npriority: 90', 'Не пиши комментарии, TODO оставляй.'),
  rule('project', 'id: no-commit\nversion: 1.0.0\ntitle: Коммиты по просьбе\npriority: 90\nextends: ask-before-publish', 'Коммиты тоже только по просьбе.'),
  rule('project', 'id: tokens\nversion: 1.0.0\ntitle: Только токены\napplies_to: ["**/*.tsx", "**/*.css"]\ntask_types: [ui]\npriority: 80', 'Цвета только через var(--jx-*).'),
]);

const registry = registryFromSets([org, project]);

describe('наследование и переопределение', () => {
  it('строит цепочку родителей и переопределяет правило с тем же id', () => {
    expect(inheritanceChain(registry, 'project')).toEqual(['org', 'project']);
    const resolution = resolveRules(registry, 'project');
    const noComments = resolution.rules.find((item) => item.id === 'no-comments');
    expect(noComments).toMatchObject({ version: '2.0.0', definedIn: 'project@1.0.0', overrides: 'org/no-comments@1.1.0' });
    expect(resolution.rules.filter((item) => item.id === 'no-comments')).toHaveLength(1);
  });

  it('extends уточняет родительское правило: текст склеивается, родитель уходит', () => {
    const resolution = resolveRules(registry, 'project');
    const commit = resolution.rules.find((item) => item.id === 'no-commit');
    expect(commit?.refines).toBe('org/ask-before-publish@1.0.0');
    expect(commit?.body).toBe('Не пуши без просьбы.\n\nКоммиты тоже только по просьбе.');
    expect(resolution.rules.some((item) => item.id === 'ask-before-publish')).toBe(false);
    expect(resolution.provenance.find((item) => item.id === 'project/no-commit')?.refines).toBe('org/ask-before-publish@1.0.0');
  });

  it('фильтрует по типу задачи, пути файла и агенту', () => {
    const ids = (options: Parameters<typeof resolveRules>[2]) => resolveRules(registry, 'project', options).rules.map((item) => item.id);
    expect(ids({ taskType: 'docs' })).not.toContain('tokens');
    expect(ids({ taskType: 'ui' })).toContain('tokens');
    expect(ids({ filePath: 'src/App.tsx' })).toContain('tokens');
    expect(ids({ filePath: 'README.md' })).not.toContain('tokens');
    expect(ids({ target: 'cursor' })).not.toContain('memory');
    expect(ids({ target: 'claude' })).toContain('memory');
  });

  it('сортирует по приоритету и укладывает в бюджет, сохраняя список опущенных', () => {
    const full = resolveRules(registry, 'project');
    expect(full.rules.map((item) => item.priority)).toEqual([90, 90, 80, 40]);
    const tight = resolveRules(registry, 'project', { budget: full.rules[0]!.tokens + full.rules[1]!.tokens });
    expect(tight.rules).toHaveLength(2);
    expect(tight.omitted.map((item) => item.id)).toEqual(['tokens', 'memory']);
    expect(tight.tokens).toBeLessThanOrEqual(tight.options.budget!);
  });

  it('ловит цикл и неизвестный набор', () => {
    const a = set('a', ['b'], []);
    const b = set('b', ['a'], []);
    expect(() => inheritanceChain(registryFromSets([a, b]), 'a')).toThrow(/Циклическое/);
    expect(() => resolveRules(registry, 'ghost')).toThrow(/не найден/);
  });
});

describe('компиляция', () => {
  const resolution = resolveRules(registry, 'project', { taskType: 'ui' });

  it('claude: общие правила в CLAUDE.md, правила с путями в .claude/rules с paths', () => {
    const files = compile(resolution, 'claude');
    expect(files.map((file) => file.path)).toEqual(['CLAUDE.md', '.claude/rules/tokens.md']);
    expect(files[0]?.content).toMatch(/## Без комментариев, кроме TODO/);
    expect(files[0]?.content).not.toMatch(/Только токены/);
    expect(files[1]?.content).toMatch(/^---\npaths: \["\*\*\/\*\.tsx", "\*\*\/\*\.css"\]\n---/);
  });

  it('cursor и copilot получают frontmatter с globs и applyTo', () => {
    const cursor = compile(resolution, 'cursor').find((file) => file.path.endsWith('tokens.mdc'));
    expect(cursor?.content).toMatch(/globs: \["\*\*\/\*\.tsx", "\*\*\/\*\.css"\]\nalwaysApply: false/);
    const copilot = compile(resolution, 'copilot').find((file) => file.path.endsWith('tokens.instructions.md'));
    expect(copilot?.content).toMatch(/applyTo: "\*\*\/\*\.tsx, \*\*\/\*\.css"/);
  });

  it('текстовая форма нумерует правила и указывает область применения', () => {
    const text = renderRulesText(resolution);
    expect(text).toMatch(/^Правила набора project \(4 правил/);
    expect(text).toMatch(/3\. Только токены \[\*\*\/\*\.tsx, \*\*\/\*\.css\]/);
  });

  it('компиляция идемпотентна и check ловит дрейф', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'rules-'));
    const files = compileAll(resolution, COMPILE_TARGETS);
    writeCompiled(files, dir);
    expect(findDrift(compileAll(resolution, COMPILE_TARGETS), dir)).toEqual([]);
    const edited = project.rules.map((item) => (item.id === 'tokens' ? { ...item, body: 'Цвета только через токены, без исключений.' } : item));
    const changed = resolveRules(registryFromSets([org, set('project', ['org'], edited)]), 'project', { taskType: 'ui' });
    expect(findDrift(compileAll(changed, COMPILE_TARGETS), dir).length).toBeGreaterThan(0);
    rmSync(dir, { recursive: true, force: true });
  });

  it('удалённое правило не остаётся файлом в скомпилированных', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'rules-'));
    writeCompiled(compileAll(resolution, COMPILE_TARGETS), dir);

    const without = project.rules.filter((item) => item.id !== 'tokens');
    const shrunk = compileAll(resolveRules(registryFromSets([org, set('project', ['org'], without)]), 'project', { taskType: 'ui' }), COMPILE_TARGETS);

    const orphans = findOrphans(shrunk, dir, COMPILE_TARGETS);
    expect(orphans).toEqual(['.claude/rules/tokens.md', '.cursor/rules/tokens.mdc', '.github/instructions/tokens.instructions.md']);
    writeCompiled(shrunk, dir);
    expect(removeOrphans(shrunk, dir, COMPILE_TARGETS)).toEqual(orphans);
    expect(findOrphans(shrunk, dir, COMPILE_TARGETS)).toEqual([]);
    expect(findDrift(shrunk, dir)).toEqual([]);
    rmSync(dir, { recursive: true, force: true });
  });

  it('при компиляции в чужой проект не трогает его собственные файлы', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'rules-'));
    const foreign = ['README.md', 'CHANGELOG.md', '.github/PULL_REQUEST_TEMPLATE.md', '.claude/rules/own.md', '.cursor/rules/own.mdc'];
    for (const file of foreign) {
      mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
      writeFileSync(path.join(dir, file), '# Свой файл проекта\n', 'utf8');
    }
    const files = compileAll(resolution, COMPILE_TARGETS);
    writeCompiled(files, dir);
    expect(removeOrphans(files, dir, COMPILE_TARGETS)).toEqual([]);
    for (const file of foreign) expect(existsSync(path.join(dir, file))).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });
});

describe('линт реестра', () => {
  it('находит дубликаты, расплывчатые слова, конфликты и несуществующих родителей', () => {
    const messy = set('messy', ['nowhere'], [
      rule('messy', 'id: dup\nversion: 1.0.0\ntitle: Первое', 'По возможности пиши тесты.'),
      rule('messy', 'id: dup\nversion: 1.0.0\ntitle: Второе', 'Текст.'),
      rule('messy', 'id: a\nversion: 1.0.0\ntitle: А\nconflicts_with: [b]', 'Всегда используй табы.'),
      rule('messy', 'id: b\nversion: 1.0.0\ntitle: Б', 'Никогда не используй табы.'),
    ]);
    const issues = lintRegistry(registryFromSets([messy]));
    const messages = issues.map((issue) => `${issue.level}:${issue.message}`);
    expect(messages).toEqual(expect.arrayContaining([
      'error:дубликат id внутри набора',
      'error:наследует несуществующий набор "nowhere"',
      expect.stringMatching(/warning:расплывчатая формулировка «по возможности»/),
    ]));
  });

  it('чистый реестр проходит без ошибок', () => {
    expect(lintRegistry(registry).filter((issue) => issue.level === 'error')).toEqual([]);
  });
});

afterAll(() => undefined);
