'use client';

/**
 * Record & sign a qualification decision (screens A5 + A6).
 * Ports the OfficerDecisionSection / DigitalSigningModal behaviour to v2: the officer picks
 * a verdict, gives reasons (min 5 chars, re-validated by the server action), confirms, and
 * signProcurementDecision seals it server-side. Only plain data crosses into this component.
 */
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, X } from 'lucide-react';
import { signProcurementDecision } from '@/lib/actions/decisions';
import type { OfficerDecisionAction } from '@/types/procurement-decision';
import { cx } from '../ui';
import { aiAdviceLabel, decisionLabel, decisionPill, riskLabel, riskPill } from '../status';

export interface DecisionPanelProps {
  bidId: string;
  submissionId: string;
  bidderName: string;
  tenderId: string;
  tenderTitle: string;
  tenderReference: string;
  score: number;
  risk: string;
  aiRecommendation: string;
  officerName: string;
  current: null | {
    decision: string;
    signedAt: string;
    officerName: string;
    version: number;
    integrityHash: string;
    decisionId: string;
    remarks?: string;
  };
  history: Array<{ version: number; decision: string; officerName: string; signedAt: string; integrityHash: string; status: string }>;
}

const OPTIONS: Array<{ id: OfficerDecisionAction; label: string; hint: string }> = [
  { id: 'APPROVED', label: 'Qualify', hint: 'Bid proceeds to commercial opening.' },
  { id: 'REJECTED', label: 'Disqualify', hint: 'Bid is rejected at technical evaluation.' },
  { id: 'CLARIFICATION_REQUIRED', label: 'Seek clarification', hint: 'Bidder gets a query; the bid stays open.' },
  { id: 'MANUAL_REVIEW', label: 'Refer to committee', hint: 'Hold for the tender evaluation committee.' },
];

function fmtTime(s: string) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';
}

export function RecordDecisionButton(props: DecisionPanelProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        {props.current ? 'Record new version' : 'Record decision'}
      </button>
      {open ? <SignDecisionDialog {...props} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

export function DecisionStatusCard(props: DecisionPanelProps) {
  const { current, history, bidId } = props;
  return (
    <section aria-label="Officer decision" className="card flex flex-col gap-3 p-[18px]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="h2">Your decision</h2>
        <span className={cx('pill', decisionPill(current?.decision))}>{current ? decisionLabel(current.decision) : 'Not recorded'}</span>
      </div>
      {current ? (
        <>
          <span className="text-xs text-fg-2">
            Signed by {current.officerName} on {fmtTime(current.signedAt)} · version {current.version}
          </span>
          <span className="mono break-all text-[11px] text-fg-3">SHA-256 {current.integrityHash}</span>
          <a href={`/api/pdf/download?type=signed-decision&bidId=${encodeURIComponent(bidId)}`} className="btn btn-secondary btn-sm self-start" download>
            Signed decision PDF
          </a>
        </>
      ) : (
        <span className="text-xs text-fg-2">No decision has been signed for this bid. The AI recommendation is advice only.</span>
      )}
      {history.length > 1 ? (
        <details className="text-xs">
          <summary className="cursor-pointer font-semibold text-brand">Version history ({history.length})</summary>
          <ol className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
            {history.map((h) => (
              <li key={h.version} className="flex flex-wrap justify-between gap-2 border-t border-line-3 pt-1.5">
                <span>v{h.version} · {decisionLabel(h.decision)} · {h.officerName}</span>
                <span className="mono text-fg-3">{h.status}</span>
              </li>
            ))}
          </ol>
        </details>
      ) : null}
      <RecordDecisionButton {...props} />
    </section>
  );
}

function SignDecisionDialog(props: DecisionPanelProps & { onClose: () => void }) {
  const router = useRouter();
  const [picked, setPicked] = useState<OfficerDecisionAction | null>(null);
  const [reasons, setReasons] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const isRevision = Boolean(props.current);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    dialogRef.current?.querySelector<HTMLElement>('input, textarea, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) props.onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sign() {
    setError(null);
    if (!picked) return setError('Choose a decision.');
    if (reasons.trim().length < 5) return setError('Reasons are required (at least 5 characters).');
    if (!confirmed) return setError('Confirm that you have reviewed the evidence before signing.');
    setSubmitting(true);
    try {
      const res = await signProcurementDecision({
        tenderId: props.tenderId,
        tenderTitle: props.tenderTitle,
        tenderReference: props.tenderReference,
        bidId: props.bidId,
        bidderId: props.submissionId,
        bidderName: props.bidderName,
        decision: picked,
        remarks: reasons.trim(),
        complianceScoreSnapshot: props.score,
        riskLevelSnapshot: props.risk,
        aiRecommendationSnapshot: props.aiRecommendation,
        isRevision,
      });
      if (!res.success) {
        setError(res.error || 'The decision could not be signed.');
        setSubmitting(false);
        return;
      }
      props.onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The decision could not be signed.');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:pt-16">
      <div className="fixed inset-0 bg-[rgba(15,23,42,0.55)]" aria-hidden="true" onClick={() => !submitting && props.onClose()} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dlg-title"
        className="relative flex w-full max-w-[620px] flex-col rounded-[10px] border border-line bg-white shadow-[0_24px_48px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 pb-4 pt-5">
          <div className="flex flex-col gap-1.5">
            <span className="eyebrow">{isRevision ? 'Record a new decision version' : 'Record qualification decision'}</span>
            <h2 id="dlg-title" className="m-0 font-display text-[22px] font-semibold tracking-[-0.01em]">
              {props.bidderName} · {props.submissionId}
            </h2>
          </div>
          <button type="button" aria-label="Close" onClick={props.onClose} disabled={submitting} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-[18px] px-6 py-5">
          <div className="panel grid grid-cols-1 gap-3 px-3.5 py-3 sm:grid-cols-3">
            <span className="flex flex-col gap-1"><span className="th">Engine score</span><span className="text-lg font-semibold">{props.score} / 100</span></span>
            <span className="flex flex-col gap-1"><span className="th">Risk</span><span><span className={cx('pill', riskPill(props.risk))}>{riskLabel(props.risk)}</span></span></span>
            <span className="flex flex-col gap-1"><span className="th">AI advice</span><span className="text-sm font-semibold">{aiAdviceLabel(props.aiRecommendation)}</span></span>
          </div>

          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="label mb-2">Your decision</legend>
            {OPTIONS.map((o) => (
              <label
                key={o.id}
                className={cx('flex cursor-pointer items-start gap-3 rounded-md border px-3.5 py-3', picked === o.id ? 'border-mark bg-page' : 'border-line')}
              >
                <input type="radio" name="decision" value={o.id} checked={picked === o.id} onChange={() => setPicked(o.id)} className="mt-1 h-4 w-4" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{o.label}</span>
                  <span className="text-xs text-fg-2">{o.hint}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="reasons" className="label">Reasons for the record</label>
            <textarea id="reasons" rows={3} className="input text-[13px]" value={reasons} onChange={(e) => setReasons(e.target.value)} aria-describedby="reasons-hint" />
            <span id="reasons-hint" className="text-[11px] text-fg-3">Required. Bidders see the decision, not these notes.</span>
          </div>

          <label className="flex items-start gap-2.5 text-[13px] text-fg-4">
            <input type="checkbox" className="mt-0.5 h-4 w-4" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            I have reviewed the clause evidence and portal checks, and I sign this decision as {props.officerName}.
          </label>

          <div className="flex items-start gap-2.5 text-xs text-fg-2">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Signing seals your name, the time, the engine&apos;s snapshot and your reasons with a SHA-256 hash in the audit trail. A signed decision can&apos;t be edited; you can only record a new version.
            </span>
          </div>

          {error ? <p role="alert" className="m-0 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[13px] text-[#991B1B]">{error}</p> : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-6 py-4">
          <button type="button" className="btn btn-secondary" onClick={props.onClose} disabled={submitting}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={sign} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Sign &amp; seal decision
          </button>
        </div>
      </div>
    </div>
  );
}
