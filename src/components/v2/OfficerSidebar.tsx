'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { BrandMark, cx } from './ui';

export interface OfficerIdentity {
  name: string;
  organisation: string;
}

interface NavLink {
  id: string;
  label: string;
  href: string;
  match: (p: string) => boolean;
  count?: number;
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter((w) => /^[A-Za-z]/.test(w))
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || 'PO'
  );
}

function SidebarContent({
  identity,
  counts,
  onNavigate,
}: {
  identity: OfficerIdentity;
  counts: { tenders: number; awaiting: number };
  onNavigate?: () => void;
}) {
  const pathname = usePathname() || '';
  const main: NavLink[] = [
    { id: 'overview', label: 'Overview', href: '/authority/dashboard', match: (p) => p === '/authority/dashboard' || p === '/authority' },
    { id: 'tenders', label: 'Tenders', href: '/authority/tenders', match: (p) => p.startsWith('/authority/tenders'), count: counts.tenders },
    { id: 'reviews', label: 'Bid reviews', href: '/authority/bids', match: (p) => p.startsWith('/authority/bids'), count: counts.awaiting },
    { id: 'verification', label: 'Portal verification', href: '/authority/government-verification', match: (p) => p.startsWith('/authority/government-verification') },
    { id: 'assistant', label: 'Assistant', href: '/authority/assistant', match: (p) => p.startsWith('/authority/assistant') },
  ];
  const records: NavLink[] = [
    { id: 'audit', label: 'Audit trail', href: '/authority/audit', match: (p) => p.startsWith('/authority/audit') },
    { id: 'reports', label: 'Reports', href: '/authority/reports', match: (p) => p.startsWith('/authority/reports') },
  ];
  const footer: NavLink[] = [
    { id: 'integrations', label: 'Data sources', href: '/authority/integrations', match: (p) => p.startsWith('/authority/integrations') },
    { id: 'settings', label: 'Settings', href: '/authority/settings', match: (p) => p.startsWith('/authority/settings') },
  ];

  const item = (it: NavLink) => {
    const active = it.match(pathname);
    return (
      <li key={it.id}>
        <Link href={it.href} className={cx('nav-item', active && 'nav-on')} aria-current={active ? 'page' : undefined} onClick={onNavigate}>
          <span className="flex-grow">{it.label}</span>
          {it.count ? (
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-[10px] bg-review px-1.5 text-[11px] font-bold text-fg"
              aria-label={`${it.count} ${it.id === 'reviews' ? 'awaiting decision' : 'open'}`}
            >
              {it.count}
            </span>
          ) : null}
        </Link>
      </li>
    );
  };

  return (
    <div className="flex h-full flex-col gap-6 px-3.5 py-5 text-white">
      <Link href="/authority/dashboard" className="flex items-center gap-2.5 px-1.5 py-1 text-white no-underline" onClick={onNavigate}>
        <BrandMark />
        <span className="flex flex-col">
          <span className="font-display text-[15px] font-bold tracking-[.06em] text-white">CLAUSENTIS</span>
          <span className="eyebrow" style={{ fontSize: 9, letterSpacing: '.14em', color: '#93C5FD' }}>Tender Authority</span>
        </span>
      </Link>
      <nav aria-label="Officer portal" className="flex flex-1 flex-col gap-6">
        <div className="flex flex-col gap-0.5">
          <span className="eyebrow px-3 pb-1.5" style={{ fontSize: 10, color: '#94A3B8' }}>Evaluate</span>
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">{main.map(item)}</ul>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="eyebrow px-3 pb-1.5" style={{ fontSize: 10, color: '#94A3B8' }}>Records</span>
          <ul className="m-0 flex list-none flex-col gap-0.5 p-0">{records.map(item)}</ul>
        </div>
        <ul className="m-0 mt-auto flex list-none flex-col gap-0.5 p-0">{footer.map(item)}</ul>
      </nav>
      <div className="flex items-center gap-2.5 border-t border-[#1E293B] px-2.5 pt-3">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] font-bold">{initials(identity.name)}</span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] font-semibold">{identity.name}</span>
          <span className="truncate text-xs text-[#94A3B8]">{identity.organisation}</span>
        </span>
      </div>
    </div>
  );
}

export function OfficerShell({
  identity,
  counts,
  children,
}: {
  identity: OfficerIdentity;
  counts: { tenders: number; awaiting: number };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="flex min-h-screen w-full bg-page">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto bg-navy md:block">
        <SidebarContent identity={identity} counts={counts} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Officer navigation">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-[rgba(15,23,42,.55)]" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-64 overflow-y-auto bg-navy">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-2 top-3 inline-flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <SidebarContent identity={identity} counts={counts} onNavigate={() => setOpen(false)} key={pathname} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-white px-4 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line-2"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <BrandMark size={24} />
          <span className="font-display text-sm font-bold tracking-[.06em]">CLAUSENTIS</span>
        </div>
        <main id="main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
