'use client';

/**
 * Enterprise Procurement Tender Search Form
 *
 * Supports searching by:
 * - Organisation (e.g. Chennai Petroleum Corporation Limited)
 * - Tender ID / Reference Number
 * - Keyword
 * - Procurement Category
 * - Location
 *
 * Clearly displays public source indicator & live/archive mode.
 */

import { useState } from 'react';
import { Search, Building2, Hash, Tag, Globe, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TenderSearchParams } from '@/types/tender-discovery';

interface TenderSearchFormProps {
  onSearch: (params: TenderSearchParams, mode: 'live' | 'imported') => void;
  isLoading?: boolean;
}

const COMMON_ORGANISATIONS = [
  'Chennai Petroleum Corporation Limited',
  'Indian Oil Corporation Limited',
  'Bharat Heavy Electricals Limited',
  'NTPC Limited',
];

const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'Goods', label: 'Goods & Equipment' },
  { id: 'Works', label: 'Civil & EPC Works' },
  { id: 'Services', label: 'Maintenance & AMC Services' },
];

export function TenderSearchForm({ onSearch, isLoading = false }: TenderSearchFormProps) {
  const [organisation, setOrganisation] = useState('Chennai Petroleum Corporation Limited');
  const [tenderId, setTenderId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('all');
  const [sourceMode, setSourceMode] = useState<'live' | 'imported'>('imported');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(
      {
        organisation,
        tenderId: tenderId.trim() || undefined,
        keyword: keyword.trim() || undefined,
        category: category !== 'all' ? category : undefined,
        activeOnly: true,
      },
      sourceMode
    );
  };

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5]">
              Discovery Engine
            </span>
            <span className="text-[#777777] text-xs">•</span>
            <span className="text-[11px] font-mono text-[#555555]">CPPP & GeM INDEX</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#111111] tracking-tight">
            Find Active Government Tenders
          </h2>
        </div>

        {/* Source Provider Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] text-xs text-[#111111] font-mono">
            <Globe className="h-3.5 w-3.5 text-[#111111]" />
            <span>Public Procurement Portal</span>
          </div>

          <div className="flex items-center rounded-md border border-[#E5E5E5] bg-[#F7F7F7] p-0.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setSourceMode('imported')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                sourceMode === 'imported'
                  ? 'bg-[#111111] text-white font-medium shadow-xs'
                  : 'text-[#555555] hover:text-[#111111]'
              }`}
            >
              Public Archive
            </button>
            <button
              type="button"
              onClick={() => setSourceMode('live')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                sourceMode === 'live'
                  ? 'bg-[#111111] text-white font-medium shadow-xs'
                  : 'text-[#555555] hover:text-[#111111]'
              }`}
            >
              Live Gateway
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Main Grid: Organisation & Tender ID */}
        <div className="grid gap-4 md:grid-cols-12">
          {/* Organisation */}
          <div className="md:col-span-6 space-y-1.5">
            <label className="text-xs font-medium text-[#111111] flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-[#111111] stroke-[1.5]" />
              Issuing Organisation / Company
            </label>
            <input
              type="text"
              value={organisation}
              onChange={(e) => setOrganisation(e.target.value)}
              placeholder="e.g. Chennai Petroleum Corporation Limited"
              className="w-full rounded-md border border-[#E5E5E5] bg-white px-3.5 py-2 text-sm text-[#111111] placeholder:text-[#777777] focus:border-[#111111] focus:outline-none transition-colors"
            />
            {/* Quick Organisation Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] text-[#777777] uppercase tracking-wider self-center mr-1">
                Quick Select:
              </span>
              {COMMON_ORGANISATIONS.map((org) => (
                <button
                  key={org}
                  type="button"
                  onClick={() => setOrganisation(org)}
                  className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    organisation === org
                      ? 'border-[#111111] bg-[#111111] text-white'
                      : 'border-[#E5E5E5] bg-[#F7F7F7] text-[#555555] hover:text-[#111111] hover:border-[#CCCCCC]'
                  }`}
                >
                  {org.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Tender ID / Ref */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-medium text-[#111111] flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-[#111111] stroke-[1.5]" />
              Tender ID (Optional)
            </label>
            <input
              type="text"
              value={tenderId}
              onChange={(e) => setTenderId(e.target.value)}
              placeholder="e.g. 2026_CPCL_894102_1"
              className="w-full rounded-md border border-[#E5E5E5] bg-white px-3.5 py-2 text-sm text-[#111111] placeholder:text-[#777777] focus:border-[#111111] focus:outline-none font-mono transition-colors"
            />
          </div>

          {/* Category */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-medium text-[#111111] flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-[#111111] stroke-[1.5]" />
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-[#E5E5E5] bg-white px-3.5 py-2 text-sm text-[#111111] focus:border-[#111111] focus:outline-none transition-colors cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id} className="bg-white text-[#111111]">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Row: Keyword and Submit Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-[#E5E5E5]">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#777777]" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Filter by keyword (e.g. Compressor, SA 516)..."
              className="w-full rounded-md border border-[#E5E5E5] bg-white pl-9 pr-3.5 py-2 text-xs sm:text-sm text-[#111111] placeholder:text-[#777777] focus:border-[#111111] focus:outline-none transition-colors"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto h-9 px-5 bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm tracking-wide gap-2 rounded-md shadow-xs transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Querying Active Tenders...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 stroke-[1.5]" />
                Search Active Tenders
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
