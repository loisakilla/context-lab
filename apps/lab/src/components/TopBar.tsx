import Link from 'next/link';

type Page = 'lab' | 'compare' | 'rules';

const LINKS: { page: Page; href: string; label: string }[] = [
  { page: 'lab', href: '/', label: 'лаборатория' },
  { page: 'compare', href: '/compare', label: 'сравнение режимов' },
  { page: 'rules', href: '/rules', label: 'реестр правил' },
];

export function TopBar({ current, home = false }: { current: Page; home?: boolean }) {
  const wordmark = (
    <Link href="/" className="lab-wordmark text-2xl font-bold no-underline">
      Context Lab
    </Link>
  );

  return (
    <header className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-b pb-5" style={{ borderColor: 'var(--lab-line)' }}>
      {home ? <h1 className="text-2xl font-bold">{wordmark}</h1> : wordmark}
      <nav className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
        {LINKS.map((link) =>
          link.page === current ? (
            <span key={link.page} className="lab-quiet" aria-current="page">
              {link.label}
            </span>
          ) : (
            <Link key={link.page} href={link.href} className="underline">
              {link.label}
            </Link>
          ),
        )}
      </nav>
    </header>
  );
}
