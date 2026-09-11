'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  AlertTriangle, 
  Loader2, 
  UserCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OfficerDecisionAction } from '@/types/procurement-decision';

interface DigitalSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSign: () => Promise<void>;
  isSubmitting: boolean;
  tenderTitle: string;
  tenderReference: string;
  tenderId: string;
  bidderName: string;
  bidId: string;
  complianceScore: number;
  riskLevel: string;
  aiRecommendation: string;
  officerDecision: OfficerDecisionAction;
  officerRemarks: string;
  officerProfile: {
    fullName: string;
    email: string;
    organisationName: string;
    role: string;
  };
  isRevision?: boolean;
}

export function DigitalSigningModal({
  isOpen,
  onClose,
  onSign,
  isSubmitting,
  tenderTitle,
  tenderReference,
  tenderId,
  bidderName,
  bidId,
  complianceScore,
  riskLevel,
  aiRecommendation,
  officerDecision,
  officerRemarks,
  officerProfile,
  isRevision = false,
}: DigitalSigningModalProps) {
  const [reviewedFindings, setReviewedFindings] = useState(false);
  const [certifiedIdentity, setCertifiedIdentity] = useState(false);

  if (!isOpen) return null;

  const canSign = reviewedFindings && certifiedIdentity && !isSubmitting;

  const getDecisionBadge = (decision: OfficerDecisionAction) => {
    switch (decision) {
      case 'APPROVED':
        return 'bg-[#111111] text-white border-[#111111]';
      case 'REJECTED':
        return 'bg-[#991B1B] text-white border-[#991B1B]';
      case 'CLARIFICATION_REQUIRED':
        return 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]';
      case 'MANUAL_REVIEW':
        return 'bg-[#F7F7F7] text-[#111111] border-[#CCCCCC]';
    }
  };

  const getDecisionLabel = (decision: OfficerDecisionAction) => {
    switch (decision) {
      case 'APPROVED':
        return 'Approve / Qualify Bid';
      case 'REJECTED':
        return 'Reject / Disqualify Bid';
      case 'CLARIFICATION_REQUIRED':
        return 'Send for Clarification';
      case 'MANUAL_REVIEW':
        return 'Hold for Manual Review';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-lg border border-[#E5E5E5] bg-white shadow-2xl p-6 sm:p-7 space-y-5 text-sans text-[#111111]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E5E5E5] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider bg-[#F7F7F7] text-[#111111] px-2 py-0.5 rounded border border-[#E5E5E5]">
                {isRevision ? 'Formal Decision Revision' : 'Digital Approval & Decision Signing'}
              </span>
              <span className="text-[11px] font-mono text-[#777777]">• CVC Guideline Ledger</span>
            </div>
            <h2 id="modal-headline" className="text-xl font-semibold tracking-tight text-[#111111]">
              Review Final Decision
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[#777777] hover:text-[#111111] p-1 rounded hover:bg-[#F7F7F7] cursor-pointer transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUMMARY REVIEW TABLE */}
        <div className="rounded-md border border-[#E5E5E5] bg-[#FAFAFA] divide-y divide-[#E5E5E5] text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 p-3 gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#777777] font-semibold">Tender Title</span>
              <p className="font-medium text-[#111111] mt-0.5">{tenderTitle}</p>
              <p className="text-[11px] text-[#555555] font-mono mt-0.5">Ref: {tenderReference} • ID: {tenderId}</p>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#777777] font-semibold">Bidder Corporate Entity</span>
              <p className="font-medium text-[#111111] mt-0.5">{bidderName}</p>
              <p className="text-[11px] text-[#555555] font-mono mt-0.5">Bid ID: {bidId}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 p-3 gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#777777] font-semibold">Compliance Score</span>
              <p className="text-base font-mono font-bold text-[#111111] mt-0.5">{complianceScore}%</p>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#777777] font-semibold">Risk Level</span>
              <p className="text-xs font-mono font-semibold text-[#111111] mt-1">{riskLevel} RISK</p>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#777777] font-semibold">AI Recommendation</span>
              <p className="text-xs font-medium text-[#111111] mt-1">{aiRecommendation}</p>
            </div>
          </div>

          <div className="p-3 space-y-2 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-[#777777] font-semibold">Procurement Officer Verdict</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border ${getDecisionBadge(officerDecision)}`}>
                {officerDecision}: {getDecisionLabel(officerDecision)}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#777777] font-semibold block mb-1">
                Official Remarks / Justification
              </span>
              <p className="p-2.5 rounded bg-[#F7F7F7] border border-[#E5E5E5] text-xs text-[#222222] font-mono leading-relaxed whitespace-pre-wrap">
                {officerRemarks}
              </p>
            </div>
          </div>
        </div>

        {/* AUTHENTICATED OFFICER IDENTITY BINDING */}
        <div className="p-3.5 rounded-md border border-[#E5E5E5] bg-[#F7F7F7] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase font-semibold text-[#111111] flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#111111]" />
              Authenticated Signing Officer Identity
            </span>
            <span className="text-[10px] font-mono text-[#555555]">Verified Session</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-[#777777] uppercase font-mono">Officer Name</span>
              <p className="font-semibold text-[#111111]">{officerProfile.fullName || 'Procurement Officer'}</p>
              <p className="text-[11px] text-[#555555] font-mono">{officerProfile.email}</p>
            </div>
            <div>
              <span className="text-[10px] text-[#777777] uppercase font-mono">Organisation & Role</span>
              <p className="font-semibold text-[#111111]">{officerProfile.organisationName || 'Tender Authority'}</p>
              <p className="text-[11px] text-[#555555] font-mono">Designated Procurement Authority</p>
            </div>
          </div>
        </div>

        {/* MANDATORY STATUTORY WARNING */}
        <div className="p-3 rounded-md border border-[#FDE68A] bg-[#FFFBEB] text-[#92400E] text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-[#B45309]">Advisory AI Disclaimer</p>
            <p className="text-[11px] text-[#78350F] leading-snug">
              AI-generated recommendations are advisory. The Procurement Officer is solely responsible for the final sovereign decision under Indian Public Procurement rules.
            </p>
          </div>
        </div>

        {/* DUAL CHECK-GATES (REQUIRED) */}
        <div className="space-y-2.5 pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none group">
            <input
              type="checkbox"
              id="confirm-findings"
              checked={reviewedFindings}
              onChange={(e) => setReviewedFindings(e.target.checked)}
              disabled={isSubmitting}
              className="mt-0.5 h-4 w-4 rounded border-[#CCCCCC] text-[#111111] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#111111]"
            />
            <span className="text-xs text-[#222222] leading-snug group-hover:text-[#000000]">
              I have reviewed the compliance findings, supporting evidence, and algorithmic recommendation.
            </span>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer select-none group">
            <input
              type="checkbox"
              id="confirm-identity"
              checked={certifiedIdentity}
              onChange={(e) => setCertifiedIdentity(e.target.checked)}
              disabled={isSubmitting}
              className="mt-0.5 h-4 w-4 rounded border-[#CCCCCC] text-[#111111] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#111111]"
            />
            <span className="text-xs text-[#222222] leading-snug group-hover:text-[#000000]">
              I confirm that this decision is made by me as the authorized Procurement Officer and will be cryptographically registered in the immutable audit trail.
            </span>
          </label>
        </div>

        {/* LEGAL TRANSPARENCY NOTICE */}
        <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between text-[10px] text-[#777777] font-mono">
          <span>Prototype digital approval. Production deployment can integrate an authorised DSC/eSign provider.</span>
        </div>

        {/* MODAL ACTIONS */}
        <div className="flex items-center justify-end gap-2.5 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8 px-4 text-xs border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] rounded-md cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={!canSign}
            onClick={onSign}
            className={`h-8 px-4 text-xs font-semibold rounded-md gap-1.5 cursor-pointer transition-all ${
              canSign
                ? 'bg-[#111111] hover:bg-[#222222] text-white shadow-sm'
                : 'bg-[#E5E5E5] text-[#888888] cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Signing into Immutable Ledger...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sign &amp; Approve Decision</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
