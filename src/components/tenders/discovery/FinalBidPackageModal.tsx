'use client';

/**
 * Final Bid Package Confirmation Modal
 *
 * Displays:
 * - Tender title & ID
 * - Bidder profile details
 * - Verified document manifest count
 * - Verified compliance score
 * - Official procurement officer disclaimer
 * - [CONFIRM & SUBMIT BID] action
 */

import { useState } from 'react';
import {
  X,
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  SendHorizontal,
  Loader2,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  BidderProfile,
  BidComplianceReport,
  DiscoveredTender,
} from '@/types/tender-discovery';

interface FinalBidPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  tender: DiscoveredTender;
  bidderProfile: BidderProfile;
  report: BidComplianceReport;
  onConfirmSubmission: (options?: { allowUnresolvedSubmission?: boolean }) => Promise<void>;
  isSubmitting?: boolean;
}

export function FinalBidPackageModal({
  isOpen,
  onClose,
  tender,
  bidderProfile,
  report,
  onConfirmSubmission,
  isSubmitting = false,
}: FinalBidPackageModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);

  if (!isOpen) return null;

  const isPassed = report.mandatoryFailed === 0 && report.mandatoryMissing === 0;

  const handleSubmit = () => {
    onConfirmSubmission({ allowUnresolvedSubmission: !isPassed && warningAcknowledged });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-lg border border-[#E5E5E5] bg-white shadow-2xl p-6 sm:p-8 space-y-5 font-sans my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111]">
              <FileCheck className="h-5 w-5 stroke-[1.5]" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#777777]">
                OFFICIAL BID PACKAGE
              </div>
              <h3 className="text-lg font-semibold text-[#111111] tracking-tight">
                Review & Confirm Bid Submission
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#777777] hover:text-[#111111] transition-colors p-1 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Verification Summary Manifest */}
        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="p-3.5 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#777777] block">
              Tender Opportunity
            </span>
            <div className="font-semibold text-[#111111] truncate">{tender.title}</div>
            <div className="text-[11px] font-mono text-[#555555]">
              ID: {tender.tenderId} &bull; {tender.referenceNumber}
            </div>
          </div>

          <div className="p-3.5 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#777777] block">
              Issuing Authority
            </span>
            <div className="font-semibold text-[#111111] truncate">
              {tender.issuingOrganisation}
            </div>
            <div className="text-[11px] text-[#555555]">{tender.location}</div>
          </div>

          <div className="p-3.5 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#777777] block">
              Submitting Bidder
            </span>
            <div className="font-semibold text-[#111111] truncate">
              {bidderProfile.companyName}
            </div>
            <div className="text-[11px] font-mono text-[#555555]">
              GSTIN: {bidderProfile.gstin}
            </div>
          </div>

          <div className="p-3.5 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] uppercase font-mono text-[#777777] block">
              Compliance Verification Status
            </span>
            <div className="font-mono text-[#111111] font-semibold flex items-center gap-1.5">
              {isPassed ? (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>PASSED ({report.overallScore}%)</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4" />
                  <span>UNRESOLVED ({report.overallScore}%)</span>
                </>
              )}
            </div>
            <div className="text-[11px] text-[#555555]">
              {report.documentsCount} verified exhibits attached &bull; {report.mandatoryPassed}/{report.mandatoryTotal} mandatory criteria passed
            </div>
          </div>
        </div>

        {/* Warning Banner if Package has Unresolved Mandatory Issues */}
        {!isPassed && (
          <div className="p-4 rounded-md border border-[#CCCCCC] bg-[#FAFAFA] space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-[#111111] font-semibold">
              <AlertTriangle className="h-4 w-4 text-[#111111] shrink-0" />
              <span>Warning: Mandatory Criteria Currently Unresolved</span>
            </div>
            <p className="text-[11px] text-[#444444] leading-relaxed">
              This bid package currently has {report.mandatoryFailed > 0 ? `${report.mandatoryFailed} failed` : ''} {report.mandatoryFailed > 0 && report.mandatoryMissing > 0 ? 'and' : ''} {report.mandatoryMissing > 0 ? `${report.mandatoryMissing} missing` : ''} mandatory criteria. Per public procurement rules, submitting with critical non-compliance may lead to technical disqualification.
            </p>
            <label className="flex items-start gap-2 pt-1 cursor-pointer select-none text-[#111111]">
              <input
                type="checkbox"
                checked={warningAcknowledged}
                onChange={(e) => setWarningAcknowledged(e.target.checked)}
                className="mt-0.5 rounded border-[#E5E5E5] text-[#111111] focus:ring-0 cursor-pointer"
              />
              <span className="text-[11px] font-medium leading-snug">
                I understand that submitting with unresolved mandatory criteria may lead to disqualification, and I wish to proceed with submission.
              </span>
            </label>
          </div>
        )}

        {/* Legal Disclaimer Box */}
        <div className="p-4 rounded-md border border-[#E5E5E5] bg-[#F7F7F7] text-xs space-y-2">
          <div className="flex items-center gap-2 text-[#111111] font-semibold font-mono uppercase text-[11px]">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#111111]" />
            <span>Procurement Intelligence Disclaimer</span>
          </div>
          <p className="leading-relaxed text-[11px] text-[#555555]">
            Clausentis provides AI-assisted compliance verification and traceable evidence mapping. Final procurement evaluation and contract award decisions remain solely with the authorised procurement officer. This submission represents an authenticated Clausentis verification package prepared for official tender evaluation.
          </p>

          <label className="flex items-center gap-2 pt-2 cursor-pointer select-none text-[#111111] font-medium text-xs">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="rounded border-[#E5E5E5] text-[#111111] focus:ring-0 cursor-pointer"
            />
            <span>I confirm that the submitted documents and declarations are accurate.</span>
          </label>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E5E5E5]">
          <div className="text-[11px] text-[#777777] font-mono">
            Package sealed with SHA-256 integrity hash.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs text-[#555555] hover:text-[#111111] border-[#E5E5E5] bg-white rounded-md cursor-pointer"
            >
              Cancel
            </Button>

            <Button
              disabled={!acknowledged || (!isPassed && !warningAcknowledged) || isSubmitting}
              onClick={handleSubmit}
              className="w-full sm:w-auto h-10 px-6 bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm tracking-wide gap-2 rounded-md shadow-xs cursor-pointer transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Recording Submission...
                </>
              ) : (
                <>
                  <SendHorizontal className="h-4 w-4" />
                  <span>Confirm & Submit Bid</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
