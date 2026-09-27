import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getBidSubmissionReceiptAction } from '@/lib/actions/tender-discovery';
import { getLatestProcurementDecision } from '@/lib/actions/decisions';
import { DefinitionGrid, EmptyState, PageBody, PageHeader, RawPill } from '@/components/v2/ui';
import { ColumnPair, type ColumnDatum } from '@/components/v2/charts';
import { decisionLabel, decisionPill, formatDate } from '@/components/v2/status';
import { PrintButton } from '@/components/v2/bidder/PrintButton';

export const metadata = { title: 'Bid receipt · Clausentis bidder portal' };
export const dynamic = 'force-dynamic';

function fmtTime(s: string) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';
}

export default async function BidReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const submissionId = decodeURIComponent(id);
  const receipt = await getBidSubmissionReceiptAction(submissionId);

  if (!receipt) {
    return (
      <PageBody className="max-w-[720px]">
        <PageHeader back={{ href: '/bidder/bids', label: 'My bids' }} title="Receipt not found" />
        <EmptyState title={`No receipt for ${submissionId}`}>Receipts are only visible to the account that submitted the bid.</EmptyState>
      </PageBody>
    );
  }

  const bidId = receipt.submissionId.toLowerCase();
  const latest = await getLatestProcurementDecision(bidId);
  const decision = latest.decision && latest.decision.status !== 'SUPERSEDED' ? latest.decision : null;

  // Readiness checks this bidder ran on the same tender before submitting (recorded in audit_events).
  const checks: ColumnDatum[] = [];
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('audit_events')
        .select('created_at, event_type, metadata')
        .eq('user_id', user.id)
        .ilike('event_type', 'Bid Verification%')
        .eq('metadata->>tender_id', receipt.tenderId)
        .lte('created_at', receipt.submittedAt || new Date().toISOString())
        .order('created_at', { ascending: true })
        .limit(6);
      (data || []).forEach((row, i) => {
        const meta = (row.metadata || {}) as Record<string, unknown>;
        const score = typeof meta.score === 'number' ? meta.score : null;
        if (score === null) return;
        checks.push({
          key: `c${i}`,
          label: `CHECK ${i + 1}`,
          sub: meta.status === 'READY_FOR_SUBMISSION' ? 'READY' : 'BLOCKED',
          value: score,
          tone: 'muted',
          tip: `Check ${i + 1}: ${score} / 100 (${String(meta.status || '').replace(/_/g, ' ').toLowerCase()})`,
        });
      });
    }
  } catch {
    // no database: only the sealed score is known
  }
  if (checks.length === 0 || checks[checks.length - 1]?.value !== receipt.complianceScore) {
    checks.push({
      key: 'final',
      label: `CHECK ${receipt.verificationVersion}`,
      sub: 'SUBMITTED',
      value: receipt.complianceScore,
      tone: 'ink',
      tip: `Sealed with the bid: ${receipt.complianceScore} / 100`,
    });
  } else {
    checks[checks.length - 1] = { ...checks[checks.length - 1], tone: 'ink', sub: 'SUBMITTED' };
  }

  return (
    <PageBody className="max-w-none">
      <PageHeader
        back={{ href: '/bidder/bids', label: 'My bids' }}
        eyebrow={`Bid receipt · ${receipt.tenderReference}`}
        title="Submitted and sealed"
        actions={
          <>
            <a href={`/api/pdf/download?type=compliance-report&bidId=${encodeURIComponent(bidId)}`} className="btn btn-secondary" download>
              Compliance report PDF
            </a>
            <PrintButton />
          </>
        }
      />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <section
            aria-label="Decision"
            className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
            style={decision ? { borderColor: '#A7F3D0', background: '#F7FDFA' } : undefined}
          >
            <div className="flex flex-col gap-1">
              <span className="eyebrow" style={decision ? { color: '#065F46' } : undefined}>Officer decision</span>
              <span className="text-xl font-semibold">{decision ? decisionLabel(decision.decision) : 'Awaiting the procurement officer'}</span>
              <span className="text-xs text-fg-2">
                {decision
                  ? `Signed by the procurement officer on ${formatDate(decision.signed_at)}. Internal notes are not shared with bidders.`
                  : 'You will see the decision here once it is signed.'}
              </span>
            </div>
            <RawPill cls={decisionPill(decision?.decision)} className="self-start sm:self-center">{decision ? decisionLabel(decision.decision) : 'Under review'}</RawPill>
          </section>

          <section aria-label="Receipt" className="card p-5">
            <DefinitionGrid
              rows={[
                ['Submission ID', <span key="s" className="mono font-semibold">{receipt.submissionId}</span>],
                ['Sealed at', fmtTime(receipt.submittedAt)],
                ['Tender', `${receipt.tenderTitle} · ${receipt.issuingOrganisation}`],
                ['Bidder', `${receipt.bidderProfile.companyName} · ${receipt.bidderProfile.gstin}`],
                ['Package checksum', <span key="c" className="mono break-all text-xs">SHA-256 · {receipt.sha256Checksum}</span>],
                ['Documents', `${receipt.documentsManifest.length} file${receipt.documentsManifest.length === 1 ? '' : 's'}`],
              ]}
            />
          </section>

          <section aria-label="Documents" className="card overflow-hidden">
            <div className="px-5 pb-2 pt-3.5"><h2 className="h2">Sealed documents</h2></div>
            {receipt.documentsManifest.length ? (
              <ul className="m-0 list-none p-0">
                {receipt.documentsManifest.map((d) => (
                  <li key={d.name} className="tr flex justify-between gap-3 px-5 py-2.5 text-xs">
                    <span className="mono break-all">{d.name}</span>
                    <span className="shrink-0 text-fg-3">{(d.sizeBytes / 1_048_576).toFixed(2)} MB</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 pb-5"><EmptyState title="No document manifest recorded" /></div>
            )}
          </section>
        </div>

        <section aria-label="Check history" className="card flex flex-col gap-3.5 p-5">
          <div className="flex flex-col gap-1">
            <h2 className="h2">Your checks before submitting</h2>
            <span className="text-xs text-fg-3">Readiness score out of 100</span>
          </div>
          <ColumnPair columns={checks} ariaLabel={checks.map((c) => c.tip).join('; ')} />
          {checks.length === 1 ? <span className="text-xs text-fg-2">Earlier check scores are only kept when the account is connected to the database.</span> : null}
          {receipt.auditTrail.length ? (
            <ol className="m-0 flex flex-col gap-1 pl-[18px] text-xs text-fg-4">
              {receipt.auditTrail.map((a, i) => (
                <li key={i}>
                  <strong>{a.action}</strong>
                  {a.details ? ` · ${a.details}` : ''}
                </li>
              ))}
            </ol>
          ) : null}
          <Link href="/bidder/bids" className="link text-xs">All my bids →</Link>
        </section>
      </div>
    </PageBody>
  );
}
