'use client';

/**
 * Requirement-by-Requirement Bid Compliance Matrix Table
 *
 * Traceable matrix displaying:
 * - Requirement title & Category
 * - Tender stipulation / threshold
 * - Bidder evidence verified
 * - Status (PASS, FAIL, MISSING, WARNING)
 * - Confidence %
 * - Risk rating (LOW, MEDIUM, HIGH, CRITICAL)
 * - Exact source document & page citation
 */

import { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Search,
  FileText,
} from 'lucide-react';
import type { ComplianceMatrixRow } from '@/types/tender-discovery';

interface BidRequirementMatrixProps {
  matrix: ComplianceMatrixRow[];
}

export function BidRequirementMatrix({ matrix }: BidRequirementMatrixProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['all', ...Array.from(new Set(matrix.map((r) => r.category)))];

  const filteredRows = matrix.filter((row) => {
    if (filterCategory !== 'all' && row.category !== filterCategory) return false;
    if (filterStatus !== 'all' && row.status !== filterStatus) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      return (
        row.requirementTitle.toLowerCase().includes(q) ||
        row.requiredCriteria.toLowerCase().includes(q) ||
        row.bidderEvidence.toLowerCase().includes(q) ||
        row.sourceDocument.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-xs overflow-hidden">
      {/* Table Controls & Filter Bar */}
      <div className="p-4 sm:p-5 border-b border-[#E5E5E5] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-[#111111] uppercase tracking-[0.08em] flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#111111]" />
            Requirement-by-Requirement Verification Matrix ({filteredRows.length})
          </h3>
          <p className="text-xs text-[#555555] mt-0.5">
            Deterministic and verifiable evidence trails linked to exact tender clauses.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 md:w-48">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#777777]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search matrix..."
              className="w-full rounded-md border border-[#E5E5E5] bg-white pl-8 pr-2.5 py-1.5 text-xs text-[#111111] placeholder:text-[#777777] focus:border-[#111111] focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-md border border-[#E5E5E5] bg-white px-2.5 py-1.5 text-xs text-[#111111] focus:border-[#111111] focus:outline-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-[#E5E5E5] bg-white px-2.5 py-1.5 text-xs text-[#111111] focus:border-[#111111] focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="PASS">PASS Only</option>
            <option value="FAIL">FAIL Only</option>
            <option value="MISSING">MISSING Only</option>
            <option value="WARNING">WARNING Only</option>
          </select>
        </div>
      </div>

      {/* Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F7F7F7] border-b border-[#E5E5E5] text-[10px] uppercase font-mono text-[#777777] tracking-wider">
            <tr>
              <th className="py-3 px-4">Requirement & Category</th>
              <th className="py-3 px-4">Tender Stipulation</th>
              <th className="py-3 px-4">Bidder Evidence</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3 text-center">Conf.</th>
              <th className="py-3 px-3 text-center">Risk</th>
              <th className="py-3 px-4">Source Citation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5] font-sans">
            {filteredRows.map((row) => {
              let statusBadge = 'bg-[#F7F7F7] text-[#111111] border-[#E5E5E5]';
              let StatusIcon = CheckCircle2;
              if (row.status === 'FAIL') {
                statusBadge = 'bg-[#111111] text-white border-[#111111]';
                StatusIcon = XCircle;
              } else if (row.status === 'MISSING') {
                statusBadge = 'bg-[#F7F7F7] text-[#555555] border-[#CCCCCC]';
                StatusIcon = AlertTriangle;
              } else if (row.status === 'WARNING') {
                statusBadge = 'bg-[#F7F7F7] text-[#555555] border-[#CCCCCC]';
                StatusIcon = HelpCircle;
              }

              let riskBadge = 'text-[#555555] font-normal';
              if (row.riskLevel === 'CRITICAL') riskBadge = 'text-[#111111] font-bold underline';
              else if (row.riskLevel === 'HIGH') riskBadge = 'text-[#111111] font-semibold';
              else if (row.riskLevel === 'MEDIUM') riskBadge = 'text-[#555555] font-medium';

              return (
                <tr key={row.id} className="hover:bg-[#FAFAFA] transition-colors">
                  {/* Requirement Title */}
                  <td className="py-3.5 px-4 max-w-[220px]">
                    <div className="font-semibold text-[#111111] leading-snug">
                      {row.requirementTitle}
                    </div>
                    <div className="text-[10px] font-mono text-[#777777] mt-0.5">
                      {row.category} &bull; {row.tenderClauseReference}
                    </div>
                  </td>

                  {/* Required Criteria */}
                  <td className="py-3.5 px-4 text-[#555555] max-w-[240px] leading-relaxed">
                    {row.requiredCriteria}
                  </td>

                  {/* Bidder Evidence */}
                  <td className="py-3.5 px-4 max-w-[260px]">
                    <div className={row.status === 'FAIL' ? 'text-[#111111] font-semibold' : 'text-[#111111]'}>
                      {row.bidderEvidence}
                    </div>
                    {row.failureReason && (
                      <div className="text-[10px] text-[#555555] mt-1 font-mono">
                        Deficit: {row.failureReason}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${statusBadge}`}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {row.status}
                    </span>
                  </td>

                  {/* Confidence */}
                  <td className="py-3.5 px-3 text-center font-mono text-[#555555]">
                    {row.confidence}%
                  </td>

                  {/* Risk */}
                  <td className="py-3.5 px-3 text-center font-mono text-[11px]">
                    <span className={riskBadge}>{row.riskLevel}</span>
                  </td>

                  {/* Source Document */}
                  <td className="py-3.5 px-4 text-[#555555] max-w-[180px]">
                    <div className="truncate font-mono text-[11px] text-[#111111]">
                      {row.sourceDocument}
                    </div>
                    {row.sourcePage && (
                      <div className="text-[10px] text-[#777777] font-mono">
                        Page {row.sourcePage}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
