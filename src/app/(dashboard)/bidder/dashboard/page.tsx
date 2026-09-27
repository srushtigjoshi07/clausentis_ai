import Link from 'next/link';
import { getSavedBidderProfileAction, searchActiveTendersAction } from '@/lib/actions/tender-discovery';
import { getBidderDocuments } from '@/lib/actions/documents';
import { eligibilityFor, listMySubmissions } from '@/lib/views/bidder';
import { EmptyState, KpiTile, Legend, PageBody, RawPill, SummaryBand } from '@/components/v2/ui';
import { decisionLabel, decisionPill, daysUntil, formatDate, relativeDays } from '@/components/v2/status';

export const metadata = { title: 'Home · Clausentis bidder portal' };
export const dynamic = 'force-dynamic';

export default async function BidderHomePage() {
  const now = new Date();
  const [profile, subs, search, docs] = await Promise.all([
    getSavedBidderProfileAction(),
    listMySubmissions(),
    searchActiveTendersAction({}),
    getBidderDocuments(),
  ]);
  const tenders = [...search.tenders].sort((a, b) => (daysUntil(a.closingDate, now) ?? 0) - (daysUntil(b.closingDate, now) ?? 0));
  const elig = tenders.map((t) => ({ t, e: eligibilityFor(t, profile) }));
  const qualifyCount = elig.filter((x) => x.e.status === 'qualify').length;
  const decided = subs.filter((s) => s.decision);
  const latest = subs[0];
  const submittedTenderIds = new Set(subs.map((s) => s.record.tenderId));
  const nextQualifying = elig.find((x) => x.e.status === 'qualify' && !submittedTenderIds.has(x.t.tenderId));
  const you = profile?.annualTurnoverInCr ?? null;

  const title = latest?.decision
    ? `Your ${latest.record.tenderReference.split('/')[0]} bid: ${decisionLabel(latest.decision.code).toLowerCase()}`
    : latest
      ? `Your ${latest.record.tenderReference.split('/')[0]} bid is with the procurement officer`
      : 'Find a tender and check your bid before you submit';
  const sub = nextQualifying
    ? `You meet the declared minimums for ${nextQualifying.t.referenceNumber}, closing ${formatDate(nextQualifying.t.closingDate, { day: 'numeric', month: 'short' })}.`
    : !profile || you === null
      ? 'Add your declared turnover and experience to your company profile to see which tenders you qualify for.'
      : `${tenders.length} open tender${tenders.length === 1 ? '' : 's'} on the catalogue.`;

  const maxNeed = Math.max(you ?? 0, ...tenders.map((t) => t.minimumTurnoverRequired), 1) * 1.1;
  const steps = latest
    ? [
        { t: 'Submitted and sealed', d: `${formatDate(latest.record.submittedAt)} · SHA-256 recorded`, done: true },
        { t: 'Verified by Clausentis', d: `Readiness ${latest.record.complianceScore}/100 · check v${latest.record.verificationVersion}`, done: true },
        {
          t: latest.decision ? `${decisionLabel(latest.decision.code)} by the procurement officer` : 'Officer decision pending',
          d: latest.decision ? `Signed ${formatDate(latest.decision.signedAt)}` : 'You will see the decision here once it is signed',
          done: Boolean(latest.decision),
        },
      ]
    : [];

  return (
    <PageBody className="max-w-none">
      <SummaryBand
        eyebrow={`Home · ${formatDate(now.toISOString())}`}
        title={title}
        sub={sub}
        actions={
          <>
            {latest ? (
              <Link href={`/bidder/bids/${encodeURIComponent(latest.record.submissionId)}/receipt`} className="btn btn-ghostblue">
                {latest.decision ? 'View decision' : 'View receipt'}
              </Link>
            ) : null}
            <Link href="/bidder/tenders" className="btn btn-onblue">Find tenders</Link>
          </>
        }
      />

      <section aria-label="Key figures" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile label="Bids submitted" value={subs.length} icon="send" tone="blue" note={latest ? latest.record.tenderReference : 'None yet'} />
        <KpiTile
          label="Decisions received"
          value={decided.length}
          icon="check"
          tone="green"
          badge={decided[0]?.decision ? <RawPill cls={decisionPill(decided[0].decision.code)}>{decisionLabel(decided[0].decision.code)}</RawPill> : undefined}
          note={decided[0]?.decision ? `Signed ${formatDate(decided[0].decision.signedAt)}` : 'None yet'}
        />
        <KpiTile
          label="Open tenders you qualify for"
          value={profile && you !== null ? qualifyCount : '—'}
          unit={profile && you !== null ? `of ${tenders.length}` : undefined}
          icon="search"
          tone="violet"
          note={profile && you !== null ? 'Based on your declared figures' : 'Add declared figures to your profile'}
        />
        <KpiTile label="Documents in vault" value={docs.length} icon="folder" tone="amber" note={docs.length ? 'Reusable across bids' : 'Upload once, reuse in every bid'} />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section aria-label="Turnover eligibility" className="card flex flex-col gap-3.5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="h2">Minimum turnover by open tender</h2>
              <span className="text-xs text-fg-3">
                {you !== null ? `The line is your declared turnover, ₹${you.toFixed(2)} Cr` : 'Declare your turnover in your profile to compare'}
              </span>
            </div>
            <Legend
              items={
                you !== null
                  ? [
                      { label: 'Within reach', swatch: 'ink' },
                      { label: 'Above yours', swatch: 'track' },
                      { label: 'Your turnover', swatch: 'line' },
                    ]
                  : [{ label: 'Tender minimum', swatch: 'ink' }]
              }
            />
          </div>
          {tenders.length ? (
            <div className="relative" role="img" aria-label={`Minimum turnover: ${tenders.map((t) => `${t.referenceNumber.split('/')[0]} ₹${t.minimumTurnoverRequired} Cr`).join(', ')}${you !== null ? `; your turnover ₹${you} Cr` : ''}`}>
              <ul className="m-0 flex list-none flex-col gap-4 p-0">
                {tenders.map((t) => {
                  const within = you === null || t.minimumTurnoverRequired <= you;
                  return (
                    <li key={t.id} className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3" title={`${t.referenceNumber} requires ₹${t.minimumTurnoverRequired} Cr${you !== null ? `; you declared ₹${you} Cr` : ''}`}>
                      <span className="flex flex-col">
                        <span className="text-[13px] font-semibold">{t.referenceNumber.split('/')[0]}</span>
                        <span className="mono text-[10px] uppercase text-fg-3">{t.category}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="block h-[18px]" style={{ width: `${(t.minimumTurnoverRequired / maxNeed) * 100}%`, background: within ? '#2563EB' : '#E2E8F0' }} />
                        <span className="mono shrink-0 text-[11px] font-semibold">₹{t.minimumTurnoverRequired} Cr</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              {you !== null ? (
                <span className="pointer-events-none absolute inset-y-0 left-[calc(96px+0.75rem)] right-0" aria-hidden="true">
                  <span className="absolute -bottom-5 top-0 w-0.5 bg-fg" style={{ left: `${(you / maxNeed) * 100}%` }} />
                </span>
              ) : null}
              {you !== null ? <span className="mono mt-6 block text-right text-[10px] font-bold text-brand">YOU ₹{you.toFixed(2)} CR</span> : null}
            </div>
          ) : (
            <EmptyState title="No open tenders" />
          )}
          {!profile || you === null ? <Link href="/bidder/settings" className="link text-xs">Add declared turnover →</Link> : null}
        </section>

        <section aria-label="Bid progress" className="card flex flex-col gap-3.5 p-5">
          {latest ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col gap-1">
                  <h2 className="h2 truncate">{latest.record.tenderTitle}</h2>
                  <span className="mono text-[11px] text-fg-3">{latest.record.submissionId}</span>
                </div>
                <RawPill cls={decisionPill(latest.decision?.code)}>{latest.decision ? decisionLabel(latest.decision.code) : 'Under review'}</RawPill>
              </div>
              <ol className="m-0 flex list-none flex-col p-0">
                {steps.map((s, i) => (
                  <li key={s.t} className="grid grid-cols-[20px_minmax(0,1fr)] gap-3 pb-3.5">
                    <span className="flex flex-col items-center gap-1">
                      <span className="mt-1 block h-2.5 w-2.5 rounded-full" style={{ background: s.done ? '#2563EB' : '#FFFFFF', border: s.done ? undefined : '2px solid #94A3B8' }} aria-hidden="true" />
                      {i < steps.length - 1 ? <span className="block w-px flex-grow bg-line" /> : null}
                    </span>
                    <span className="flex flex-col gap-0.5">
                      <span className="text-[13px] font-semibold">{s.t}<span className="sr-only-v2">{s.done ? ' (done)' : ' (pending)'}</span></span>
                      <span className="text-xs text-fg-2">{s.d}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <Link href={`/bidder/bids/${encodeURIComponent(latest.record.submissionId)}/receipt`} className="link mt-auto text-xs">View receipt and decision →</Link>
            </>
          ) : (
            <EmptyState title="No bids yet" action={<Link href="/bidder/tenders" className="btn btn-primary btn-sm">Find a tender</Link>}>
              Pick a tender, upload your documents and run the same check the officer will run.
            </EmptyState>
          )}
        </section>
      </div>

      <section aria-label="Closing soon" className="card overflow-hidden">
        <div className="flex justify-between px-5 pb-2 pt-4">
          <h2 className="h2">Closing soon</h2>
          <Link href="/bidder/tenders" className="link text-xs">All tenders →</Link>
        </div>
        {elig.length ? (
          <ul className="m-0 list-none p-0">
            {elig.slice(0, 4).map(({ t, e }) => {
              const submitted = submittedTenderIds.has(t.tenderId);
              const pill = submitted
                ? { cls: 'pill-ink', label: 'Bid submitted' }
                : e.status === 'qualify'
                  ? { cls: 'pill-pass', label: 'You qualify' }
                  : e.status === 'short'
                    ? { cls: 'pill-fail', label: e.turnover.ok === false ? 'Turnover short' : 'Experience short' }
                    : { cls: 'pill-neutral', label: 'Add profile figures' };
              return (
                <li key={t.id} className="tr">
                  <Link href={`/bidder/tenders/${t.id}`} className="grid grid-cols-1 items-center gap-2 px-5 py-3 text-[13px] text-fg no-underline sm:grid-cols-[minmax(0,2.4fr)_150px_160px_90px] sm:gap-3">
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-semibold">{t.title}</span>
                      <span className="mono text-[11px] text-fg-3">{t.referenceNumber}</span>
                    </span>
                    <span>
                      {formatDate(t.closingDate)} <span className="text-xs text-fg-3">({relativeDays(daysUntil(t.closingDate, now))})</span>
                    </span>
                    <span><span className={`pill ${pill.cls}`}>{pill.label}</span></span>
                    <span className="btn btn-secondary btn-sm">Open</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="px-5 pb-5"><EmptyState title="No open tenders" /></div>
        )}
      </section>
    </PageBody>
  );
}
