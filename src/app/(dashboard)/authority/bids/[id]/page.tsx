import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getUserProfile } from '@/app/auth/actions';
import { getLatestProcurementDecision, getProcurementDecisionHistory } from '@/lib/actions/decisions';
import { getDossier, summarizeDossier } from '@/lib/views/officer';
import type { RequirementComplianceResult } from '@/lib/compliance/types';
import { CategoryChip, EmptyState, PageBody, RawPill, SandboxBadge, StatusPill, cx } from '@/components/v2/ui';
import { BulletChart, OutcomeCountLegend, StackedStatusBar, type BulletRow } from '@/components/v2/charts';
import { DecisionStatusCard, RecordDecisionButton, type DecisionPanelProps } from '@/components/v2/officer/DecisionPanel';
import { aiAdviceLabel, firstNumber, riskLabel, riskPill, toOutcome } from '@/components/v2/status';

export const dynamic = 'force-dynamic';

const NUMERIC_RULES = new Set(['MINIMUM_VALUE', 'NUMERIC_THRESHOLD', 'YEARS_EXPERIENCE', 'PERCENTAGE_THRESHOLD']);

function unitOf(text: string): string {
  if (/%/.test(text)) return '%';
  if (/year/i.test(text)) return 'yrs';
  if (/cr/i.test(text)) return 'Cr';
  return '';
}

function toBullet(r: RequirementComplianceResult): BulletRow | null {
  if (!NUMERIC_RULES.has(r.ruleType)) return null;
  const threshold = firstNumber(r.expectedValue);
  const actual =
    typeof r.evidence?.extractedValue === 'number' ? r.evidence.extractedValue : firstNumber(r.status === 'MISSING' ? null : r.verifiedValue);
  if (threshold === null || threshold <= 0) return null;
  const declared = r.declaredValue ? firstNumber(r.declaredValue) : null;
  const unit = unitOf(`${r.expectedValue} ${r.verifiedValue}`);
  return {
    key: r.requirementId,
    label: r.title,
    sub: `${r.clauseCode}${unit ? ` · ${unit === 'Cr' ? '₹ crore' : unit === 'yrs' ? 'years' : 'percent'}` : ''}`,
    threshold,
    actual,
    declared: declared !== null && declared !== actual ? declared : null,
    unit,
    note: r.evidence ? `${r.evidence.documentName} p.${r.evidence.pageNumber}` : undefined,
  };
}

function portalTone(status: string, concordant: boolean): { cls: string; label: string } {
  const s = status.toUpperCase();
  if (!concordant) return { cls: s.includes('MISSING') ? 'pill-fail' : 'pill-critical', label: 'Flagged' };
  if (s === 'WARNING' || s.includes('REVIEW')) return { cls: 'pill-review', label: 'Review' };
  return { cls: 'pill-pass', label: 'Verified' };
}

export default async function BidReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dossier = getDossier(decodeURIComponent(id));
  if (!dossier) notFound();

  const summary = summarizeDossier(dossier);
  const [profile, latest, history] = await Promise.all([
    getUserProfile(),
    getLatestProcurementDecision(dossier.bidId),
    getProcurementDecisionHistory(dossier.bidId),
  ]);

  const signed = latest.decision;
  const current: DecisionPanelProps['current'] = signed
    ? {
        decision: signed.decision,
        signedAt: signed.signed_at,
        officerName: signed.officer_name,
        version: signed.decision_version,
        integrityHash: signed.integrity_hash,
        decisionId: signed.decision_id,
        remarks: signed.remarks,
      }
    : summary.decision
      ? {
          decision: summary.decision.code,
          signedAt: summary.decision.signedAt,
          officerName: summary.decision.officerName,
          version: summary.decision.version ?? 1,
          integrityHash: summary.decision.integrityHash ?? '',
          decisionId: dossier.officerDecision?.decisionId ?? '',
        }
      : null;

  const panelProps: DecisionPanelProps = {
    bidId: dossier.bidId,
    submissionId: dossier.submissionId,
    bidderName: dossier.bidderName,
    tenderId: dossier.tenderId,
    tenderTitle: dossier.tenderTitle,
    tenderReference: dossier.tenderReference,
    score: dossier.complianceScore,
    risk: dossier.riskLevel,
    aiRecommendation: dossier.aiRecommendation.recommendation,
    officerName: profile?.fullName || 'Procurement officer',
    current,
    history: (history.history || []).map((h) => ({ ...h, decision: h.decision as string })),
  };

  const bullets = dossier.requirementResults.map(toBullet).filter((b): b is BulletRow => b !== null);
  const orderedResults = [...dossier.requirementResults].sort((a, b) => {
    const rank = (r: RequirementComplianceResult) => ({ fail: 0, missing: 1, review: 2, pass: 3 })[toOutcome(r.status) ?? 'pass'] ?? 4;
    return rank(a) - rank(b);
  });
  const documents =
    dossier.documents && dossier.documents.length
      ? dossier.documents.map((d) => ({ name: d.fileName, hashed: Boolean(d.sha256Hash) }))
      : Array.from(new Set(dossier.requirementResults.filter((r) => r.evidence).map((r) => r.evidence!.documentName))).map((name) => ({ name, hashed: false }));

  const bidHref = encodeURIComponent(dossier.bidId);

  return (
    <PageBody>
      <header className="flex flex-col gap-3">
        <Link href={`/authority/tenders/${dossier.tenderId}`} className="self-start text-xs text-fg-2 hover:text-brand hover:underline">
          ← {dossier.tenderReference} · all bids
        </Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="h1">{dossier.bidderName}</h1>
            <div className="flex flex-wrap gap-x-[18px] gap-y-1 text-xs text-fg-2">
              <span>Bid <span className="mono text-fg">{dossier.submissionId}</span></span>
              <span>GSTIN <span className="mono text-fg">{dossier.gstin}</span></span>
              <span>PAN <span className="mono text-fg">{dossier.pan}</span></span>
              <span>Submitted {dossier.submittedAt}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/api/pdf/download?type=compliance-report&bidId=${bidHref}`} className="btn btn-secondary" download>Compliance PDF</a>
            <Link href={`/authority/assistant?bidId=${bidHref}`} className="btn btn-secondary">Ask assistant</Link>
            <RecordDecisionButton {...panelProps} />
          </div>
        </div>
      </header>

      <section aria-label="Assessment summary" className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <div className="card flex flex-col gap-3 p-5">
          <span className="eyebrow">Compliance score</span>
          <span className="flex items-baseline gap-1.5">
            <span className="font-display text-[56px] font-semibold leading-none">{dossier.complianceScore}</span>
            <span className="text-base text-fg-3">/ 100</span>
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <RawPill cls={riskPill(dossier.riskLevel)}>{riskLabel(dossier.riskLevel)} risk</RawPill>
            <span className="text-xs text-fg-2">{dossier.mandatoryPassed} of {dossier.mandatoryTotal} mandatory</span>
          </span>
          <StackedStatusBar counts={summary.counts} label="Clause outcomes" height={10} className="mt-1" />
          <OutcomeCountLegend counts={summary.counts} />
        </div>
        <div className="card flex flex-col gap-3 border-mark p-5" style={{ borderColor: '#2563EB' }}>
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span className="eyebrow">AI recommendation · {aiAdviceLabel(dossier.aiRecommendation.recommendation)}</span>
            <span className="text-[11px] text-fg-3">Advice only · the decision is yours</span>
          </span>
          <p className="m-0 font-display text-lg font-semibold leading-snug tracking-[-0.01em] sm:text-xl">{dossier.aiRecommendation.summary}</p>
          {dossier.aiRecommendation.keyRiskFactors.length ? (
            <ul className="m-0 flex flex-col gap-1 pl-[18px] text-[13px] text-fg-4">
              {dossier.aiRecommendation.keyRiskFactors.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section aria-label="Evidence against thresholds" className="card flex flex-col gap-3.5 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="h2">Evidence against thresholds</h2>
          <span className="text-xs text-fg-3">Value read from the bidder&apos;s own documents vs the tender minimum</span>
        </div>
        {bullets.length ? (
          <BulletChart rows={bullets} ariaLabel="Numeric clause evidence against tender thresholds" actualLabel="Audited" />
        ) : (
          <EmptyState title="No numeric thresholds to chart">None of this bid&apos;s evaluated clauses carries a numeric minimum with a readable value.</EmptyState>
        )}
      </section>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section aria-label="Clause checks" className="card overflow-hidden">
            <div className="px-5 pb-2.5 pt-4"><h2 className="h2">Clause checks</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-xs">
                <thead>
                  <tr className="border-y border-line bg-page text-left">
                    <th scope="col" className="th px-5 py-2">Clause</th>
                    <th scope="col" className="th px-3 py-2">Requirement</th>
                    <th scope="col" className="th px-3 py-2">Found</th>
                    <th scope="col" className="th px-3 py-2">Evidence</th>
                    <th scope="col" className="th px-5 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orderedResults.map((r) => {
                    const o = toOutcome(r.status);
                    return (
                      <tr key={r.requirementId} className="tr align-top">
                        <td className="mono px-5 py-2.5 text-fg-2">{r.clauseCode.replace(/^Clause\s*/i, '')}</td>
                        <td className="px-3 py-2.5">
                          <span className="flex flex-col items-start gap-1">
                            <span className="font-semibold">{r.title}</span>
                            <CategoryChip category={r.category} className="min-h-5 text-[11px]" />
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="flex flex-col gap-0.5">
                            <span>{r.verifiedValue}</span>
                            {r.declaredValue ? <span className="text-[11px] text-fg-3">Declared {r.declaredValue}</span> : null}
                            {o && o !== 'pass' ? <span className="text-[11px] text-fg-2">{r.reason}</span> : null}
                          </span>
                        </td>
                        <td className="mono px-3 py-2.5 text-[11px] text-fg-2">
                          {r.evidence ? `${r.evidence.documentName} p.${r.evidence.pageNumber}` : '—'}
                        </td>
                        <td className="px-5 py-2.5">
                          {o ? <StatusPill outcome={o} /> : <span className="pill pill-neutral">N/A</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-label="Contradictions" className="card flex flex-col gap-3 p-5">
            <h2 className="h2">Contradictions between documents</h2>
            {dossier.crossDocumentFindings.length ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {dossier.crossDocumentFindings.map((f) => (
                  <div key={f.id} className="panel flex flex-col gap-2 p-3.5">
                    <RawPill cls={riskPill(f.severity)} className="self-start">{riskLabel(f.severity)}</RawPill>
                    <span className="text-[13px] font-semibold">{f.title}</span>
                    <span className="text-xs text-fg-2">
                      {f.primaryDocument.name} p.{f.primaryDocument.page}: {f.primaryDocument.value}
                      {f.conflictingDocument.value !== f.primaryDocument.value
                        ? ` · ${f.conflictingDocument.name} p.${f.conflictingDocument.page}: ${f.conflictingDocument.value}`
                        : ` · vs ${f.conflictingDocument.name}`}
                    </span>
                    <span className="text-xs text-fg-4">{f.explanation}</span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No contradictions found">The engine found no conflicting values across this bid&apos;s documents.</EmptyState>
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <DecisionStatusCard {...panelProps} />

          <section aria-label="Government portal checks" className="card flex flex-col gap-0.5 p-[18px]">
            <div className="flex items-center justify-between pb-2">
              <h2 className="h2">Portal checks</h2>
              <SandboxBadge />
            </div>
            {dossier.statutoryVerifications.length ? (
              dossier.statutoryVerifications.map((p) => {
                const tone = portalTone(p.status, p.concordant);
                return (
                  <div key={p.providerId} className="tr flex min-h-[46px] items-center justify-between gap-2.5 py-1.5">
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[13px] font-semibold">{p.providerName}</span>
                      <span className="text-[11px] text-fg-3">{p.details}</span>
                    </span>
                    <span className={cx('pill', tone.cls)}>{tone.label}</span>
                  </div>
                );
              })
            ) : (
              <span className="text-xs text-fg-2">No portal checks were recorded for this bid.</span>
            )}
            <Link href="/authority/government-verification" className="link mt-2 text-xs">Run a full portal check →</Link>
          </section>

          <section aria-label="Submitted documents" className="card flex flex-col gap-2 p-[18px]">
            <h2 className="h2">
              Documents <span className="mono text-xs font-normal text-fg-3">{documents.length}</span>
            </h2>
            <span className="text-xs text-fg-2">Files cited by the engine for this bid.</span>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-xs">
              {documents.map((d) => (
                <li key={d.name} className="mono break-all">{d.name}{d.hashed ? <span className="ml-1.5 text-fg-3">· SHA-256</span> : null}</li>
              ))}
            </ul>
            <a href={`/api/pdf/download?type=audit&bidId=${bidHref}`} className="link text-xs" download>Audit ledger PDF for this bid →</a>
          </section>
        </aside>
      </div>
    </PageBody>
  );
}
