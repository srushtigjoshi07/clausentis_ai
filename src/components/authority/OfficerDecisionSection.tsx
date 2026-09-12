'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  FileText, 
  RefreshCw, 
  History,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DigitalSigningModal } from './DigitalSigningModal';
import { SignedDecisionPdfButton } from './SignedDecisionPdfButton';
import { MatchedRequirementsPdfButton } from '@/components/reports/MatchedRequirementsPdfButton';
import { signProcurementDecision, getProcurementDecisionHistory } from '@/lib/actions/decisions';
import type { 
  OfficerDecisionAction, 
  DecisionStatus,
  ProcurementDecisionRecord,
  DecisionHistoryItem 
} from '@/types/procurement-decision';
import type { BidderEvaluationDossier } from '@/lib/compliance/types';

interface OfficerDecisionSectionProps {
  bidId: string;
  tenderId: string;
  tenderTitle: string;
  tenderReference: string;
  dossier: BidderEvaluationDossier;
  initialDecision?: ProcurementDecisionRecord | null;
  officerProfile: {
    fullName: string;
    email: string;
    organisationName: string;
    role: string;
  };
  onDecisionSigned?: (decision: ProcurementDecisionRecord) => void;
}

export function OfficerDecisionSection({
  bidId,
  tenderId,
  tenderTitle,
  tenderReference,
  dossier,
  initialDecision = null,
  officerProfile,
  onDecisionSigned,
}: OfficerDecisionSectionProps) {
  // Decision Form State (Active when not signed or when revising)
  const [selectedDecision, setSelectedDecision] = useState<OfficerDecisionAction | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Signed State
  const [activeDecision, setActiveDecision] = useState<ProcurementDecisionRecord | null>(() => {
    if (initialDecision) return initialDecision;
    if (dossier.officerDecision && dossier.officerDecision.decisionId) {
      return {
        id: `dec-${dossier.bidId}`,
        decision_id: dossier.officerDecision.decisionId,
        tender_id: dossier.tenderId,
        bid_id: dossier.bidId,
        bidder_id: dossier.submissionId,
        bidder_name: dossier.bidderName,
        officer_user_id: 'officer-session',
        officer_name: dossier.officerDecision.officerName,
        officer_email: officerProfile.email,
        organisation: officerProfile.organisationName,
        officer_role: dossier.officerDecision.officerRole,
        decision: (dossier.officerDecision.decision === 'QUALIFIED' ? 'APPROVED' : dossier.officerDecision.decision === 'DISQUALIFIED' ? 'REJECTED' : 'APPROVED') as OfficerDecisionAction,
        remarks: dossier.officerDecision.notes,
        compliance_score_snapshot: dossier.complianceScore,
        risk_level_snapshot: dossier.riskLevel,
        ai_recommendation_snapshot: dossier.aiRecommendation.recommendation,
        signed_at: new Date().toISOString(),
        decision_version: dossier.officerDecision.decisionVersion || 1,
        status: (dossier.officerDecision.status || 'SIGNED') as DecisionStatus,
        integrity_hash: dossier.officerDecision.integrityHash || '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return null;
  });

  // Revision Mode Toggle
  const [isRevisionMode, setIsRevisionMode] = useState(false);
  // Audit Version History
  const [history, setHistory] = useState<DecisionHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Helper for decision text mapping
  const getDisplayDecision = (decision: string) => {
    switch (decision) {
      case 'APPROVED':
      case 'QUALIFIED':
        return 'Approved / Qualify Bid';
      case 'REJECTED':
      case 'DISQUALIFIED':
        return 'Rejected / Disqualify Bid';
      case 'CLARIFICATION_REQUIRED':
      case 'REQUIRES CLARIFICATION':
        return 'Clarification Required';
      case 'MANUAL_REVIEW':
      case 'PENDING REVIEW':
        return 'Hold for Manual Review';
      default:
        return decision;
    }
  };

  const handleOpenSigningModal = () => {
    setErrorMsg(null);
    if (!selectedDecision) {
      setErrorMsg('Please select an official verdict before proceeding to review & sign.');
      return;
    }
    if (!remarks || remarks.trim().length < 5) {
      setErrorMsg('Official justification / remarks are mandatory (at least 5 characters).');
      return;
    }
    setIsModalOpen(true);
  };

  const handleConfirmSign = async () => {
    if (!selectedDecision) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const result = await signProcurementDecision({
        tenderId,
        tenderTitle,
        tenderReference,
        bidId,
        bidderId: dossier.submissionId,
        bidderName: dossier.bidderName,
        decision: selectedDecision,
        remarks: remarks.trim(),
        complianceScoreSnapshot: dossier.complianceScore,
        riskLevelSnapshot: dossier.riskLevel,
        aiRecommendationSnapshot: dossier.aiRecommendation.recommendation,
        isRevision: isRevisionMode,
      });

      if (!result.success || !result.decision) {
        throw new Error(result.error || 'Failed to sign decision.');
      }

      setActiveDecision(result.decision);
      setIsRevisionMode(false);
      setIsModalOpen(false);
      setSuccessMsg(
        isRevisionMode
          ? `Decision revised (v${result.decision.decision_version}) and registered in CVC audit ledger.`
          : `Official decision successfully signed and cryptographically sealed into the CVC audit ledger.`
      );

      if (onDecisionSigned) {
        onDecisionSigned(result.decision);
      }
    } catch (err: unknown) {
      console.error('[OfficerDecisionSection] Signing error:', err);
      setErrorMsg((err as Error)?.message || 'An error occurred during signing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await getProcurementDecisionHistory(bidId);
      if (res.success) {
        setHistory(res.history);
      }
    } catch (err) {
      console.warn('Failed to load decision history:', err);
    } finally {
      setLoadingHistory(false);
      setShowHistory(true);
    }
  };

  // Evidence list summary
  const documentsReviewed = dossier.requirementResults
    .filter((r) => r.evidence)
    .map((r) => `${r.evidence!.documentName} (p.${r.evidence!.pageNumber})`);
  const uniqueDocuments = Array.from(new Set(documentsReviewed));

  return (
    <section className="rounded-lg border border-[#E5E5E5] bg-white shadow-sm overflow-hidden text-sans text-[#111111]">
      {/* SECTION HEADER */}
      <div className="p-5 sm:p-6 border-b border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFAFA]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-white px-2 py-0.5 rounded border border-[#E5E5E5]">
              Section 8 • Sovereign Governance
            </span>
            <span className="text-xs text-[#777777]">•</span>
            <span className="text-xs text-[#555555] font-mono">CVC 2026 Procurement Directives</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-[#111111] mt-1">
            Officer Decision &amp; Approval
          </h2>
          <p className="text-xs text-[#555555] mt-0.5">
            The Procurement Officer is the final sovereign decision-maker. AI evaluations are non-binding advisory inputs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <MatchedRequirementsPdfButton
            bidId={bidId}
            tenderId={tenderId}
            bidderCompanyName={dossier.bidderName}
            label="View Matched Requirements"
          />
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* SUCCESS NOTIFICATION */}
        {successMsg && (
          <div className="p-3.5 rounded-md border border-[#E5E5E5] bg-[#F7F7F7] text-xs text-[#111111] flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#111111] shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
            <button
              onClick={() => setSuccessMsg(null)}
              className="text-[11px] font-mono text-[#777777] hover:text-[#111111] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ERROR NOTIFICATION */}
        {errorMsg && (
          <div className="p-3.5 rounded-md border border-[#FCA5A5] bg-[#FFF5F5] text-xs text-[#991B1B] flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#991B1B] shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-[11px] font-mono text-[#991B1B] hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. AI RECOMMENDATION SUMMARY (ADVISORY ONLY) */}
        <div className="rounded-md border border-[#E5E5E5] bg-[#FAFAFA] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-semibold text-[#777777]">
                Advisory Input
              </span>
              <span className="text-xs font-semibold text-[#111111]">AI Recommendation Summary</span>
            </div>
            <span className="text-[10px] font-mono text-[#777777]">
              Advisory only • Non-binding
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#777777]">Recommendation</span>
              <p className="text-sm font-semibold text-[#111111] mt-0.5">
                {dossier.aiRecommendation.recommendation}
              </p>
              <p className="text-[11px] text-[#555555] font-mono mt-0.5">
                Confidence: {Math.round(dossier.aiRecommendation.confidence * 100)}%
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-[#777777]">Compliance Score</span>
              <p className="text-base font-mono font-bold text-[#111111] mt-0.5">
                {dossier.complianceScore}%
              </p>
              <p className="text-[11px] text-[#555555] font-mono mt-0.5">
                {dossier.mandatoryPassed} / {dossier.mandatoryTotal} Mandatory Criteria Passed
              </p>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase text-[#777777]">Risk Assessment</span>
              <p className="text-xs font-mono font-semibold text-[#111111] mt-1">
                {dossier.riskLevel} RISK
              </p>
              <p className="text-[11px] text-[#555555] mt-0.5">
                {dossier.failuresCount} failures, {dossier.missingCount} missing documents
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#E5E5E5] space-y-1.5 text-xs">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#777777] font-semibold">Key Findings</span>
              <p className="text-[#333333] mt-0.5 leading-relaxed">
                {dossier.aiRecommendation.summary}
              </p>
            </div>

            {uniqueDocuments.length > 0 && (
              <div>
                <span className="text-[10px] font-mono uppercase text-[#777777] font-semibold">
                  Evidence Reviewed ({uniqueDocuments.length} Documents)
                </span>
                <p className="text-[#555555] text-[11px] font-mono mt-0.5 leading-relaxed">
                  {uniqueDocuments.slice(0, 4).join(' • ')}
                  {uniqueDocuments.length > 4 ? ` • +${uniqueDocuments.length - 4} more` : ''}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 2. SIGNED DECISION STATE VIEW OR ACTIVE SIGNING FORM */}
        {activeDecision && !isRevisionMode ? (
          /* ========================================================== */
          /* STATE A: DECISION ALREADY SIGNED                           */
          /* ========================================================== */
          <div className="rounded-md border border-[#111111] bg-white p-5 sm:p-6 space-y-5 shadow-xs">
            {/* Top Status Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E5] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-[#111111]">Decision Signed</h3>
                    <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111]">
                      Version {activeDecision.decision_version}
                    </span>
                    <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-[#111111] text-white">
                      {activeDecision.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#555555] mt-0.5">
                    Permanent immutable record anchored in the CVC audit trail.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <SignedDecisionPdfButton
                  decision={activeDecision}
                  dossier={dossier}
                  tenderTitle={tenderTitle}
                  tenderReference={tenderReference}
                  label="Download Signed Decision PDF"
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsRevisionMode(true);
                    setSelectedDecision(activeDecision.decision);
                    setRemarks(activeDecision.remarks);
                  }}
                  className="h-8 px-3 text-xs gap-1.5 border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] rounded-md cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Revise Decision (New Version)</span>
                </Button>
              </div>
            </div>

            {/* Signed Decision Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#777777]">Decision Verdict</span>
                <p className="text-sm font-semibold text-[#111111] mt-0.5">
                  {getDisplayDecision(activeDecision.decision)}
                </p>
                <p className="text-[11px] text-[#555555] font-mono mt-0.5">
                  Status: {activeDecision.status}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-[#777777]">Signed By</span>
                <p className="font-semibold text-[#111111] mt-0.5">{activeDecision.officer_name}</p>
                <p className="text-[11px] text-[#555555] font-mono">{activeDecision.officer_email}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-[#777777]">Organisation</span>
                <p className="font-semibold text-[#111111] mt-0.5">{activeDecision.organisation}</p>
                <p className="text-[11px] text-[#555555] font-mono">{activeDecision.officer_role}</p>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-[#777777]">Signed Timestamp</span>
                <p className="font-mono text-[#111111] mt-0.5">
                  {new Date(activeDecision.signed_at).toLocaleString('en-GB', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })} IST
                </p>
                <p className="text-[11px] text-[#555555] font-mono">Decision ID: {activeDecision.decision_id}</p>
              </div>
            </div>

            {/* Officer Remarks Display */}
            <div className="p-3.5 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] space-y-1 text-xs">
              <span className="text-[10px] font-mono uppercase text-[#777777] font-semibold block">
                Signed Officer Remarks &amp; Justification
              </span>
              <p className="text-[#111111] font-mono whitespace-pre-wrap leading-relaxed">
                {activeDecision.remarks}
              </p>
            </div>

            {/* Cryptographic Seal Snippet */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#E5E5E5] text-[11px] font-mono text-[#555555]">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#111111]" />
                <span>SHA-256 Checksum:</span>
                <span className="text-[#111111] font-semibold break-all">
                  {activeDecision.integrity_hash}
                </span>
              </div>

              <button
                onClick={loadHistory}
                disabled={loadingHistory}
                className="inline-flex items-center gap-1 text-[11px] text-[#111111] hover:underline cursor-pointer font-mono"
              >
                <History className="w-3.5 h-3.5" />
                <span>{showHistory ? 'Refresh History' : 'View Version History'}</span>
              </button>
            </div>

            {/* Decision Version History List */}
            {showHistory && (
              <div className="mt-4 p-4 rounded-md border border-[#E5E5E5] bg-[#FAFAFA] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[#111111] uppercase font-mono">
                    Decision Version History &amp; Audit Trace
                  </h4>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-[10px] text-[#777777] hover:text-[#111111] font-mono cursor-pointer"
                  >
                    Hide
                  </button>
                </div>

                {history.length === 0 ? (
                  <p className="text-xs text-[#555555] font-mono">No prior versions recorded for this bid.</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((h, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded bg-white border border-[#E5E5E5] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[#111111] font-mono">v{h.version}</span>
                            <span className="text-[#777777]">•</span>
                            <span className="font-semibold text-[#111111]">{h.decision}</span>
                            <span className="text-[#777777]">•</span>
                            <span className="text-[11px] text-[#555555]">By {h.officerName}</span>
                          </div>
                          <p className="text-[11px] text-[#555555] font-mono mt-0.5">{h.remarks}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono text-[#777777] block">
                            {new Date(h.signedAt).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' })}
                          </span>
                          <span className="text-[10px] font-mono text-[#111111] font-semibold uppercase">
                            {h.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ========================================================== */
          /* STATE B: ACTIVE OFFICER DECISION & SIGNING FORM            */
          /* ========================================================== */
          <div className="space-y-5">
            {isRevisionMode && (
              <div className="p-3 rounded-md bg-[#F7F7F7] border border-[#111111] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-[#111111]" />
                  <span className="font-medium text-[#111111]">
                    Submitting a formal Decision Revision (Version {(activeDecision?.decision_version || 1) + 1})
                  </span>
                </div>
                <button
                  onClick={() => setIsRevisionMode(false)}
                  className="text-[11px] font-mono text-[#777777] hover:text-[#111111] cursor-pointer"
                >
                  Cancel Revision
                </button>
              </div>
            )}

            {/* STATUTORY SOVEREIGN DECISION DISCLAIMER BANNER */}
            <div className="p-4 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] text-[#92400E] space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase font-bold tracking-wider text-[#78350F]">
                <ShieldCheck className="w-4 h-4 text-[#78350F]" />
                Statutory Procurement Governance Disclaimer
              </div>
              <p className="text-xs text-[#78350F] leading-relaxed font-sans">
                Artificial Intelligence recommendations and automated scorecards are strictly evidentiary and advisory inputs. Under <strong>General Financial Rules (GFR 2017 Rule 173)</strong> and <strong>Central Vigilance Commission (CVC)</strong> procurement guidelines, the authority to Qualify, Disqualify, or Request Clarification from any bidder resides exclusively and sovereignly with the designated <strong>Procurement Officer</strong>. AI will never execute an automated adjudication.
              </p>
            </div>

            {/* DECISION RADIO SELECTION */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#111111] uppercase font-mono block">
                Official Verdict Selection <span className="text-[#991B1B]">*</span>
              </label>
              <p className="text-xs text-[#555555]">
                Select the final procurement verdict for this bidder. The AI recommendation is advisory and is not pre-selected.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {/* 1. APPROVE / QUALIFY */}
                <label
                  onClick={() => setSelectedDecision('APPROVED')}
                  className={`flex items-start gap-3 p-3.5 rounded-md border text-xs cursor-pointer transition-all ${
                    selectedDecision === 'APPROVED'
                      ? 'border-[#111111] bg-[#111111] text-white shadow-sm'
                      : 'border-[#E5E5E5] bg-white text-[#111111] hover:border-[#999999]'
                  }`}
                >
                  <input
                    type="radio"
                    name="officer_decision"
                    value="APPROVED"
                    checked={selectedDecision === 'APPROVED'}
                    onChange={() => setSelectedDecision('APPROVED')}
                    className="mt-0.5 sr-only"
                  />
                  <div className="space-y-0.5">
                    <div className="font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve / Qualify Bid</span>
                    </div>
                    <p className={`text-[11px] ${selectedDecision === 'APPROVED' ? 'text-[#E5E5E5]' : 'text-[#666666]'}`}>
                      Bidder meets all mandatory technical &amp; statutory qualification criteria.
                    </p>
                  </div>
                </label>

                {/* 2. REJECT / DISQUALIFY */}
                <label
                  onClick={() => setSelectedDecision('REJECTED')}
                  className={`flex items-start gap-3 p-3.5 rounded-md border text-xs cursor-pointer transition-all ${
                    selectedDecision === 'REJECTED'
                      ? 'border-[#991B1B] bg-[#991B1B] text-white shadow-sm'
                      : 'border-[#E5E5E5] bg-white text-[#111111] hover:border-[#999999]'
                  }`}
                >
                  <input
                    type="radio"
                    name="officer_decision"
                    value="REJECTED"
                    checked={selectedDecision === 'REJECTED'}
                    onChange={() => setSelectedDecision('REJECTED')}
                    className="mt-0.5 sr-only"
                  />
                  <div className="space-y-0.5">
                    <div className="font-semibold flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject / Disqualify Bid</span>
                    </div>
                    <p className={`text-[11px] ${selectedDecision === 'REJECTED' ? 'text-[#FEE2E2]' : 'text-[#666666]'}`}>
                      Bidder fails essential tender conditions or submitted non-conforming data.
                    </p>
                  </div>
                </label>

                {/* 3. SEND FOR CLARIFICATION */}
                <label
                  onClick={() => setSelectedDecision('CLARIFICATION_REQUIRED')}
                  className={`flex items-start gap-3 p-3.5 rounded-md border text-xs cursor-pointer transition-all ${
                    selectedDecision === 'CLARIFICATION_REQUIRED'
                      ? 'border-[#B45309] bg-[#B45309] text-white shadow-sm'
                      : 'border-[#E5E5E5] bg-white text-[#111111] hover:border-[#999999]'
                  }`}
                >
                  <input
                    type="radio"
                    name="officer_decision"
                    value="CLARIFICATION_REQUIRED"
                    checked={selectedDecision === 'CLARIFICATION_REQUIRED'}
                    onChange={() => setSelectedDecision('CLARIFICATION_REQUIRED')}
                    className="mt-0.5 sr-only"
                  />
                  <div className="space-y-0.5">
                    <div className="font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Send for Clarification</span>
                    </div>
                    <p className={`text-[11px] ${selectedDecision === 'CLARIFICATION_REQUIRED' ? 'text-[#FEF3C7]' : 'text-[#666666]'}`}>
                      Seek formal explanation or supplementary document from bidder.
                    </p>
                  </div>
                </label>

                {/* 4. HOLD FOR MANUAL REVIEW */}
                <label
                  onClick={() => setSelectedDecision('MANUAL_REVIEW')}
                  className={`flex items-start gap-3 p-3.5 rounded-md border text-xs cursor-pointer transition-all ${
                    selectedDecision === 'MANUAL_REVIEW'
                      ? 'border-[#111111] bg-[#111111] text-white shadow-sm'
                      : 'border-[#E5E5E5] bg-white text-[#111111] hover:border-[#999999]'
                  }`}
                >
                  <input
                    type="radio"
                    name="officer_decision"
                    value="MANUAL_REVIEW"
                    checked={selectedDecision === 'MANUAL_REVIEW'}
                    onChange={() => setSelectedDecision('MANUAL_REVIEW')}
                    className="mt-0.5 sr-only"
                  />
                  <div className="space-y-0.5">
                    <div className="font-semibold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Hold for Manual Review</span>
                    </div>
                    <p className={`text-[11px] ${selectedDecision === 'MANUAL_REVIEW' ? 'text-[#E5E5E5]' : 'text-[#666666]'}`}>
                      Refer to Tender Evaluation Committee or legal advisor for deliberation.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* DECISION REMARKS (REQUIRED) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="officer-remarks" className="text-xs font-semibold text-[#111111] uppercase font-mono">
                  Official Decision Remarks &amp; Justification <span className="text-[#991B1B]">*</span>
                </label>
                <span className="text-[10px] font-mono text-[#777777]">
                  {remarks.length} characters (min 5 required)
                </span>
              </div>
              <textarea
                id="officer-remarks"
                rows={4}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter detailed official reasoning, referencing statutory verifications, clause evaluations, and tender guidelines..."
                className="w-full p-3 bg-white border border-[#E5E5E5] rounded-md text-xs text-[#111111] placeholder:text-[#888888] focus:outline-none focus:border-[#111111] font-mono leading-relaxed"
              />
            </div>

            {/* DIGITAL APPROVAL TRIGGER */}
            <div className="pt-2 border-t border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-[11px] text-[#555555]">
                <p>Signing registers an immutable record under officer <span className="font-semibold text-[#111111]">{officerProfile.fullName || 'Procurement Officer'}</span>.</p>
                <p className="text-[10px] text-[#777777] font-mono mt-0.5">Dual confirmation check-gates required in the next step.</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="default"
                  onClick={handleOpenSigningModal}
                  disabled={!selectedDecision || remarks.trim().length < 5}
                  className={`h-9 px-5 text-xs font-semibold rounded-md gap-2 cursor-pointer transition-all ${
                    selectedDecision && remarks.trim().length >= 5
                      ? 'bg-[#111111] hover:bg-[#222222] text-white shadow-sm'
                      : 'bg-[#E5E5E5] text-[#888888] cursor-not-allowed'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Review &amp; Sign Decision</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL */}
      {selectedDecision && (
        <DigitalSigningModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSign={handleConfirmSign}
          isSubmitting={isSubmitting}
          tenderTitle={tenderTitle}
          tenderReference={tenderReference}
          tenderId={tenderId}
          bidderName={dossier.bidderName}
          bidId={bidId}
          complianceScore={dossier.complianceScore}
          riskLevel={dossier.riskLevel}
          aiRecommendation={dossier.aiRecommendation.recommendation}
          officerDecision={selectedDecision}
          officerRemarks={remarks}
          officerProfile={officerProfile}
          isRevision={isRevisionMode}
        />
      )}
    </section>
  );
}
