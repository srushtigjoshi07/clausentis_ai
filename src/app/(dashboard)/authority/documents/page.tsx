import React from 'react';
import Link from 'next/link';
import { 
  Files, 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  Download, 
  ExternalLink,
  ShieldCheck,
  Search,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllBidderDossiers } from '@/lib/compliance/repository';

export const metadata = {
  title: 'Documents Repository | Authority Portal',
  description: 'Procurement document vault and submitted vendor credentials repository.',
};

export default function AuthorityDocumentsPage() {
  const dossiers = getAllBidderDossiers('tender-cpcl-2026-0412');

  const authorityTenderDocs = [
    {
      name: 'CPCL_HPGC_0412_Notice_Inviting_Tender.pdf',
      category: 'Notice Inviting Tender (NIT)',
      size: '3.8 MB',
      clausesExtracted: 14,
      publishedAt: '04 Sep 2026',
      status: 'Extracted & Parsed'
    },
    {
      name: 'Technical_Specification_Schedule_API618.pdf',
      category: 'Technical Specifications',
      size: '8.4 MB',
      clausesExtracted: 28,
      publishedAt: '04 Sep 2026',
      status: 'Extracted & Parsed'
    },
    {
      name: 'Corrigendum_No_1_CPCL_HPGC_0412.pdf',
      category: 'Official Addenda',
      size: '1.1 MB',
      clausesExtracted: 3,
      publishedAt: '04 Sep 2026',
      status: 'Active (v2.0)'
    }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16 font-sans bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5]">
              Document Vault &amp; Vault Repository
            </span>
            <span className="text-[#777777] text-xs">•</span>
            <span className="text-xs text-[#555555] font-mono">CPCL/ENG/2026/HPGC-0412</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111] mt-1">
            Departmental Tender &amp; Vendor Documents
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
            Cryptographically sealed and OCR-parsed PDF documents, audited balance sheets, work orders, and statutory filings.
          </p>
        </div>

        <Link href="/authority/tenders/new">
          <Button className="h-9 px-4 bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs gap-1.5 cursor-pointer shadow-sm rounded-md">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Tender Document</span>
          </Button>
        </Link>
      </div>

      {/* SECTION 1: Tender Authoring Documents */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[#111111] uppercase tracking-wider font-mono">
          Departmental Gazetted Tender Documents
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {authorityTenderDocs.map((doc, idx) => (
            <div key={idx} className="p-4 rounded-lg border border-[#E5E5E5] bg-white space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] font-semibold">
                  {doc.category}
                </span>
                <span className="text-[10px] text-[#777777] font-mono">{doc.size}</span>
              </div>
              <h3 className="text-xs font-semibold text-[#111111] truncate" title={doc.name}>
                {doc.name}
              </h3>
              <div className="flex items-center justify-between text-[11px] text-[#555555] font-mono pt-2 border-t border-[#E5E5E5]">
                <span>{doc.clausesExtracted} Clauses Extracted</span>
                <span className="font-semibold text-[#111111]">{doc.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Submitted Vendor Evidence Packages */}
      <div className="space-y-3 pt-4">
        <h2 className="text-sm font-semibold text-[#111111] uppercase tracking-wider font-mono">
          Submitted Vendor Credentials &amp; Evidence Packages
        </h2>

        <div className="space-y-4">
          {dossiers.map((d) => (
            <div key={d.bidId} className="p-5 rounded-lg border border-[#E5E5E5] bg-white space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E5E5] pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#111111]" />
                  <span className="font-semibold text-[#111111] text-sm">{d.bidderName}</span>
                  <span className="text-xs font-mono text-[#555555]">({d.submissionId})</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                    d.complianceScore >= 70 ? 'bg-[#F7F7F7] text-[#111111] border-[#E5E5E5]' : 'bg-[#111111] text-white border-[#111111]'
                  }`}>
                    {d.complianceScore}% Score
                  </span>
                  <Link href={`/authority/bids/${d.bidId}`}>
                    <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] rounded cursor-pointer font-medium">
                      Inspect Vault
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Document List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {d.requirementResults
                  .filter((r) => r.evidence)
                  .map((r, i) => (
                    <div key={i} className="p-2.5 rounded bg-[#FAFAFA] border border-[#E5E5E5] space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[#777777] font-mono">
                        <span>{r.clauseCode}</span>
                        <span>Page {r.evidence!.pageNumber}</span>
                      </div>
                      <p className="font-semibold text-[#111111] truncate" title={r.evidence!.documentName}>
                        {r.evidence!.documentName}
                      </p>
                      <p className="text-[11px] text-[#555555] line-clamp-1 font-mono">
                        {r.evidence!.extractedText}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
