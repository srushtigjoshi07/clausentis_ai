import React from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  FileText, 
  Download, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllStructuredReports } from '@/lib/actions/reports';
import { ExportAuditPdfButton } from '@/components/audit/ExportAuditPdfButton';
import { MatchedRequirementsPdfButton } from '@/components/reports/MatchedRequirementsPdfButton';

export const metadata = {
  title: 'Statutory Reports | Authority Portal',
  description: 'Comprehensive compliance and evaluation reports generated from verified procurement evidence.',
};

export default async function AuthorityReportsPage() {
  const reports = await getAllStructuredReports('tender-cpcl-2026-0412');

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16 font-sans bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5]">
              CVC Defensible Intelligence
            </span>
            <span className="text-[#777777] text-xs">•</span>
            <span className="text-xs text-[#555555] font-mono">CPCL/ENG/2026/HPGC-0412</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111] mt-1">
            Procurement Compliance &amp; Evaluation Reports
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
            Audit-grade dossiers generated directly from deterministic compliance evaluations, statutory provider checks, and evidence citations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MatchedRequirementsPdfButton
            tenderId="tender-cpcl-2026-0412"
            label="Matched Requirements PDF"
            showSaveButton={true}
          />
          <ExportAuditPdfButton
            tenderTitle="Supply, Installation and Commissioning of High-Pressure Gas Compressor System"
            tenderRef="CPCL/ENG/2026/HPGC-0412"
            tenderId="tender-cpcl-2026-0412"
            label="Export Full Audit PDF"
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report, idx) => (
          <div
            key={report.id}
            className="p-5 rounded-lg border border-[#E5E5E5] bg-white hover:border-[#CCCCCC] transition-all space-y-4 shadow-xs"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#E5E5E5] pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] font-semibold">
                    Report #{idx + 1}
                  </span>
                  <span className="text-[11px] font-mono text-[#777777]">
                    {report.recordCount} Records Analyzed
                  </span>
                </div>
                <h3 className="text-base font-semibold text-[#111111]">
                  {report.title}
                </h3>
              </div>

              <span className="w-2 h-2 rounded-full bg-[#111111] shrink-0 mt-1" />
            </div>

            <p className="text-xs text-[#555555] leading-relaxed">
              {report.description}
            </p>

            {/* Structured Report Preview */}
            <div className="p-3 rounded-md bg-[#FAFAFA] border border-[#E5E5E5] text-xs font-mono space-y-1 text-[#333333]">
              <div className="flex items-center justify-between text-[11px] text-[#777777]">
                <span>Generated: {report.generatedAt}</span>
                <span className="uppercase">{report.type.replace(/_/g, ' ')}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#555555] font-mono">
                Status: Complete &amp; Grounded
              </span>
              <div className="flex items-center gap-2">
                {report.type === 'REQUIREMENT_WISE_COMPLIANCE' ? (
                  <MatchedRequirementsPdfButton
                    tenderId="tender-cpcl-2026-0412"
                    label="Download Matrix PDF"
                    showSaveButton={true}
                  />
                ) : (
                  <ExportAuditPdfButton
                    tenderTitle="Supply, Installation and Commissioning of High-Pressure Gas Compressor System"
                    tenderRef="CPCL/ENG/2026/HPGC-0412"
                    tenderId="tender-cpcl-2026-0412"
                    label="Download PDF"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
