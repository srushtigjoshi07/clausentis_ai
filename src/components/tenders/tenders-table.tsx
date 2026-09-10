'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TenderItem {
  id: string;
  title: string;
  status: string;
  compliance_score?: number | null;
  risk_level?: string | null;
  created_at: string;
  updated_at: string;
  requirements_count?: number | null;
}

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateStr));
  } catch {
    return 'Recent';
  }
}

export function TendersTable({ initialTenders }: { initialTenders: TenderItem[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTenders = initialTenders.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white shadow-sm overflow-hidden flex-1 flex flex-col font-sans">
      {/* Controls Bar */}
      <div className="p-4 border-b border-[#E5E5E5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#F7F7F7]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#777777] stroke-[1.5]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenders by title..."
            className="w-full h-9 pl-9 pr-3 rounded-md bg-white border border-[#E5E5E5] text-sm text-[#111111] placeholder:text-[#777777] focus:outline-none focus:border-[#111111] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All' },
            { id: 'analyzed', label: 'Analyzed' },
            { id: 'processing', label: 'Processing' },
            { id: 'uploaded', label: 'Uploaded' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-md text-sm transition-colors whitespace-nowrap border ${
                statusFilter === tab.id
                  ? 'bg-[#111111] text-white border-[#111111] font-medium'
                  : 'text-[#555555] bg-white hover:text-[#111111] hover:bg-[#F7F7F7] border-[#E5E5E5]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {filteredTenders.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-14 sm:p-20 text-center">
          <div className="h-12 w-12 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-center mb-4 text-[#111111]">
            <FileText className="h-5 w-5 stroke-[1.5]" />
          </div>
          <h3 className="font-semibold text-lg text-[#111111]">
            {initialTenders.length === 0 ? 'No tenders analyzed yet' : 'No matching tenders found'}
          </h3>
          <p className="text-sm text-[#555555] mt-1.5 mb-6 max-w-sm leading-relaxed">
            {initialTenders.length === 0 
              ? 'Upload your first RFP or government tender to extract requirements and evaluate compliance.'
              : 'Try clearing your search query or switching the status filter.'}
          </p>
          {initialTenders.length === 0 && (
            <Link href="/authority/tenders/new">
              <Button size="sm" className="bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm px-6 h-9">
                Analyze a Tender &rarr;
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-[#555555] uppercase tracking-wider bg-[#F7F7F7] border-b border-[#E5E5E5] font-medium">
              <tr>
                <th className="px-6 py-3.5 font-medium">Tender Title</th>
                <th className="px-6 py-3.5 font-medium">Status</th>
                <th className="px-6 py-3.5 font-medium">Readiness Score</th>
                <th className="px-6 py-3.5 font-medium">Risk Level</th>
                <th className="px-6 py-3.5 font-medium text-right">Created</th>
                <th className="px-6 py-3.5 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredTenders.map((tender) => {
                const score = tender.compliance_score;
                const isAnalyzed = tender.status === 'analyzed';
                const isProcessing = tender.status === 'processing';
                const isFailed = tender.status === 'failed';

                return (
                  <tr key={tender.id} className="hover:bg-[#F7F7F7] transition-colors group">
                    <td className="px-6 py-4">
                      <Link href={`/tenders/${tender.id}`} className="text-[15px] text-[#111111] group-hover:underline font-medium transition-colors flex items-center gap-2 max-w-md truncate">
                        {tender.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono uppercase bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] font-medium">
                        {isAnalyzed ? '✓ ANALYZED' : isProcessing ? 'PROCESSING' : isFailed ? 'FAILED' : 'DRAFT'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {score !== null && score !== undefined ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-16 h-1.5 rounded-full bg-[#E5E5E5] overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-[#111111]" 
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-medium text-[#111111]">{score}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#777777]">&mdash;</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase text-[#111111] font-medium">
                        {tender.risk_level === 'critical' || tender.risk_level === 'high' ? (
                          <>▲ HIGH</>
                        ) : tender.risk_level === 'medium' ? (
                          <>MEDIUM</>
                        ) : (
                          <>LOW</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-[#777777] text-right">
                      {formatDate(tender.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/tenders/${tender.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs text-[#111111] hover:bg-[#E5E5E5] font-medium">
                          View &rarr;
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}