import Link from 'next/link';
import { listBidSummaries, sortByUrgency } from '@/lib/views/officer';
import { EmptyState, PageBody, PageHeader, RawPill } from '@/components/v2/ui';
import { StackedStatusBar } from '@/components/v2/charts';
import { aiAdviceLabel, decisionLabel, decisionPill, riskLabel, riskPill } from '@/components/v2/status';

export const metadata = { title: 'Bid reviews · Clausentis officer portal' };
export const dynamic = 'force-dynamic';

export default async function BidReviewsPage() {
  const bids = listBidSummaries();
  const awaiting = bids.filter((b) => !b.decision).sort(sortByUrgency);
  const decided = bids.filter((b) => b.decision);

  const table = (rows: typeof bids, caption: string) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-[13px]">
        <caption className="sr-only-v2">{caption}</caption>
        <thead>
          <tr className="border-b border-line bg-page text-left">
            <th scope="col" className="th px-5 py-2.5">Bid</th>
            <th scope="col" className="th px-3 py-2.5">Tender</th>
            <th scope="col" className="th px-3 py-2.5">Score</th>
            <th scope="col" className="th px-3 py-2.5">Clauses</th>
            <th scope="col" className="th px-3 py-2.5">Risk</th>
            <th scope="col" className="th px-3 py-2.5">AI advice</th>
            <th scope="col" className="th px-3 py-2.5">Decision</th>
            <th scope="col" className="th px-5 py-2.5"><span className="sr-only-v2">Action</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b.bidId} className="tr">
              <td className="px-5 py-3">
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold">{b.bidderName}</span>
                  <span className="mono text-[11px] text-fg-3">{b.submissionId} · {b.submittedAt}</span>
                </span>
              </td>
              <td className="mono px-3 py-3 text-[11px] text-fg-2">
                <Link href={`/authority/tenders/${b.tenderId}`} className="hover:text-brand hover:underline">{b.tenderReference}</Link>
              </td>
              <td className="mono px-3 py-3 font-semibold">{b.score}</td>
              <td className="w-[140px] px-3 py-3"><StackedStatusBar counts={b.counts} label={`${b.bidderName} clauses`} height={8} /></td>
              <td className="px-3 py-3"><RawPill cls={riskPill(b.risk)}>{riskLabel(b.risk)}</RawPill></td>
              <td className="px-3 py-3 text-fg-2">{aiAdviceLabel(b.aiRecommendation)}</td>
              <td className="px-3 py-3">
                <RawPill cls={decisionPill(b.decision?.code)}>{b.decision ? decisionLabel(b.decision.code) : 'Awaiting'}</RawPill>
              </td>
              <td className="px-5 py-3 text-right">
                <Link href={`/authority/bids/${b.bidId}`} className="btn btn-secondary btn-sm">{b.decision ? 'Open' : 'Review'}</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <PageBody>
      <PageHeader eyebrow="Bid reviews" title="Bids to review and decide" />
      <section aria-label="Awaiting decision" className="card overflow-hidden">
        <div className="px-5 pb-3 pt-4">
          <h2 className="h2">Awaiting your decision <span className="mono text-xs font-normal text-fg-3">{awaiting.length}</span></h2>
        </div>
        {awaiting.length ? table(awaiting, 'Bids awaiting a decision') : <div className="px-5 pb-5"><EmptyState title="Nothing waiting" /></div>}
      </section>
      <section aria-label="Decided" className="card overflow-hidden">
        <div className="px-5 pb-3 pt-4">
          <h2 className="h2">Decided <span className="mono text-xs font-normal text-fg-3">{decided.length}</span></h2>
        </div>
        {decided.length ? table(decided, 'Bids with a signed decision') : <div className="px-5 pb-5"><EmptyState title="No signed decisions yet" /></div>}
      </section>
    </PageBody>
  );
}
