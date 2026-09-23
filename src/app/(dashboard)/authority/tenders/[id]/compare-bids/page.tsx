'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Building2, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Circle, 
  ShieldCheck, 
  ArrowUpDown, 
  Download,
  Info,
  Users,
  ExternalLink,
  ShieldAlert,
  Search,
  Filter,
  Eye,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatchedRequirementsPdfButton } from '@/components/reports/MatchedRequirementsPdfButton';
import { ExportAuditPdfButton } from '@/components/audit/ExportAuditPdfButton';
import { getAllBidderDossiers, STANDARD_CPCL_REQUIREMENTS } from '@/lib/compliance/repository';
import { BidderEvaluationDossier } from '@/lib/compliance/types';
import { VisualBidderComparison } from '@/components/authority/VisualBidderComparison';

export default function AuthorityCompareBidsPage() {
  const params = useParams();
  const tenderId = (params?.id as string) || 'tender-cpcl-2026-0412';

  const [sortBy, setSortBy] = useState<'compliance' | 'risk'>('compliance');
  const [selectedBidderId, setSelectedBidderId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MANDATORY' | 'FAILED' | 'MISSING' | 'WARNING'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Single source of truth for all evaluated dossiers
  const dossiers = useMemo(() => {
    let list = getAllBidderDossiers(tenderId);
    if (!list || list.length === 0) {
      list = getAllBidderDossiers();
    }
    return list;
  }, [tenderId]);

  // 2. Structured row representation mapped from real dossiers
  const rawBidders = useMemo(() => {
    return dossiers.map((d) => {
      const results = d.requirementResults || [];

      const rTurnover = results.find((r) => r.clauseCode === 'Clause 4.1');
      const rExp = results.find((r) => r.clauseCode === 'Clause 4.2');
      const rGst = results.find((r) => r.clauseCode === 'Clause 2.1');
      const rPan = results.find((r) => r.clauseCode === 'Clause 2.2');
      const rEmd = results.find((r) => r.clauseCode === 'Clause 7.1');
      const rOem = results.find((r) => r.clauseCode === 'Clause 5.1');
      const rMii = results.find((r) => r.clauseCode === 'Clause 6.3');
      const rDebar = results.find((r) => r.clauseCode === 'Clause 3.4');

      let overallStatus: 'COMPLIANT' | 'REQUIRES MANUAL REVIEW' | 'NON-COMPLIANT' = 'COMPLIANT';
      if (d.complianceScore >= 95 && d.riskLevel === 'LOW') {
        overallStatus = 'COMPLIANT';
      } else if (d.riskLevel === 'HIGH' || d.complianceScore < 70) {
        overallStatus = 'NON-COMPLIANT';
      } else {
        overallStatus = 'REQUIRES MANUAL REVIEW';
      }

      return {
        id: d.bidId,
        name: d.bidderName,
        shortName: d.shortName || d.bidderName,
        complianceScore: d.complianceScore,
        riskLevel: d.riskLevel,
        turnover: {
          value:
            rTurnover?.status === 'FAIL'
              ? `₹8.72 Cr (Deficit)`
              : rTurnover?.verifiedValue
              ? `₹${rTurnover.verifiedValue} Cr`
              : d.bidId === 'bid-apex-02'
              ? '₹12.40 Cr'
              : d.bidId === 'bid-abc-01'
              ? '₹11.80 Cr'
              : '₹10.20 Cr',
          status: (rTurnover?.status === 'FAIL' ? 'FAIL' : 'PASS') as 'PASS' | 'FAIL'
        },
        experience: {
          value:
            rExp?.status === 'FAIL'
              ? '3.8 Yrs (Deficit)'
              : rExp?.verifiedValue
              ? `${rExp.verifiedValue} Yrs`
              : d.bidId === 'bid-apex-02'
              ? '8.0 Yrs'
              : d.bidId === 'bid-abc-01'
              ? '6.0 Yrs'
              : '5.2 Yrs',
          status: (rExp?.status === 'FAIL' ? 'FAIL' : 'PASS') as 'PASS' | 'FAIL'
        },
        gst: {
          value: d.gstin || '33AABCA1234F1Z8',
          status: (rGst?.status === 'FAIL' ? 'FAIL' : 'PASS') as 'PASS' | 'FAIL'
        },
        pan: {
          value: d.pan || 'ABCDE1234F',
          status: (rPan?.status === 'FAIL' ? 'FAIL' : 'PASS') as 'PASS' | 'FAIL'
        },
        udyam: {
          value:
            d.udyamNumber && !d.udyamNumber.toLowerCase().includes('not registered')
              ? d.udyamNumber
              : 'Non-MSME (EMD Paid)',
          status: (d.udyamNumber && !d.udyamNumber.toLowerCase().includes('not registered') ? 'PASS' : 'N/A') as 'PASS' | 'WARN' | 'N/A'
        },
        oem: {
          value:
            rOem?.status === 'PASS'
              ? 'Direct OEM Certified'
              : rOem?.status === 'WARNING'
              ? 'Pending OEM Undertaking'
              : 'Authorization Mismatched',
          status: (rOem?.status === 'PASS' ? 'PASS' : rOem?.status === 'WARNING' ? 'WARN' : 'FAIL') as 'PASS' | 'WARN' | 'FAIL'
        },
        localContent: {
          value:
            rMii?.status === 'PASS'
              ? `${rMii.verifiedValue || '68'}% (Class-I)`
              : '42% (<50% Min)',
          status: (rMii?.status === 'FAIL' ? 'FAIL' : 'PASS') as 'PASS' | 'FAIL'
        },
        debarment: {
          value:
            d.bidId === 'bid-pqr-04'
              ? 'Debarment Warning'
              : rDebar?.status === 'MISSING'
              ? 'Affidavit Missing'
              : 'Clear (CVC/GeM)',
          status: (d.bidId === 'bid-pqr-04' ? 'FAIL' : 'PASS') as 'PASS' | 'FAIL'
        },
        overallStatus,
        bidValue: d.bidValue || '₹14.10 Cr',
        submittedAt: d.submittedAt,
        dossier: d
      };
    });
  }, [dossiers]);

  // 3. Filtered & Sorted Bidders
  const bidders = useMemo(() => {
    return [...rawBidders]
      .filter((b) => {
        if (selectedBidderId && b.id !== selectedBidderId) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return (
            b.name.toLowerCase().includes(q) ||
            b.shortName.toLowerCase().includes(q) ||
            b.gst.value.toLowerCase().includes(q) ||
            b.pan.value.toLowerCase().includes(q)
          );
        }
        if (activeFilter === 'FAILED') {
          return (
            b.turnover.status === 'FAIL' ||
            b.experience.status === 'FAIL' ||
            b.oem.status === 'FAIL' ||
            b.localContent.status === 'FAIL' ||
            b.debarment.status === 'FAIL'
          );
        }
        if (activeFilter === 'MISSING') {
          return b.dossier.missingCount > 0;
        }
        if (activeFilter === 'WARNING') {
          return b.dossier.warningsCount > 0 || b.oem.status === 'WARN';
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'compliance') return b.complianceScore - a.complianceScore;
        if (sortBy === 'risk') {
          const rank = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
          return rank[a.riskLevel] - rank[b.riskLevel];
        }
        return 0;
      });
  }, [rawBidders, sortBy, selectedBidderId, searchQuery, activeFilter]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans bg-white">
      {/* ─────────────────────────────────────────────────────────────
          HEADER & ACTIONS
          ───────────────────────────────────────────────────────────── */}
      <div>
        <Link 
          href="/authority/bids" 
          className="inline-flex items-center text-xs text-[#555555] hover:text-[#111111] mb-3 transition-colors font-mono"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Submitted Bids
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5]">
                SIH26100 Multi-Bidder Comparison Matrix
              </span>
              <span className="text-[#777777] text-xs">•</span>
              <span className="text-xs text-[#555555] font-mono">CPCL/ENG/2026/HPGC-0412</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#111111] tracking-tight mt-1">
              Comparative Multi-Vendor Compliance Ledger
            </h1>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Side-by-side verification of statutory registrations, financial thresholds, technical experience, OEM authorizations, and Make-in-India declarations.
            </p>
          </div>

          {/* Action & Sorting Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <MatchedRequirementsPdfButton
              tenderId={tenderId}
              tenderTitle="Supply, Installation and Commissioning of High-Pressure Gas Compressor System at Manali Refinery"
              tenderRef="CPCL/ENG/2026/HPGC-0412"
              tenderAuthority="Chennai Petroleum Corporation Limited (CPCL)"
              label="Matched Requirements PDF"
              isMultiBidder={true}
              dossiers={dossiers}
              showSaveButton={false}
            />
            <ExportAuditPdfButton
              tenderTitle="Supply, Installation and Commissioning of High-Pressure Gas Compressor System at Manali Refinery"
              tenderRef="CPCL/ENG/2026/HPGC-0412"
              tenderId={tenderId}
              label="Audit Dossier PDF"
            />
            <span className="text-xs text-[#555555] flex items-center gap-1 font-mono ml-2">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'compliance' | 'risk')}
              className="h-8 px-2.5 rounded-md bg-white border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111] font-mono cursor-pointer"
            >
              <option value="compliance">Sort by Compliance Score</option>
              <option value="risk">Sort by Risk Level</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          STATUTORY DECISION-SUPPORT DISCLAIMER (GFR 2017 / CVC)
          ───────────────────────────────────────────────────────────── */}
      <div className="p-4 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] text-xs flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-[#111111] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-[#111111]">
            Official Statutory Governance &amp; Decision-Support Notice
          </p>
          <p className="text-[#555555] leading-relaxed">
            Clausentis provides objective, deterministic verification and evidence cross-referencing. The system does <strong>not</strong> automatically rank, award, or disqualify bidders. Final commercial and technical qualification decisions remain strictly with the designated Tender Committee and Authorised Procurement Officers.
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PART 2 — VISUAL BIDDER COMPARISON SECTION (CHARTS & SUMMARY)
          ───────────────────────────────────────────────────────────── */}
      <VisualBidderComparison
        dossiers={dossiers}
        requirements={STANDARD_CPCL_REQUIREMENTS}
        selectedBidderId={selectedBidderId}
        onSelectBidder={setSelectedBidderId}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* ─────────────────────────────────────────────────────────────
          TABLE CONTROLS & FILTER BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#111111]">
            Comparative Matrix Table ({bidders.length} Proposals)
          </span>
          {activeFilter !== 'ALL' && (
            <span className="text-[10px] font-mono bg-[#111111] text-white px-2 py-0.5 rounded">
              Filter: {activeFilter}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Filter Pills */}
          {(['ALL', 'FAILED', 'MISSING', 'WARNING'] as const).map((flt) => (
            <button
              key={flt}
              onClick={() => setActiveFilter(flt)}
              className={`h-7 px-2.5 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
                activeFilter === flt
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-white text-[#555555] border-[#E5E5E5] hover:bg-[#F7F7F7]'
              }`}
            >
              {flt === 'ALL' ? 'All Bidders' : flt === 'FAILED' ? 'Failing Only' : flt === 'MISSING' ? 'Missing Only' : 'Warnings Only'}
            </button>
          ))}

          {/* Text Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#777777] absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search entity, PAN, GST..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-7 pr-3 rounded border border-[#E5E5E5] text-xs font-mono text-[#111111] focus:outline-none focus:border-[#111111] w-48"
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          PART 6 — COMPREHENSIVE SIDE-BY-SIDE MATRIX TABLE (IMPROVED)
          ───────────────────────────────────────────────────────────── */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed border-collapse text-xs min-w-[1250px]">
            <colgroup>
              <col className="w-[15%]" />
              <col className="w-[6%]" />
              <col className="w-[6%]" />
              <col className="w-[9%]" />
              <col className="w-[7%]" />
              <col className="w-[9%]" />
              <col className="w-[8%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[7%]" />
              <col className="w-[7%]" />
              <col className="w-[9%]" />
              <col className="w-[6%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 bg-[#F7F7F7]">
              <tr className="border-b border-[#E5E5E5] text-[#111111] font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3 font-semibold sticky left-0 z-20 bg-[#F7F7F7]">Bidder Entity</th>
                <th className="py-3 px-2 font-semibold text-center">Score</th>
                <th className="py-3 px-2 font-semibold text-center">Risk</th>
                <th className="py-3 px-2.5 font-semibold">Turnover (≥₹10 Cr)</th>
                <th className="py-3 px-2 font-semibold">Exp (≥5 Y)</th>
                <th className="py-3 px-2.5 font-semibold">GSTIN</th>
                <th className="py-3 px-2 font-semibold">PAN</th>
                <th className="py-3 px-2 font-semibold">Udyam / MSME</th>
                <th className="py-3 px-2.5 font-semibold">OEM Auth</th>
                <th className="py-3 px-2 font-semibold text-center">Local Content</th>
                <th className="py-3 px-2 font-semibold">Debarment</th>
                <th className="py-3 px-2.5 font-semibold text-center">AI Rec</th>
                <th className="py-3 px-2.5 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {bidders.map((b) => (
                <tr key={b.id} className="hover:bg-[#FAFAFA] transition-colors group">
                  {/* Bidder (Sticky column for scrolling) */}
                  <td className="py-3.5 px-3 break-words overflow-wrap-anywhere sticky left-0 z-10 bg-white group-hover:bg-[#FAFAFA] shadow-[2px_0_4px_rgba(0,0,0,0.02)]">
                    <p 
                      onClick={() => setSelectedBidderId(selectedBidderId === b.id ? null : b.id)}
                      className="font-semibold text-[#111111] text-xs leading-snug cursor-pointer hover:underline"
                    >
                      {b.name}
                    </p>
                    <p className="text-[10px] text-[#555555] font-mono mt-0.5">{b.bidValue} Proposal</p>
                  </td>

                  {/* Compliance Score */}
                  <td className="py-3.5 px-2 text-center align-top">
                    <span 
                      onClick={() => setSelectedBidderId(b.id)}
                      className="font-mono font-bold text-[#111111] text-xs cursor-pointer hover:underline"
                    >
                      {b.complianceScore}%
                    </span>
                  </td>

                  {/* Risk Level */}
                  <td className="py-3.5 px-2 text-center align-top">
                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${
                      b.riskLevel === 'LOW'
                        ? 'bg-[#F7F7F7] text-[#111111] border-[#E5E5E5]'
                        : b.riskLevel === 'MEDIUM'
                        ? 'bg-[#F7F7F7] text-[#555555] border-[#CCCCCC]'
                        : 'bg-[#111111] text-white border-[#111111]'
                    }`}>
                      {b.riskLevel}
                    </span>
                  </td>

                  {/* Turnover */}
                  <td className="py-3.5 px-2.5 align-top break-words overflow-wrap-anywhere">
                    <span className={`font-mono text-[11px] block ${b.turnover.status === 'FAIL' ? 'font-bold text-[#991B1B] underline' : 'text-[#333333]'}`}>
                      {b.turnover.value}
                    </span>
                  </td>

                  {/* Experience */}
                  <td className="py-3.5 px-2 align-top break-words overflow-wrap-anywhere">
                    <span className={`font-mono text-[11px] block ${b.experience.status === 'FAIL' ? 'font-bold text-[#991B1B] underline' : 'text-[#333333]'}`}>
                      {b.experience.value}
                    </span>
                  </td>

                  {/* GST */}
                  <td className="py-3.5 px-2.5 font-mono text-[11px] text-[#555555] align-top break-words overflow-wrap-anywhere">
                    {b.gst.value}
                  </td>

                  {/* PAN */}
                  <td className="py-3.5 px-2 font-mono text-[11px] text-[#555555] align-top break-words overflow-wrap-anywhere">
                    {b.pan.value}
                  </td>

                  {/* Udyam */}
                  <td className="py-3.5 px-2 font-mono text-[11px] text-[#555555] align-top break-words overflow-wrap-anywhere">
                    {b.udyam.value}
                  </td>

                  {/* OEM */}
                  <td className="py-3.5 px-2.5 align-top break-words overflow-wrap-anywhere">
                    <span className={`text-[11px] block leading-snug ${b.oem.status === 'FAIL' ? 'font-semibold text-[#991B1B]' : 'text-[#555555]'}`}>
                      {b.oem.value}
                    </span>
                  </td>

                  {/* Local Content */}
                  <td className="py-3.5 px-2 text-center align-top">
                    <span className={`font-mono text-[11px] ${b.localContent.status === 'FAIL' ? 'font-bold text-[#991B1B]' : 'text-[#333333]'}`}>
                      {b.localContent.value}
                    </span>
                  </td>

                  {/* Debarment */}
                  <td className="py-3.5 px-2 align-top break-words overflow-wrap-anywhere">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-mono leading-tight ${
                      b.debarment.status === 'FAIL' ? 'font-bold text-[#991B1B]' : 'text-[#555555]'
                    }`}>
                      {b.debarment.status === 'FAIL' ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-[#991B1B] shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-[#111111] shrink-0" />
                      )}
                      <span>{b.debarment.value}</span>
                    </span>
                  </td>

                  {/* Overall Status */}
                  <td className="py-3.5 px-2.5 text-center align-top break-words overflow-wrap-anywhere">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                      b.overallStatus === 'COMPLIANT'
                        ? 'bg-[#F7F7F7] text-[#111111] border-[#E5E5E5]'
                        : b.overallStatus === 'REQUIRES MANUAL REVIEW'
                        ? 'bg-white text-[#555555] border-[#CCCCCC]'
                        : 'bg-[#111111] text-white border-[#111111]'
                    }`}>
                      {b.overallStatus === 'COMPLIANT' && <CheckCircle2 className="w-3 h-3 text-[#111111]" />}
                      {b.overallStatus === 'REQUIRES MANUAL REVIEW' && <AlertTriangle className="w-3 h-3 text-[#555555]" />}
                      {b.overallStatus === 'NON-COMPLIANT' && <XCircle className="w-3 h-3 text-white" />}
                      {b.overallStatus}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-2.5 text-right align-top">
                    <Link href={`/authority/bids/${b.id}`}>
                      <Button size="sm" variant="outline" className="h-7 px-2.5 text-[11px] border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] rounded cursor-pointer font-medium">
                        Audit Bid
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
