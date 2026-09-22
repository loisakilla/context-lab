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
        <Link href="/" className="mark">
          <span className="mark__glyph" aria-hidden="true">
            cl
          </span>
          Context&nbsp;Lab
        </Link>
        <nav className="nav" aria-label="Разделы">
          {LINKS.map((link) => (
            <Link key={link.page} href={link.href} className="nav__link" {...(link.page === current ? { 'aria-current': 'page' as const } : {})}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
