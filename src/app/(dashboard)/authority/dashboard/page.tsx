import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  PlusCircle, 
  Inbox, 
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTenderSource } from '@/lib/tender-discovery/tender-source';
import { getAllBidderDossiers } from '@/lib/compliance/repository';
import { ExecutiveDashboardCommandCenter } from '@/components/dashboard/ExecutiveDashboardCommandCenter';

export const metadata = {
  title: 'Authority Dashboard - Clausentis',
  description: 'Procurement Authority Command Center: Manage tenders, evaluate bids, and compare proposals.',
};

export default async function AuthorityDashboardPage() {
  const tenderSource = getTenderSource('imported');
  const searchRes = await tenderSource.searchTenders({});
  const activeTenders = searchRes.tenders;

  const dossiers = getAllBidderDossiers();

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* 1. HEADER */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.16em] text-[#111111] bg-[#F5F5F5] px-2.5 py-0.5 rounded border border-[#E5E5E5]">
                TENDER AUTHORITY COMMAND CENTER
              </span>
              <span className="text-[#777777] text-xs">&bull;</span>
              <span className="text-[#555555] text-xs font-mono">Chennai Petroleum Corporation Limited (PSU)</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-[#111111]">
              Procurement Oversight &amp; Evaluation
            </h1>
            
            <p className="text-sm sm:text-base text-[#555555] leading-relaxed">
              Publish tenders, automatically extract qualification criteria, inspect incoming vendor proposals, and compare competing bids side-by-side.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/authority/tenders/new">
              <Button className="h-10 px-5 bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm tracking-wide gap-2 cursor-pointer">
                <PlusCircle className="h-4 w-4 stroke-[2]" />
                Publish New Tender
              </Button>
            </Link>
            <Link href="/authority/bids">
              <Button variant="outline" className="h-10 px-4 border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] text-[#111111] font-medium text-xs sm:text-sm gap-2 cursor-pointer">
                <Inbox className="h-4 w-4 text-[#555555]" />
                Inspect Submitted Bids
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE DASHBOARD COMMAND CENTER (KPIs, Charts, Pipeline, Compliance Matrix) */}
      <ExecutiveDashboardCommandCenter />


      {/* 3. RECENT TENDERS TABLE */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white overflow-hidden">
        <div className="p-6 border-b border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#555555]" />
              <h2 className="text-base font-semibold text-[#111111]">
                Managed Tenders &amp; Submitted Bids Directory
              </h2>
            </div>
            <p className="text-xs text-[#555555] mt-0.5">
              Live procurement packages issued by your department with incoming bidder counts and review status
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/authority/tenders" className="inline-flex items-center gap-1.5 text-xs text-[#111111] hover:underline font-medium transition-colors">
              <span>View All Managed Tenders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F7F7F7] text-[#555555] uppercase font-mono text-[10px] tracking-wider">
                <th className="py-3 px-4 font-medium">Tender Title &amp; Reference</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium">Closing Date</th>
                <th className="py-3 px-4 font-medium text-center">Bids Received</th>
                <th className="py-3 px-4 font-medium text-center">Pending Review</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {activeTenders.map((tender, idx) => {
                const bidsCount = [27, 42, 19, 39][idx % 4];
                const pendingCount = [5, 8, 3, 5][idx % 4];

                return (
                  <tr key={tender.id} className="hover:bg-[#F7F7F7] transition-colors">
                    {/* Tender Title */}
                    <td className="py-4 px-4 max-w-sm">
                      <p className="font-semibold text-[#111111] text-xs line-clamp-1">{tender.title}</p>
                      <p className="text-[11px] text-[#777777] font-mono mt-0.5">{tender.referenceNumber}</p>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                        {tender.tenderStatus}
                      </span>
                    </td>

                    {/* Closing Date */}
                    <td className="py-4 px-4 whitespace-nowrap font-mono text-[#555555] text-[11px]">
                      {new Date(tender.closingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Bids Received */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="font-mono font-bold text-[#111111] bg-[#F5F5F5] px-2.5 py-1 rounded border border-[#E5E5E5]">
                        {bidsCount} Bids
                      </span>
                    </td>

                    {/* Pending Review */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="font-mono font-bold text-[#111111] bg-[#F7F7F7] px-2.5 py-1 rounded border border-[#E5E5E5]">
                        {pendingCount} Pending
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 whitespace-nowrap text-right space-x-2">
                      <Link href={`/authority/tenders/${tender.id}/compare-bids`}>
                        <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px] border-[#E5E5E5] text-[#111111] hover:bg-[#F5F5F5] font-medium cursor-pointer">
                          Compare Bidders
                        </Button>
                      </Link>
                      <Link href="/authority/bids">
                        <Button size="sm" className="h-7 px-2.5 text-[11px] bg-[#111111] hover:bg-[#222222] text-white font-medium cursor-pointer">
                          Open Tender
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
