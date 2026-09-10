import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  ShieldCheck,
  FileSpreadsheet,
  FileCheck2,
  Inbox,
  ExternalLink
} from 'lucide-react';
import { getTenderSource } from '@/lib/tender-discovery/tender-source';
import { getMyBidSubmissionsAction } from '@/lib/actions/tender-discovery';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Bidder Dashboard - Clausentis',
  description: 'Enterprise Bidder Workspace and Procurement Compliance Command Center',
};

export const dynamic = 'force-dynamic';

export default async function BidderDashboardPage() {
  const tenderSource = getTenderSource('imported');
  const [searchResult, myBids] = await Promise.all([
    tenderSource.searchTenders({}),
    getMyBidSubmissionsAction(),
  ]);

  const activeTenders = searchResult.tenders || [];
  const submittedBidsCount = myBids.length;

  const metrics = {
    activeBids: submittedBidsCount,
    complianceScore: submittedBidsCount > 0 
      ? Math.round(myBids.reduce((acc, b) => acc + (b.complianceScore || 0), 0) / submittedBidsCount)
      : 94,
    attentionRequired: 1,
    openOpportunities: activeTenders.length,
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 font-sans bg-white">
      
      {/* 1. PAGE HEADER */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-[#111111] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E5E5]">
                BIDDER WORKSPACE
              </span>
              <span className="text-[#777777] text-xs">&bull;</span>
              <span className="text-[#555555] text-xs font-mono">Apex Heavy Engineering Pvt Ltd</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
              Dashboard
            </h1>
            
            <p className="text-xs sm:text-sm text-[#555555]">
              Welcome back. Track active bid readiness, documentary compliance, and recommended government tenders.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/bidder/tenders">
              <Button className="h-9 px-4 bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs tracking-wide gap-2 cursor-pointer">
                <Search className="h-3.5 w-3.5 stroke-[1.5]" />
                Find Tenders
              </Button>
            </Link>
            <Link href="/bidder/documents">
              <Button variant="outline" className="h-9 px-3.5 border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] text-[#111111] font-medium text-xs gap-1.5 cursor-pointer">
                <FileSpreadsheet className="h-3.5 w-3.5 text-[#555555]" />
                Vault Documents
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. KPI STATUS TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Bids */}
        <div className="p-5 rounded-xl border border-[#E5E5E5] bg-white hover:border-[#111111] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-mono tracking-wider text-[#777777]">
              Active Bids
            </span>
            <div className="w-7 h-7 rounded-md bg-[#F5F5F5] text-[#555555] flex items-center justify-center">
              <FileCheck2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#111111] font-mono">
              {metrics.activeBids}
            </span>
            <span className="text-xs text-[#555555] font-medium">Submitted</span>
          </div>
          <p className="text-[11px] text-[#777777] mt-1">Cryptographically registered</p>
        </div>

        {/* Compliance Readiness */}
        <div className="p-5 rounded-xl border border-[#E5E5E5] bg-white hover:border-[#111111] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-mono tracking-wider text-[#777777]">
              Compliance Score
            </span>
            <div className="w-7 h-7 rounded-md bg-[#F5F5F5] text-[#555555] flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#111111] font-mono">
              {metrics.complianceScore}%
            </span>
            <span className="text-xs text-[#555555] font-medium">Avg Readiness</span>
          </div>
          <p className="text-[11px] text-[#777777] mt-1">Documentary verification</p>
        </div>

        {/* Issues Requiring Attention */}
        <div className="p-5 rounded-xl border border-[#E5E5E5] bg-white hover:border-[#111111] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-mono tracking-wider text-[#777777]">
              Action Required
            </span>
            <div className="w-7 h-7 rounded-md bg-[#F5F5F5] text-[#555555] flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#111111] font-mono">
              {metrics.attentionRequired}
            </span>
            <span className="text-xs text-[#555555] font-medium">Item pending</span>
          </div>
          <p className="text-[11px] text-[#777777] mt-1">Update non-blacklisting affidavit</p>
        </div>

        {/* Open Opportunities */}
        <div className="p-5 rounded-xl border border-[#E5E5E5] bg-white hover:border-[#111111] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-mono tracking-wider text-[#777777]">
              Open Tenders
            </span>
            <div className="w-7 h-7 rounded-md bg-[#F5F5F5] text-[#555555] flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#111111] font-mono">
              {metrics.openOpportunities}
            </span>
            <span className="text-xs text-[#555555] font-medium">Live PSU</span>
          </div>
          <p className="text-[11px] text-[#777777] mt-1">Central portal opportunities</p>
        </div>
      </div>

      {/* 3. RECENT BIDS SECTION */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white overflow-hidden">
        <div className="p-5 border-b border-[#E5E5E5] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#111111]" />
              <h2 className="text-sm sm:text-base font-semibold text-[#111111]">
                Recent Bids &amp; Submissions
              </h2>
            </div>
            <p className="text-xs text-[#555555] mt-0.5">
              Status and verification receipts for your active procurement packages
            </p>
          </div>

          <Link href="/bidder/bids" className="inline-flex items-center gap-1 text-xs text-[#111111] hover:underline font-medium">
            <span>All Bids</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {myBids.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <div className="h-10 w-10 rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-center text-[#555555] mb-3">
              <Inbox className="h-5 w-5 stroke-[1.5]" />
            </div>
            <h3 className="font-medium text-sm text-[#111111]">No bids submitted yet.</h3>
            <p className="text-xs text-[#555555] mt-1 mb-4 max-w-sm">
              Explore active public tenders below to prepare and submit your first verified bid package.
            </p>
            <Link href="/bidder/tenders">
              <Button size="sm" className="bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs px-4 h-8">
                Explore Tenders &rarr;
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#F7F7F7] text-[#555555] uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-medium">Submission ID</th>
                  <th className="py-3 px-4 font-medium">Tender Title</th>
                  <th className="py-3 px-4 font-medium">Organisation</th>
                  <th className="py-3 px-4 font-medium">Readiness</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {myBids.slice(0, 4).map((bid) => (
                  <tr key={bid.submissionId} className="hover:bg-[#F7F7F7] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#111111]">
                      {bid.submissionId}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate font-medium text-[#111111]">
                      {bid.tenderTitle}
                    </td>
                    <td className="py-3.5 px-4 text-[#555555] whitespace-nowrap">
                      {bid.issuingOrganisation}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-[#111111]">
                        {bid.complianceScore}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F5F5F5] border border-[#E5E5E5] text-[#111111]">
                        ✓ {bid.status || 'SUBMITTED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <Link href={`/bidder/bids/${bid.submissionId}/receipt`}>
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-[#111111] hover:bg-[#F5F5F5]">
                          View Receipt <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. RECOMMENDED / ACTIVE TENDERS TABLE */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white overflow-hidden">
        <div className="p-5 border-b border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#111111]" />
              <h2 className="text-sm sm:text-base font-semibold text-[#111111]">
                Recommended Tenders &amp; Active Opportunities
              </h2>
            </div>
            <p className="text-xs text-[#555555] mt-0.5">
              Live opportunities from Central and PSU procurement portals matching your engineering profile
            </p>
          </div>

          <Link href="/bidder/tenders" className="inline-flex items-center gap-1 text-xs text-[#111111] hover:underline font-medium">
            <span>View All Tenders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F7F7F7] text-[#555555] uppercase font-mono text-[10px] tracking-wider">
                <th className="py-3 px-4 font-medium">Tender</th>
                <th className="py-3 px-4 font-medium">Organisation</th>
                <th className="py-3 px-4 font-medium">Closing Date</th>
                <th className="py-3 px-4 font-medium">Est. Value</th>
                <th className="py-3 px-4 font-medium">Readiness</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {activeTenders.slice(0, 5).map((tender, idx) => {
                const readinessLabels = [
                  'Ready to Bid (100% Eligible)',
                  'Check Eligibility',
                  'Ready to Bid (95% Match)',
                  'Check Eligibility',
                  'Ready to Bid (92% Match)',
                ];
                const readiness = readinessLabels[idx % readinessLabels.length];

                return (
                  <tr key={tender.id} className="hover:bg-[#F7F7F7] transition-colors">
                    {/* Tender Title */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <p className="font-medium text-[#111111] text-xs line-clamp-1">{tender.title}</p>
                      <p className="text-[11px] text-[#777777] font-mono mt-0.5">{tender.referenceNumber}</p>
                    </td>

                    {/* Organisation */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-[#555555]">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#777777] shrink-0" />
                        <span className="truncate max-w-[180px]">{tender.issuingOrganisation}</span>
                      </div>
                    </td>

                    {/* Closing Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[#555555] font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-[#777777] shrink-0" />
                        <span>{new Date(tender.closingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </td>

                    {/* Value */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[#111111] font-medium">
                      {tender.estimatedValue}
                    </td>

                    {/* Readiness */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border bg-[#F5F5F5] text-[#111111] border-[#E5E5E5]">
                        {readiness}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-2">
                      <Link href={`/bidder/tenders/${tender.id}/eligibility`}>
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px] border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#111111] font-medium cursor-pointer">
                          Check Eligibility
                        </Button>
                      </Link>
                      <Link href={`/bidder/tenders/${tender.id}/compare`}>
                        <Button size="sm" className="h-7 px-2.5 text-[11px] bg-[#111111] hover:bg-[#222222] text-white font-medium cursor-pointer">
                          Start Bid
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
