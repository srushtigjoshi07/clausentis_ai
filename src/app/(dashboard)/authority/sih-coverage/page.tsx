'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Building2, 
  Cpu,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { STATUTORY_PROVIDERS, evaluateAllStatutorySources } from '@/lib/providers/registry';
import { StatutoryProviderId, VerificationSourceStatus } from '@/lib/providers/types';
import { Button } from '@/components/ui/button';

export default function SihCoveragePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const providerList = Object.values(STATUTORY_PROVIDERS);
  const sampleEvaluation = evaluateAllStatutorySources({
    companyName: 'Apex Heavy Engineering Pvt Ltd',
    pan: 'AABCA1234F',
    gstin: '33AABCA1234F1Z8',
    udyamNumber: 'UDYAM-TN-02-0048192',
    localContentPercent: 62.5,
  });

  const filtered = providerList.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.primaryDocumentProof.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' || p.defaultStatus === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: VerificationSourceStatus) => {
    switch (status) {
      case 'LIVE_VERIFIED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#111111] text-white border border-[#111111]">
            LIVE VERIFIED
          </span>
        );
      case 'DOCUMENT_VERIFIED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F7F7F7] text-[#111111] border border-[#E5E5E5]">
            DOCUMENT VERIFIED
          </span>
        );
      case 'PROTOTYPE_VERIFIED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F0F0F0] text-[#333333] border border-[#D5D5D5]">
            PROTOTYPE VERIFIED
          </span>
        );
      case 'INTEGRATION_READY':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white text-[#555555] border border-[#CCCCCC]">
            INTEGRATION READY
          </span>
        );
      case 'MANUAL_REVIEW':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
            MANUAL REVIEW
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white text-[#777777] border border-[#E5E5E5]">
            {status.replace('_', ' ')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans bg-white">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] pb-6 pt-2">
        <Link 
          href="/authority/dashboard" 
          className="inline-flex items-center text-xs text-[#555555] hover:text-[#111111] mb-2 font-mono transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3 w-3" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E5E5]">
            SIH26100 TRACEABILITY MATRIX
          </span>
          <span className="text-[#777777] text-xs">&bull;</span>
          <span className="text-[#555555] text-xs font-mono">16 Statutory &amp; Government Sources</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
          Government Source Integration &amp; Coverage Architecture
        </h1>
        <p className="text-xs sm:text-sm text-[#555555] mt-1 max-w-3xl leading-relaxed">
          In strict conformance with SIH26100, Clausentis implements an extensible provider adapter architecture. Every statutory provider operates under a truthful, verifiable status—avoiding false live claims while ensuring full document and algorithmic defensibility.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-white border border-[#E5E5E5]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777]">SIH26100 Mandated Sources</span>
          <p className="text-xl font-bold font-mono text-[#111111] mt-0.5">16 / 16 Supported</p>
        </div>
        <div className="p-3.5 rounded-lg bg-white border border-[#E5E5E5]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777]">Document Grounded Verification</span>
          <p className="text-xl font-bold font-mono text-[#111111] mt-0.5">9 Active Adapters</p>
        </div>
        <div className="p-3.5 rounded-lg bg-white border border-[#E5E5E5]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777]">Prototype &amp; Schema Verified</span>
          <p className="text-xl font-bold font-mono text-[#111111] mt-0.5">3 Active Ledgers</p>
        </div>
        <div className="p-3.5 rounded-lg bg-white border border-[#E5E5E5]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777]">G2G API Ready</span>
          <p className="text-xl font-bold font-mono text-[#111111] mt-0.5">4 Open Interfaces</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
          <input
            type="text"
            placeholder="Search provider, department, or proof..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#E5E5E5] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#111111] placeholder:text-[#777777] focus:outline-none focus:border-[#111111] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
          {['ALL', 'DOCUMENT_VERIFIED', 'PROTOTYPE_VERIFIED', 'INTEGRATION_READY'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all shrink-0 cursor-pointer ${
                selectedStatus === st
                  ? 'bg-[#111111] text-white font-semibold'
                  : 'text-[#555555] hover:bg-white hover:text-[#111111] border border-transparent'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Sources Grid Table */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs table-fixed min-w-[1000px] border-collapse">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[16%]" />
              <col className="w-[16%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead className="bg-[#F7F7F7] border-b border-[#E5E5E5] text-[10px] font-mono uppercase tracking-wider text-[#777777]">
              <tr>
                <th className="py-3 px-3.5 font-semibold">Requirement</th>
                <th className="py-3 px-3.5 font-semibold">Source</th>
                <th className="py-3 px-3.5 font-semibold">Verification</th>
                <th className="py-3 px-3.5 font-semibold">Authority</th>
                <th className="py-3 px-3.5 font-semibold">Evidence</th>
                <th className="py-3 px-3.5 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filtered.map((p) => {
                return (
                  <tr key={p.id} className="hover:bg-[#FAFAFA] transition-colors">
                    {/* 1. Requirement */}
                    <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                      <div className="font-semibold text-[#111111] text-xs flex items-start gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#111111] shrink-0 mt-0.5" />
                        <span className="leading-snug">{p.name}</span>
                      </div>
                      <div className="text-[10px] text-[#777777] font-mono mt-1">
                        IDs: {p.supportedIdentifiers.join(', ')}
                      </div>
                    </td>

                    {/* 2. Source */}
                    <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                      <a 
                        href={p.portalUrl} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[11px] font-mono text-[#111111] hover:underline inline-flex items-center gap-1 break-all leading-normal"
                      >
                        <span>{p.portalUrl.replace('https://', '')}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </td>

                    {/* 3. Verification */}
                    <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                      <div className="shrink-0 mb-1">
                        {getStatusBadge(p.defaultStatus)}
                      </div>
                      <p className="text-[10px] text-[#555555] font-mono leading-tight mt-1">
                        {p.statusRationale}
                      </p>
                    </td>

                    {/* 4. Authority */}
                    <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                      <p className="font-medium text-[#111111] text-[11px] leading-snug">{p.department}</p>
                    </td>

                    {/* 5. Evidence */}
                    <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                      <div className="flex items-start gap-1 text-[#111111] font-mono font-medium text-[11px]">
                        <FileText className="w-3 h-3 text-[#111111] shrink-0 mt-0.5" />
                        <span className="leading-snug break-words">{p.primaryDocumentProof}</span>
                      </div>
                    </td>

                    {/* 6. Description */}
                    <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                      <p className="text-[11px] text-[#555555] leading-relaxed">
                        {p.cvcDefensibilityNote}
                      </p>
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
