'use client';

/**
 * Tender Detail Workspace
 *
 * Displays full procurement specifications, NIT details, critical milestones,
 * tender document catalog, and the primary [START BID VERIFICATION] button.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Clock,
  FileText,
  Download,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DiscoveredTender, DiscoveredTenderDocument } from '@/types/tender-discovery';

interface TenderDetailWorkspaceProps {
  tender: DiscoveredTender;
  onStartVerification: () => void;
  onBackToSearch?: () => void;
}

export function TenderDetailWorkspace({
  tender,
  onStartVerification,
  onBackToSearch,
}: TenderDetailWorkspaceProps) {
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const handleDownloadDoc = (doc: DiscoveredTenderDocument) => {
    setDownloadingDocId(doc.id);
    setTimeout(() => {
      setDownloadingDocId(null);
      alert(`Downloaded: ${doc.fileName} (${(doc.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB)`);
    }, 400);
  };

  return (
    <div className="space-y-6 font-sans bg-white">
      {/* Back link & Eyebrow */}
      <div className="flex items-center justify-between">
        {onBackToSearch && (
          <button
            onClick={onBackToSearch}
            className="inline-flex items-center gap-1.5 text-xs text-[#555555] hover:text-[#111111] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Tender Search
          </button>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#777777]">
            02. TENDER OVERVIEW & REQUIREMENTS
          </span>
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-[#E5E5E5]">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-[#F7F7F7] text-[#111111] border border-[#E5E5E5]">
                Tender ID: {tender.tenderId}
              </span>
              <span className="text-[#777777]">&bull;</span>
              <span className="text-xs font-mono text-[#555555]">
                Ref: {tender.referenceNumber}
              </span>
              <span className="text-[#777777]">&bull;</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono uppercase bg-[#F7F7F7] text-[#111111] border border-[#E5E5E5]">
                {tender.tenderStatus}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111] leading-tight">
              {tender.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#555555] pt-1">
              <span className="flex items-center gap-1.5 font-medium text-[#111111]">
                <Building2 className="h-4 w-4 text-[#111111] stroke-[1.5]" />
                {tender.issuingOrganisation}
              </span>
              <span className="text-[#777777]">&bull;</span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#777777]" />
                {tender.location}
              </span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="shrink-0 w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2.5">
            <Link href={`/bidder/tenders/${tender.id}/eligibility`} className="w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-11 px-5 border-[#111111] bg-white hover:bg-[#F7F7F7] text-[#111111] font-medium text-xs sm:text-sm tracking-wide gap-2 rounded-md cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4 text-[#111111]" />
                <span>Check My Eligibility</span>
              </Button>
            </Link>
            <Button
              onClick={onStartVerification}
              size="lg"
              className="w-full sm:w-auto h-11 px-6 bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm tracking-wide gap-2 rounded-md shadow-xs cursor-pointer transition-colors"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Start Bid Verification</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Commercial & Operational Parameters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 text-xs sm:text-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.10em] text-[#777777] block">
              Estimated Value
            </span>
            <span className="font-mono text-base font-bold text-[#111111]">
              {tender.estimatedValue}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.10em] text-[#777777] block">
              Earnest Money Deposit (EMD)
            </span>
            <span className="font-mono text-sm text-[#111111]">
              {tender.emdAmount}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.10em] text-[#777777] block">
              Closing Date & Time
            </span>
            <span className="font-mono text-sm text-[#111111] font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#777777]" />
              {tender.closingDate} &bull; {tender.closingTime}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-[0.10em] text-[#777777] block">
              Bid Validity Period
            </span>
            <span className="font-mono text-sm text-[#111111]">
              {tender.bidValidityDays} Days
            </span>
          </div>
        </div>
      </div>

      {/* Scope Description & Qualification Criteria Summary */}
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.10em] text-[#111111] border-b border-[#E5E5E5] pb-2">
            Scope of Work & Specification Summary
          </h3>
          <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
            {tender.summaryDescription}
          </p>

          <div className="pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#111111] mb-2">
              Key Technical Specifications Required:
            </h4>
            <div className="grid gap-2">
              {tender.keyTechnicalSpecs.map((spec, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs text-[#111111] bg-[#F7F7F7] p-2.5 rounded-md border border-[#E5E5E5] font-mono"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#111111] mt-0.5 shrink-0" />
                  <span>{spec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pre-Qualification Thresholds Card */}
        <div className="md:col-span-4 rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.10em] text-[#111111] border-b border-[#E5E5E5] pb-2">
            Minimum Pre-Qualification Criteria
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#777777] block">
                Average Annual Turnover
              </span>
              <span className="text-sm font-semibold font-mono text-[#111111]">
                ₹{tender.minimumTurnoverRequired.toFixed(2)} Crore (Min.)
              </span>
            </div>

            <div className="p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#777777] block">
                Technical Experience
              </span>
              <span className="text-sm font-semibold font-mono text-[#111111]">
                {tender.minimumExperienceYears} Years in Similar Domain
              </span>
            </div>

            <div className="p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
              <span className="text-[10px] uppercase font-mono text-[#777777] block">
                Similar Completed Projects
              </span>
              <span className="text-sm font-semibold font-mono text-[#111111]">
                {tender.similarProjectsRequired} Satisfactorily Executed Works
              </span>
            </div>

            {tender.contactDetails && (
              <div className="pt-2 text-[11px] text-[#777777] leading-relaxed">
                <span className="text-[#111111] font-medium">Authority Contact:</span>{' '}
                {tender.contactDetails}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tender Documents Catalog */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3 mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-[#111111] uppercase tracking-[0.08em] flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#111111]" />
              Official Tender Documents & Annexures ({tender.documents.length})
            </h3>
            <p className="text-xs text-[#555555] mt-0.5">
              Review and download the procurement specifications, NIT, and price schedules published by {tender.issuingOrganisation}.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tender.documents.map((doc) => (
            <div
              key={doc.id}
              className="rounded-md border border-[#E5E5E5] bg-white p-4 flex flex-col justify-between hover:border-[#CCCCCC] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#F7F7F7] text-[#111111] border border-[#E5E5E5]">
                    {doc.documentType}
                  </span>
                  <span className="text-[11px] font-mono text-[#777777]">
                    {(doc.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-semibold text-[#111111] mb-1 leading-snug">
                  {doc.title}
                </h4>

                {doc.description && (
                  <p className="text-[11px] text-[#555555] line-clamp-2 mb-3">
                    {doc.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#777777] truncate max-w-[150px]">
                  {doc.fileName}
                </span>

                <Button
                  size="sm"
                  variant="ghost"
                  disabled={downloadingDocId === doc.id}
                  onClick={() => handleDownloadDoc(doc)}
                  className="h-7 px-2.5 text-xs text-[#111111] hover:bg-[#F7F7F7] gap-1.5 cursor-pointer rounded"
                >
                  <Download className="h-3 w-3" />
                  <span>{downloadingDocId === doc.id ? 'Downloading...' : 'Download'}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
