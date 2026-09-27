'use client';

/**
 * B4 Prepare & check bid. Documents are processed and sealed on the server
 * (BidDocumentUploader), checked with runBidVerificationAction and submitted with
 * submitBidPackageAction, which re-evaluates everything on the server. No client-side
 * report is ever sent for submission.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { BidDocumentUploader } from '@/components/tenders/discovery/BidDocumentUploader';
import { runBidVerificationAction, submitBidPackageAction } from '@/lib/actions/tender-discovery';
import type { BidComplianceReport, BidderProfile, BidUploadedDocument, DiscoveredTender } from '@/types/tender-discovery';
import { EmptyState, StatusPill, cx } from '../ui';
import { OutcomeCountLegend, StackedStatusBar, ThresholdBars } from '../charts';
import { countOutcomes, toOutcome } from '../status';

function parseCr(text: string, label: RegExp): number | null {
  const m = text.match(new RegExp(`${label.source}[^₹\\d]*₹?\\s*([\\d.,]+)\\s*Cr`, 'i'));
  return m ? parseFloat(m[1].replace(/,/g, '')) : null;
}

export function PrepareBid({ tender, profile, profileSaved }: { tender: DiscoveredTender; profile: BidderProfile; profileSaved: boolean }) {
  const router = useRouter();
  const [documents, setDocuments] = useState<BidUploadedDocument[]>([]);
  const [docsRev, setDocsRev] = useState(0);
  const [checkedRev, setCheckedRev] = useState(-1);
  const [report, setReport] = useState<BidComplianceReport | null>(null);
  const [version, setVersion] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<null | { override: boolean }>(null);

  const stale = report !== null && checkedRev !== docsRev;
  const processing = documents.some((d) => d.status === 'processing');
  const ready = report?.status === 'READY_FOR_SUBMISSION';
  const issues = report ? report.mandatoryFailed + report.mandatoryMissing : 0;

  function onDocs(next: BidUploadedDocument[]) {
    setDocuments(next);
    setDocsRev((r) => r + 1);
  }

  async function runCheck() {
    setError(null);
    setVerifying(true);
    const nextVersion = version + 1;
    try {
      const r = await runBidVerificationAction(tender.id, profile, documents, nextVersion);
      setReport(r);
      setVersion(nextVersion);
      setCheckedRev(docsRev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The check could not run.');
    } finally {
      setVerifying(false);
    }
  }

  const counts = countOutcomes((report?.matrix ?? []).map((r) => r.status));
  const met = counts.pass;
  const total = report?.matrix.length ?? 0;
  const turnoverMismatch = report?.crossDocumentMismatches.find((m) => /turnover/i.test(`${m.field} ${m.detectedDifference}`));
  const declared = turnoverMismatch ? parseCr(turnoverMismatch.detectedDifference, /declared/) : null;
  const audited = turnoverMismatch ? parseCr(turnoverMismatch.detectedDifference, /audited/) : null;

  const steps = [
    { label: 'Upload documents', tag: documents.length ? 'DONE' : '', done: documents.length > 0, current: documents.length === 0 },
    { label: 'Automated check', tag: version ? `CHECK ${version}` : '', done: Boolean(report) && !stale, current: documents.length > 0 && (!report || stale) },
    { label: 'Fix issues', tag: report && !ready ? `${issues} OPEN` : '', done: ready && !stale, current: Boolean(report) && !ready && !stale },
    { label: 'Seal & submit', tag: '', done: false, current: ready && !stale },
  ];

  const statusPill = !report
    ? null
    : ready
      ? { cls: 'pill-pass', label: 'Ready to submit' }
      : report.status === 'BLOCKED_CRITICAL_FAILURES'
        ? { cls: 'pill-fail', label: `Blocked · ${report.criticalFindings.length} critical` }
        : { cls: 'pill-review', label: `Needs attention · ${issues} open` };

  return (
    <div className="flex flex-col gap-[18px]">
      <header className="flex flex-col gap-2">
        <Link href={`/bidder/tenders/${tender.id}`} className="self-start text-xs text-fg-2 hover:text-brand hover:underline">← {tender.referenceNumber}</Link>
        <h1 className="h1">Check your bid before you submit</h1>
        {!profileSaved ? (
          <p className="m-0 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2 text-[13px] text-[#92400E]">
            You haven&apos;t saved a company profile, so this check uses the sandbox demo company (Apex Heavy Engineering).{' '}
            <Link href="/bidder/settings" className="font-semibold underline">Save your profile</Link> before a real submission.
          </p>
        ) : null}
      </header>

      <ol aria-label="Steps" className="m-0 grid list-none grid-cols-2 gap-3 p-0 md:grid-cols-4">
        {steps.map((s, i) => (
          <li
            key={s.label}
            aria-current={s.current ? 'step' : undefined}
            className={cx('flex flex-col gap-0.5 border-t-2 pt-2.5', s.done || s.current ? 'border-mark' : 'border-line')}
          >
            <span className="mono text-[10px] text-fg-2">STEP {i + 1}{s.tag ? ` · ${s.tag}` : ''}{s.done ? ' · DONE' : ''}</span>
            <span className={cx('text-[13px] font-semibold', !s.done && !s.current && 'text-fg-2')}>{s.label}</span>
          </li>
        ))}
      </ol>

      {report ? (
        <section aria-label="Readiness" className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="card flex flex-col gap-3 p-5">
            <span className="eyebrow">Readiness · check {version}</span>
            <span className="flex items-baseline gap-1.5">
              <span className="font-display text-[56px] font-semibold leading-none">{report.overallScore}</span>
              <span className="text-base text-fg-3">/ 100</span>
            </span>
            {statusPill ? <span><span className={`pill ${statusPill.cls}`}>{statusPill.label}</span></span> : null}
            {stale ? <span className="text-xs text-[#92400E]">Documents changed since this check. Run it again.</span> : null}
            <StackedStatusBar counts={counts} label="Requirement outcomes" height={10} unit="requirements" />
            <OutcomeCountLegend counts={counts} />
          </div>
          {turnoverMismatch ? (
            <div className="card flex flex-col gap-3 p-5" style={{ borderColor: '#FECACA' }}>
              <span className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="h2">Your documents disagree about turnover</h2>
                <span className="pill pill-fail">{turnoverMismatch.severity === 'HIGH' ? 'Blocks submission' : 'Review'}</span>
              </span>
              <span className="text-[13px] text-fg-2">{turnoverMismatch.impactExplanation || 'The officer will see this contradiction. Upload the correct audited statement, or correct your declaration.'}</span>
              {declared !== null && audited !== null ? (
                <ThresholdBars
                  ariaLabel={`Audited turnover ₹${audited} crore, declared ₹${declared} crore, tender minimum ₹${tender.minimumTurnoverRequired} crore`}
                  threshold={{ value: tender.minimumTurnoverRequired, label: `MIN ₹${tender.minimumTurnoverRequired} CR` }}
                  rows={[
                    { key: 'a', label: 'Audited statement', value: audited, display: `₹${audited.toFixed(2)} Cr`, style: 'solid' },
                    { key: 'd', label: 'Your declaration', value: declared, display: `₹${declared.toFixed(2)} Cr`, style: 'outline' },
                  ]}
                />
              ) : (
                <span className="mono text-xs">{turnoverMismatch.detectedDifference}</span>
              )}
            </div>
          ) : report.crossDocumentMismatches.length ? (
            <div className="card flex flex-col gap-2 p-5" style={{ borderColor: '#FECACA' }}>
              <h2 className="h2">Your documents disagree</h2>
              <ul className="m-0 flex flex-col gap-1.5 pl-4 text-[13px] text-fg-4">
                {report.crossDocumentMismatches.map((m, i) => (
                  <li key={i}>
                    <strong>{m.field}:</strong> {m.detectedDifference} ({m.documentA} vs {m.documentB})
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="card flex flex-col gap-2 p-5">
              <h2 className="h2">No contradictions between your documents</h2>
              <span className="text-[13px] text-fg-2">
                {report.criticalFindings.length
                  ? `${report.criticalFindings.length} critical finding${report.criticalFindings.length === 1 ? '' : 's'}: ${report.criticalFindings.map((f) => f.title).join('; ')}.`
                  : 'Values agree across the files you uploaded.'}
              </span>
            </div>
          )}
        </section>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-label="Requirements" className="card overflow-hidden">
          <div className="flex justify-between px-5 pb-2.5 pt-4">
            <h2 className="h2">Requirements</h2>
            {report ? <span className="text-xs text-fg-2">{met} of {total} met</span> : null}
          </div>
          {report ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-xs">
                <thead>
                  <tr className="border-y border-line bg-page text-left">
                    <th scope="col" className="th px-5 py-2">Requirement</th>
                    <th scope="col" className="th px-3 py-2">What we found</th>
                    <th scope="col" className="th px-3 py-2">Status</th>
                    <th scope="col" className="th px-5 py-2"><span className="sr-only-v2">Action</span></th>
                  </tr>
                </thead>
                <tbody>
                  {[...report.matrix]
                    .sort((a, b) => (toOutcome(a.status) === 'pass' ? 1 : 0) - (toOutcome(b.status) === 'pass' ? 1 : 0))
                    .map((r) => {
                      const o = toOutcome(r.status);
                      return (
                        <tr key={r.id} className="tr align-top">
                          <td className="px-5 py-2.5">
                            <span className="flex flex-col gap-0.5">
                              <span className="font-semibold">{r.requirementTitle}</span>
                              <span className="mono text-[10px] text-fg-3">{r.tenderClauseReference}</span>
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-fg-4">
                            <span className="flex flex-col gap-0.5">
                              <span>{r.bidderEvidence}</span>
                              {o && o !== 'pass' && r.remediationAction ? <span className="text-[11px] text-fg-2">{r.remediationAction}</span> : null}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">{o ? <StatusPill outcome={o} label={o === 'pass' ? 'Met' : undefined} /> : null}</td>
                          <td className="px-5 py-2.5">
                            {o && o !== 'pass' ? (
                              <a href="#upload" className="btn btn-secondary btn-sm">{o === 'missing' ? 'Upload' : 'Replace'}</a>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 pb-5">
              <EmptyState title="No check run yet">
                Add your documents on the right, then run the check. You&apos;ll see each requirement exactly as the procurement officer will.
              </EmptyState>
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <section id="upload" aria-label="Upload" className="card flex scroll-mt-20 flex-col gap-3 p-[18px]">
            <h2 className="h2">Add or replace documents</h2>
            <BidDocumentUploader documents={documents} onDocumentsChange={onDocs} tender={tender} isVerifying={verifying} />
          </section>
          <section aria-label="Check and submit" className="card flex flex-col gap-2.5 p-[18px]">
            <button type="button" className={cx('btn', report && !stale ? 'btn-secondary' : 'btn-primary')} style={{ minHeight: 44 }} disabled={documents.length === 0 || verifying || processing} onClick={runCheck}>
              {verifying ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {report ? 'Run check again' : 'Run the check'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ minHeight: 44 }}
              disabled={!ready || stale || verifying || processing}
              onClick={() => setDialog({ override: false })}
            >
              Seal &amp; submit
            </button>
            {error ? <p role="alert" className="m-0 text-[13px] text-[#991B1B]">{error}</p> : null}
            <span className="text-[11px] text-fg-3">
              {!report
                ? 'Run the check to see if your bid can be submitted.'
                : stale
                  ? 'Run the check again after changing documents.'
                  : ready
                    ? 'All mandatory requirements are met.'
                    : `Fix the ${issues || 'open'} issue${issues === 1 ? '' : 's'} to submit.`}
            </span>
            {report && !ready && !stale ? (
              <button type="button" className="self-start text-left text-xs font-semibold text-brand underline" onClick={() => setDialog({ override: true })}>
                Submit with unresolved issues
              </button>
            ) : null}
          </section>
        </aside>
      </div>

      {dialog && report ? (
        <SubmitDialog
          override={dialog.override}
          tender={tender}
          report={report}
          onClose={() => setDialog(null)}
          onSubmit={async (override) => {
            const res = await submitBidPackageAction(tender.id, profile, documents, version, override ? { allowUnresolvedSubmission: true } : undefined);
            if (res.success && res.submission) {
              router.push(`/bidder/bids/${encodeURIComponent(res.submission.submissionId)}/receipt`);
              return null;
            }
            return res.error || 'Submission failed.';
          }}
        />
      ) : null}
    </div>
  );
}

function SubmitDialog({
  override,
  tender,
  report,
  onClose,
  onSubmit,
}: {
  override: boolean;
  tender: DiscoveredTender;
  report: BidComplianceReport;
  onClose: () => void;
  onSubmit: (override: boolean) => Promise<string | null>;
}) {
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('input, button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:pt-20">
      <div className="fixed inset-0 bg-[rgba(15,23,42,0.55)]" aria-hidden="true" onClick={() => !busy && onClose()} />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="submit-title" className="relative flex w-full max-w-[560px] flex-col rounded-[10px] border border-line bg-white shadow-[0_24px_48px_rgba(0,0,0,0.18)]">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 pb-4 pt-5">
          <div className="flex flex-col gap-1.5">
            <span className="eyebrow">Seal &amp; submit</span>
            <h2 id="submit-title" className="m-0 font-display text-xl font-semibold">{tender.referenceNumber}</h2>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} disabled={busy} className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex flex-col gap-3 px-6 py-5 text-[13px] text-fg-4">
          <p className="m-0">
            Your {report.documentsCount} document{report.documentsCount === 1 ? '' : 's'} will be sealed with SHA-256 and sent to {tender.issuingOrganisation}. Clausentis re-runs the check on the server when you submit, and the officer sees that result, not this page.
          </p>
          <p className="m-0">Latest readiness: <strong>{report.overallScore}/100</strong>, {report.mandatoryPassed} of {report.mandatoryTotal} mandatory requirements met.</p>
          {override ? (
            <label className="flex items-start gap-2.5 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3 text-[#92400E]">
              <input type="checkbox" className="mt-0.5 h-4 w-4" checked={ack} onChange={(e) => setAck(e.target.checked)} />
              I understand my bid has unresolved issues and the procurement officer will see every one of them.
            </label>
          ) : null}
          {error ? <p role="alert" className="m-0 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[#991B1B]">{error}</p> : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy || (override && !ack)}
            onClick={async () => {
              setBusy(true);
              setError(null);
              const err = await onSubmit(override);
              if (err) {
                setError(err);
                setBusy(false);
              }
            }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Seal &amp; submit bid
          </button>
        </div>
      </div>
    </div>
  );
}
