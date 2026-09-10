'use client';

import { 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  AlertOctagon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface BidReadinessCardProps {
  tenderId: string;
  score: number;
  satisfiedCount: number;
  gapsCount: number;
  risksCount: number;
  primaryRecommendation?: string;
  onReviewCritical?: () => void;
}

export function BidReadinessCard({
  tenderId,
  score,
  satisfiedCount,
  gapsCount,
  risksCount,
  primaryRecommendation,
  onReviewCritical
}: BidReadinessCardProps) {
  const isReady = score >= 80 && risksCount === 0;
  const isConditional = score >= 60;

  const statusLabel = isReady 
    ? 'HIGH WIN PROBABILITY' 
    : isConditional 
    ? 'READY WITH CONDITIONS' 
    : 'CRITICAL DEFICITS DETECTED';

  const defaultRecommendation = risksCount > 0
    ? 'Reconcile turnover figures with statutory Form 3CA/3CD and submit the final UDIN-verified audit statement before bid opening.'
    : gapsCount > 0
    ? 'Upload remaining mandatory statutory affidavits and experience credentials in the Document Vault to achieve 100% eligibility.'
    : 'All mandatory qualification criteria satisfied. Tender is ready for final commercial bid pricing submission.';

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 sm:p-8 shadow-xs space-y-6 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#E5E5E5] pb-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#777777]">
              06. EXECUTIVE VERDICT
            </span>
            <span className="text-xs text-[#777777]">• Autonomous Procurement Scoring</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-semibold text-[#111111] tracking-tight">
            Bid Readiness Assessment
          </h3>
        </div>

        <div className="flex items-center gap-4 bg-[#F7F7F7] p-3.5 rounded-md border border-[#E5E5E5]">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#777777] block">
              FINAL SCORE
            </span>
            <div className="text-2xl sm:text-3xl font-bold text-[#111111] font-mono">
              {score}%
            </div>
          </div>

          <div className={`px-3 py-1.5 rounded text-xs font-mono font-semibold uppercase tracking-wider ${
            isReady ? 'bg-white text-[#111111] border border-[#E5E5E5]' :
            isConditional ? 'bg-white text-[#555555] border border-[#CCCCCC]' :
            'bg-[#111111] text-white border border-[#111111]'
          }`}>
            {statusLabel}
          </div>
        </div>
      </div>

      {/* 3 Status Summaries */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-md border border-[#E5E5E5] bg-[#F7F7F7] p-4 space-y-1">
          <div className="flex items-center gap-2 text-[#111111] text-xs font-semibold uppercase tracking-wider font-mono">
            <CheckCircle2 className="h-4 w-4 text-[#111111]" />
            <span>Satisfied Criteria</span>
          </div>
          <div className="text-xl font-bold font-mono text-[#111111]">{satisfiedCount} Verified</div>
          <p className="text-[11px] text-[#555555]">100% grounded in vault credentials</p>
        </div>

        <div className="rounded-md border border-[#E5E5E5] bg-[#F7F7F7] p-4 space-y-1">
          <div className="flex items-center gap-2 text-[#555555] text-xs font-semibold uppercase tracking-wider font-mono">
            <AlertTriangle className="h-4 w-4 text-[#555555]" />
            <span>Evidence Gaps</span>
          </div>
          <div className="text-xl font-bold font-mono text-[#111111]">{gapsCount} Pending</div>
          <p className="text-[11px] text-[#555555]">Credentials needed before submission</p>
        </div>

        <div className="rounded-md border border-[#E5E5E5] bg-[#F7F7F7] p-4 space-y-1">
          <div className="flex items-center gap-2 text-[#111111] text-xs font-semibold uppercase tracking-wider font-mono">
            <AlertOctagon className="h-4 w-4 text-[#111111]" />
            <span>Critical Risks</span>
          </div>
          <div className="text-xl font-bold font-mono text-[#111111]">{risksCount} Flagged</div>
          <p className="text-[11px] text-[#555555]">Requires remediation undertaking</p>
        </div>
      </div>

      {/* Primary Recommendation */}
      <div className="rounded-md border border-[#E5E5E5] bg-[#F7F7F7] p-4 space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#111111] font-semibold block">
          PRIMARY PROCUREMENT RECOMMENDATION
        </span>
        <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
          {primaryRecommendation || defaultRecommendation}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {onReviewCritical && (
          <Button
            variant="outline"
            onClick={onReviewCritical}
            className="bg-white border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] text-xs sm:text-sm h-9 px-4 rounded-md cursor-pointer"
          >
            Review Critical Issues
          </Button>
        )}

        <Link href={`/reports/${tenderId}`}>
          <Button
            className="bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm h-9 px-5 rounded-md cursor-pointer"
          >
            Generate Comprehensive Audit Report <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
