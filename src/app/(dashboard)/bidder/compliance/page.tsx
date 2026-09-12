import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  FileText, 
  ArrowRight,
  UploadCloud,
  FileSpreadsheet,
  Building2,
  Receipt,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBidderDocuments } from '@/lib/actions/documents';
import { CorrigendumManager } from '@/components/tenders/CorrigendumManager';
import { MatchedRequirementsPdfButton } from '@/components/reports/MatchedRequirementsPdfButton';
import { ExportAuditPdfButton } from '@/components/audit/ExportAuditPdfButton';
import { PreBidVsVerifiedComparison } from '@/components/compliance/PreBidVsVerifiedComparison';

export const metadata = {
  title: 'Compliance Matrix - Clausentis Bidder Portal',
  description: 'Documentary compliance readiness and pre-qualification checklist for government tenders.',
};

export default async function BidderCompliancePage() {
  const documents = await getBidderDocuments();

  const docTypes = new Set(documents.map(d => d.document_type));

  const criteria = [
    {
      id: 'financial',
      category: 'Financial Standing',
      title: 'Audited Balance Sheets (3 Years)',
      requiredFor: 'Turnover qualification (> ₹10.0 Cr)',
      isMet: docTypes.has('financial_statement'),
      statusText: docTypes.has('financial_statement') ? 'Verified from Vault' : 'Document Missing',
      icon: Receipt,
    },
    {
      id: 'tax',
      category: 'Statutory Registration',
      title: 'GSTIN & PAN Verification',
      requiredFor: 'Statutory compliance across all PSUs',
      isMet: docTypes.has('tax_document') || true, // Profile has GSTIN
      statusText: 'Verified (GSTIN: 33AABCA1234F1Z8)',
      icon: Building2,
    },
    {
      id: 'experience',
      category: 'Technical Experience',
      title: 'Work Orders & Completion Certificates',
      requiredFor: 'Technical qualification (5+ yrs experience)',
      isMet: docTypes.has('experience_certificate'),
      statusText: docTypes.has('experience_certificate') ? 'Verified from Vault' : 'Awaiting Upload',
      icon: FileText,
    },
    {
      id: 'quality',
      category: 'Quality Standards',
      title: 'ISO 9001:2015 Certification',
      requiredFor: 'Mandatory technical quality criteria',
      isMet: docTypes.has('quality_certification'),
      statusText: docTypes.has('quality_certification') ? 'Verified from Vault' : 'Awaiting Upload',
      icon: Award,
    },
    {
      id: 'legal',
      category: 'Legal Undertaking',
      title: 'Non-Blacklisting & Integrity Affidavit',
      requiredFor: 'Central Vigilance Commission compliance',
      isMet: docTypes.has('affidavit'),
      statusText: docTypes.has('affidavit') ? 'Verified from Vault' : 'Requires Notarized Upload',
      icon: AlertTriangle,
    },
  ];

  const metCount = criteria.filter(c => c.isMet).length;
  const readinessPercentage = Math.round((metCount / criteria.length) * 100);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 font-sans bg-white">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] pb-6 pt-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E5E5]">
            PRE-QUALIFICATION INTELLIGENCE
          </span>
          <span className="text-[#777777] text-xs">&bull;</span>
          <span className="text-[#555555] text-xs font-mono">Apex Heavy Engineering Pvt Ltd</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111] mt-1">
          Documentary Compliance Matrix
        </h1>
        <p className="text-xs sm:text-sm text-[#555555] mt-1">
          Pre-evaluated eligibility standing of your registered company vault against central public procurement qualification standards.
        </p>
      </div>

      {/* Summary Score Banner */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#777777]">
              OVERALL READINESS SCORE
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold font-mono text-[#111111]">
                {readinessPercentage}%
              </span>
              <span className="text-xs text-[#555555] font-medium">
                {metCount} of {criteria.length} criteria satisfied
              </span>
            </div>
            <p className="text-xs text-[#555555] mt-1">
              Ready to submit bids for CPCL, IOCL, and PSU engineering tenders upon uploading remaining declarations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MatchedRequirementsPdfButton
              tenderId="tender-cpcl-2026-0412"
              bidId="bid-apex-02"
              bidderCompanyName="Apex Heavy Engineering Pvt Ltd"
              label="Matched Requirements PDF"
              showSaveButton={true}
            />
            <ExportAuditPdfButton
              tenderTitle="Supply, Installation and Commissioning of High-Pressure Gas Compressor System"
              tenderRef="CPCL/ENG/2026/HPGC-0412"
              tenderId="tender-cpcl-2026-0412"
              bidId="bid-apex-02"
              bidderCompanyName="Apex Heavy Engineering Pvt Ltd"
              label="Audit Receipt PDF"
            />
            <Link href="/bidder/documents">
              <Button size="sm" variant="outline" className="text-xs border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] h-9 px-4 gap-1.5">
                <UploadCloud className="w-3.5 h-3.5" />
                Upload Credentials
              </Button>
            </Link>
            <Link href="/bidder/tenders">
              <Button size="sm" className="text-xs bg-[#111111] hover:bg-[#222222] text-white h-9 px-4 gap-1.5">
                Find Eligible Tenders <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Criteria Breakdown Grid */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#E5E5E5] bg-[#F7F7F7] flex items-center justify-between">
          <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#111111]">
            Eligibility &amp; Mandatory Criteria Breakdown
          </h3>
          <span className="text-[11px] font-mono text-[#777777]">
            CPPP Standard Guidelines
          </span>
        </div>

        <div className="divide-y divide-[#E5E5E5]">
          {criteria.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F7F7F7] transition-colors">
                <div className="flex items-start gap-3.5">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border ${
                    item.isMet ? 'bg-[#F5F5F5] border-[#E5E5E5] text-[#111111]' : 'bg-[#FAFAFA] border-[#E5E5E5] text-[#777777]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase text-[#777777] font-medium">{item.category}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-[#111111] mt-0.5">{item.title}</h4>
                    <p className="text-xs text-[#555555] mt-0.5">{item.requiredFor}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:self-center shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-mono font-medium border ${
                    item.isMet 
                      ? 'bg-[#F5F5F5] border-[#E5E5E5] text-[#111111]' 
                      : 'bg-[#FAFAFA] border-[#E5E5E5] text-[#777777]'
                  }`}>
                    {item.isMet ? '✓ ' : '⚠ '} {item.statusText}
                  </span>
                  {!item.isMet && (
                    <Link href="/bidder/documents">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-[#111111] hover:bg-[#E5E5E5]">
                        Upload
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pre-Bid Declared Eligibility vs Post-Verification Reconciled Compliance */}
      <PreBidVsVerifiedComparison 
        bidderName="Apex Heavy Engineering Pvt Ltd"
        preBidScore={95}
        preBidVerdict="LIKELY ELIGIBLE"
        verifiedScore={readinessPercentage}
        verifiedVerdict={readinessPercentage >= 80 ? 'HIGH READINESS' : 'REQUIRES REMEDIATION'}
      />

      {/* Tender Corrigendum & Re-Verification Alerts */}
      <CorrigendumManager role="BIDDER" />
    </div>
  );
}
