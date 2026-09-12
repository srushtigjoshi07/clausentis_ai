'use client';

/**
 * Pre-Bid vs Final Compliance Comparison Component
 *
 * Compares the bidder's initial self-declared Pre-Bid Eligibility Score
 * with the final Verified Compliance Score (grounded in document AI extraction
 * and statutory government verification).
 *
 * Explains why the score changed and highlights discrepancies found.
 */

import React from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  ShieldCheck, 
  FileText, 
  Building,
  Info
} from 'lucide-react';
import { WaterfallDeltaChart, WaterfallStep } from '@/components/charts/InteractiveCharts';

export interface ComparisonItem {
  parameter: string;
  declaredValue: string;
  extractedDocValue: string;
  governmentRecordValue: string;
  status: 'VERIFIED_MATCH' | 'VARIATION_EXPLAINED' | 'DISCREPANCY_FOUND' | 'STATUTORY_FAILED';
  scoreImpact: string;
  explanation: string;
}

interface PreBidVsVerifiedComparisonProps {
  bidderName?: string;
  preBidScore?: number;
  preBidVerdict?: string;
  verifiedScore?: number;
  verifiedVerdict?: string;
  items?: ComparisonItem[];
  className?: string;
}

const DEFAULT_COMPARISON_ITEMS: ComparisonItem[] = [
  {
    parameter: 'Average Annual Turnover',
    declaredValue: '₹15.00 Cr',
    extractedDocValue: '₹12.40 Cr (CA Balance Sheet)',
    governmentRecordValue: '₹12.40 Cr (MCA Balance Sheet)',
    status: 'VARIATION_EXPLAINED',
    scoreImpact: '-2 pts',
    explanation: 'Declared estimate was ₹15 Cr, but audited CA certificate and MCA filings reflect ₹12.40 Cr. Still comfortably exceeds the ₹10 Cr tender threshold.',
  },
  {
    parameter: 'MSME / Udyam Enterprise Status',
    declaredValue: 'UDYAM-TN-02-0049182 (Active)',
    extractedDocValue: 'UDYAM-TN-02-0049182',
    governmentRecordValue: 'ACTIVE (Ministry of MSME)',
    status: 'VERIFIED_MATCH',
    scoreImpact: '0 pts',
    explanation: 'Udyam certificate confirmed authentic via Government Verification Gateway. Qualified for EMD and tender fee exemption.',
  },
  {
    parameter: 'GSTIN Registration Status',
    declaredValue: '33AABCA1234F1Z8',
    extractedDocValue: '33AABCA1234F1Z8 (Form REG-06)',
    governmentRecordValue: 'ACTIVE (GSTN Portal)',
    status: 'VERIFIED_MATCH',
    scoreImpact: '0 pts',
    explanation: 'Principal place of business confirmed in Tamil Nadu. Regular taxpayer status active with recent return filed.',
  },
  {
    parameter: 'Enterprise Legal Identity (PAN)',
    declaredValue: 'AABCA1234F',
    extractedDocValue: 'AABCA1234F',
    governmentRecordValue: 'AABCA1234F (CBDT / MCA)',
    status: 'VERIFIED_MATCH',
    scoreImpact: '0 pts',
    explanation: 'PAN matches enterprise entity across submitted document vault, GSTIN characters 3-12, and MCA21 company registry.',
  },
  {
    parameter: 'Make in India Local Content',
    declaredValue: '75% Local Value Addition',
    extractedDocValue: '68% (Statutory Auditor Certificate)',
    governmentRecordValue: 'Class-I Local Supplier (>= 50%)',
    status: 'VARIATION_EXPLAINED',
    scoreImpact: '-3 pts',
    explanation: 'Auditor certificate verified 68% domestic value addition. Remains eligible as Class-I Local Supplier under PPP-MII order.',
  },
  {
    parameter: 'Non-Blacklisting Undertaking',
    declaredValue: 'Non-Debarred (Affidavit Ready)',
    extractedDocValue: 'Notarized 28-Aug-2026',
    governmentRecordValue: 'Clear (CVC / GeM Index)',
    status: 'VERIFIED_MATCH',
    scoreImpact: '0 pts',
    explanation: 'Notarization verified within 30 days of tender due date. No active debarment found on Central Vigilance Commission register.',
  }
];

export function PreBidVsVerifiedComparison({
  bidderName = 'Apex Heavy Engineering Pvt Ltd',
  preBidScore = 95,
  preBidVerdict = 'LIKELY ELIGIBLE',
  verifiedScore = 90,
  verifiedVerdict = 'COMPLIANT & QUALIFIED',
  items = DEFAULT_COMPARISON_ITEMS,
  className = '',
}: PreBidVsVerifiedComparisonProps) {
  const delta = verifiedScore - preBidScore;
  const isDrop = delta < 0;

  return (
    <div className={`rounded-xl border border-[#E5E5E5] bg-white overflow-hidden shadow-2xs ${className}`}>
      
      {/* Header */}
      <div className="p-6 border-b border-[#E5E5E5] bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E5E5]">
                PRE-BID VS POST-VERIFICATION DELTA
              </span>
              <span className="text-[#777777] text-xs">•</span>
              <span className="text-xs text-[#555555] font-mono">{bidderName}</span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-[#111111] mt-1 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#111111]" />
              Pre-Bid vs Final Compliance Comparison
            </h2>
            <p className="text-xs text-[#555555] mt-0.5">
              Transparent reconciliation of self-declared operational parameters against document AI extractions and statutory government verification.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-mono font-bold uppercase border ${
              delta === 0 
                ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]' 
                : isDrop 
                ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]' 
                : 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]'
            }`}>
              {isDrop ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
              {delta > 0 ? `+${delta}` : delta} Pts Variance
            </span>
          </div>
        </div>
      </div>

      {/* Side-by-Side Score Delta Cards */}
      <div className="p-6 bg-[#FAFAFA] border-b border-[#E5E5E5]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          
          {/* Pre-Bid Score Card */}
          <div className="p-4 rounded-lg bg-white border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777] block">
              Phase 1: Pre-Bid Eligibility Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[#111111]">{preBidScore}</span>
              <span className="text-xs text-[#777777]">/ 100</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="text-[11px] font-medium text-[#111111]">{preBidVerdict}</span>
            </div>
            <p className="text-[10px] text-[#777777] pt-1">
              Derived from bidder self-declared operational questionnaire
            </p>
          </div>

          {/* Transition Arrow */}
          <div className="hidden md:flex flex-col items-center justify-center text-center space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#777777]">
              Grounding &amp; Verification
            </span>
            <div className="flex items-center gap-2 text-[#555555]">
              <span className="h-px w-12 bg-[#CCCCCC]" />
              <ArrowRight className="w-4 h-4 text-[#111111]" />
              <span className="h-px w-12 bg-[#CCCCCC]" />
            </div>
            <span className="text-[10px] font-mono text-[#065F46] font-semibold bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
              OCR + Statutory Gateway
            </span>
          </div>

          {/* Verified Compliance Score Card */}
          <div className="p-4 rounded-lg bg-white border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777] block">
              Phase 2: Verified Compliance Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[#111111]">{verifiedScore}</span>
              <span className="text-xs text-[#777777]">/ 100</span>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-green-600" />
              <span className="text-[11px] font-medium text-[#111111]">{verifiedVerdict}</span>
            </div>
            <p className="text-[10px] text-[#777777] pt-1">
              Backed by extracted CA balance sheets, Udyam, GSTN &amp; MCA records
            </p>
          </div>

        </div>
      </div>

      {/* Visual Waterfall Delta Variance Chart */}
      <div className="p-6 border-b border-[#E5E5E5] bg-white">
        <WaterfallDeltaChart
          title="Reconciliation Waterfall: Declared vs Verified Breakdown"
          subtitle="Point-by-point audit explaining each variance between self-assessment and registry proof"
          steps={[
            {
              name: 'Pre-Bid Declared',
              delta: preBidScore,
              cumulative: preBidScore,
              category: 'START',
              reason: 'Initial preliminary self-assessment calculated from vendor operational questionnaire.'
            },
            {
              name: 'Turnover Variance',
              delta: -2,
              cumulative: preBidScore - 2,
              category: 'DEDUCTION',
              reason: 'Audited CA balance sheet and MCA21 confirm ₹12.40 Cr vs self-declared ₹15.00 Cr (exceeds ₹10 Cr cutoff).'
            },
            {
              name: 'Local Content Revision',
              delta: -3,
              cumulative: preBidScore - 5,
              category: 'DEDUCTION',
              reason: 'Statutory auditor certificate verifies 68% domestic value addition vs self-estimated 75%.'
            },
            {
              name: 'Udyam MSME Matched',
              delta: 0,
              cumulative: verifiedScore,
              category: 'ADDITION',
              reason: 'MSME registration authenticated via Udyam gateway; EMD exemption formally confirmed.'
            },
            {
              name: 'Final Verified Score',
              delta: 0,
              cumulative: verifiedScore,
              category: 'FINAL',
              reason: 'Post-verification compliance score grounded in authentic official documentation and government APIs.'
            }
          ]}
        />
      </div>

      {/* Why Did the Score Change? Analytical Explanation Box */}
      <div className="p-6 border-b border-[#E5E5E5] bg-white space-y-3">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#555555]" />
          Why Did the Score Change After Verification?
        </h3>
        <div className="p-3.5 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] text-xs text-[#555555] space-y-2 leading-relaxed">
          <p>
            • <strong>Turnover Grounding:</strong> The bidder self-declared an estimated turnover of ₹15.00 Cr. Document OCR extraction of CA-certified balance sheets and cross-verification with MCA21 confirmed ₹12.40 Cr. While fully qualifying the ≥ ₹10 Cr mandatory clause, the score was normalized by -2 points to reflect audited figures.
          </p>
          <p>
            • <strong>Make in India Local Content:</strong> Self-declared at 75%, but the statutory auditor declaration confirmed 68% domestic value addition (-3 points). The vendor remains safely within the Class-I Local Supplier band (≥ 50%).
          </p>
          <p>
            • <strong>Statutory Authentication:</strong> Udyam (MSME), GSTN, and Corporate PAN were 100% verified with zero entity conflicts across government registries, affirming full legal qualification.
          </p>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-[#F7F7F7] text-[#555555] font-mono text-[10px] uppercase tracking-wider">
              <th className="py-3 px-4 font-medium">Evaluation Parameter</th>
              <th className="py-3 px-4 font-medium">Pre-Bid Self-Declared</th>
              <th className="py-3 px-4 font-medium">Document Vault Extracted</th>
              <th className="py-3 px-4 font-medium">Government Registry Value</th>
              <th className="py-3 px-4 font-medium text-center">Outcome</th>
              <th className="py-3 px-4 font-medium text-right">Score Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-[#FAFAFA] transition-colors">
                <td className="py-3.5 px-4 font-medium text-[#111111]">
                  <div>
                    <span className="block text-xs font-semibold">{item.parameter}</span>
                    <span className="text-[11px] text-[#777777] font-normal line-clamp-1">{item.explanation}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-[#555555]">
                  {item.declaredValue}
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-[#111111] font-medium">
                  {item.extractedDocValue}
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-[#111111] font-semibold">
                  {item.governmentRecordValue}
                </td>
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                    item.status === 'VERIFIED_MATCH' 
                      ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]' 
                      : item.status === 'VARIATION_EXPLAINED' 
                      ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]' 
                      : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                  }`}>
                    {item.status === 'VERIFIED_MATCH' && <CheckCircle2 className="w-3 h-3" />}
                    {item.status === 'VARIATION_EXPLAINED' && <AlertTriangle className="w-3 h-3" />}
                    {item.status === 'DISCREPANCY_FOUND' && <XCircle className="w-3 h-3" />}
                    {item.status === 'STATUTORY_FAILED' && <XCircle className="w-3 h-3" />}
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-mono text-right font-medium text-xs whitespace-nowrap text-[#555555]">
                  {item.scoreImpact}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
