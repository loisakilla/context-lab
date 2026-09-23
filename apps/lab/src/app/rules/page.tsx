import Link from 'next/link';
import type { ResolvedRule } from '@context-lab/rules';
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
          <code key={index} className="mono rounded-[3px] px-1.5 py-0.5 text-[13px]" style={{ background: 'var(--jx-surface-2)' }}>
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </p>
  );
}

function RuleCard({ rule }: { rule: ResolvedRule }) {
  return (
    <article className="jx-card flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className="text-[16px] font-bold uppercase">{rule.title}</h3>
        <code className="dim mono">
          {rule.qualifiedId}@{rule.version}
        </code>
      </div>
      <RuleBody text={rule.body} />
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Badge>Из {rule.definedIn}</Badge>
        <Badge>Приоритет {rule.priority}</Badge>
        <Badge>~{rule.tokens} ток.</Badge>
        {rule.taskTypes.length > 0 && <Badge tone="accent">Задачи: {rule.taskTypes.join(', ')}</Badge>}
        {rule.overrides && <Badge tone="warn">Переопределяет {rule.overrides}</Badge>}
        {rule.refines && <Badge tone="accent">Уточняет {rule.refines}</Badge>}
        {rule.appliesTo.length > 0 && <Badge>{rule.appliesTo.join(', ')}</Badge>}
      </div>
    </article>
  );
}

function RuleGroup({ title, hint, empty, rules }: { title: string; hint: string; empty: string; rules: ResolvedRule[] }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <h2>{title}</h2>
          <span className="dim mono">{rules.length}</span>
        </div>
        <p className="muted max-w-[72ch] text-sm">{hint}</p>
      </div>
      {rules.length === 0 ? <p className="muted text-sm">{empty}</p> : rules.map((rule) => <RuleCard key={rule.qualifiedId} rule={rule} />)}
    </section>
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
  const scoped = resolution?.rules.filter((rule) => rule.taskTypes.length > 0) ?? [];
  const always = resolution?.rules.filter((rule) => rule.taskTypes.length === 0) ?? [];

  return (
    <>
      <TopBar current="rules" />
      <main className="wrap flex flex-col gap-10 pt-10 pb-24">
        <header className="flex flex-col gap-4">
          <h1>Реестр правил</h1>
          <p className="lede">
            Правила лежат в репозитории как Markdown с frontmatter и собираются в наборы. Набор наследует правила родителей, правило с тем же идентификатором
            переопределяет родительское, <code className="mono">extends</code> уточняет его. Резолвер отдаёт эффективный набор под конкретный тип задачи: на
            вкладке меняется не оформление, а сам состав правил.
          </p>
        </header>

        <div className="jx-card flex flex-col gap-5">
          <Switcher label="Набор" values={sets} current={set} href={(value) => `/rules?set=${value}&task=${taskType}`} />
          <Switcher label="Тип задачи" values={TASK_TYPES} current={taskType} href={(value) => `/rules?set=${set}&task=${value}`} />
          {resolution && (
            <>
              <hr className="rule" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
                <Stat label="Цепочка наследования" value={resolution.chain.join(' → ')} />
                <Stat label="Правил в наборе" value={String(resolution.rules.length)} />
                <Stat label={`Из них под «${taskType}»`} value={String(scoped.length)} />
                <Stat label="Стоимость набора" value={`~${resolution.tokens.toLocaleString('ru-RU')} ток.`} />
              </div>
            </>
          )}
        </div>

        {!resolution && <p>Набора «{set}» в реестре нет.</p>}

        {resolution && (
          <>
            <RuleGroup
              title={`Только для «${taskType}»`}
              hint="У этих правил заполнен task_types: на других вкладках резолвер их не отдаёт."
              empty="Правил, привязанных к этому типу задач, в наборе нет."
              rules={scoped}
            />
            <RuleGroup
              title="Действуют всегда"
              hint="Правила без привязки к типу задачи входят в набор на любой вкладке."
              empty="Таких правил в наборе нет."
              rules={always}
            />

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
            <p className="muted max-w-[72ch] text-sm">
              Один источник, четыре цели. CI падает, если файлы разошлись с реестром или если от удалённого правила остался файл.
            </p>
          </div>
          <ul className="jx-card flex flex-col gap-3">
            {TARGET_FILES.map(([target, files]) => (
              <li key={target} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <code className="mono" style={{ color: 'var(--jx-accent)' }}>
                  {target}
                </code>
                <span className="muted">{files}</span>
              </li>
            ))}
          </ul>
          <pre className="codebox">
            npm run rules:resolve -- {set} --task {taskType}
          </pre>
        </section>
      </main>
    </>
  );
}
