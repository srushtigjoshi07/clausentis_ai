'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { BrandMark, cx } from './ui';

const ITEMS = [
  { id: 'home', label: 'Home', href: '/bidder/dashboard', match: (p: string) => p === '/bidder/dashboard' || p === '/bidder' },
  { id: 'tenders', label: 'Find tenders', href: '/bidder/tenders', match: (p: string) => p.startsWith('/bidder/tenders') && !p.endsWith('/prepare') },
  { id: 'bids', label: 'My bids', href: '/bidder/bids', match: (p: string) => p.startsWith('/bidder/bids') || p.endsWith('/prepare') },
  { id: 'vault', label: 'Document vault', href: '/bidder/documents', match: (p: string) => p.startsWith('/bidder/documents') },
  { id: 'assistant', label: 'Assistant', href: '/bidder/assistant', match: (p: string) => p.startsWith('/bidder/assistant') },
];

export function BidderTopbar({ companyName, identifier }: { companyName: string; identifier?: string }) {
  const pathname = usePathname() || '';
  const [open, setOpen] = useState(false);
  const initials =
    companyName
      .split(/\s+/)
      .filter((w) => /^[A-Za-z]/.test(w))
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || 'B';

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:gap-10 lg:px-10">
        <Link href="/bidder/dashboard" className="flex items-center gap-2.5 text-fg no-underline">
          <BrandMark />
          <span className="font-display text-[15px] font-bold tracking-[.06em]">CLAUSENTIS</span>
          <span className="pill pill-neutral hidden sm:inline-flex">Bidder</span>
        </Link>
        <nav aria-label="Bidder portal" className="hidden h-16 items-stretch gap-7 lg:flex">
          {ITEMS.map((it) => {
            const active = it.match(pathname);
            return (
              <Link key={it.id} href={it.href} className={cx('tab h-16', active && 'tab-on')} aria-current={active ? 'page' : undefined}>
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/bidder/settings"
            className="flex items-center gap-2.5 rounded-lg text-fg no-underline hover:text-brand"
            aria-current={pathname.startsWith('/bidder/settings') ? 'page' : undefined}
            title="Company profile"
          >
            <span className="hidden flex-col items-end sm:flex">
              <span className="max-w-[240px] truncate text-xs font-semibold">{companyName}</span>
              {identifier ? <span className="mono text-[11px] text-fg-3">{identifier}</span> : null}
            </span>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-[#F1F5F9] text-[11px] font-bold">{initials}</span>
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line-2 lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="bidder-mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>
      {open ? (
        <nav id="bidder-mobile-nav" aria-label="Bidder portal" className="border-t border-line bg-white px-4 py-2 lg:hidden">
          <ul className="m-0 flex list-none flex-col p-0">
            {ITEMS.map((it) => {
              const active = it.match(pathname);
              return (
                <li key={it.id}>
                  <Link
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className={cx('flex min-h-11 items-center rounded-lg px-3 text-[15px]', active ? 'bg-[#EFF6FF] font-semibold text-brand' : 'text-fg-4')}
                    aria-current={active ? 'page' : undefined}
                  >
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
