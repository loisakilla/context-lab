import Link from 'next/link';
import { TopBar } from '@/components/TopBar';
import { Badge, Stat } from '@/components/ui';
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

function RuleBody({ text }: { text: string }) {
  const parts = text.split(/`([^`]+)`/g);
  return (
    <p className="max-w-[80ch]">
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <code key={index} className="mono rounded-[5px] px-1.5 py-0.5 text-[13.5px]" style={{ background: 'var(--jx-surface-2)' }}>
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </p>
  );
}

function Switcher({ label, values, current, href }: { label: string; values: string[]; current: string; href: (value: string) => string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="jx-label w-24 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <Link
            key={value}
            href={href(value)}
            className={value === current ? 'jx-btn jx-btn--sm jx-btn--primary' : 'jx-btn jx-btn--sm jx-btn--secondary'}
            {...(value === current ? { 'aria-current': 'page' as const } : {})}
          >
            {value}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function RulesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const set = first(params.set, 'jinx-ui');
  const taskType = first(params.task, 'ui');
  const { resolution, sets } = loadRuleResolution(set, taskType);

  return (
    <>
      <TopBar current="rules" />
      <main className="wrap flex flex-col gap-10 pt-10 pb-24">
        <header className="flex flex-col gap-4">
          <h1>Реестр правил</h1>
          <p className="lede">
            Правила лежат в репозитории как Markdown с frontmatter и собираются в наборы. Набор наследует правила родителей, правило с тем же идентификатором
            переопределяет родительское, <code className="mono text-[15px]">extends</code> уточняет его. Резолвер отдаёт эффективный набор под тип задачи с
            провенансом.
          </p>
        </header>

        <div className="jx-card flex flex-col gap-5">
          <Switcher label="Набор" values={sets} current={set} href={(value) => `/rules?set=${value}&task=${taskType}`} />
          <Switcher label="Тип задачи" values={TASK_TYPES} current={taskType} href={(value) => `/rules?set=${set}&task=${value}`} />
          {resolution && (
            <>
              <hr className="rule" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
                <Stat label="Цепочка наследования" value={resolution.chain.join(' → ')} />
                <Stat label="Правил в наборе" value={String(resolution.rules.length)} />
                <Stat label="Стоимость набора" value={`~${resolution.tokens.toLocaleString('ru-RU')} ток.`} tone="accent" />
              </div>
            </>
          )}
        </div>

        {!resolution && <p>Набора «{set}» в реестре нет.</p>}

        {resolution && (
          <>
            <section className="flex flex-col gap-4">
              {resolution.rules.map((rule) => (
                <article key={rule.qualifiedId} className="jx-card flex flex-col gap-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                    <h2>{rule.title}</h2>
                    <code className="dim mono text-[13px]">
                      {rule.qualifiedId}@{rule.version}
                    </code>
                  </div>
                  <RuleBody text={rule.body} />
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge>из {rule.definedIn}</Badge>
                    <Badge>приоритет {rule.priority}</Badge>
                    <Badge>~{rule.tokens} ток.</Badge>
                    {rule.overrides && <Badge tone="warn">переопределяет {rule.overrides}</Badge>}
                    {rule.refines && <Badge tone="accent">уточняет {rule.refines}</Badge>}
                    {rule.appliesTo.length > 0 && <Badge>{rule.appliesTo.join(', ')}</Badge>}
                    {rule.taskTypes.length > 0 && <Badge>задачи: {rule.taskTypes.join(', ')}</Badge>}
                  </div>
                </article>
              ))}
            </section>

            {resolution.omitted.length > 0 && (
              <section className="flex flex-col gap-3">
                <span className="jx-label">Не поместились в бюджет</span>
                <ul className="muted flex flex-col gap-1 text-sm">
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

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2>Куда это компилируется</h2>
            <p className="muted max-w-[72ch] text-sm">Один источник, четыре цели. CI падает, если файлы разошлись с реестром.</p>
          </div>
          <ul className="jx-card flex flex-col gap-3">
            {TARGET_FILES.map(([target, files]) => (
              <li key={target} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <code className="mono text-[13px]" style={{ color: 'var(--jx-accent)' }}>
                  {target}
                </code>
                <span className="muted">{files}</span>
              </li>
            ))}
          </ul>
          <pre className="code">
            npm run rules:resolve -- {set} --task {taskType}
          </pre>
        </section>
      </main>
    </>
  );
}
