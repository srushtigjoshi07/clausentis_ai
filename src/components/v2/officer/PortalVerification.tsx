'use client';

import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import type { GovernmentVerificationReport, GovVerificationStatus } from '@/lib/verification/types';
import { EmptyState, cx } from '../ui';
import { HBarList } from '../charts';
import { riskLabel, riskPill } from '../status';

export interface PrefillBid {
  bidId: string;
  bidderName: string;
  pan: string;
  gstin: string;
  udyamNumber: string;
  cin: string;
}

const STATUS_PILL: Record<GovVerificationStatus, { cls: string; label: string }> = {
  VERIFIED: { cls: 'pill-pass', label: 'Verified' },
  MISMATCH: { cls: 'pill-fail', label: 'Mismatch' },
  NOT_FOUND: { cls: 'pill-neutral', label: 'Not found' },
  INACTIVE: { cls: 'pill-fail', label: 'Inactive' },
  EXPIRED: { cls: 'pill-fail', label: 'Expired' },
  UNAVAILABLE: { cls: 'pill-neutral', label: 'Not configured' },
  REQUIRES_REVIEW: { cls: 'pill-review', label: 'Review' },
};

const FIELDS = [
  { id: 'legalName', label: 'Legal name', mono: false },
  { id: 'pan', label: 'PAN', mono: true },
  { id: 'gstin', label: 'GSTIN', mono: true },
  { id: 'udyamNumber', label: 'Udyam number', mono: true },
  { id: 'cin', label: 'CIN', mono: true },
] as const;

type Identity = Record<(typeof FIELDS)[number]['id'], string>;

export function PortalVerification({ bids }: { bids: PrefillBid[] }) {
  const [identity, setIdentity] = useState<Identity>({ legalName: '', pan: '', gstin: '', udyamNumber: '', cin: '' });
  const [bidId, setBidId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<GovernmentVerificationReport | null>(null);

  function prefill(id: string) {
    setBidId(id);
    const b = bids.find((x) => x.bidId === id);
    if (b) {
      setIdentity({
        legalName: b.bidderName,
        pan: b.pan,
        gstin: b.gstin,
        udyamNumber: b.udyamNumber === 'Not registered' ? '' : b.udyamNumber,
        cin: b.cin,
      });
    }
  }

  async function run(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const clean = Object.fromEntries(Object.entries(identity).filter(([, v]) => v.trim())) as Partial<Identity>;
      const res = await fetch('/api/government/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidderId: bidId || 'manual-check',
          bidderName: identity.legalName || 'Manual check',
          identity: clean,
          environment: 'DEMO',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Verification failed (${res.status})`);
      setReport(json as GovernmentVerificationReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  const s = report?.overallScore;
  const breakdown = s ? [s.breakdown.identity, s.breakdown.registration, s.breakdown.status, s.breakdown.crossVerification] : [];
  const maxOfMax = Math.max(1, ...breakdown.map((b) => b.maxScore));

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <form onSubmit={run} aria-label="Identity to check" className="card flex flex-col gap-3 p-[18px]">
        <h2 className="h2">Identity to check</h2>
        {bids.length ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="v-bid" className="label">Prefill from a submitted bid</label>
            <select id="v-bid" className="input" value={bidId} onChange={(e) => prefill(e.target.value)}>
              <option value="">Enter details manually</option>
              {bids.map((b) => (
                <option key={b.bidId} value={b.bidId}>{b.bidderName}</option>
              ))}
            </select>
          </div>
        ) : null}
        {FIELDS.map((f) => (
          <div key={f.id} className="flex flex-col gap-1.5">
            <label htmlFor={`v-${f.id}`} className="label">{f.label}</label>
            <input
              id={`v-${f.id}`}
              className={cx('input', f.mono && 'mono')}
              value={identity[f.id]}
              onChange={(e) => setIdentity((v) => ({ ...v, [f.id]: e.target.value }))}
            />
          </div>
        ))}
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !Object.values(identity).some((v) => v.trim())}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Run checks
        </button>
        {error ? <p role="alert" className="m-0 text-[13px] text-[#991B1B]">{error}</p> : null}
      </form>

      <div className="flex min-w-0 flex-col gap-4" aria-live="polite">
        {!report ? (
          <EmptyState title="No check run yet">
            Enter a PAN, GSTIN, Udyam number or CIN, or pick a submitted bid, then run the checks. Results come from the sandbox registry bundled with Clausentis.
          </EmptyState>
        ) : (
          <>
            <section aria-label="Result" className="grid grid-cols-1 gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
              <div className="card flex flex-col gap-2.5 p-[18px]">
                <span className="eyebrow">Verification score</span>
                <span className="flex items-baseline gap-1.5">
                  <span className="font-display text-5xl font-semibold leading-none">{s!.total}</span>
                  <span className="text-sm text-fg-3">/ 100</span>
                </span>
                <span><span className={cx('pill', riskPill(s!.riskLevel))}>{riskLabel(s!.riskLevel)} risk</span></span>
                <span className="text-xs text-fg-2">
                  {s!.matchedFields} fields matched · {s!.mismatchedFields} mismatch{s!.mismatchedFields === 1 ? '' : 'es'} · {s!.reviewFields} to review. Names{' '}
                  {report.entityResolution.nameConsistency === 'CONSISTENT' ? 'consistent' : 'vary'} and PAN{' '}
                  {report.entityResolution.panConsistency === 'CONSISTENT' ? 'consistent' : report.entityResolution.panConsistency === 'CONFLICT' ? 'conflicting' : 'incomplete'} across sources.
                </span>
              </div>
              <div className="card flex flex-col gap-3 p-[18px]">
                <h2 className="h2 text-sm">Where the points come from</h2>
                <HBarList
                  ariaLabel="Verification score breakdown"
                  max={maxOfMax}
                  labelWidth={170}
                  items={breakdown.map((b) => ({
                    key: b.label,
                    label: b.label,
                    value: b.score,
                    max: b.maxScore,
                    valueLabel: `${b.score}/${b.maxScore}`,
                    tip: `${b.label}: ${b.score} of ${b.maxScore}`,
                  }))}
                />
                <span className="text-[11px] text-fg-3">Track length is each category&apos;s maximum, so empty track is points not earned.</span>
              </div>
            </section>

            <section aria-label="Sources" className="card overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-xs">
                <thead>
                  <tr className="border-b border-line bg-page text-left">
                    <th scope="col" className="th px-[18px] py-2.5">Source</th>
                    <th scope="col" className="th px-3 py-2.5">Result</th>
                    <th scope="col" className="th px-3 py-2.5">Mode</th>
                    <th scope="col" className="th px-[18px] py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.verifications.map((v) => {
                    const p = STATUS_PILL[v.status] ?? { cls: 'pill-neutral', label: v.status };
                    return (
                      <tr key={v.connectorId} className="tr">
                        <td className="px-[18px] py-2.5 font-semibold">{v.source}</td>
                        <td className="px-3 py-2.5 text-fg-2">{v.message || (v.identifier !== 'NOT_CONFIGURED' ? v.identifier : '')}</td>
                        <td className="px-3 py-2.5"><span className="pill pill-review">Sandbox</span></td>
                        <td className="px-[18px] py-2.5"><span className={cx('pill', p.cls)}>{p.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
