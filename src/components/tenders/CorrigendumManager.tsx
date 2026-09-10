'use client';

import React, { useState } from 'react';
import { 
  FileEdit, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  RotateCw, 
  ChevronRight, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CorrigendumRecord {
  id: string;
  tenderId: string;
  tenderReference: string;
  corrigendumNumber: number;
  version: string;
  publishedAt: string;
  changeReason: string;
  summary: string;
  amendments: {
    clauseNumber: string;
    clauseTitle: string;
    previousRequirement: string;
    newRequirement: string;
    impactType: 'MODIFIED_THRESHOLD' | 'TIMELINE_EXTENSION' | 'FORMAT_CHANGE' | 'NEW_MANDATORY_DOC';
    reverificationResult: 'COMPLIANT' | 'ACTION_REQUIRED' | 'UNDER_REVIEW';
  }[];
  affectedBiddersCount: number;
  reverifiedBiddersCount: number;
  acknowledgmentRequired: boolean;
}

const DEFAULT_CORRIGENDUM: CorrigendumRecord = {
  id: 'corr-cpcl-0412-01',
  tenderId: 'tender-cpcl-2026-0412',
  tenderReference: 'CPCL/ENG/2026/HPGC-0412',
  corrigendumNumber: 1,
  version: 'v2.0 (Amended)',
  publishedAt: '04 Sep 2026, 11:30 IST',
  changeReason: 'Pre-bid meeting resolution regarding bank guarantee confirmation channels and timeline harmonization.',
  summary: 'Mandatory introduction of SFMS MT760 confirmation for EMD Bank Guarantee and 7-day extension for submission deadline.',
  amendments: [
    {
      clauseNumber: 'Clause 7.1',
      clauseTitle: 'Earnest Money Deposit (EMD) Verification',
      previousRequirement: 'Physical Bank Guarantee copy from scheduled commercial bank with standard covering letter.',
      newRequirement: 'Bank Guarantee must be transmitted through Structured Financial Messaging System (SFMS) code MT760 with unique verification token.',
      impactType: 'NEW_MANDATORY_DOC',
      reverificationResult: 'COMPLIANT',
    },
    {
      clauseNumber: 'Clause 12.3',
      clauseTitle: 'Submission Deadline & Bid Opening',
      previousRequirement: 'Closing on 21 Sep 2026, 15:00 IST; Technical opening 22 Sep 2026.',
      newRequirement: 'Closing extended to 28 Sep 2026, 15:00 IST; Technical opening 29 Sep 2026, 11:00 IST.',
      impactType: 'TIMELINE_EXTENSION',
      reverificationResult: 'COMPLIANT',
    },
    {
      clauseNumber: 'Clause 4.1',
      clauseTitle: 'Minimum Average Annual Turnover',
      previousRequirement: 'Average turnover of ₹10.00 Cr over FY 2023-24, FY 2024-25, FY 2025-26.',
      newRequirement: 'Average turnover of ₹10.00 Cr retained; clarified that provisional FY26 audited accounts with CA UDIN are admissible.',
      impactType: 'MODIFIED_THRESHOLD',
      reverificationResult: 'COMPLIANT',
    },
  ],
  affectedBiddersCount: 27,
  reverifiedBiddersCount: 26,
  acknowledgmentRequired: true,
};

interface CorrigendumManagerProps {
  corrigendum?: CorrigendumRecord;
  role?: 'AUTHORITY' | 'BIDDER';
  bidderStatus?: {
    isAcknowledged: boolean;
    acknowledgedAt?: string;
  };
  onAcknowledge?: () => void;
}

export function CorrigendumManager({
  corrigendum = DEFAULT_CORRIGENDUM,
  role = 'AUTHORITY',
  bidderStatus,
  onAcknowledge,
}: CorrigendumManagerProps) {
  const [acknowledged, setAcknowledged] = useState(bidderStatus?.isAcknowledged || false);
  const [isReevaluating, setIsReevaluating] = useState(false);
  const [reverifyMessage, setReverifyMessage] = useState('');

  const handleAcknowledge = () => {
    setAcknowledged(true);
    if (onAcknowledge) onAcknowledge();
  };

  const handleTriggerReverification = () => {
    setIsReevaluating(true);
    setReverifyMessage('');
    setTimeout(() => {
      setIsReevaluating(false);
      setReverifyMessage(`All ${corrigendum.affectedBiddersCount} proposals re-evaluated against ${corrigendum.version} amendments.`);
    }, 800);
  };

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 sm:p-6 space-y-5 shadow-xs font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] font-semibold">
              Corrigendum Tracking
            </span>
            <span className="text-xs text-[#777777] font-mono">•</span>
            <span className="text-xs font-mono font-bold text-[#111111]">
              Corrigendum No. {corrigendum.corrigendumNumber} ({corrigendum.version})
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[#111111]">
            Official Tender Amendments & Version History
          </h3>
          <p className="text-xs text-[#555555] mt-0.5 max-w-2xl">
            {corrigendum.summary}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {role === 'AUTHORITY' ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isReevaluating}
              onClick={handleTriggerReverification}
              className="h-8 px-3 text-xs border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] rounded-md cursor-pointer gap-1.5 font-medium"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isReevaluating ? 'animate-spin' : ''}`} />
              <span>{isReevaluating ? 'Re-verifying...' : 'Re-verify All Bids'}</span>
            </Button>
          ) : (
            <div>
              {acknowledged ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-medium bg-[#F7F7F7] text-[#111111] border border-[#E5E5E5]">
                  <Check className="w-3.5 h-3.5 text-[#111111]" />
                  <span>Acknowledged</span>
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={handleAcknowledge}
                  className="h-8 px-3 text-xs bg-[#111111] hover:bg-[#222222] text-white font-medium rounded-md cursor-pointer gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Acknowledge Amendment</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {reverifyMessage && (
        <div className="p-3 bg-[#F7F7F7] border border-[#E5E5E5] rounded-md text-xs font-mono text-[#111111] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#111111]" />
          <span>{reverifyMessage}</span>
        </div>
      )}

      {/* Metadata Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3.5 bg-[#F9F9F9] rounded-md border border-[#E5E5E5] text-xs">
        <div>
          <span className="text-[10px] uppercase font-mono text-[#777777]">Gazetted Date</span>
          <p className="font-mono text-[#111111] font-medium mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#777777]" />
            {corrigendum.publishedAt}
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono text-[#777777]">Affected Bidders</span>
          <p className="font-mono text-[#111111] font-semibold mt-0.5">
            {corrigendum.affectedBiddersCount} Submissions
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono text-[#777777]">Automated Re-checks</span>
          <p className="font-mono text-[#111111] font-bold mt-0.5">
            {corrigendum.reverifiedBiddersCount} / {corrigendum.affectedBiddersCount} Re-verified
          </p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-mono text-[#777777]">Change Rationale</span>
          <p className="text-[#555555] truncate mt-0.5" title={corrigendum.changeReason}>
            {corrigendum.changeReason}
          </p>
        </div>
      </div>

      {/* Side-by-Side Clause Amendments Diff */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider font-mono text-[#555555]">
          Clause-by-Clause Requirement Modifications
        </h4>

        <div className="space-y-3">
          {corrigendum.amendments.map((item, idx) => (
            <div
              key={idx}
              className="border border-[#E5E5E5] rounded-md overflow-hidden bg-white text-xs"
            >
              <div className="px-4 py-2 bg-[#F7F7F7] border-b border-[#E5E5E5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#111111]">{item.clauseNumber}:</span>
                  <span className="font-semibold text-[#111111]">{item.clauseTitle}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#E5E5E5] bg-white text-[#555555]">
                  {item.impactType.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E5E5E5]">
                {/* Previous (v1.0) */}
                <div className="p-3.5 space-y-1 bg-white">
                  <span className="text-[10px] uppercase font-mono text-[#777777] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#999999]" />
                    Original Requirement (v1.0)
                  </span>
                  <p className="text-[#555555] leading-relaxed">
                    {item.previousRequirement}
                  </p>
                </div>

                {/* Amended (v2.0) */}
                <div className="p-3.5 space-y-1 bg-[#FAFAFA]">
                  <span className="text-[10px] uppercase font-mono text-[#111111] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                    Amended Requirement (v2.0)
                  </span>
                  <p className="text-[#111111] font-medium leading-relaxed">
                    {item.newRequirement}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
