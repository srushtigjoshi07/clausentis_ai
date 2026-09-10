'use client';

/**
 * Bid Compliance Overview Dashboard
 *
 * Displays overall compliance score %, status badge, mandatory requirements tally,
 * category progress bars, and high-impact critical findings cards with exact citations.
 */

import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import type { BidComplianceReport } from '@/types/tender-discovery';

interface BidComplianceDashboardProps {
  report: BidComplianceReport;
}

export function BidComplianceDashboard({ report }: BidComplianceDashboardProps) {
  let statusBadge = {
    label: '✓ READY FOR SUBMISSION',
    color: 'bg-[#F7F7F7] text-[#111111] border-[#E5E5E5]',
  };
  if (report.status === 'BLOCKED_CRITICAL_FAILURES') {
    statusBadge = {
      label: '✕ SUBMISSION BLOCKED (CRITICAL FAILURES)',
      color: 'bg-[#111111] text-white border-[#111111]',
    };
  } else if (report.status === 'REQUIRES_ATTENTION') {
    statusBadge = {
      label: '⚠ REQUIRES ATTENTION (ACTION ITEMS)',
      color: 'bg-[#F7F7F7] text-[#555555] border-[#CCCCCC]',
    };
  }

  return (
    <div className="space-y-6 bg-white font-sans">
      {/* 1. Score & High-Level Metrics Summary */}
      <div className="grid gap-4 md:grid-cols-12">
        {/* Main Score Card */}
        <div className="md:col-span-4 rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#777777]">
                BID COMPLIANCE SCORE
              </span>
              <span className="text-[10px] font-mono text-[#777777]">
                Version {report.version}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl sm:text-6xl font-bold font-mono text-[#111111] tracking-tight">
                {report.overallScore}%
              </span>
              <span className="text-xs text-[#777777]">verifiable</span>
            </div>

            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-medium tracking-wide border ${statusBadge.color}`}
              >
                {statusBadge.label}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E5E5] text-[11px] text-[#777777] font-mono mt-4">
            Evaluated {report.documentsCount} documents against mandatory tender clauses.
          </div>
        </div>

        {/* Mandatory Requirements Counters */}
        <div className="md:col-span-8 rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-[0.10em] text-[#111111]">
              Mandatory Requirements Evaluation
            </span>
            <span className="text-xs font-mono text-[#777777]">
              Total Mandatory Criteria: {report.mandatoryTotal}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-md bg-[#F7F7F7] border border-[#E5E5E5]">
              <div className="flex items-center gap-1.5 text-xs text-[#111111] font-mono font-semibold mb-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#111111]" />
                <span>PASS</span>
              </div>
              <div className="text-2xl font-bold text-[#111111] font-mono">
                {report.mandatoryPassed}
              </div>
              <div className="text-[10px] text-[#777777] mt-0.5">Satisfied</div>
            </div>

            <div className="p-3.5 rounded-md bg-[#F7F7F7] border border-[#E5E5E5]">
              <div className="flex items-center gap-1.5 text-xs text-[#111111] font-mono font-semibold mb-1">
                <XCircle className="h-3.5 w-3.5 text-[#111111]" />
                <span>FAIL</span>
              </div>
              <div className="text-2xl font-bold text-[#111111] font-mono">
                {report.mandatoryFailed}
              </div>
              <div className="text-[10px] text-[#777777] mt-0.5">Deficit threshold</div>
            </div>

            <div className="p-3.5 rounded-md bg-[#F7F7F7] border border-[#E5E5E5]">
              <div className="flex items-center gap-1.5 text-xs text-[#111111] font-mono font-semibold mb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-[#111111]" />
                <span>MISSING</span>
              </div>
              <div className="text-2xl font-bold text-[#111111] font-mono">
                {report.mandatoryMissing}
              </div>
              <div className="text-[10px] text-[#777777] mt-0.5">Exhibit absent</div>
            </div>

            <div className="p-3.5 rounded-md bg-[#F7F7F7] border border-[#E5E5E5]">
              <div className="flex items-center gap-1.5 text-xs text-[#555555] font-mono font-semibold mb-1">
                <HelpCircle className="h-3.5 w-3.5 text-[#555555]" />
                <span>WARNINGS</span>
              </div>
              <div className="text-2xl font-bold text-[#111111] font-mono">
                {report.warningsCount}
              </div>
              <div className="text-[10px] text-[#777777] mt-0.5">Advisory items</div>
            </div>
          </div>

          {/* Category Progress Breakdown */}
          <div className="mt-5 space-y-2.5 pt-4 border-t border-[#E5E5E5]">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#777777] block mb-2">
              Category Compliance Breakdown:
            </span>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {report.categoryBreakdown.map((cat) => (
                <div key={cat.category} className="p-2.5 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[#111111] font-medium">{cat.category}</span>
                    <span className="font-mono text-[#555555] font-medium">
                      {cat.passed}/{cat.total} ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white border border-[#E5E5E5] overflow-hidden">
                    <div
                      className="h-full bg-[#111111] transition-all"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Critical Findings & Cross-Document Contradictions */}
      {report.criticalFindings.length > 0 && (
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-3">
            <AlertTriangle className="h-4 w-4 text-[#111111]" />
            <h3 className="text-sm font-semibold text-[#111111] uppercase tracking-wide">
              Critical Findings Requiring Remediation ({report.criticalFindings.length})
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {report.criticalFindings.map((finding) => (
              <div
                key={finding.id}
                className="rounded-md border border-[#E5E5E5] bg-[#F7F7F7] p-4 flex flex-col justify-between text-xs space-y-2.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-white text-[#111111] border border-[#E5E5E5]">
                      {finding.status === 'FAIL' ? 'FAIL' : finding.status === 'MISSING' ? 'MISSING' : 'DEFICIT'}
                    </span>
                    {finding.page && (
                      <span className="text-[10px] font-mono text-[#777777]">
                        Page {finding.page}
                      </span>
                    )}
                  </div>

                  <h4 className="font-semibold text-[#111111] text-xs sm:text-sm leading-snug">
                    {finding.title}
                  </h4>

                  <div className="space-y-1 pt-2 text-[11px]">
                    <div className="flex items-start justify-between text-[#555555]">
                      <span>Required:</span>
                      <span className="text-[#111111] font-mono font-medium">{finding.required}</span>
                    </div>
                    <div className="flex items-start justify-between text-[#555555]">
                      <span>Evidence:</span>
                      <span className="text-[#111111] font-mono font-medium">{finding.evidence}</span>
                    </div>
                    <div className="flex items-start justify-between text-[#555555]">
                      <span>Source:</span>
                      <span className="text-[#777777] truncate max-w-[150px]">{finding.source}</span>
                    </div>
                  </div>
                </div>

                <div className="p-2 rounded bg-white border border-[#E5E5E5] text-[11px] text-[#111111]">
                  <span className="font-semibold">Action:</span> {finding.remediation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Cross-Document Contradiction Signals */}
      {report.crossDocumentMismatches.length > 0 && (
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[#111111]" />
            <h4 className="text-xs font-semibold text-[#111111] uppercase tracking-wide font-mono">
              Cross-Document Mismatches Detected ({report.crossDocumentMismatches.length})
            </h4>
          </div>

          <div className="space-y-2">
            {report.crossDocumentMismatches.map((m, idx) => (
              <div
                key={idx}
                className="p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-[#111111] flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white border border-[#E5E5E5] text-[#111111] uppercase">
                      {m.severity}
                    </span>
                    <span>{m.field}</span>
                  </div>
                  <div className="text-[11px] text-[#555555]">
                    {m.detectedDifference}
                  </div>
                  <div className="text-[10px] text-[#777777] font-mono">
                    Comparing: {m.documentA} vs {m.documentB} {m.pageRef && `(${m.pageRef})`}
                  </div>
                </div>

                <div className="text-[11px] text-[#111111] max-w-sm sm:text-right">
                  {m.impactExplanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
