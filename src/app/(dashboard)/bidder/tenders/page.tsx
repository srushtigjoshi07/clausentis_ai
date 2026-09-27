import Link from 'next/link';
import { getSavedBidderProfileAction, searchActiveTendersAction } from '@/lib/actions/tender-discovery';
import { eligibilityFor, listMySubmissions } from '@/lib/views/bidder';
import { EmptyState, Legend, PageBody, PageHeader } from '@/components/v2/ui';
import { formatDate, toCrore } from '@/components/v2/status';

export const metadata = { title: 'Find tenders · Clausentis bidder portal' };
export const dynamic = 'force-dynamic';

const T_MAX = 30;
const E_MAX = 10;

function MiniBullet({ you, need, max, unit, label }: { you: number | null; need: number; max: number; unit: string; label: string }) {
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  const aria = `${label} required ${need} ${unit}${you !== null ? `, yours ${you} ${unit}` : ', yours not declared'}`;
  return (
    <span className="flex flex-col gap-1">
      <span className="relative block h-4 w-full max-w-[180px]" role="img" aria-label={aria} title={aria}>
        <span className="absolute left-0 top-1 block h-2 w-full bg-track" />
        {you !== null ? <span className="absolute left-0 top-1 block h-2 bg-mark" style={{ width: pct(you) }} /> : null}
        <span className="absolute top-0 block h-4 w-0.5 bg-fail" style={{ left: pct(need) }} />
      </span>
      <span className="mono text-[11px] text-fg-2">
        {unit === 'Cr' ? `₹${need} Cr` : `${need} yrs`} vs {you === null ? 'not declared' : unit === 'Cr' ? `₹${you} Cr` : `${you} yrs`}
      </span>
    </span>
  );
}

export default async function FindTendersPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; eligible?: string }> }) {
  const sp = await searchParams;
  const [profile, result, subs] = await Promise.all([
    getSavedBidderProfileAction(),
    searchActiveTendersAction({ keyword: sp.q || undefined, category: sp.category || undefined }),
    listMySubmissions(),
  ]);
  const submitted = new Set(subs.map((s) => s.record.tenderId));
  const rows = result.tenders
    .map((t) => ({ t, e: eligibilityFor(t, profile) }))
    .filter((r) => sp.eligible !== '1' || r.e.status === 'qualify');
  const hasFigures = profile?.annualTurnoverInCr !== undefined || profile?.relevantExperienceYears !== undefined;

  return (
    <PageBody className="max-w-none">
      <PageHeader eyebrow="Find tenders" title="Open tenders, matched to your company" />

      <form method="get" className="flex flex-wrap items-center gap-2.5" aria-label="Search tenders">
        <label htmlFor="f-q" className="sr-only-v2">Search</label>
        <input id="f-q" name="q" defaultValue={sp.q ?? ''} className="input w-full sm:w-[420px]" placeholder="Search by keyword, title or specification" />
        <label htmlFor="f-cat" className="sr-only-v2">Category</label>
        <select id="f-cat" name="category" defaultValue={sp.category ?? ''} className="input w-full sm:w-[170px]">
          <option value="">All categories</option>
          {['Goods', 'Services', 'Works', 'Consultancy', 'Turnkey / EPC', 'Maintenance'].map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <label className="ml-1 inline-flex min-h-10 items-center gap-2 text-[13px]">
          <input type="checkbox" name="eligible" value="1" defaultChecked={sp.eligible === '1'} className="h-4 w-4" disabled={!hasFigures} />
          Only tenders I qualify for
        </label>
        <button type="submit" className="btn btn-secondary">Search</button>
        <span className="ml-auto text-xs text-fg-3">
          {rows.length} open · source: {result.sourceUsed}
        </span>
      </form>

      {!hasFigures ? (
        <p className="m-0 text-[13px] text-fg-2">
          Your declared turnover and experience aren&apos;t on your profile yet, so the comparison below shows only the tender minimums.{' '}
          <Link href="/bidder/settings" className="link">Add them</Link>.
        </p>
      ) : null}

      <section aria-label="Tenders" className="card overflow-x-auto">
        {rows.length ? (
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="border-b border-line bg-page text-left">
                <th scope="col" className="th px-5 py-3">Tender</th>
                <th scope="col" className="th px-3 py-3">Closes</th>
                <th scope="col" className="th px-3 py-3">Turnover: need vs you</th>
                <th scope="col" className="th px-3 py-3">Experience: need vs you</th>
                <th scope="col" className="th px-5 py-3">Match</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ t, e }) => {
                const isSubmitted = submitted.has(t.tenderId);
                const pill = isSubmitted
                  ? { cls: 'pill-ink', label: 'Bid submitted' }
                  : e.status === 'qualify'
                    ? { cls: 'pill-pass', label: 'You qualify' }
                    : e.status === 'short'
                      ? { cls: 'pill-fail', label: 'Not eligible' }
                      : { cls: 'pill-neutral', label: 'Check profile' };
                const cr = toCrore(t.estimatedValue);
                return (
                  <tr key={t.id} className="tr">
                    <td className="px-5 py-4">
                      <Link href={`/bidder/tenders/${t.id}`} className="flex min-w-0 flex-col gap-1 text-fg no-underline hover:text-brand">
                        <span className="mono text-[11px] text-fg-3">{t.referenceNumber}</span>
                        <span className="text-sm font-semibold leading-snug">{t.title}</span>
                        <span className="text-xs text-fg-2">
                          {t.issuingOrganisation} · {t.category} · {cr !== null ? `₹${cr.toFixed(2)} Cr` : t.estimatedValue}
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-4 text-[13px]">{formatDate(t.closingDate)}</td>
                    <td className="px-3 py-4">
                      <MiniBullet label="Turnover" you={e.turnover.you} need={e.turnover.need} max={T_MAX} unit="Cr" />
                    </td>
                    <td className="px-3 py-4">
                      <MiniBullet label="Experience" you={e.experience.you} need={e.experience.need} max={E_MAX} unit="yrs" />
                    </td>
                    <td className="px-5 py-4">
                      <span className={`pill ${pill.cls}`}>{pill.label}</span>
                      {e.shortBy.length && !isSubmitted ? <span className="mt-1 block text-[11px] text-fg-3">{e.shortBy.join(', ')}</span> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-5">
            <EmptyState title="No tenders match">Try a different keyword or category.</EmptyState>
          </div>
        )}
      </section>
      <div className="flex flex-wrap items-center gap-4 text-xs text-fg-2">
        <Legend items={[{ label: 'You (from your profile)', swatch: 'ink' }, { label: 'Tender minimum', swatch: 'line-red' }]} />
        <span>Turnover scale ₹0–{T_MAX} Cr · experience scale 0–{E_MAX} years. Your documents are checked later, when you prepare the bid.</span>
      </div>
    </PageBody>
  );
}
