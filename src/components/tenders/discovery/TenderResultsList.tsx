'use client';

/**
 * Enterprise Procurement Tender Results List
 *
 * Displays active public tenders with closing countdowns, EMD amounts,
 * issuing authority, category, document counts, and [VIEW TENDER] trigger.
 */

import {
  Building2,
  Clock,
  FileText,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DiscoveredTender } from '@/types/tender-discovery';

interface TenderResultsListProps {
  tenders: DiscoveredTender[];
  onSelectTender: (tender: DiscoveredTender) => void;
  selectedTenderId?: string;
  sourceUsed?: string;
  searchDurationMs?: number;
}

export function TenderResultsList({
  tenders,
  onSelectTender,
  selectedTenderId,
  sourceUsed = 'Public Procurement Portal',
  searchDurationMs = 0,
}: TenderResultsListProps) {
  if (tenders.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E5E5] bg-white p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] mb-3">
          <AlertCircle className="h-6 w-6 stroke-[1.5]" />
        </div>
        <h3 className="text-lg font-semibold text-[#111111]">No Active Tenders Found</h3>
        <p className="mt-1 text-sm text-[#555555] max-w-md mx-auto">
          No open tenders matched your criteria. Try adjusting the issuing organisation, clearing the keyword, or switching to the Public Archive repository.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#777777]">
            ACTIVE TENDERS — {tenders.length} {tenders.length === 1 ? 'RESULT' : 'RESULTS'}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" />
          <span className="text-xs text-[#111111] font-mono font-medium">LIVE EVALUATION READY</span>
        </div>
        <div className="text-[11px] text-[#777777] font-mono">
          {sourceUsed} &bull; {searchDurationMs}ms
        </div>
      </div>

      {/* Tender Cards Grid */}
      <div className="grid gap-4">
        {tenders.map((tender) => {
          const isSelected = selectedTenderId === tender.id || selectedTenderId === tender.tenderId;

          return (
            <div
              key={tender.id}
              className={`rounded-lg border transition-colors p-5 sm:p-6 relative overflow-hidden bg-white shadow-xs ${
                isSelected
                  ? 'border-[#111111] ring-1 ring-[#111111]'
                  : 'border-[#E5E5E5] hover:border-[#CCCCCC]'
              }`}
            >
              {/* Top Row: Ref & Status Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#111111] font-semibold tracking-wide">
                    ID: {tender.tenderId}
                  </span>
                  <span className="text-[#777777]">&bull;</span>
                  <span className="text-xs font-mono text-[#555555]">
                    REF: {tender.referenceNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-medium uppercase tracking-wider bg-[#F7F7F7] text-[#111111] border border-[#E5E5E5]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" />
                    {tender.tenderStatus}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider bg-[#F7F7F7] text-[#555555] border border-[#E5E5E5]">
                    {tender.category}
                  </span>
                </div>
              </div>

              {/* Tender Title */}
              <h3 className="text-lg sm:text-xl font-semibold text-[#111111] tracking-tight mb-2 leading-snug">
                {tender.title}
              </h3>

              {/* Issuing Organisation */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#555555] mb-4">
                <Building2 className="h-4 w-4 text-[#111111] stroke-[1.5] shrink-0" />
                <span className="font-medium text-[#111111]">{tender.issuingOrganisation}</span>
                <span className="text-[#777777]">&bull;</span>
                <span className="text-[#555555] truncate">{tender.location}</span>
              </div>

              {/* Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] text-xs mb-4">
                {/* Published Date */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#777777] mb-0.5">
                    Published
                  </div>
                  <div className="text-[#111111] font-mono">{tender.publishedDate}</div>
                </div>

                {/* Closing Date & Time */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#111111] mb-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-[#777777]" /> Closing Date
                  </div>
                  <div className="text-[#111111] font-mono font-medium">
                    {tender.closingDate} &bull; {tender.closingTime}
                  </div>
                </div>

                {/* EMD */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#777777] mb-0.5">
                    EMD Required
                  </div>
                  <div className="text-[#111111] font-mono">{tender.emdAmount}</div>
                </div>

                {/* Estimated Value */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#777777] mb-0.5">
                    Estimated Value
                  </div>
                  <div className="text-[#111111] font-mono font-medium">
                    {tender.estimatedValue}
                  </div>
                </div>
              </div>

              {/* Bottom Actions & Document Count */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-[#E5E5E5]">
                <div className="flex items-center gap-4 text-xs text-[#555555]">
                  <span className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-[#111111]" />
                    {tender.documents.length} Tender Documents Available
                  </span>
                  <span className="hidden sm:inline text-[#777777]">&bull;</span>
                  <span className="hidden sm:inline text-[11px] text-[#555555]">
                    Min. Turnover: ₹{tender.minimumTurnoverRequired} Cr &bull; {tender.minimumExperienceYears} Yrs Exp.
                  </span>
                </div>

                <Button
                  onClick={() => onSelectTender(tender)}
                  className="w-full sm:w-auto h-9 px-5 bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs tracking-wide gap-2 rounded-md shadow-xs cursor-pointer transition-colors"
                >
                  <span>View Tender</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
