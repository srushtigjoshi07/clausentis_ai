import Link from 'next/link';
import { listMySubmissions } from '@/lib/views/bidder';
import { EmptyState, PageBody, PageHeader, RawPill, cx } from '@/components/v2/ui';
import { decisionLabel, decisionPill, formatDate } from '@/components/v2/status';

export const metadata = { title: 'My bids · Clausentis bidder portal' };
export const dynamic = 'force-dynamic';

const STAGES = ['Prepared', 'Submitted', 'Verified', 'Decided'];

export default async function MyBidsPage() {
  const subs = await listMySubmissions();

  return (
    <PageBody className="max-w-none">
      <PageHeader
        eyebrow="My bids"
        title="Where each bid stands"
        actions={<Link href="/bidder/tenders" className="btn btn-primary">Start a new bid</Link>}
      />

      <section aria-label="Bids" className="card overflow-x-auto">
        {subs.length ? (
          <table className="w-full min-w-[860px] border-collapse">
            <thead>
              <tr className="border-b border-line bg-page text-left">
                <th scope="col" className="th px-5 py-3">Tender</th>
                <th scope="col" className="th px-3 py-3">Progress</th>
                <th scope="col" className="th px-3 py-3">Score</th>
                <th scope="col" className="th px-3 py-3">Decision</th>
                <th scope="col" className="th px-5 py-3"><span className="sr-only-v2">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {subs.map(({ record, decision }) => {
                const reached = decision ? 4 : 3; // prepared, submitted and verified (sealed score) are always true for a submission
                return (
                  <tr key={record.submissionId} className="tr">
                    <td className="px-5 py-[18px]">
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold">{record.tenderTitle}</span>
                        <span className="mono text-[11px] text-fg-3">{record.tenderReference} · {record.submissionId} · {formatDate(record.submittedAt)}</span>
                      </span>
                    </td>
                    <td className="px-3 py-[18px]">
                      <ol className="m-0 flex list-none gap-1.5 p-0" aria-label={`${reached} of 4 stages complete`}>
                        {STAGES.map((l, i) => (
                          <li key={l} className="flex flex-1 flex-col gap-1">
                            <span className={cx('block h-1 rounded-sm', i < reached ? 'bg-mark' : 'bg-line')} />
                            <span className={cx('text-[11px]', i < reached ? 'text-brand' : 'text-fg-3')}>
                              {l}
                              <span className="sr-only-v2">{i < reached ? ' (done)' : ' (pending)'}</span>
                            </span>
                          </li>
                        ))}
                      </ol>
                    </td>
                    <td className="mono px-3 py-[18px] text-sm font-semibold">{record.complianceScore}</td>
                    <td className="px-3 py-[18px]">
                      <RawPill cls={decisionPill(decision?.code)}>{decision ? decisionLabel(decision.code) : 'Under review'}</RawPill>
                    </td>
                    <td className="px-5 py-[18px] text-right">
                      <Link href={`/bidder/bids/${encodeURIComponent(record.submissionId)}/receipt`} className="btn btn-secondary btn-sm">Receipt</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-5">
            <EmptyState title="No submitted bids yet" action={<Link href="/bidder/tenders" className="btn btn-primary btn-sm">Find a tender</Link>}>
              Bids you seal and submit appear here with their decision. Drafts are not saved between sessions.
            </EmptyState>
          </div>
        )}
      </section>
      <p className="m-0 text-xs text-fg-3">Filled segments are completed stages. Scores are the readiness check sealed with each bid.</p>
    </PageBody>
  );
}
