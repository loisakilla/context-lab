import Link from 'next/link';
import { TopBar } from '@/components/TopBar';
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

function Switcher({ label, values, current, href }: { label: string; values: string[]; current: string; href: (value: string) => string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
      <span className="lab-label">{label}</span>
      {values.map((value) =>
        value === current ? (
          <span key={value} className="font-mono text-sm" style={{ color: 'var(--jx-accent)' }}>
            {value}
          </span>
        ) : (
          <Link key={value} href={href(value)} className="lab-muted font-mono text-sm underline">
            {value}
          </Link>
        ),
      )}
    </div>
  );
}

export default async function RulesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const set = first(params.set, 'jinx-ui');
  const taskType = first(params.task, 'ui');
  const { resolution, sets } = loadRuleResolution(set, taskType);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6">
      <TopBar current="rules" />

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold">Реестр правил</h1>
        <p className="lab-muted max-w-[62ch] text-lg">
          Правила лежат в репозитории как Markdown с frontmatter и собираются в наборы. Набор наследует правила родителей, правило с тем же идентификатором переопределяет родительское, <code>extends</code> уточняет его. Резолвер отдаёт эффективный набор под тип задачи с провенансом.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Switcher label="Набор" values={sets} current={set} href={(value) => `/rules?set=${value}&task=${taskType}`} />
        <Switcher label="Тип задачи" values={TASK_TYPES} current={taskType} href={(value) => `/rules?set=${set}&task=${value}`} />
      </div>

      {!resolution && <p>Набора «{set}» в реестре нет.</p>}

      {resolution && (
        <>
          <div className="lab-panel flex flex-wrap items-baseline gap-x-10 gap-y-4">
            <div className="flex flex-col gap-1">
              <span className="lab-label">Цепочка</span>
              <span className="font-mono">{resolution.chain.join(' → ')}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="lab-label">Правил</span>
              <span className="font-mono">{resolution.rules.length}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="lab-label">Стоимость набора</span>
              <span className="font-mono" style={{ color: 'var(--jx-accent)' }}>
                ~{resolution.tokens.toLocaleString('ru-RU')} токенов
              </span>
            </div>
          </div>

          <section className="flex flex-col gap-4">
            {resolution.rules.map((rule) => (
              <article key={rule.qualifiedId} className="lab-panel flex flex-col gap-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <h2 className="text-lg font-bold">{rule.title}</h2>
                  <code className="lab-quiet text-sm">
                    {rule.qualifiedId}@{rule.version}
                  </code>
                </div>
                <p className="max-w-[80ch]">{rule.body}</p>
                <div className="lab-quiet flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <span>из {rule.definedIn}</span>
                  <span>приоритет {rule.priority}</span>
                  <span>~{rule.tokens} ток.</span>
                  {rule.overrides && <span style={{ color: 'var(--jx-warning)' }}>переопределяет {rule.overrides}</span>}
                  {rule.refines && <span style={{ color: 'var(--jx-accent)' }}>уточняет {rule.refines}</span>}
                  {rule.appliesTo.length > 0 && <span>{rule.appliesTo.join(', ')}</span>}
                  {rule.taskTypes.length > 0 && <span>задачи: {rule.taskTypes.join(', ')}</span>}
                </div>
              </article>
            ))}
          </section>

          {resolution.omitted.length > 0 && (
            <section className="flex flex-col gap-2">
              <span className="lab-label">Не поместились в бюджет</span>
              <ul className="lab-muted flex flex-col gap-1 text-sm">
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

      <section className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold">Куда это компилируется</h2>
        <p className="lab-muted max-w-[70ch] text-sm">Один источник, четыре цели. CI падает, если файлы разошлись с реестром.</p>
        <ul className="flex flex-col gap-1 text-sm">
          {TARGET_FILES.map(([target, files]) => (
            <li key={target} className="flex flex-wrap gap-x-2">
              <code style={{ color: 'var(--jx-accent)' }}>{target}</code>
              <span className="lab-muted">{files}</span>
            </li>
          ))}
        </ul>
        <pre className="code-block whitespace-pre-wrap">npm run rules:resolve -- {set} --task {taskType}</pre>
      </section>
    </main>
  );
}
