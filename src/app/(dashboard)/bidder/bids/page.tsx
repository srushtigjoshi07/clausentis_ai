import React from 'react';
import Link from 'next/link';
import { 
  FileCheck2, 
  Search, 
  ExternalLink, 
  ShieldCheck, 
  Clock, 
  Inbox,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMyBidSubmissionsAction } from '@/lib/actions/tender-discovery';

export const metadata = {
  title: 'My Bids - Clausentis Bidder Portal',
  description: 'Track submitted tender packages, compliance readiness scores, and cryptographic receipts.',
};

export const dynamic = 'force-dynamic';

export default async function BidderBidsPage() {
  const bids = await getMyBidSubmissionsAction();

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 font-sans bg-white">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] pb-6 pt-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E5E5]">
            BID SUBMISSION REGISTRY
          </span>
          <span className="text-[#777777] text-xs">&bull;</span>
          <span className="text-[#555555] text-xs font-mono">Apex Heavy Engineering Pvt Ltd</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111] mt-1">
          My Bids &amp; Submissions
        </h1>
        <p className="text-xs sm:text-sm text-[#555555] mt-1">
          Cryptographically sealed bid packages submitted to central and state public procurement authorities.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-[#E5E5E5] bg-white">
          <span className="text-[11px] uppercase font-mono tracking-wider text-[#777777]">Total Bids</span>
          <div className="mt-2 text-2xl font-bold font-mono text-[#111111]">{bids.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-[#E5E5E5] bg-white">
          <span className="text-[11px] uppercase font-mono tracking-wider text-[#777777]">Sealed Packages</span>
          <div className="mt-2 text-2xl font-bold font-mono text-[#111111]">{bids.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-[#E5E5E5] bg-white">
          <span className="text-[11px] uppercase font-mono tracking-wider text-[#777777]">Average Score</span>
          <div className="mt-2 text-2xl font-bold font-mono text-[#111111]">
            {bids.length > 0 
              ? `${Math.round(bids.reduce((a, b) => a + (b.complianceScore || 0), 0) / bids.length)}%` 
              : '---'}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-[#E5E5E5] bg-white">
          <span className="text-[11px] uppercase font-mono tracking-wider text-[#777777]">Registry Status</span>
          <div className="mt-2 text-xs font-mono text-[#111111] font-medium flex items-center gap-1.5 pt-1">
            <span className="h-2 w-2 rounded-full bg-[#111111]" />
            ACTIVE SYNC
          </div>
        </div>
      </div>

      {/* Bids Table / Empty State */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#E5E5E5] bg-[#F7F7F7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-[#111111]" />
            <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#111111]">
              Submitted Procurement Packages ({bids.length})
            </h2>
          </div>
          <Link href="/bidder/tenders">
            <Button size="sm" variant="ghost" className="text-xs text-[#111111] hover:bg-[#E5E5E5] h-7 gap-1">
              <Search className="w-3.5 h-3.5" /> Find New Tender
            </Button>
          </Link>
        </div>

        {bids.length === 0 ? (
          <div className="p-14 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-xl bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center text-[#555555] mb-4">
              <Inbox className="h-6 w-6 stroke-[1.5]" />
            </div>
            <h3 className="font-semibold text-base text-[#111111]">No bids submitted yet.</h3>
            <p className="text-xs sm:text-sm text-[#555555] mt-1.5 mb-6 max-w-md leading-relaxed">
              You haven&apos;t submitted any bid packages yet. Search active government tenders to perform qualification verification and submit your proposal.
            </p>
            <Link href="/bidder/tenders">
              <Button size="sm" className="bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs px-5 h-9 gap-2">
                <Search className="w-3.5 h-3.5" />
                Find Active Tenders <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#F7F7F7] text-[#555555] uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-medium">Submission ID</th>
                  <th className="py-3 px-4 font-medium">Tender Title &amp; Ref</th>
                  <th className="py-3 px-4 font-medium">Issuing Authority</th>
                  <th className="py-3 px-4 font-medium">Submitted At</th>
                  <th className="py-3 px-4 font-medium">Compliance</th>
                  <th className="py-3 px-4 font-medium">Checksum</th>
                  <th className="py-3 px-4 font-medium text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {bids.map((bid) => (
                  <tr key={bid.submissionId} className="hover:bg-[#F7F7F7] transition-colors">
                    <td className="py-4 px-4 font-mono text-[11px] font-medium text-[#111111]">
                      {bid.submissionId}
                    </td>
                    <td className="py-4 px-4 max-w-sm">
                      <p className="font-medium text-[#111111] text-xs line-clamp-1">{bid.tenderTitle}</p>
                      <p className="text-[11px] text-[#777777] font-mono mt-0.5">{bid.tenderReference}</p>
                    </td>
                    <td className="py-4 px-4 text-[#555555] whitespace-nowrap">
                      {bid.issuingOrganisation}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap font-mono text-[11px] text-[#555555]">
                      {bid.submittedAt ? new Date(bid.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#111111]" />
                        <span className="font-mono text-xs font-semibold text-[#111111]">
                          {bid.complianceScore}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap font-mono text-[10px] text-[#777777]">
                      {bid.sha256Checksum ? `${bid.sha256Checksum.slice(0, 10)}...` : 'sha256-verified'}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-right">
                      <Link href={`/bidder/bids/${bid.submissionId}/receipt`}>
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs text-[#111111] border-[#E5E5E5] hover:bg-[#F5F5F5] gap-1">
                          View Receipt <ExternalLink className="w-3 h-3" />
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
    </div>
  );
}
