'use client';

import React from 'react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Download, 
  ArrowLeft, 
  FileText, 
  Building2, 
  Calendar, 
  Lock, 
  Hash, 
  Award 
} from 'lucide-react';
import type { BidSubmissionRecord, DiscoveredTender } from '@/types/tender-discovery';
import { ExportAuditPdfButton } from '@/components/audit/ExportAuditPdfButton';
import { MatchedRequirementsPdfButton } from '@/components/reports/MatchedRequirementsPdfButton';

interface BidSubmissionReceiptProps {
  submission: BidSubmissionRecord;
  tender: DiscoveredTender;
  onResetWorkflow: () => void;
}

export function BidSubmissionReceipt({
  submission,
  tender,
  onResetWorkflow,
}: BidSubmissionReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(submission.submittedAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans bg-white">
      {/* Official Success Banner */}
      <div className="bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-white border border-[#E5E5E5] flex items-center justify-center shrink-0 text-[#111111]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-white text-[#111111] border border-[#E5E5E5] text-xs font-mono uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                Submission Package Locked & Sealed
              </div>
              <h1 className="text-2xl font-semibold text-[#111111] tracking-tight">
                Bid Submission Receipt Generated
              </h1>
              <p className="text-sm text-[#555555] mt-1">
                Your bid package has completed 100% mandatory compliance verification and is cryptographically registered.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <MatchedRequirementsPdfButton
              tenderId={tender.id}
              bidId="bid-apex-02"
              bidderCompanyName={submission.bidderProfile.companyName}
              label="Matched Requirements PDF"
              showSaveButton={true}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white border border-[#E5E5E5] text-[#111111] font-medium text-xs sm:text-sm hover:bg-[#F7F7F7] transition-colors cursor-pointer h-auto"
            />
            <ExportAuditPdfButton
              tenderTitle={tender.title}
              tenderRef={tender.referenceNumber}
              bidId="bid-apex-02"
              bidderCompanyName={submission.bidderProfile.companyName}
              label="Export Audit PDF"
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white border border-[#E5E5E5] text-[#111111] font-medium text-xs sm:text-sm hover:bg-[#F7F7F7] transition-colors cursor-pointer h-auto"
            />
            <button
              onClick={handlePrint}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Dossier
            </button>
            <button
              onClick={onResetWorkflow}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-white text-[#111111] font-medium text-xs sm:text-sm hover:bg-[#F7F7F7] transition-colors border border-[#E5E5E5] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              New Bid
            </button>
          </div>
        </div>
      </div>

      {/* Main Official Receipt Card */}
      <div className="bg-white border border-[#E5E5E5] rounded-lg p-6 md:p-8 space-y-6 shadow-xs print:bg-white print:text-black print:border-neutral-300">
        
        {/* Receipt Header */}
        <div className="border-b border-[#E5E5E5] pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-mono tracking-widest text-[#777777]">Clausentis Submission ID</span>
            <div className="text-2xl font-mono font-bold text-[#111111] flex items-center gap-2 mt-1">
              <Hash className="w-5 h-5 text-[#111111]" />
              {submission.submissionId}
            </div>
          </div>
          <div className="sm:text-right">
            <span className="text-xs uppercase font-mono tracking-widest text-[#777777]">Recorded Timestamp</span>
            <div className="text-sm font-mono text-[#555555] mt-1 flex sm:justify-end items-center gap-2">
              <Calendar className="w-4 h-4 text-[#777777]" />
              {formattedDate}
            </div>
          </div>
        </div>

        {/* Verification Certificate Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-md bg-[#F7F7F7] border border-[#E5E5E5]">
          <div>
            <span className="text-xs text-[#777777]">Verification Engine</span>
            <p className="text-sm font-medium text-[#111111] mt-0.5">Clausentis Auditor v2.6</p>
          </div>
          <div>
            <span className="text-xs text-[#777777]">Compliance Score</span>
            <p className="text-sm font-bold font-mono text-[#111111] mt-0.5 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              {submission.complianceScore}% (100% Mandatory Pass)
            </p>
          </div>
          <div>
            <span className="text-xs text-[#777777]">Audit Status</span>
            <p className="text-sm font-semibold text-[#111111] mt-0.5 uppercase tracking-wide">
              {submission.status}
            </p>
          </div>
        </div>

        {/* Tender & Bidder Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Tender Metadata */}
          <div className="space-y-3 p-4 rounded-md bg-[#F7F7F7] border border-[#E5E5E5]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#111111] uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-[#111111]" />
              Tender Details
            </div>
            <div className="space-y-1.5 text-sm">
              <div>
                <span className="text-xs text-[#777777]">Authority: </span>
                <span className="text-[#111111] font-medium">{tender.issuingOrganisation}</span>
              </div>
              <div>
                <span className="text-xs text-[#777777]">Tender Ref: </span>
                <span className="text-[#111111] font-mono text-xs">{tender.referenceNumber}</span>
              </div>
              <div>
                <span className="text-xs text-[#777777]">Title: </span>
                <p className="text-[#555555] text-xs line-clamp-2 mt-0.5">{tender.title}</p>
              </div>
            </div>
          </div>

          {/* Bidder Profile */}
          <div className="space-y-3 p-4 rounded-md bg-[#F7F7F7] border border-[#E5E5E5]">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#111111] uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-[#111111]" />
              Verified Bidder Profile
            </div>
            <div className="space-y-1.5 text-sm">
              <div>
                <span className="text-xs text-[#777777]">Company: </span>
                <span className="text-[#111111] font-medium">{submission.bidderProfile.companyName}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#777777]">GSTIN: </span>
                  <span className="font-mono text-[#111111]">{submission.bidderProfile.gstin}</span>
                </div>
                <div>
                  <span className="text-[#777777]">PAN: </span>
                  <span className="font-mono text-[#111111]">{submission.bidderProfile.pan}</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-[#777777]">Profile Turnover: </span>
                <span className="text-[#555555] text-xs">
                  ₹{submission.bidderProfile.annualTurnoverInCr ?? 18.5} Cr ({submission.bidderProfile.relevantExperienceYears ?? 8} yrs experience)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic Proof and SHA-256 Checksum */}
        <div className="p-4 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#777777] uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#111111]" />
              Package SHA-256 Checksum
            </span>
            <span className="text-[10px] font-mono text-[#777777]">Immutable Audit Seal</span>
          </div>
          <p className="text-xs font-mono text-[#111111] break-all bg-white p-2.5 rounded border border-[#E5E5E5]">
            {submission.sha256Checksum}
          </p>
        </div>

        {/* Document Manifest */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#111111]" />
              Verified Document Manifest ({submission.documentsManifest.length} Documents)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {submission.documentsManifest.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#111111] shrink-0" />
                  <span className="font-medium text-[#111111] truncate">{doc.name}</span>
                </div>
                <span className="text-[10px] font-mono text-[#777777] uppercase shrink-0 bg-white px-2 py-0.5 rounded border border-[#E5E5E5]">
                  {doc.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Statutory & Official Disclaimer */}
        <div className="p-4 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-[#111111]">
            <ShieldCheck className="w-4 h-4" />
            Audit & Submission Notice
          </div>
          <p className="text-[#555555] leading-relaxed">
            {submission.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
