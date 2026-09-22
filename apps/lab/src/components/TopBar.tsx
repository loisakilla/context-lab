import Link from 'next/link';

type Page = 'lab' | 'compare' | 'rules';

const LINKS: { page: Page; href: string; label: string }[] = [
  { page: 'lab', href: '/', label: 'Лаборатория' },
  { page: 'compare', href: '/compare', label: 'Сравнение' },
  { page: 'rules', href: '/rules', label: 'Правила' },
];

export function TopBar({ current }: { current: Page }) {
  return (
    <header className="bar">
      <div className="wrap wrap--wide bar__inner">
        <Link href="/" className="jx-logo">
          <span className="jx-logo-name">
            Context <em>Lab</em>
          </span>
          <span className="jx-logo-stamp">jinx-ui</span>
        </Link>
        <nav className="nav" aria-label="Разделы">
          {LINKS.map((link) => (
            <Link key={link.page} href={link.href} {...(link.page === current ? { 'aria-current': 'page' as const } : {})}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
