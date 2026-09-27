import Link from 'next/link';
import { getAllBidderDossiers } from '@/lib/compliance/repository';
import { getTenderSource } from '@/lib/tender-discovery/tender-source';
import { clauseOutcomeCounts, clauseUnion, sortByUrgency, summarizeDossier } from '@/lib/views/officer';
import { Card, CardHeader, EmptyState, KpiTile, Legend, PageBody, Pill, RawPill, STATUS_LEGEND, SummaryBand } from '@/components/v2/ui';
import { DeadlineTimeline, HBarList, StackedStatusBar } from '@/components/v2/charts';
import { aiAdviceLabel, daysUntil, formatDate, relativeDays, riskLabel, riskPill } from '@/components/v2/status';

export const metadata = { title: 'Overview · Clausentis officer portal' };
export const dynamic = 'force-dynamic';

export default async function OfficerOverviewPage() {
  const now = new Date();
  const dossiers = getAllBidderDossiers();
  const bids = dossiers.map(summarizeDossier);
  const { tenders } = await getTenderSource('imported').searchTenders({ activeOnly: false });
  const openTenders = tenders.filter((t) => (daysUntil(t.closingDate, now) ?? -1) >= 0 && t.tenderStatus !== 'CLOSED');
  const byClose = [...openTenders].sort((a, b) => (daysUntil(a.closingDate, now) ?? 0) - (daysUntil(b.closingDate, now) ?? 0));
  const nextClose = byClose[0];

  const awaiting = bids.filter((b) => !b.decision).sort(sortByUrgency);
  const signed = bids.length - awaiting.length;
  const critical = bids.filter((b) => b.critical);
  const tenderIdsWithBids = Array.from(new Set(bids.map((b) => b.tenderId)));

  // Tender with the most bids anchors the clause-outcome chart.
  const focusTenderId = tenderIdsWithBids.sort((a, b) => bids.filter((x) => x.tenderId === b).length - bids.filter((x) => x.tenderId === a).length)[0];
  const focusDossiers = dossiers.filter((d) => d.tenderId === focusTenderId);
  const focusRef = focusDossiers[0]?.tenderReference ?? '';
  const clauses = clauseUnion(focusDossiers)
    .map((c) => ({ ...c, counts: clauseOutcomeCounts(focusDossiers, c.key) }))
    .sort((a, b) => a.counts.pass - b.counts.pass);

  const scores = [...bids].sort((a, b) => b.score - a.score);
  const avg = bids.length ? Math.round(bids.reduce((s, b) => s + b.score, 0) / bids.length) : 0;

  const title =
    awaiting.length === 0
      ? 'No bids are waiting for your decision'
      : `${awaiting.length} bid${awaiting.length === 1 ? ' is' : 's are'} waiting for your decision`;
  const subParts: string[] = [];
  if (nextClose) subParts.push(`${nextClose.referenceNumber} closes ${relativeDays(daysUntil(nextClose.closingDate, now))}.`);
  if (critical.length) subParts.push(`${critical.length} bid${critical.length === 1 ? ' is' : 's are'} flagged critical.`);

  const bidsPerTender = (tenderId: string) => bids.filter((b) => b.tenderId === tenderId).length;

  return (
    <PageBody>
      <SummaryBand
        eyebrow={`Overview · ${formatDate(now.toISOString())}`}
        title={title}
        sub={subParts.join(' ')}
        actions={
          <>
            <Link href="/authority/tenders/new" className="btn btn-ghostblue">Publish tender</Link>
            <Link href={awaiting[0] ? `/authority/bids/${awaiting[0].bidId}` : '/authority/bids'} className="btn btn-onblue">
              Start reviewing
            </Link>
          </>
        }
      />

      <section aria-label="Key figures" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label="Open tenders"
          value={openTenders.length}
          icon="doc"
          tone="blue"
          note={nextClose ? `Next closes ${relativeDays(daysUntil(nextClose.closingDate, now))}` : 'None open'}
        />
        <KpiTile
          label="Bids received"
          value={bids.length}
          icon="inbox"
          tone="violet"
          note={tenderIdsWithBids.length === 1 ? `All on ${focusRef}` : `Across ${tenderIdsWithBids.length} tenders`}
        />
        <KpiTile label="Awaiting your decision" value={awaiting.length} icon="clock" tone="amber" note={`${signed} decision${signed === 1 ? '' : 's'} signed`} />
        <KpiTile
          label="Critical-risk bids"
          value={critical.length}
          icon="alert"
          tone="red"
          badge={critical.some((c) => c.debarred) ? <Pill tone="critical">Debarred</Pill> : undefined}
          note={critical.length ? critical.map((c) => c.bidderName).join(', ') : 'None flagged'}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <Card label="Requirement outcomes" className="flex flex-col gap-3.5 p-5">
          <CardHeader
            title="Where bids fall short"
            sub={focusDossiers.length ? `Outcome of each tender clause across the ${focusDossiers.length} bids, ${focusRef}` : 'No bids received yet'}
            right={<Legend items={STATUS_LEGEND} />}
          />
          {clauses.length ? (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {clauses.map((c) => {
                const total = focusDossiers.length;
                const summary = c.counts.pass === total ? 'all pass' : `${c.counts.pass}/${total} pass`;
                return (
                  <li key={c.key} className="grid grid-cols-1 items-center gap-1 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)_64px] sm:gap-3">
                    <span className="truncate text-xs" title={`${c.code} ${c.title}`}>
                      <span className="mono text-fg-3">{c.code}</span> {c.title}
                    </span>
                    <StackedStatusBar counts={c.counts} label={`Clause ${c.code}`} height={14} unit="bids" />
                    <span className="mono text-[11px] text-fg-2">{summary}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="No evaluated bids">Clause outcomes appear once bidders submit.</EmptyState>
          )}
        </Card>

        <Card label="Scores by bid" className="flex flex-col gap-3.5 p-5">
          <CardHeader title="Compliance score by bid" sub="Deterministic engine score out of 100, with risk" />
          {scores.length ? (
            <HBarList
              stacked
              ariaLabel="Compliance score by bid"
              max={100}
              items={scores.map((b) => ({
                key: b.bidId,
                label: b.bidderName,
                value: b.score,
                href: `/authority/bids/${b.bidId}`,
                tip: `${b.bidderName}: ${b.score} / 100, ${riskLabel(b.risk)} risk`,
                right: <RawPill cls={riskPill(b.risk)}>{riskLabel(b.risk)}</RawPill>,
              }))}
            />
          ) : (
            <EmptyState title="No bids yet" />
          )}
          {scores.length ? (
            <div className="mt-auto flex justify-between border-t border-line-3 pt-2.5 text-[11px] text-fg-3">
              <span>Average {avg}</span>
              <span>{scores.length} bids</span>
            </div>
          ) : null}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <Card label="Decision queue" className="overflow-hidden">
          <div className="flex items-center justify-between px-5 pb-3 pt-4">
            <h2 className="h2">Decision queue</h2>
            {focusTenderId ? (
              <Link href={`/authority/tenders/${focusTenderId}`} className="link text-xs">Open tender workspace →</Link>
            ) : null}
          </div>
          {awaiting.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-[13px]">
                <thead>
                  <tr className="text-left">
                    <th scope="col" className="th px-5 py-2">Bid</th>
                    <th scope="col" className="th px-3 py-2">Score</th>
                    <th scope="col" className="th px-3 py-2">Risk</th>
                    <th scope="col" className="th px-3 py-2">AI advice</th>
                    <th scope="col" className="th px-5 py-2"><span className="sr-only-v2">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {awaiting.map((q) => (
                    <tr key={q.bidId} className="tr">
                      <td className="px-5 py-3">
                        <span className="flex flex-col gap-0.5">
                          <span className="font-semibold">{q.bidderName}</span>
                          <span className="mono text-[11px] text-fg-3">{q.submissionId} · {q.submittedAt}</span>
                        </span>
                      </td>
                      <td className="mono px-3 py-3 font-semibold">{q.score}</td>
                      <td className="px-3 py-3"><RawPill cls={riskPill(q.risk)}>{riskLabel(q.risk)}</RawPill></td>
                      <td className="px-3 py-3 text-fg-2">{aiAdviceLabel(q.aiRecommendation)}</td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/authority/bids/${q.bidId}`} className="btn btn-secondary btn-sm">Review</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 pb-5">
              <EmptyState title="Nothing waiting">Every received bid has a signed decision.</EmptyState>
            </div>
          )}
        </Card>

        <Card label="Tender deadlines" className="flex flex-col gap-3 p-5">
          <CardHeader title="Closing dates" sub={`Next 30 days · today is ${formatDate(now.toISOString(), { day: 'numeric', month: 'short' })}`} />
          <DeadlineTimeline
            from={now}
            days={30}
            items={openTenders.map((t) => {
              const n = bidsPerTender(t.id);
              return {
                key: t.id,
                label: t.referenceNumber.split('/')[0] || t.issuingOrganisation,
                meta: `${formatDate(t.closingDate, { day: 'numeric', month: 'short' }).toUpperCase()} · ${n} BID${n === 1 ? '' : 'S'}`,
                date: t.closingDate,
                tip: `${t.referenceNumber} closes ${formatDate(t.closingDate)}, ${n} bid${n === 1 ? '' : 's'}`,
              };
            })}
          />
        </Card>
      </div>
    </PageBody>
  );
}
