import Link from 'next/link';

type Page = 'lab' | 'compare' | 'rules';

const LINKS: { page: Page; href: string; label: string }[] = [
  { page: 'lab', href: '/', label: 'Лаборатория' },
  { page: 'compare', href: '/compare', label: 'Сравнение' },
  { page: 'rules', href: '/rules', label: 'Правила' },
];

export function TopBar({ current }: { current: Page }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-b pb-4" style={{ borderColor: 'var(--line)' }}>
      <Link href="/" className="flex items-baseline gap-2">
        <span className="text-[15px] font-semibold">Context Lab</span>
        <span className="quiet mono text-xs">jinx-ui</span>
      </Link>
      <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        {LINKS.map((link) =>
          link.page === current ? (
            <span key={link.page} aria-current="page">
              {link.label}
            </span>
          ) : (
            <Link key={link.page} href={link.href} className="link">
              {link.label}
            </Link>
          ),
        )}
      </nav>
    </header>
  );
}
