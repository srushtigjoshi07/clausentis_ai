'use client';

/**
 * Executive Dashboard Command Center for Government Procurement Officers
 *
 * Provides executive KPI cards, category compliance breakdown charts,
 * bidder comparison charts, risk distribution visualizer, interactive compliance
 * matrix with status filters (✓ ⚠ ✗), and extracted vs verified evidence inspection.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  FileText,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Users,
  Eye,
  ArrowRight,
  ExternalLink,
  Layers,
  Filter,
  CheckCircle,
  Database,
  Clock,
  PieChart,
  Network
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  RadarSpiderChart,
  DonutGaugeChart,
  GroupedBarChart,
  type RadarMetric,
  type DonutSlice,
  type GroupedBarItem
} from '@/components/charts/InteractiveCharts';
import { ArchitectureWorkflowDiagram } from '@/components/charts/ArchitectureWorkflowDiagram';

// Category compliance breakdown data
const COMPLIANCE_CATEGORIES = [
  { category: 'GSTN Tax Compliance', passRate: 100, count: '4/4 Bids', color: 'bg-emerald-600' },
  { category: 'PAN Corporate Identity', passRate: 100, count: '4/4 Bids', color: 'bg-emerald-600' },
  { category: 'Non-Blacklisting (CVC / GeM)', passRate: 96, count: '4/4 Bids', color: 'bg-emerald-600' },
  { category: 'Udyam MSME Registry', passRate: 92, count: '3/4 Bids', color: 'bg-emerald-500' },
  { category: 'Make in India (Local Content)', passRate: 88, count: '3/4 Bids', color: 'bg-emerald-500' },
  { category: 'OEM Authorization (MAF)', passRate: 84, count: '3/4 Bids', color: 'bg-amber-500' },
  { category: 'EPFO & ESIC Clearance', passRate: 80, count: '3/4 Bids', color: 'bg-amber-500' },
  { category: 'Financial Turnover (CA Audited)', passRate: 75, count: '3/4 Bids', color: 'bg-amber-500' },
];

// Bidder Comparison data
const BIDDER_COMPARISONS = [
  {
    id: 'bid-apex-02',
    name: 'Apex Heavy Engineering Pvt Ltd',
    shortName: 'Apex Heavy',
    compliancePct: 100,
    riskLevel: 'LOW',
    riskPct: 10,
    verificationPct: 100,
    turnover: '₹12.40 Cr',
    status: 'QUALIFIED',
    color: '#065F46'
  },
  {
    id: 'bid-abc-01',
    name: 'ABC Industrial Solutions Pvt Ltd',
    shortName: 'ABC Industrial',
    compliancePct: 96,
    riskLevel: 'LOW',
    riskPct: 15,
    verificationPct: 100,
    turnover: '₹11.80 Cr',
    status: 'QUALIFIED',
    color: '#065F46'
  },
  {
    id: 'bid-xyz-03',
    name: 'XYZ Engineering Works',
    shortName: 'XYZ Engineering',
    compliancePct: 82,
    riskLevel: 'MEDIUM',
    riskPct: 45,
    verificationPct: 85,
    turnover: '₹10.20 Cr',
    status: 'REQUIRES REVIEW',
    color: '#92400E'
  },
  {
    id: 'bid-zenith-04',
    name: 'Zenith Marine & Mechanical Ltd',
    shortName: 'Zenith Marine',
    compliancePct: 64,
    riskLevel: 'HIGH',
    riskPct: 75,
    verificationPct: 65,
    turnover: '₹8.90 Cr',
    status: 'NON-COMPLIANT',
    color: '#991B1B'
  }
];

// Radar Spider Chart Data: 6 Key Dimensions
const RADAR_DATA: RadarMetric[] = [
  {
    dimension: 'Financial Solvency',
    maxScore: 100,
    bidders: [
      { bidderId: 'bid-apex-02', name: 'Apex Heavy', score: 98, color: '#059669' },
      { bidderId: 'bid-abc-01', name: 'ABC Industrial', score: 94, color: '#2563EB' },
      { bidderId: 'bid-xyz-03', name: 'XYZ Engineering', score: 82, color: '#D97706' },
      { bidderId: 'bid-zenith-04', name: 'Zenith Marine', score: 60, color: '#DC2626' },
    ]
  },
  {
    dimension: 'Statutory (GST/PAN)',
    maxScore: 100,
    bidders: [
      { bidderId: 'bid-apex-02', name: 'Apex Heavy', score: 100, color: '#059669' },
      { bidderId: 'bid-abc-01', name: 'ABC Industrial', score: 100, color: '#2563EB' },
      { bidderId: 'bid-xyz-03', name: 'XYZ Engineering', score: 95, color: '#D97706' },
      { bidderId: 'bid-zenith-04', name: 'Zenith Marine', score: 85, color: '#DC2626' },
    ]
  },
  {
    dimension: 'Udyam MSME Registry',
    maxScore: 100,
    bidders: [
      { bidderId: 'bid-apex-02', name: 'Apex Heavy', score: 100, color: '#059669' },
      { bidderId: 'bid-abc-01', name: 'ABC Industrial', score: 100, color: '#2563EB' },
      { bidderId: 'bid-xyz-03', name: 'XYZ Engineering', score: 90, color: '#D97706' },
      { bidderId: 'bid-zenith-04', name: 'Zenith Marine', score: 65, color: '#DC2626' },
    ]
  },
  {
    dimension: 'OEM Direct Authorization',
    maxScore: 100,
    bidders: [
      { bidderId: 'bid-apex-02', name: 'Apex Heavy', score: 95, color: '#059669' },
      { bidderId: 'bid-abc-01', name: 'ABC Industrial', score: 95, color: '#2563EB' },
      { bidderId: 'bid-xyz-03', name: 'XYZ Engineering', score: 70, color: '#D97706' },
      { bidderId: 'bid-zenith-04', name: 'Zenith Marine', score: 40, color: '#DC2626' },
    ]
  },
  {
    dimension: 'Make in India (Local %)',
    maxScore: 100,
    bidders: [
      { bidderId: 'bid-apex-02', name: 'Apex Heavy', score: 92, color: '#059669' },
      { bidderId: 'bid-abc-01', name: 'ABC Industrial', score: 90, color: '#2563EB' },
      { bidderId: 'bid-xyz-03', name: 'XYZ Engineering', score: 80, color: '#D97706' },
      { bidderId: 'bid-zenith-04', name: 'Zenith Marine', score: 55, color: '#DC2626' },
    ]
  },
  {
    dimension: 'CVC / GeM Non-Debarment',
    maxScore: 100,
    bidders: [
      { bidderId: 'bid-apex-02', name: 'Apex Heavy', score: 100, color: '#059669' },
      { bidderId: 'bid-abc-01', name: 'ABC Industrial', score: 100, color: '#2563EB' },
      { bidderId: 'bid-xyz-03', name: 'XYZ Engineering', score: 100, color: '#D97706' },
      { bidderId: 'bid-zenith-04', name: 'Zenith Marine', score: 40, color: '#DC2626' },
    ]
  },
];

// Donut Gauge Slices
const DONUT_SLICES: DonutSlice[] = [
  { label: 'Low Risk (Qualified)', count: 2, percentage: 50, color: '#059669', description: 'Fully compliant on all 8 government registries and technical clauses.' },
  { label: 'Medium Risk (Review)', count: 1, percentage: 25, color: '#D97706', description: 'Minor OEM channel partner clarification required under CVC norms.' },
  { label: 'High Risk (Flagged)', count: 1, percentage: 25, color: '#DC2626', description: 'Annual turnover deficit (-₹1.10 Cr) below statutory tender cutoff.' },
];

// Grouped Bar Items
const GROUPED_BAR_ITEMS: GroupedBarItem[] = [
  {
    id: 'bid-apex-02',
    name: 'Apex Heavy Engineering Pvt Ltd',
    qualificationStatus: 'QUALIFIED',
    metrics: [
      { label: 'Compliance', value: 100, color: '#059669' },
      { label: 'Verification', value: 100, color: '#2563EB' },
      { label: 'Safety (100-Risk)', value: 90, color: '#10B981' },
    ]
  },
  {
    id: 'bid-abc-01',
    name: 'ABC Industrial Solutions Pvt Ltd',
    qualificationStatus: 'QUALIFIED',
    metrics: [
      { label: 'Compliance', value: 96, color: '#059669' },
      { label: 'Verification', value: 100, color: '#2563EB' },
      { label: 'Safety (100-Risk)', value: 85, color: '#10B981' },
    ]
  },
  {
    id: 'bid-xyz-03',
    name: 'XYZ Engineering Works',
    qualificationStatus: 'REVIEW',
    metrics: [
      { label: 'Compliance', value: 82, color: '#D97706' },
      { label: 'Verification', value: 85, color: '#2563EB' },
      { label: 'Safety (100-Risk)', value: 55, color: '#F59E0B' },
    ]
  },
  {
    id: 'bid-zenith-04',
    name: 'Zenith Marine & Mechanical Ltd',
    qualificationStatus: 'DISQUALIFIED',
    metrics: [
      { label: 'Compliance', value: 64, color: '#DC2626' },
      { label: 'Verification', value: 65, color: '#2563EB' },
      { label: 'Safety (100-Risk)', value: 25, color: '#EF4444' },
    ]
  },
];

// Interactive compliance matrix rows
interface MatrixRequirementRow {
  clauseCode: string;
  requirementName: string;
  category: string;
  extractedValue: string;
  verifiedGovValue: string;
  status: 'COMPLIANT' | 'REQUIRES_REVIEW' | 'NON_COMPLIANT';
  bidderName: string;
  evidenceSource: string;
  confidence: number;
}

const SAMPLE_MATRIX_REQUIREMENTS: MatrixRequirementRow[] = [
  {
    clauseCode: 'SEC-3.1',
    requirementName: 'Annual Average Turnover >= ₹10.0 Cr',
    category: 'Financial',
    extractedValue: '₹12.40 Cr (CA Audited Balance Sheet)',
    verifiedGovValue: '₹12.40 Cr (MCA21 Filings)',
    status: 'COMPLIANT',
    bidderName: 'Apex Heavy Engineering',
    evidenceSource: 'MCA21 & Audited Balance Sheet',
    confidence: 0.99
  },
  {
    clauseCode: 'SEC-4.2',
    requirementName: 'Active GSTIN in State of Operation',
    category: 'Statutory',
    extractedValue: '33AABCA1234F1Z8 (Tamil Nadu)',
    verifiedGovValue: '33AABCA1234F1Z8 (Active Regular)',
    status: 'COMPLIANT',
    bidderName: 'Apex Heavy Engineering',
    evidenceSource: 'GSTN Gateway (G2G)',
    confidence: 1.00
  },
  {
    clauseCode: 'SEC-5.1',
    requirementName: 'Udyam MSME Registration Certificate',
    category: 'Statutory',
    extractedValue: 'UDYAM-TN-02-0049182',
    verifiedGovValue: 'ACTIVE (Medium Enterprise - Mfg)',
    status: 'COMPLIANT',
    bidderName: 'Apex Heavy Engineering',
    evidenceSource: 'Ministry of MSME Portal',
    confidence: 1.00
  },
  {
    clauseCode: 'SEC-6.1',
    requirementName: 'Manufacturer Authorization Form (MAF)',
    category: 'Technical',
    extractedValue: 'MAF Annexure-IV (Direct OEM Certified)',
    verifiedGovValue: 'Direct OEM Certified',
    status: 'COMPLIANT',
    bidderName: 'Apex Heavy Engineering',
    evidenceSource: 'OEM Undertaking',
    confidence: 0.95
  },
  {
    clauseCode: 'SEC-7.1',
    requirementName: 'Make in India Local Content >= 50%',
    category: 'Technical',
    extractedValue: '68% Local Value Addition',
    verifiedGovValue: 'Class-I Local Supplier (>= 50%)',
    status: 'COMPLIANT',
    bidderName: 'Apex Heavy Engineering',
    evidenceSource: 'Statutory Auditor Certificate',
    confidence: 0.98
  },
  {
    clauseCode: 'SEC-3.1',
    requirementName: 'Annual Average Turnover >= ₹10.0 Cr',
    category: 'Financial',
    extractedValue: '₹10.20 Cr (Borderline Threshold)',
    verifiedGovValue: '₹10.20 Cr (MCA21 Filings)',
    status: 'REQUIRES_REVIEW',
    bidderName: 'XYZ Engineering Works',
    evidenceSource: 'MCA21 & Balance Sheet',
    confidence: 0.92
  },
  {
    clauseCode: 'SEC-6.1',
    requirementName: 'Manufacturer Authorization Form (MAF)',
    category: 'Technical',
    extractedValue: 'Dealer Certificate (Pending OEM Direct Undertaking)',
    verifiedGovValue: 'Channel Partner (Not Direct OEM)',
    status: 'REQUIRES_REVIEW',
    bidderName: 'XYZ Engineering Works',
    evidenceSource: 'Document AI Inspection',
    confidence: 0.88
  },
  {
    clauseCode: 'SEC-3.1',
    requirementName: 'Annual Average Turnover >= ₹10.0 Cr',
    category: 'Financial',
    extractedValue: '₹8.90 Cr (Deficit of ₹1.10 Cr)',
    verifiedGovValue: '₹8.90 Cr (Audited Balance Sheet)',
    status: 'NON_COMPLIANT',
    bidderName: 'Zenith Marine & Mechanical',
    evidenceSource: 'Audited Financials',
    confidence: 0.99
  }
];

export function ExecutiveDashboardCommandCenter() {
  const [matrixFilter, setMatrixFilter] = useState<'ALL' | 'COMPLIANT' | 'REQUIRES_REVIEW' | 'NON_COMPLIANT'>('ALL');
  const [selectedRowForEvidence, setSelectedRowForEvidence] = useState<MatrixRequirementRow | null>(null);
  const [viewTab, setViewTab] = useState<'ALL' | 'ANALYTICS' | 'ARCHITECTURE' | 'MATRIX'>('ALL');

  const filteredRequirements = SAMPLE_MATRIX_REQUIREMENTS.filter(r => {
    if (matrixFilter === 'ALL') return true;
    return r.status === matrixFilter;
  });

  const compliantCount = SAMPLE_MATRIX_REQUIREMENTS.filter(r => r.status === 'COMPLIANT').length;
  const reviewCount = SAMPLE_MATRIX_REQUIREMENTS.filter(r => r.status === 'REQUIRES_REVIEW').length;
  const nonCompliantCount = SAMPLE_MATRIX_REQUIREMENTS.filter(r => r.status === 'NON_COMPLIANT').length;

  return (
    <div className="space-y-8 font-sans">

      {/* VIEW CONTROLLER & DASHBOARD HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-[#E5E5E5] gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#111111] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#111111]" />
            Executive Bid Compliance &amp; Verification Command Center
          </h2>
          <p className="text-xs text-[#666666] mt-0.5">
            Tender Reference: <span className="font-mono font-medium text-[#111111]">CPCL/RE/2026/0412</span> • High-Pressure Gas Compressor Automation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-[#F5F5F5] p-1 rounded-lg border border-[#E5E5E5] text-xs">
          <button
            type="button"
            onClick={() => setViewTab('ALL')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              viewTab === 'ALL'
                ? 'bg-white text-[#111111] shadow-2xs font-semibold'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            All Views
          </button>
          <button
            type="button"
            onClick={() => setViewTab('ANALYTICS')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              viewTab === 'ANALYTICS'
                ? 'bg-white text-[#111111] shadow-2xs font-semibold'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            Visual Graphs &amp; Radar
          </button>
          <button
            type="button"
            onClick={() => setViewTab('ARCHITECTURE')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              viewTab === 'ARCHITECTURE'
                ? 'bg-white text-[#111111] shadow-2xs font-semibold'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            Architecture &amp; Pipeline
          </button>
          <button
            type="button"
            onClick={() => setViewTab('MATRIX')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-1.5 ${
              viewTab === 'MATRIX'
                ? 'bg-white text-[#111111] shadow-2xs font-semibold'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Compliance Matrix
          </button>
        </div>
      </div>
      
      {/* 1. EXECUTIVE KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Average Compliance Score */}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-2xs hover:border-[#CCCCCC] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#777777] font-semibold">
              Average Compliance Score
            </span>
            <div className="w-7 h-7 rounded-md bg-[#ECFDF5] text-[#065F46] flex items-center justify-center border border-[#A7F3D0]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#111111] font-mono">88.5%</span>
            <span className="inline-flex items-center text-[10px] font-mono text-[#065F46] font-semibold">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +4.2%
            </span>
          </div>
          <div className="mt-2.5 w-full bg-[#F0F0F0] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#065F46] h-full rounded-full" style={{ width: '88.5%' }} />
          </div>
          <p className="text-[11px] text-[#777777] mt-2">Clause concordance across 4 active bids</p>
        </div>

        {/* KPI 2: Risk Level Distribution */}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-2xs hover:border-[#CCCCCC] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#777777] font-semibold">
              Risk Level Overview
            </span>
            <div className="w-7 h-7 rounded-md bg-[#FFFBEB] text-[#92400E] flex items-center justify-center border border-[#FDE68A]">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#111111] font-mono">1 Flagged</span>
            <span className="text-xs text-[#991B1B] font-mono font-medium">Critical</span>
          </div>
          <div className="mt-2.5 flex h-1.5 w-full rounded-full overflow-hidden gap-0.5">
            <div className="bg-[#065F46] h-full" style={{ width: '60%' }} title="Low Risk: 60%" />
            <div className="bg-[#F59E0B] h-full" style={{ width: '20%' }} title="Medium Risk: 20%" />
            <div className="bg-[#EF4444] h-full" style={{ width: '20%' }} title="High/Critical: 20%" />
          </div>
          <p className="text-[11px] text-[#777777] mt-2">2 Low • 1 Medium • 1 High Risk</p>
        </div>

        {/* KPI 3: Documents Analysed */}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-2xs hover:border-[#CCCCCC] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#777777] font-semibold">
              Documents Analysed
            </span>
            <div className="w-7 h-7 rounded-md bg-[#F5F5F5] text-[#111111] flex items-center justify-center border border-[#E5E5E5]">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#111111] font-mono">142</span>
            <span className="text-xs text-[#555555] font-medium">Vault Docs</span>
          </div>
          <div className="mt-2.5 w-full bg-[#F0F0F0] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#111111] h-full rounded-full" style={{ width: '100%' }} />
          </div>
          <p className="text-[11px] text-[#777777] mt-2">100% OCR &amp; tamper checked</p>
        </div>

        {/* KPI 4: Government Verifications Completed */}
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-2xs hover:border-[#CCCCCC] transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#777777] font-semibold">
              Government Verifications
            </span>
            <div className="w-7 h-7 rounded-md bg-[#ECFDF5] text-[#065F46] flex items-center justify-center border border-[#A7F3D0]">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#111111] font-mono">98.4%</span>
            <span className="text-xs text-[#065F46] font-mono font-medium">Verified</span>
          </div>
          <div className="mt-2.5 w-full bg-[#F0F0F0] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#065F46] h-full rounded-full" style={{ width: '98.4%' }} />
          </div>
          <p className="text-[11px] text-[#777777] mt-2">Udyam, GSTN, MCA21 cross-checked</p>
        </div>

      </div>

      {/* 2. VERIFICATION PIPELINE PROGRESS & ARCHITECTURE DIAGRAM */}
      {(viewTab === 'ALL' || viewTab === 'ARCHITECTURE') && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-[#555555]" />
                5-Stage Automated Verification Pipeline
              </h3>
              <span className="text-[10px] font-mono text-[#065F46] font-semibold bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
                ACTIVE PIPELINE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[
                { step: '01', title: 'Document Validation', desc: 'OCR, QR & Tamper Detection', progress: '100% Complete', status: 'done' },
                { step: '02', title: 'AI Clause Extraction', desc: 'Financial & Technical Facts', progress: '100% Complete', status: 'done' },
                { step: '03', title: 'Government Gateway', desc: 'Udyam, GSTN, MCA Records', progress: '100% Complete', status: 'done' },
                { step: '04', title: 'Entity Resolution', desc: 'Cross-Document Identity Link', progress: '95% Concordance', status: 'done' },
                { step: '05', title: 'Officer Adjudication', desc: 'Statutory Verdict & Signing', progress: 'Pending Review', status: 'active' },
              ].map((st, i) => (
                <div key={i} className={`p-3 rounded-lg border text-xs ${
                  st.status === 'done' 
                    ? 'bg-[#FAFAFA] border-[#E5E5E5]' 
                    : 'bg-white border-[#111111] ring-1 ring-[#111111]'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[10px] text-[#777777] font-bold">{st.step}</span>
                    {st.status === 'done' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-[#065F46]" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-[#111111]" />
                    )}
                  </div>
                  <h4 className="font-semibold text-[#111111] text-xs">{st.title}</h4>
                  <p className="text-[10px] text-[#555555] mt-0.5 line-clamp-1">{st.desc}</p>
                  <div className="mt-2 text-[10px] font-mono font-medium text-[#777777]">
                    {st.progress}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive End-to-End System Architecture & Dataflow Diagram */}
          <ArchitectureWorkflowDiagram />
        </div>
      )}

      {/* 3. VISUAL CHARTS & GRAPHS SUITE */}
      {(viewTab === 'ALL' || viewTab === 'ANALYTICS') && (
        <div className="space-y-6">
          {/* Row A: Donut Gauge Chart + Multidimensional Radar Spider Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <DonutGaugeChart
                slices={DONUT_SLICES}
                totalScore={88.5}
                totalLabel="Average Compliance"
                title="Portfolio Risk & Compliance Distribution"
                subtitle="Categorization of all 4 active bids based on statutory evaluation"
              />
            </div>
            <div className="lg:col-span-7">
              <RadarSpiderChart
                data={RADAR_DATA}
                title="Multidimensional Bidder Competency Radar"
                subtitle="Overlay comparison across 6 statutory & technical qualification dimensions"
              />
            </div>
          </div>

          {/* Row B: Multi-Metric Grouped Bar Chart */}
          <GroupedBarChart
            items={GROUPED_BAR_ITEMS}
            title="Multi-Metric Comparative Bidder Performance"
            subtitle="Side-by-side comparison of Compliance %, Gateway Verification %, and Risk Safety Margin"
          />

          {/* Row C: Category Breakdown & Bidder Comparison Standing */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Category Compliance Breakdown Chart (6 cols) */}
        <div className="lg:col-span-6 rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
            <div>
              <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#555555]" />
                Compliance Breakdown by Statutory Category
              </h3>
              <p className="text-[11px] text-[#777777] mt-0.5">
                Concordance rate across standard PSU qualification clauses
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#777777]">8 Categories</span>
          </div>

          <div className="space-y-3 pt-1">
            {COMPLIANCE_CATEGORIES.map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#111111]">{cat.category}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-[#777777]">{cat.count}</span>
                    <span className={`font-bold ${cat.passRate >= 90 ? 'text-[#065F46]' : cat.passRate >= 75 ? 'text-[#92400E]' : 'text-[#991B1B]'}`}>
                      {cat.passRate}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-[#F0F0F0] h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      cat.passRate >= 90 ? 'bg-[#065F46]' : cat.passRate >= 80 ? 'bg-[#111111]' : 'bg-[#F59E0B]'
                    }`}
                    style={{ width: `${cat.passRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bidder Comparison Chart (6 cols) */}
        <div className="lg:col-span-6 rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
            <div>
              <h3 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#555555]" />
                Comparative Bidder Evaluation Standing
              </h3>
              <p className="text-[11px] text-[#777777] mt-0.5">
                Side-by-side compliance, risk rating, and statutory verification rates
              </p>
            </div>
            <Link href="/authority/tenders/tender-cpcl-2026-0412/compare-bids">
              <span className="text-[11px] text-[#111111] hover:underline font-medium cursor-pointer">
                Full Matrix &rarr;
              </span>
            </Link>
          </div>

          <div className="space-y-3.5 pt-1">
            {BIDDER_COMPARISONS.map((bidder) => (
              <div key={bidder.id} className="p-3.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-xs text-[#111111]">{bidder.name}</h4>
                    <span className="text-[10px] font-mono text-[#777777]">Turnover: {bidder.turnover}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                    bidder.riskLevel === 'LOW' ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]' :
                    bidder.riskLevel === 'MEDIUM' ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]' :
                    'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                  }`}>
                    {bidder.riskLevel} RISK
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1 text-center font-mono">
                  <div className="p-1.5 rounded bg-white border border-[#E5E5E5]">
                    <span className="text-[9px] text-[#777777] block uppercase">Compliance</span>
                    <span className="text-xs font-bold text-[#111111]">{bidder.compliancePct}%</span>
                  </div>
                  <div className="p-1.5 rounded bg-white border border-[#E5E5E5]">
                    <span className="text-[9px] text-[#777777] block uppercase">Govt Verified</span>
                    <span className="text-xs font-bold text-[#111111]">{bidder.verificationPct}%</span>
                  </div>
                  <div className="p-1.5 rounded bg-white border border-[#E5E5E5]">
                    <span className="text-[9px] text-[#777777] block uppercase">Action</span>
                    <Link href={`/authority/bids/${bidder.id}`}>
                      <span className="text-xs font-bold text-[#111111] hover:underline cursor-pointer">Inspect &rarr;</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )}

      {/* 4. INTERACTIVE COMPLIANCE MATRIX WITH FILTER TABS (✓ ⚠ ✗) */}
      {(viewTab === 'ALL' || viewTab === 'MATRIX') && (
        <div className="rounded-xl border border-[#E5E5E5] bg-white overflow-hidden shadow-2xs">
        
        {/* Table Header & Status Filter Tabs */}
        <div className="p-6 border-b border-[#E5E5E5] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-[#111111] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#111111]" />
              Interactive Compliance Matrix &amp; Evidence Inspector
            </h3>
            <p className="text-xs text-[#555555] mt-0.5">
              Filter requirements by status. Click any row to inspect side-by-side extracted vs verified values.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center p-1 rounded-lg border border-[#E5E5E5] bg-[#F7F7F7] text-xs">
            <button
              type="button"
              onClick={() => setMatrixFilter('ALL')}
              className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                matrixFilter === 'ALL' ? 'bg-white text-[#111111] shadow-2xs border border-[#E5E5E5]' : 'text-[#555555] hover:text-[#111111]'
              }`}
            >
              All ({SAMPLE_MATRIX_REQUIREMENTS.length})
            </button>
            <button
              type="button"
              onClick={() => setMatrixFilter('COMPLIANT')}
              className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                matrixFilter === 'COMPLIANT' ? 'bg-[#ECFDF5] text-[#065F46] shadow-2xs border border-[#A7F3D0]' : 'text-[#555555] hover:text-[#111111]'
              }`}
            >
              ✓ Passed ({compliantCount})
            </button>
            <button
              type="button"
              onClick={() => setMatrixFilter('REQUIRES_REVIEW')}
              className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                matrixFilter === 'REQUIRES_REVIEW' ? 'bg-[#FFFBEB] text-[#92400E] shadow-2xs border border-[#FDE68A]' : 'text-[#555555] hover:text-[#111111]'
              }`}
            >
              ⚠ Review ({reviewCount})
            </button>
            <button
              type="button"
              onClick={() => setMatrixFilter('NON_COMPLIANT')}
              className={`px-3 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                matrixFilter === 'NON_COMPLIANT' ? 'bg-[#FEF2F2] text-[#991B1B] shadow-2xs border border-[#FECACA]' : 'text-[#555555] hover:text-[#111111]'
              }`}
            >
              ✗ Failed ({nonCompliantCount})
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F7F7F7] text-[#555555] font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 font-medium">Clause Code &amp; Criterion</th>
                <th className="py-3 px-4 font-medium">Bidder</th>
                <th className="py-3 px-4 font-medium">Extracted Document Value</th>
                <th className="py-3 px-4 font-medium">Government Record Value</th>
                <th className="py-3 px-4 font-medium text-center">Status</th>
                <th className="py-3 px-4 font-medium text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredRequirements.map((row, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => setSelectedRowForEvidence(row)}
                  className={`cursor-pointer transition-colors ${
                    row.status === 'NON_COMPLIANT' ? 'bg-[#FFF8F8] hover:bg-[#FEEFEF]' :
                    row.status === 'REQUIRES_REVIEW' ? 'bg-[#FFFDF5] hover:bg-[#FEF9E7]' :
                    'hover:bg-[#FAFAFA]'
                  }`}
                >
                  <td className="py-3.5 px-4 font-medium text-[#111111]">
                    <span className="font-mono text-[10px] text-[#777777] block uppercase">{row.clauseCode} • {row.category}</span>
                    <span className="text-xs font-semibold text-[#111111]">{row.requirementName}</span>
                  </td>
                  <td className="py-3.5 px-4 text-[#555555] font-medium whitespace-nowrap">
                    {row.bidderName}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#555555] max-w-xs truncate">
                    {row.extractedValue}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#111111] font-semibold max-w-xs truncate">
                    {row.verifiedGovValue}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                      row.status === 'COMPLIANT' ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]' :
                      row.status === 'REQUIRES_REVIEW' ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]' :
                      'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                    }`}>
                      {row.status === 'COMPLIANT' && <CheckCircle2 className="w-3 h-3" />}
                      {row.status === 'REQUIRES_REVIEW' && <AlertTriangle className="w-3 h-3" />}
                      {row.status === 'NON_COMPLIANT' && <XCircle className="w-3 h-3" />}
                      {row.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRowForEvidence(row);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-[#111111] hover:underline font-medium cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#555555]" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

      {/* 5. SIDE-BY-SIDE EVIDENCE INSPECTION MODAL */}
      {selectedRowForEvidence && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[#E5E5E5] overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="p-5 border-b border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#777777] font-bold">
                  EVIDENCE AUDIT DOSSIER • {selectedRowForEvidence.clauseCode}
                </span>
                <h3 className="text-base font-semibold text-[#111111] mt-0.5">
                  {selectedRowForEvidence.requirementName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRowForEvidence(null)}
                className="text-[#777777] hover:text-[#111111] p-1.5 rounded hover:bg-[#E5E5E5] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              <div className="p-3 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#777777] block">Bidder Under Review</span>
                  <span className="font-semibold text-[#111111] mt-0.5 block">{selectedRowForEvidence.bidderName}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase text-[#777777] block">Statutory Source</span>
                  <span className="font-mono text-xs text-[#111111] font-semibold mt-0.5 block">{selectedRowForEvidence.evidenceSource}</span>
                </div>
              </div>

              {/* Side-by-Side Comparison Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg border border-[#E5E5E5] bg-white space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#777777] block font-semibold">
                    Document Extracted Value
                  </span>
                  <p className="text-xs font-mono font-medium text-[#111111] break-words">
                    {selectedRowForEvidence.extractedValue}
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-[#E5E5E5] bg-white space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#777777] block font-semibold">
                    Government Registry Verified Value
                  </span>
                  <p className="text-xs font-mono font-bold text-[#111111] break-words">
                    {selectedRowForEvidence.verifiedGovValue}
                  </p>
                </div>
              </div>

              {/* Status Banner */}
              <div className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
                selectedRowForEvidence.status === 'COMPLIANT' ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]' :
                selectedRowForEvidence.status === 'REQUIRES_REVIEW' ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]' :
                'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
              }`}>
                <div className="flex items-center gap-2">
                  {selectedRowForEvidence.status === 'COMPLIANT' && <CheckCircle2 className="w-4 h-4" />}
                  {selectedRowForEvidence.status === 'REQUIRES_REVIEW' && <AlertTriangle className="w-4 h-4" />}
                  {selectedRowForEvidence.status === 'NON_COMPLIANT' && <XCircle className="w-4 h-4" />}
                  <span className="font-mono font-bold uppercase">{selectedRowForEvidence.status.replace(/_/g, ' ')}</span>
                </div>
                <span className="font-mono text-[10px]">Confidence: {(selectedRowForEvidence.confidence * 100).toFixed(0)}%</span>
              </div>

              {/* Audit Disclaimer */}
              <p className="text-[11px] text-[#777777] leading-relaxed">
                Evidence extracted via document text OCR layer and corroborated against official statutory registers under CVC public procurement transparency mandates.
              </p>
            </div>

            <div className="p-4 border-t border-[#E5E5E5] bg-[#FAFAFA] flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRowForEvidence(null)}
                className="text-xs border-[#E5E5E5]"
              >
                Close
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
