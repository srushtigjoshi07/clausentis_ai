'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { cx } from '../ui';

export interface TenderRow {
  id: string;
  reference: string;
  title: string;
  organisation: string;
  location: string;
  category: string;
  valueLabel: string;
  valueCr: number | null;
  closeLabel: string;
  closeRelative: string;
  bids: number;
  stage: 'Evaluating' | 'Accepting bids' | 'Decided' | 'Closed';
}

const STAGE_PILL: Record<TenderRow['stage'], string> = {
  Evaluating: 'pill-ink',
  'Accepting bids': 'pill-neutral',
  Decided: 'pill-pass',
  Closed: 'pill-neutral',
};

export function TendersTable({ rows }: { rows: TenderRow[] }) {
  const [q, setQ] = useState('');
  const [stage, setStage] = useState('all');
  const [cat, setCat] = useState('all');
  const categories = useMemo(() => Array.from(new Set(rows.map((r) => r.category).filter(Boolean))).sort(), [rows]);
  const maxCr = Math.max(0, ...rows.map((r) => r.valueCr ?? 0));

  const filtered = rows.filter((r) => {
    const text = `${r.reference} ${r.title} ${r.organisation}`.toLowerCase();
    return (!q || text.includes(q.toLowerCase())) && (stage === 'all' || r.stage === stage) && (cat === 'all' || r.category === cat);
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        <label htmlFor="tsearch" className="sr-only-v2">Search tenders</label>
        <input id="tsearch" className="input w-full sm:w-[380px]" placeholder="Search by reference, title or organisation" value={q} onChange={(e) => setQ(e.target.value)} />
        <label htmlFor="tstatus" className="sr-only-v2">Stage</label>
        <select id="tstatus" className="input w-full sm:w-[170px]" value={stage} onChange={(e) => setStage(e.target.value)}>
          <option value="all">All stages</option>
          <option value="Accepting bids">Accepting bids</option>
          <option value="Evaluating">Evaluating</option>
          <option value="Decided">Decided</option>
          <option value="Closed">Closed</option>
        </select>
        <label htmlFor="tcat" className="sr-only-v2">Category</label>
        <select id="tcat" className="input w-full sm:w-[170px]" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-fg-3" aria-live="polite">
          {filtered.length} tender{filtered.length === 1 ? '' : 's'}
        </span>
      </div>

      <section aria-label="Tender list" className="card overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse">
          <thead>
            <tr className="border-b border-line bg-page text-left">
              <th scope="col" className="th px-5 py-3">Tender</th>
              <th scope="col" className="th px-3 py-3">Category</th>
              <th scope="col" className="th px-3 py-3">Estimated value</th>
              <th scope="col" className="th px-3 py-3">Closes</th>
              <th scope="col" className="th px-3 py-3">Bids</th>
              <th scope="col" className="th px-5 py-3">Stage</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="tr">
                <td className="px-5 py-4">
                  <Link href={`/authority/tenders/${t.id}`} className="flex min-w-0 flex-col gap-1 text-fg no-underline hover:text-brand">
                    <span className="mono text-[11px] text-fg-3">{t.reference}</span>
                    <span className="text-sm font-semibold leading-snug">{t.title}</span>
                    <span className="text-xs text-fg-2">{[t.organisation, t.location].filter(Boolean).join(' · ')}</span>
                  </Link>
                </td>
                <td className="px-3 py-4 text-[13px] text-fg-2">{t.category || '—'}</td>
                <td className="px-3 py-4">
                  {t.valueCr !== null && maxCr > 0 ? (
                    <span className="flex items-center gap-2.5">
                      <span className="relative block h-2.5 w-[120px] rounded-r bg-track">
                        <span className="mark absolute left-0 top-0 block h-2.5 rounded-r bg-mark" title={t.valueLabel} style={{ width: `${(t.valueCr / maxCr) * 100}%` }} />
                      </span>
                      <span className="mono text-xs">{t.valueLabel}</span>
                    </span>
                  ) : (
                    <span className="mono text-xs text-fg-3">{t.valueLabel || 'Not stated'}</span>
                  )}
                </td>
                <td className="px-3 py-4">
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[13px]">{t.closeLabel}</span>
                    <span className="mono text-[11px] uppercase text-fg-3">{t.closeRelative}</span>
                  </span>
                </td>
                <td className="mono px-3 py-4 text-sm font-semibold">{t.bids}</td>
                <td className="px-5 py-4">
                  <span className={cx('pill', STAGE_PILL[t.stage])}>{t.stage}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-sm text-fg-2">No tenders match these filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
      {maxCr > 0 ? <p className="m-0 text-xs text-fg-3">Estimated values share one scale; the longest bar is ₹{maxCr.toFixed(2)} Cr.</p> : null}
    </>
  );
}
