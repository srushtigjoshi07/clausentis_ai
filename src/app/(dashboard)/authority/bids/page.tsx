'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import { getAllBidderDossiers } from '@/lib/compliance/repository';

export default function AuthoritySubmittedBidsPage() {
  const tender = {
    id: 'tender-cpcl-2026-0412',
    title: 'Supply, Installation and Commissioning of High-Pressure Gas Compressor System at Manali Refinery',
    reference: 'CPCL/ENG/2026/HPGC-0412',
    totalBidsReceived: 27,
  };

  const dossiers = getAllBidderDossiers(tender.id);

  const bids = dossiers.map((d) => ({
    id: d.bidId,
    bidderName: d.bidderName,
    registrationNumber: d.registrationNumber,
    complianceScore: d.complianceScore,
    riskLevel: d.riskLevel,
    status: d.officerDecision ? `Decision: ${d.officerDecision.decision}` : d.aiRecommendation.recommendation,
    mandatoryPassed: d.mandatoryPassed === d.mandatoryTotal,
    turnover: d.requirementResults.find(r => r.ruleType === 'MINIMUM_VALUE')?.verifiedValue || '₹12.40 Cr',
    experience: d.requirementResults.find(r => r.ruleType === 'YEARS_EXPERIENCE')?.verifiedValue || '5.0 Yrs',
    submittedDate: d.submittedAt,
    submissionId: d.submissionId,
  }));

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 font-sans bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5]">
              Procurement Oversight
            </span>
            <span className="text-[#777777] text-xs">•</span>
            <span className="text-xs text-[#555555] font-mono">Real-Time Submissions Intake</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111] mt-1">
            Submitted Bids & Proposals
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
            Incoming vendor proposals automatically evaluated against tender clauses with transparent evidence trails.
          </p>
        </div>

        <Link href={`/authority/tenders/${tender.id}/compare-bids`}>
          <Button className="h-9 px-4 bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs gap-1.5 cursor-pointer shadow-sm rounded-md">
            <Users className="w-3.5 h-3.5" />
            <span>Compare All Bidders Side-by-Side</span>
          </Button>
        </Link>
      </div>

      {/* Tender Header Banner */}
      <div className="p-5 rounded-lg border border-[#E5E5E5] bg-[#F7F7F7] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono text-[#777777]">Tender:</span>
            <span className="text-xs text-[#111111] font-mono font-semibold">{tender.reference}</span>
          </div>
          <h2 className="text-base font-semibold text-[#111111] mt-0.5">{tender.title}</h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono bg-white px-3 py-1.5 rounded-md border border-[#E5E5E5] text-[#111111] font-semibold">
            {tender.totalBidsReceived} bids received
          </span>
        </div>
      </div>

      {/* Submitted Bids List */}
      <div className="space-y-4">
        {bids.map((bid) => (
          <div
            key={bid.id}
            className="p-5 sm:p-6 rounded-lg border border-[#E5E5E5] bg-white hover:border-[#CCCCCC] transition-all space-y-4 shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E5E5] pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-[#777777]">{bid.submissionId}</span>
                  <span className="text-[#777777] text-xs">•</span>
                  <span className="text-xs text-[#555555] font-mono">{bid.registrationNumber}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#111111]">
                  {bid.bidderName}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                {/* Risk Level Badge */}
                {bid.riskLevel === 'LOW' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F7F7F7] text-[#111111] border border-[#E5E5E5]">
                    <CheckCircle2 className="w-3 h-3 text-[#111111]" />
                    Risk: LOW
                  </span>
                )}
                {bid.riskLevel === 'MEDIUM' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F7F7F7] text-[#555555] border border-[#CCCCCC]">
                    <AlertTriangle className="w-3 h-3 text-[#555555]" />
                    Risk: MEDIUM
                  </span>
                )}
                {bid.riskLevel === 'HIGH' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#111111] text-white border border-[#111111]">
                    <XCircle className="w-3 h-3 text-white" />
                    Risk: HIGH
                  </span>
                )}

                <Link href={`/authority/bids/${bid.id}`}>
                  <Button size="sm" className="h-8 px-4 bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs gap-1.5 cursor-pointer rounded-md">
                    <span>Review Proposal</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Metrics ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-[#777777] uppercase font-mono">Compliance Score</span>
                <p className="font-mono font-bold text-sm text-[#111111] mt-0.5">
                  {bid.complianceScore}%
                </p>
              </div>

              <div>
                <span className="text-[10px] text-[#777777] uppercase font-mono">Review Status</span>
                <p className="font-semibold text-[#111111] mt-0.5">{bid.status}</p>
              </div>

              <div>
                <span className="text-[10px] text-[#777777] uppercase font-mono">Audited Turnover</span>
                <p className="font-mono text-[#555555] mt-0.5">{bid.turnover} ({bid.experience} exp)</p>
              </div>

              <div>
                <span className="text-[10px] text-[#777777] uppercase font-mono">Submitted At</span>
                <p className="font-mono text-[#777777] mt-0.5">{bid.submittedDate}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
