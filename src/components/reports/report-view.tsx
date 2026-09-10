'use client';

import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { TenderReportData } from '@/lib/actions/reports';
import { TenderRequirementRow } from '@/lib/actions/tenders';

interface ReportViewProps {
  reportData: TenderReportData;
}

export function ReportView({ reportData }: ReportViewProps) {
  const { tender, requirements, complianceResults, summary } = reportData;

  const handlePrint = () => {
    window.print();
  };

  const uploadDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(tender.created_at));

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-16 font-sans">
      
      {/* Top Action Bar (Hidden on Print) */}
      <div className="print:hidden flex items-center justify-between gap-4 border-b border-[#E5E5E5] pb-4">
        <Link href="/reports" className="inline-flex items-center text-xs sm:text-sm text-[#555555] hover:text-[#111111] transition-colors">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5 stroke-[1.5]" />
          Back to Reports
        </Link>
        <div className="flex items-center gap-3">
          <Link href={`/tenders/${tender.id}`}>
            <Button variant="outline" size="sm" className="bg-white border-[#E5E5E5] text-[#111111] text-xs sm:text-sm hover:bg-[#F7F7F7] h-9 px-4">
              View Workspace
            </Button>
          </Link>
          <Button 
            size="sm" 
            onClick={handlePrint}
            className="bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm h-9 px-5 gap-2"
          >
            <Printer className="h-3.5 w-3.5 stroke-[1.5]" />
            Download / Print Report
          </Button>
        </div>
      </div>

      {/* Main Report Document Container */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 sm:p-10 shadow-sm space-y-8 print:shadow-none print:border-none print:p-0">
        
        {/* 1. Header & Title Banner */}
        <div className="border-b border-[#E5E5E5] pb-6">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#111111] text-white">
                <ShieldCheck className="h-4 w-4 stroke-[1.5]" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-[#111111]">
                CLAUSENTIS PROCUREMENT INTELLIGENCE
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#777777] uppercase tracking-wider font-mono">
              CONFIDENTIAL BID DOSSIER
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#111111]">
            {tender.title}
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1.5 font-mono">
            Compliance &amp; Bid Readiness Evaluation Report &bull; Analyzed on {uploadDate}
          </p>
        </div>

        {/* 2. Executive Metrics Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777] block mb-1">
              Readiness Score
            </span>
            <div className="text-3xl sm:text-4xl font-semibold text-[#111111] tracking-tight">
              {summary.readinessScore} <span className="text-sm font-mono text-[#777777]">/ 100</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777] block mb-1">
              Total Criteria
            </span>
            <div className="text-3xl sm:text-4xl font-semibold text-[#111111] tracking-tight">
              {summary.totalRequirements} <span className="text-sm font-mono text-[#777777]">Clauses</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777] block mb-1">
              Compliant Matches
            </span>
            <div className="text-3xl sm:text-4xl font-semibold text-[#111111] tracking-tight">
              {summary.compliantCount}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777] block mb-1">
              Risk Profile
            </span>
            <div className="text-3xl sm:text-4xl font-semibold capitalize tracking-tight text-[#111111]">
              {summary.riskLevel}
            </div>
          </div>
        </div>

        {/* 3. Critical Issues */}
        {summary.criticalIssues.length > 0 ? (
          <div className="p-5 rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] space-y-3">
            <div className="flex items-center gap-2 text-[#111111]">
              <AlertTriangle className="h-5 w-5 stroke-[1.5]" />
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                Critical Disqualification Alerts ({summary.criticalIssues.length})
              </h3>
            </div>
            <div className="space-y-2 text-xs sm:text-sm">
              {summary.criticalIssues.map((issue: TenderRequirementRow) => (
                <div key={issue.id} className="p-3.5 rounded-lg bg-white border border-[#E5E5E5]">
                  <div className="font-semibold text-[#111111]">{issue.name}</div>
                  <p className="text-[#555555] mt-1 leading-relaxed">{issue.description}</p>
                  <span className="text-xs text-[#111111] font-mono mt-1.5 block font-medium">
                    Source: Page {issue.source_page || 1} &bull; Mandatory Threshold Condition
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#111111] shrink-0 stroke-[1.5]" />
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-[#111111] uppercase tracking-wider">No Critical Disqualifiers Detected</h4>
              <p className="text-xs sm:text-sm text-[#555555]">All mandatory eligibility thresholds are supported by company credentials.</p>
            </div>
          </div>
        )}

        {/* 4. Complete Structured Requirements Matrix */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
            <h3 className="text-sm sm:text-base font-semibold text-[#111111] uppercase tracking-wider">
              Detailed Requirements &amp; Compliance Breakdown
            </h3>
            <span className="text-xs text-[#777777] font-mono">
              {requirements.length} Evaluated
            </span>
          </div>

          <div className="space-y-3">
            {requirements.map((req: TenderRequirementRow) => {
              const comp = complianceResults.find((c) => c.requirement_id === req.id);
              const isCompliant = comp?.status === 'compliant';

              return (
                <div 
                  key={req.id} 
                  className="p-4 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-[#555555] bg-white border border-[#E5E5E5] px-2 py-0.5 rounded">
                        {req.category}
                      </span>
                      {req.mandatory && (
                        <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-white bg-[#111111] px-2 py-0.5 rounded">
                          Mandatory
                        </span>
                      )}
                      <span className="text-xs sm:text-sm font-semibold text-[#111111]">
                        {req.name}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono uppercase tracking-wider border ${
                      isCompliant 
                        ? 'bg-white text-[#111111] border-[#E5E5E5]' 
                        : 'bg-[#111111] text-white border-[#111111]'
                    }`}>
                      {comp?.status ? comp.status.replace('_', ' ') : 'Verified'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
                    {req.description}
                  </p>

                  {/* Grounded Quote / Source */}
                  {req.source_text && (
                    <blockquote className="text-xs sm:text-sm italic text-[#555555] bg-white p-2.5 rounded border-l-2 border-[#111111]">
                      &ldquo;{req.source_text}&rdquo; &mdash; <span className="text-[#111111] font-mono font-medium">Page {req.source_page || 1}</span>
                    </blockquote>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Recommendations & Disclaimer */}
        <div className="pt-4 border-t border-[#E5E5E5] text-xs text-[#777777] space-y-1">
          <p className="font-semibold text-[#111111]">Clausentis Analysis Disclaimer:</p>
          <p className="leading-relaxed text-[#555555]">
            This report is synthesized from tender and bidder documents using deterministic extraction and inference models. Citations point to exact source clauses and pages. The AI assists; the procurement officer decides. Verify all findings prior to final submission.
          </p>
        </div>

      </div>

    </div>
  );
}