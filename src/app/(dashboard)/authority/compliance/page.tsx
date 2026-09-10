import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  ArrowRight,
  Filter,
  FileText,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllBidderDossiers, STANDARD_CPCL_REQUIREMENTS } from '@/lib/compliance/repository';
import { MatchedRequirementsPdfButton } from '@/components/reports/MatchedRequirementsPdfButton';
import { ExportAuditPdfButton } from '@/components/audit/ExportAuditPdfButton';

export const metadata = {
  title: 'Compliance Matrix | Authority Portal',
  description: 'Clause-by-clause compliance evaluation across all submitted bidder proposals.',
};

export default function AuthorityCompliancePage() {
  const dossiers = getAllBidderDossiers('tender-cpcl-2026-0412');
  const requirements = STANDARD_CPCL_REQUIREMENTS;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16 font-sans bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5]">
              Master Evaluation Matrix
            </span>
            <span className="text-[#777777] text-xs">•</span>
            <span className="text-xs text-[#555555] font-mono">CPCL/ENG/2026/HPGC-0412</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111] mt-1">
            Clause-by-Clause Compliance Matrix
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
            Systematic evaluation of financial thresholds, technical specifications, and statutory undertakings across all {dossiers.length} proposals.
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
            label="Audit Trail PDF"
          />
          <Link href="/authority/tenders/tender-cpcl-2026-0412/compare-bids">
            <Button className="h-9 px-4 bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs gap-1.5 cursor-pointer shadow-sm rounded-md">
              <Users className="w-3.5 h-3.5" />
              <span>Side-by-Side Comparison</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Compliance Master Table */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed border-collapse text-xs min-w-[950px]">
            <colgroup>
              <col className="w-[34%]" />
              <col className="w-[12%]" />
              {dossiers.map((d) => (
                <col key={d.bidId} style={{ width: `${54 / Math.max(dossiers.length, 1)}%` }} />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F7F7F7] text-[#111111] font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3.5 font-semibold">Tender Clause &amp; Requirement</th>
                <th className="py-3 px-3.5 font-semibold">Type</th>
                {dossiers.map((d) => (
                  <th key={d.bidId} className="py-3 px-3.5 font-semibold text-center border-l border-[#E5E5E5]">
                    <div>
                      <p className="font-bold text-[#111111] text-xs truncate">{d.shortName}</p>
                      <span className="font-mono text-[10px] text-[#555555]">{d.complianceScore}% ({d.riskLevel} Risk)</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {requirements.map((req) => (
                <tr key={req.id} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[#111111] text-[11px]">{req.clauseCode}</span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#F5F5F5] border border-[#E5E5E5] text-[#555555]">
                          {req.category}
                        </span>
                      </div>
                      <p className="font-semibold text-[#111111] text-xs leading-snug">{req.title}</p>
                      <p className="text-[10px] text-[#777777] leading-relaxed">{req.description}</p>
                    </div>
                  </td>

                  <td className="py-3.5 px-3.5 font-mono text-[10px] text-[#555555] align-top">
                    {req.mandatory ? <span className="font-bold text-[#111111]">MANDATORY</span> : 'OPTIONAL'}
                  </td>

                  {dossiers.map((d) => {
                    const res = d.requirementResults.find((r) => r.requirementId === req.id);
                    const status = res?.status || 'MISSING';
                    return (
                      <td key={d.bidId} className="py-3.5 px-3.5 text-center border-l border-[#E5E5E5] align-top break-words overflow-wrap-anywhere">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                            status === 'PASS'
                              ? 'bg-[#F7F7F7] text-[#111111] border-[#CCCCCC]'
                              : status === 'FAIL'
                              ? 'bg-[#111111] text-white border-[#111111]'
                              : status === 'WARNING'
                              ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                              : 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]'
                          }`}>
                            {status === 'PASS' && <CheckCircle2 className="w-3 h-3 text-[#111111]" />}
                            {status === 'FAIL' && <XCircle className="w-3 h-3 text-white" />}
                            {status === 'WARNING' && <AlertTriangle className="w-3 h-3 text-[#B45309]" />}
                            {status === 'MISSING' && <XCircle className="w-3 h-3 text-[#991B1B]" />}
                            {status}
                          </span>
                          <span className="text-[10px] text-[#555555] font-mono block break-words max-w-[140px]" title={res?.verifiedValue}>
                            {res?.verifiedValue || 'No evidence'}
                          </span>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
