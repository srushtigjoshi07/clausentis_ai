'use client';

/**
 * Bid Readiness & Submission Gate Component
 *
 * Evaluates whether 100% of mandatory requirements are satisfied.
 * - If mandatory failures, missing declarations, or critical contradictions exist:
 *   BLOCKED state with actionable remediation list, [FIX ISSUES], and [RE-RUN VERIFICATION].
 * - If 100% mandatory compliance passed:
 *   READY state unlocking [REVIEW FINAL BID] button.
 */

import {
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  UploadCloud,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BidComplianceReport } from '@/types/tender-discovery';

interface BidReadinessGateProps {
  report: BidComplianceReport;
  onFixIssues: () => void;
  onRerunVerification: () => void;
  onProceedToFinalReview: () => void;
  isReverifying?: boolean;
}

export function BidReadinessGate({
  report,
  onFixIssues,
  onRerunVerification,
  onProceedToFinalReview,
  isReverifying = false,
}: BidReadinessGateProps) {
  const isPassed = report.mandatoryFailed === 0 && report.mandatoryMissing === 0;

  // Build concrete required actions
  const requiredActions: string[] = [];
  report.criticalFindings.forEach((f) => {
    requiredActions.push(`${f.title}: ${f.remediation}`);
  });

  if (requiredActions.length === 0 && !isPassed) {
    if (report.mandatoryFailed > 0) {
      requiredActions.push(`Resolve ${report.mandatoryFailed} failed mandatory threshold requirements.`);
    }
    if (report.mandatoryMissing > 0) {
      requiredActions.push(`Upload ${report.mandatoryMissing} missing mandatory documents.`);
    }
  }

  return (
    <div className="rounded-lg border border-[#E5E5E5] p-6 sm:p-8 bg-white shadow-xs font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#E5E5E5]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#E5E5E5] bg-[#F7F7F7] text-[#111111]">
            {isPassed ? (
              <ShieldCheck className="h-6 w-6 stroke-[1.5]" />
            ) : (
              <ShieldAlert className="h-6 w-6 stroke-[1.5]" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#777777]">
                BID READINESS GATE
              </span>
              <span className="text-[#777777]">&bull;</span>
              <span className="text-[11px] font-mono text-[#555555]">
                Version {report.version}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-semibold text-[#111111] tracking-tight">
              {isPassed ? 'Bid Package Ready for Submission' : 'Bid Submission Currently Blocked'}
            </h3>

            <p className="text-xs sm:text-sm text-[#555555] mt-1 max-w-xl">
              {isPassed
                ? 'All mandatory pre-qualification criteria, statutory certifications, and commercial thresholds are verified compliant.'
                : 'Mandatory tender criteria remain unsatisfied or contain material discrepancies. Per procurement regulations, submissions with critical failures are disqualified during initial gate review.'}
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
          {!isPassed ? (
            <>
              <Button
                onClick={onFixIssues}
                variant="outline"
                className="w-full sm:w-auto h-10 px-5 border-[#E5E5E5] bg-white text-[#111111] hover:bg-[#F7F7F7] text-xs sm:text-sm gap-2 cursor-pointer rounded-md"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Fix Issues (Upload)</span>
              </Button>

              <Button
                disabled={isReverifying}
                onClick={onRerunVerification}
                variant="outline"
                className="w-full sm:w-auto h-10 px-5 border-[#E5E5E5] bg-white text-[#111111] hover:bg-[#F7F7F7] text-xs sm:text-sm gap-2 cursor-pointer rounded-md"
              >
                <RefreshCw className={`h-4 w-4 ${isReverifying ? 'animate-spin' : ''}`} />
                <span>Re-run Verification</span>
              </Button>

              <Button
                onClick={onProceedToFinalReview}
                className="w-full sm:w-auto h-10 px-5 bg-[#111111] hover:bg-[#222222] text-white text-xs sm:text-sm gap-2 cursor-pointer rounded-md font-medium"
              >
                <FileCheck className="h-4 w-4" />
                <span>Submit with Warnings</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              onClick={onProceedToFinalReview}
              size="lg"
              className="w-full sm:w-auto h-11 px-7 bg-[#111111] hover:bg-[#222222] text-white font-medium text-sm tracking-wide gap-2.5 rounded-md shadow-xs cursor-pointer transition-colors"
            >
              <FileCheck className="h-4 w-4" />
              <span>Submit Bid Package</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Checklist & Gate Details */}
      <div className="pt-6">
        {isPassed ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs font-mono">
            <div className="p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] flex items-center gap-2 text-[#111111]">
              <Check className="h-4 w-4 text-[#111111] shrink-0" />
              <span>All mandatory documents present</span>
            </div>
            <div className="p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] flex items-center gap-2 text-[#111111]">
              <Check className="h-4 w-4 text-[#111111] shrink-0" />
              <span>Financial turnover satisfied</span>
            </div>
            <div className="p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] flex items-center gap-2 text-[#111111]">
              <Check className="h-4 w-4 text-[#111111] shrink-0" />
              <span>Technical experience verified</span>
            </div>
            <div className="p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] flex items-center gap-2 text-[#111111]">
              <Check className="h-4 w-4 text-[#111111] shrink-0" />
              <span>Statutory registrations verified</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-[#111111] font-semibold">
              {requiredActions.length} Action(s) Required Before Bid Submission:
            </div>
            <div className="space-y-2">
              {requiredActions.map((act, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] flex items-start gap-2.5 text-xs text-[#111111]"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#111111] text-white font-mono text-[11px] font-bold">
                    {idx + 1}
                  </span>
                  <span className="pt-0.5 leading-relaxed text-[#555555]">{act}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
