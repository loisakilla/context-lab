import Link from 'next/link';
import { JxBadge } from '@jinx-ui/react';
import { loadRuleResolution } from '@/lib/data';

export const dynamic = 'force-dynamic';

const TASK_TYPES = ['ui', 'fix', 'refactor', 'docs', 'test'];

const TARGET_FILES = [
  ['claude', 'CLAUDE.md и .claude/rules/*.md с путями'],
  ['agents', 'AGENTS.md'],
  ['cursor', '.cursor/rules/*.mdc с globs и alwaysApply'],
  ['copilot', '.github/copilot-instructions.md и .github/instructions/*.instructions.md с applyTo'],
];

function first(value: string | string[] | undefined, fallback: string): string {
  return (Array.isArray(value) ? value[0] : value) ?? fallback;
}

export default async function RulesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const set = first(params.set, 'jinx-ui');
  const taskType = first(params.task, 'ui');
  const { resolution, sets } = loadRuleResolution(set, taskType);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/" className="text-sm underline">
          ← к лаборатории
        </Link>
        <Link href="/compare" className="text-sm underline">
          сравнение режимов
        </Link>
      </div>

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Реестр правил</h1>
        <p className="max-w-3xl">
          Правила лежат в репозитории как Markdown с frontmatter и собираются в наборы. Набор наследует правила родителей, правило с тем же идентификатором переопределяет родительское, <code>extends</code> уточняет его. Резолвер отдаёт эффективный набор под тип задачи с провенансом: видно, откуда пришло правило и что оно заменило.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">Набор:</span>
          {sets.map((name) => (
            <Link key={name} href={`/rules?set=${name}&task=${taskType}`} className={name === set ? 'text-sm font-semibold underline' : 'text-sm underline opacity-70'}>
              {name}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">Тип задачи:</span>
          {TASK_TYPES.map((type) => (
            <Link key={type} href={`/rules?set=${set}&task=${type}`} className={type === taskType ? 'text-sm font-semibold underline' : 'text-sm underline opacity-70'}>
              {type}
            </Link>
          ))}
        </div>
      </section>

      {!resolution && <p>Набора «{set}» в реестре нет.</p>}

      {resolution && (
        <>
          <div className="flex flex-wrap gap-2">
            <JxBadge tone="accent">цепочка {resolution.chain.join(' → ')}</JxBadge>
            <JxBadge tone="default">правил {resolution.rules.length}</JxBadge>
            <JxBadge tone="info">~{resolution.tokens.toLocaleString('ru-RU')} токенов</JxBadge>
            {resolution.omitted.length > 0 && <JxBadge tone="warning">опущено по бюджету {resolution.omitted.length}</JxBadge>}
          </div>

          <section className="flex flex-col gap-4">
            {resolution.rules.map((rule) => (
              <article key={rule.qualifiedId} className="flex flex-col gap-2 rounded border-2 p-4" style={{ borderColor: 'var(--jx-border)', background: 'var(--jx-surface)' }}>
                <div className="flex flex-wrap items-baseline gap-2">
                  <h2 className="text-lg font-bold">{rule.title}</h2>
                  <code className="text-sm opacity-70">
                    {rule.qualifiedId}@{rule.version}
                  </code>
                </div>
                <p>{rule.body}</p>
                <div className="flex flex-wrap gap-2 text-sm">
                  <JxBadge tone="default">из {rule.definedIn}</JxBadge>
                  <JxBadge tone="default">приоритет {rule.priority}</JxBadge>
                  <JxBadge tone="info">~{rule.tokens} ток.</JxBadge>
                  {rule.overrides && <JxBadge tone="warning">переопределяет {rule.overrides}</JxBadge>}
                  {rule.refines && <JxBadge tone="accent">уточняет {rule.refines}</JxBadge>}
                  {rule.appliesTo.length > 0 && <JxBadge tone="default">{rule.appliesTo.join(', ')}</JxBadge>}
                  {rule.taskTypes.length > 0 && <JxBadge tone="default">задачи: {rule.taskTypes.join(', ')}</JxBadge>}
                </div>
              </article>
            ))}
          </section>

          {resolution.omitted.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-xl font-bold">Не поместились в бюджет</h2>
              <ul className="flex flex-col gap-1 text-sm">
                {resolution.omitted.map((rule) => (
                  <li key={rule.qualifiedId}>
                    {rule.title} · {rule.qualifiedId}@{rule.version} · ~{rule.tokens} ток.
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">Куда это компилируется</h2>
        <p className="text-sm opacity-70">Один источник, четыре цели. CI падает, если файлы разошлись с реестром.</p>
        <ul className="flex flex-col gap-1 text-sm">
          {TARGET_FILES.map(([target, files]) => (
            <li key={target}>
              <code>{target}</code> — {files}
            </li>
          ))}
        </ul>
        <pre className="code-block whitespace-pre-wrap">npm run rules:resolve -- {set} --task {taskType}</pre>
      </section>
    </main>
  );
}
