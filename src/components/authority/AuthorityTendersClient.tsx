'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  PlusCircle, 
  Clock, 
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthorityTenderItem } from '@/lib/actions/tenders';

interface AuthorityTendersClientProps {
  initialTenders: AuthorityTenderItem[];
}

export function AuthorityTendersClient({ initialTenders }: AuthorityTendersClientProps) {
  const [filter, setFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = initialTenders.filter((t) => {
    const matchesFilter = filter === 'ALL' || t.status === filter;
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 font-sans bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5]">
              Procurement Inventory
            </span>
            <span className="text-[#777777] text-xs">•</span>
            <span className="text-xs text-[#555555] font-mono">Departmental Tenders ({initialTenders.length} Total)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111] mt-1">
            My Managed Tenders
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
            Monitor tender lifecycles from publication, bid receipt, and multi-vendor compliance evaluation to final award.
          </p>
        </div>

        <Link href="/authority/tenders/new">
          <Button className="h-9 px-4 bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs gap-1.5 cursor-pointer shadow-sm rounded-md">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create New Tender</span>
          </Button>
        </Link>
      </div>

      {/* Controls: Search and Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { id: 'ALL', label: 'All Tenders' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'CLOSING_SOON', label: 'Closing Soon' },
            { id: 'UNDER_EVALUATION', label: 'Under Evaluation' },
            { id: 'CLOSED', label: 'Closed' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md border transition-colors cursor-pointer text-xs ${
                filter === tab.id
                  ? 'bg-[#111111] border-[#111111] text-white font-medium'
                  : 'border-[#E5E5E5] bg-white text-[#555555] hover:text-[#111111] hover:bg-[#F7F7F7]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reference, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#E5E5E5] rounded-md text-[#111111] placeholder:text-[#999999] focus:outline-none focus:border-[#111111]"
          />
        </div>
      </div>

      {/* Tenders Directory */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[#E5E5E5] rounded-lg bg-[#FAFAFA]">
            <p className="text-xs text-[#555555] font-mono">No tenders found matching selected filter or query.</p>
          </div>
        ) : (
          filtered.map((tender) => (
            <div
              key={tender.id}
              className="p-5 sm:p-6 rounded-lg border border-[#E5E5E5] bg-white hover:border-[#CCCCCC] transition-all space-y-4 shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-[#E5E5E5] pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] font-semibold">
                      {tender.category}
                    </span>
                    <span className="text-xs text-[#555555] font-mono">{tender.reference}</span>
                    
                    {/* Status Badges */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F7F7F7] text-[#111111] border border-[#E5E5E5]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                      {tender.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <h3 className="text-base sm:text-lg font-semibold text-[#111111]">
                    {tender.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/authority/tenders/${tender.id}/compare-bids`}>
                    <Button size="sm" variant="outline" className="h-8 px-3 text-xs border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] font-medium cursor-pointer rounded-md bg-white">
                      Compare Bidders
                    </Button>
                  </Link>
                  <Link href={`/authority/bids`}>
                    <Button size="sm" className="h-8 px-3 text-xs bg-[#111111] hover:bg-[#222222] text-white font-medium rounded-md cursor-pointer">
                      View Bids
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Metadata metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-[#777777] uppercase font-mono">Estimated Value</span>
                  <p className="font-mono font-bold text-[#111111] mt-0.5">{tender.estimatedValue}</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#777777] uppercase font-mono">Closing Date</span>
                  <p className="font-mono text-[#555555] mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#777777]" />
                    {tender.closingDate}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#777777] uppercase font-mono">Bids Received</span>
                  <p className="font-mono font-semibold text-[#111111] mt-0.5">{tender.bidsCount} Proposals</p>
                </div>
                <div>
                  <span className="text-[10px] text-[#777777] uppercase font-mono">Pending Review</span>
                  <p className="font-mono font-bold text-[#111111] mt-0.5">{tender.pendingReviewsCount} Bids</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
