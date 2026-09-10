'use client';

import React, { useState } from 'react';
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
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatchedRequirementsPdfButton } from '@/components/reports/MatchedRequirementsPdfButton';
import { ExportAuditPdfButton } from '@/components/audit/ExportAuditPdfButton';

interface BidderSummaryRow {
  id: string;
  name: string;
  shortName: string;
  complianceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  turnover: { value: string; status: 'PASS' | 'FAIL' };
  experience: { value: string; status: 'PASS' | 'FAIL' };
  gst: { value: string; status: 'PASS' | 'FAIL' };
  pan: { value: string; status: 'PASS' | 'FAIL' };
  udyam: { value: string; status: 'PASS' | 'WARN' | 'N/A' };
  oem: { value: string; status: 'PASS' | 'WARN' | 'FAIL' };
  localContent: { value: string; status: 'PASS' | 'FAIL' };
  debarment: { value: string; status: 'PASS' | 'FAIL' };
  overallStatus: 'COMPLIANT' | 'REQUIRES MANUAL REVIEW' | 'NON-COMPLIANT';
  bidValue: string;
  submittedAt: string;
}

export default function AuthorityCompareBidsPage() {
  const params = useParams();
  const tenderId = params.id as string;

  const [sortBy, setSortBy] = useState<'compliance' | 'risk' | 'score'>('compliance');

  const rawBidders: BidderSummaryRow[] = [
    {
      id: 'bid-apex-02',
      name: 'Apex Heavy Engineering Pvt Ltd',
      shortName: 'Apex Heavy',
      complianceScore: 100,
      riskLevel: 'LOW',
      turnover: { value: '₹12.40 Cr', status: 'PASS' },
      experience: { value: '8 Yrs', status: 'PASS' },
      gst: { value: '33AABCA1234F1Z8', status: 'PASS' },
      pan: { value: 'ABCDE1234F', status: 'PASS' },
      udyam: { value: 'UDYAM-TN-02-0049182', status: 'PASS' },
      oem: { value: 'Direct OEM Certified', status: 'PASS' },
      localContent: { value: '68%', status: 'PASS' },
      debarment: { value: 'Clear (CVC/GeM)', status: 'PASS' },
      overallStatus: 'COMPLIANT',
      bidValue: '₹14.10 Cr',
      submittedAt: '2026-09-09T18:45:00Z',
    },
    {
      id: 'bid-abc-01',
      name: 'ABC Industrial Solutions Pvt Ltd',
      shortName: 'ABC Industrial',
      complianceScore: 96,
      riskLevel: 'LOW',
      turnover: { value: '₹11.80 Cr', status: 'PASS' },
      experience: { value: '6 Yrs', status: 'PASS' },
      gst: { value: '27AABCB5678G1Z2', status: 'PASS' },
      pan: { value: 'AABCB5678G', status: 'PASS' },
      udyam: { value: 'UDYAM-MH-01-0023419', status: 'PASS' },
      oem: { value: 'Tier-1 Channel Auth', status: 'PASS' },
      localContent: { value: '58%', status: 'PASS' },
      debarment: { value: 'Clear (CVC/GeM)', status: 'PASS' },
      overallStatus: 'COMPLIANT',
      bidValue: '₹13.95 Cr',
      submittedAt: '2026-09-09T14:30:00Z',
    },
    {
      id: 'bid-xyz-03',
      name: 'XYZ Engineering Works',
      shortName: 'XYZ Engineering',
      complianceScore: 82,
      riskLevel: 'MEDIUM',
      turnover: { value: '₹10.20 Cr', status: 'PASS' },
      experience: { value: '5 Yrs', status: 'PASS' },
      gst: { value: '24AAACX9012H1Z5', status: 'PASS' },
      pan: { value: 'AAACX9012H', status: 'PASS' },
      udyam: { value: 'UDYAM-GJ-03-0012984', status: 'PASS' },
      oem: { value: 'Pending OEM Undertaking', status: 'WARN' },
      localContent: { value: '52%', status: 'PASS' },
      debarment: { value: 'Clear (CVC/GeM)', status: 'PASS' },
      overallStatus: 'REQUIRES MANUAL REVIEW',
      bidValue: '₹14.40 Cr',
      submittedAt: '2026-09-08T11:15:00Z',
    },
    {
      id: 'bid-pqr-04',
      name: 'PQR Industries Ltd',
      shortName: 'PQR Industries',
      complianceScore: 61,
      riskLevel: 'HIGH',
      turnover: { value: '₹7.80 Cr (Deficit)', status: 'FAIL' },
      experience: { value: '3 Yrs (Deficit)', status: 'FAIL' },
      gst: { value: '29AABCP3456J1Z9', status: 'PASS' },
      pan: { value: 'AABCP3456J', status: 'PASS' },
      udyam: { value: 'Non-MSME', status: 'N/A' },
      oem: { value: 'Authorization Expired', status: 'FAIL' },
      localContent: { value: '42% (<50% Min)', status: 'FAIL' },
      debarment: { value: 'Debarment Warning', status: 'FAIL' },
      overallStatus: 'NON-COMPLIANT',
      bidValue: '₹15.20 Cr',
      submittedAt: '2026-09-07T16:20:00Z',
    },
  ];

  const bidders = [...rawBidders].sort((a, b) => {
    if (sortBy === 'compliance') return b.complianceScore - a.complianceScore;
    if (sortBy === 'risk') {
      const rank = { LOW: 1, MEDIUM: 2, HIGH: 3 };
      return rank[a.riskLevel] - rank[b.riskLevel];
    }
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 font-sans bg-white">
      {/* Back Link */}
      <div>
        <Link 
          href="/authority/bids" 
          className="inline-flex items-center text-xs text-[#555555] hover:text-[#111111] mb-3 transition-colors font-mono"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Submitted Bids
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-4">
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
              tenderId={tenderId || 'tender-cpcl-2026-0412'}
              label="Matched Requirements PDF"
              showSaveButton={true}
            />
            <ExportAuditPdfButton
              tenderTitle="Supply, Installation and Commissioning of High-Pressure Gas Compressor System"
              tenderRef="CPCL/ENG/2026/HPGC-0412"
              tenderId={tenderId || 'tender-cpcl-2026-0412'}
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

      {/* STATUTORY DECISION-SUPPORT DISCLAIMER */}
      <div className="p-4 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] text-xs flex items-start gap-3 shadow-xs">
        <ShieldCheck className="w-5 h-5 text-[#111111] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-[#111111]">
            Official Statutory Governance & Decision-Support Notice
          </p>
          <p className="text-[#555555] leading-relaxed">
            Clausentis provides objective, deterministic verification and evidence cross-referencing. The system does <strong>not</strong> automatically rank, award, or disqualify bidders. Final commercial and technical qualification decisions remain strictly with the designated Tender Committee and Authorised Procurement Officers.
          </p>
        </div>
      </div>

      {/* COMPREHENSIVE SIDE-BY-SIDE MATRIX TABLE */}
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
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F7F7F7] text-[#111111] font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3 font-semibold">Bidder Entity</th>
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
                <tr key={b.id} className="hover:bg-[#FAFAFA] transition-colors">
                  {/* Bidder */}
                  <td className="py-3.5 px-3 break-words overflow-wrap-anywhere">
                    <p className="font-semibold text-[#111111] text-xs leading-snug">{b.name}</p>
                    <p className="text-[10px] text-[#555555] font-mono mt-0.5">{b.bidValue} Proposal</p>
                  </td>

                  {/* Compliance Score */}
                  <td className="py-3.5 px-2 text-center align-top">
                    <span className="font-mono font-bold text-[#111111] text-xs">
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
                    <span className={`font-mono text-[11px] block ${b.turnover.status === 'FAIL' ? 'font-bold text-[#111111] underline' : 'text-[#333333]'}`}>
                      {b.turnover.value}
                    </span>
                  </td>

                  {/* Experience */}
                  <td className="py-3.5 px-2 align-top break-words overflow-wrap-anywhere">
                    <span className={`font-mono text-[11px] block ${b.experience.status === 'FAIL' ? 'font-bold text-[#111111] underline' : 'text-[#333333]'}`}>
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
                    <span className={`text-[11px] block leading-snug ${b.oem.status === 'FAIL' ? 'font-semibold text-[#111111]' : 'text-[#555555]'}`}>
                      {b.oem.value}
                    </span>
                  </td>

                  {/* Local Content */}
                  <td className="py-3.5 px-2 text-center align-top">
                    <span className={`font-mono text-[11px] ${b.localContent.status === 'FAIL' ? 'font-bold text-[#111111]' : 'text-[#333333]'}`}>
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
