'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  AlertCircle,
  HelpCircle,
  Search, 
  Filter, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Eye, 
  FileCheck2, 
  X, 
  Building2, 
  Sparkles, 
  Info, 
  Layers, 
  Scale, 
  ArrowRight,
  TrendingUp,
  FileCode,
  Check,
  Calendar,
  Clock,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MatchedRequirementsPdfButton } from '@/components/reports/MatchedRequirementsPdfButton';
import { ExportAuditPdfButton } from '@/components/audit/ExportAuditPdfButton';
import { 
  BidderEvaluationDossier, 
  RequirementComplianceResult, 
  StructuredRequirement,
  ComplianceStatus,
  CrossDocumentFinding
} from '@/lib/compliance/types';
import { runAllStatutoryEvaluations } from '@/lib/providers/providers';

interface VisualComplianceAnalysisCenterProps {
  initialDossier: BidderEvaluationDossier;
  allDossiers: BidderEvaluationDossier[];
  requirements: StructuredRequirement[];
}

export function VisualComplianceAnalysisCenter({
  initialDossier,
  allDossiers,
  requirements,
}: VisualComplianceAnalysisCenterProps) {
  // Deduplicate dossiers by bidId to prevent duplicate dropdown keys
  const uniqueDossiers = useMemo(() => {
    const map = new Map<string, BidderEvaluationDossier>();
    allDossiers.forEach((d) => {
      if (d.bidId && !map.has(d.bidId)) {
        map.set(d.bidId, d);
      }
    });
    return Array.from(map.values());
  }, [allDossiers]);

  // Selected bidder dossier
  const [selectedBidId, setSelectedBidId] = useState<string>(initialDossier.bidId);
  const currentDossier = useMemo(() => {
    return uniqueDossiers.find(d => d.bidId === selectedBidId) || initialDossier;
  }, [uniqueDossiers, selectedBidId, initialDossier]);

  // Filters & Search State
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'FAIL' | 'MISSING' | 'WARNING' | 'MANUAL_REVIEW'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'MANDATORY' | 'OPTIONAL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Interactive Inspection Drawer State
  const [inspectingResult, setInspectingResult] = useState<RequirementComplianceResult | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRowExpansion = (reqId: string) => {
    setExpandedRows(prev => ({ ...prev, [reqId]: !prev[reqId] }));
  };

  // Statutory Provider Cross-checks
  const statutoryResults = useMemo(() => {
    return runAllStatutoryEvaluations({
      companyName: currentDossier.bidderName,
      pan: currentDossier.pan,
      gstin: currentDossier.gstin,
      udyamNumber: currentDossier.udyamNumber?.includes('UDYAM') ? currentDossier.udyamNumber : undefined,
      localContentPercent: 62.0,
      epfoApplicable: true,
      esicApplicable: true,
      documentsSubmitted: currentDossier.requirementResults
        .filter(r => r.evidence)
        .map(r => ({
          documentId: r.evidence!.documentId,
          documentType: r.clauseCode.includes('6.3') ? 'local_content_declaration' : r.expectedValue,
          documentName: r.evidence!.documentName,
          pageNumber: r.evidence!.pageNumber,
        }))
    });
  }, [currentDossier]);

  // Derived Metrics from Real Data
  const results = currentDossier.requirementResults || [];
  const totalCount = results.length;
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const missingCount = results.filter(r => r.status === 'MISSING').length;
  const warningCount = results.filter(r => r.status === 'WARNING').length;
  const manualReviewCount = results.filter(r => r.status === 'MANUAL_REVIEW').length;

  const mandatoryItems = results.filter(r => r.mandatory);
  const optionalItems = results.filter(r => !r.mandatory);
  const mandatoryPassed = mandatoryItems.filter(r => r.status === 'PASS').length;
  const mandatoryTotal = mandatoryItems.length;
  const optionalPassed = optionalItems.filter(r => r.status === 'PASS').length;
  const optionalTotal = optionalItems.length;

  // Real categories in tender
  const categories = useMemo(() => {
    const set = new Set<string>();
    results.forEach(r => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }, [results]);

  // Category Breakdown Data
  const categoryBreakdown = useMemo(() => {
    return categories.map(cat => {
      const items = results.filter(r => r.category === cat);
      const passed = items.filter(r => r.status === 'PASS').length;
      const failed = items.filter(r => r.status === 'FAIL').length;
      const missing = items.filter(r => r.status === 'MISSING').length;
      const warnings = items.filter(r => r.status === 'WARNING' || r.status === 'MANUAL_REVIEW').length;
      const pct = items.length > 0 ? Math.round((passed / items.length) * 100) : 0;
      return { category: cat, total: items.length, passed, failed, missing, warnings, completionPct: pct };
    }).filter(c => c.total > 0);
  }, [categories, results]);

  // Missing Requirements
  const missingItems = useMemo(() => {
    return results.filter(r => r.status === 'MISSING' || !r.evidence);
  }, [results]);

  // Failed Requirements
  const failedItems = useMemo(() => {
    return results.filter(r => r.status === 'FAIL');
  }, [results]);

  // Warning & Attention Items
  const attentionItems = useMemo(() => {
    return results.filter(r => r.status === 'WARNING' || r.status === 'MANUAL_REVIEW');
  }, [results]);

  // Document Coverage Calculations
  const docCoverage = useMemo(() => {
    const requiredDocTypes = new Set<string>();
    requirements.forEach(req => {
      if (req.expectedDocumentType) requiredDocTypes.add(req.expectedDocumentType);
    });
    const totalRequiredDocs = requiredDocTypes.size || 10;

    const submittedDocsMap = new Map<string, string>();
    results.forEach(r => {
      if (r.evidence?.documentName) {
        submittedDocsMap.set(r.evidence.documentName, r.status);
      }
    });

    const submittedCount = submittedDocsMap.size;
    const verifiedCount = results.filter(r => r.evidence && r.status === 'PASS').length;
    const failedDocsCount = Array.from(submittedDocsMap.values()).filter(s => s === 'FAIL').length;
    const missingDocsCount = Math.max(0, totalRequiredDocs - submittedCount);
    const processedCount = submittedCount;
    const progressPct = Math.min(100, Math.round((submittedCount / totalRequiredDocs) * 100));

    return {
      required: totalRequiredDocs,
      submitted: submittedCount,
      processed: processedCount,
      verified: verifiedCount,
      missing: missingDocsCount,
      failed: failedDocsCount,
      progressPct,
    };
  }, [requirements, results]);

  // Critical Cross-Document Findings
  const criticalFindings = useMemo(() => {
    return currentDossier.crossDocumentFindings || [];
  }, [currentDossier]);

  // Filtered Requirements for Matrix Table
  const filteredRequirements = useMemo(() => {
    return results.filter(r => {
      // Status Filter
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      // Type Filter
      if (typeFilter === 'MANDATORY' && !r.mandatory) return false;
      if (typeFilter === 'OPTIONAL' && r.mandatory) return false;
      // Category Filter
      if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = r.title.toLowerCase().includes(query);
        const matchesClause = r.clauseCode.toLowerCase().includes(query);
        const matchesCategory = (r.category || '').toLowerCase().includes(query);
        const matchesDoc = (r.evidence?.documentName || '').toLowerCase().includes(query);
        const matchesText = (r.evidence?.extractedText || '').toLowerCase().includes(query);
        const matchesStatus = r.status.toLowerCase().includes(query);
        const matchesReason = (r.reason || '').toLowerCase().includes(query);
        if (!matchesName && !matchesClause && !matchesCategory && !matchesDoc && !matchesText && !matchesStatus && !matchesReason) {
          return false;
        }
      }
      return true;
    });
  }, [results, statusFilter, typeFilter, categoryFilter, searchQuery]);

  // Status visual formatting helpers
  const getStatusBadge = (status: ComplianceStatus) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">
            <Check className="w-3 h-3 stroke-[2.5]" /> PASS
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
            <X className="w-3 h-3 stroke-[2.5]" /> FAIL
          </span>
        );
      case 'MISSING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FFF7ED] text-[#C2410C] border border-[#FFEDD5]">
            <AlertCircle className="w-3 h-3 stroke-[2.5]" /> MISSING
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
            <AlertTriangle className="w-3 h-3 stroke-[2.5]" /> WARNING
          </span>
        );
      case 'MANUAL_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
            <Clock className="w-3 h-3 stroke-[2.5]" /> MANUAL REVIEW
          </span>
        );
      default:
        return <span className="text-[10px] font-mono text-[#777777]">{status}</span>;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]">LOW RISK</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">MEDIUM RISK</span>;
      case 'HIGH':
        return <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">HIGH RISK</span>;
      case 'CRITICAL':
        return <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#450A0A] text-white border border-[#450A0A]">CRITICAL RISK</span>;
      default:
        return <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#F5F5F5] text-[#333333] border border-[#E5E5E5]">{risk}</span>;
    }
  };

  const getSourceBadge = (source?: string) => {
    if (!source) return null;
    let label = source;
    let classes = 'bg-[#F5F5F5] text-[#555555] border-[#E5E5E5]';
    if (source === 'DOCUMENT') {
      label = 'DOCUMENT';
      classes = 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]';
    } else if (source === 'STATUTORY_PORTAL') {
      label = 'GOVERNMENT RECORD';
      classes = 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]';
    } else if (source === 'DECLARED_FORM') {
      label = 'AI EXTRACTION';
      classes = 'bg-[#FAF5FF] text-[#6B21A8] border-[#E9D5FF]';
    }
    return (
      <span className={`text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded border ${classes}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16 font-sans bg-white text-[#111111]">
      {/* =========================================================================
          SECTION 1: TOP HEADER & BIDDER SWITCHER
         ========================================================================= */}
      <div className="border-b border-[#E5E5E5] pb-6 pt-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5]">
                MATCHED REQUIREMENTS &bull; VISUAL ANALYSIS CENTER
              </span>
              <span className="text-[#777777] text-xs">&bull;</span>
              <span className="text-xs text-[#555555] font-mono">{currentDossier.tenderReference}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
              Matched Requirements
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#555555]">
              <p>
                <strong className="text-[#111111] font-semibold">Tender:</strong>{' '}
                {currentDossier.tenderTitle}
              </p>
              <span>&bull;</span>
              <p>
                <strong className="text-[#111111] font-semibold">Evaluation Status:</strong>{' '}
                <span className="font-mono font-semibold text-[#111111] bg-[#F5F5F5] px-1.5 py-0.5 rounded border border-[#E5E5E5]">
                  {currentDossier.status}
                </span>
              </p>
            </div>
          </div>

          {/* Interactive Bidder Switcher & PDF Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-md px-2.5 py-1 shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-[#555555]" />
              <label htmlFor="bidder-selector" className="text-[10px] font-mono uppercase text-[#777777] font-semibold">
                Bidder:
              </label>
              <select
                id="bidder-selector"
                value={selectedBidId}
                onChange={(e) => setSelectedBidId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#111111] focus:outline-none cursor-pointer pr-2"
              >
                {uniqueDossiers.map((d, idx) => (
                  <option key={`${d.bidId}-${idx}`} value={d.bidId}>
                    {d.bidderName} ({d.complianceScore}%)
                  </option>
                ))}
              </select>
            </div>

            <MatchedRequirementsPdfButton
              tenderId={currentDossier.tenderId}
              bidId={currentDossier.bidId}
              bidderCompanyName={currentDossier.bidderName}
              label="Export Dossier PDF"
              showSaveButton={true}
            />
            <Link href={`/authority/bids/${currentDossier.bidId}`}>
              <Button variant="outline" size="sm" className="h-9 px-3 text-xs border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Full Bid Review</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Compact Summary Row (Values directly from actual compliance data) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mt-5">
          <div className="bg-[#F7F7F7] border border-[#E5E5E5] rounded-md p-2.5">
            <span className="text-[10px] font-mono uppercase text-[#777777] font-semibold block">TOTAL REQUIREMENTS</span>
            <span className="text-xl font-bold font-mono text-[#111111] mt-0.5 block">{totalCount}</span>
          </div>
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-md p-2.5">
            <span className="text-[10px] font-mono uppercase text-[#166534] font-semibold block flex items-center justify-between">
              PASS <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
            <span className="text-xl font-bold font-mono text-[#166534] mt-0.5 block">{passCount}</span>
          </div>
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-md p-2.5">
            <span className="text-[10px] font-mono uppercase text-[#991B1B] font-semibold block flex items-center justify-between">
              FAIL <X className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
            <span className="text-xl font-bold font-mono text-[#991B1B] mt-0.5 block">{failCount}</span>
          </div>
          <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-md p-2.5">
            <span className="text-[10px] font-mono uppercase text-[#C2410C] font-semibold block flex items-center justify-between">
              MISSING <AlertCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
            <span className="text-xl font-bold font-mono text-[#C2410C] mt-0.5 block">{missingCount}</span>
          </div>
          <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-md p-2.5">
            <span className="text-[10px] font-mono uppercase text-[#B45309] font-semibold block flex items-center justify-between">
              WARNING <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
            <span className="text-xl font-bold font-mono text-[#B45309] mt-0.5 block">{warningCount}</span>
          </div>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-2.5">
            <span className="text-[10px] font-mono uppercase text-[#475569] font-semibold block flex items-center justify-between">
              MANUAL REVIEW <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
            <span className="text-xl font-bold font-mono text-[#475569] mt-0.5 block">{manualReviewCount}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: VISUAL COMPLIANCE OVERVIEW (Prominent Visual Summary)
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Compliance Score */}
        <div className="lg:col-span-1 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777] font-semibold">
            Compliance Score
          </span>
          <div className="my-2">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold font-mono text-[#111111]">
                {currentDossier.complianceScore}%
              </span>
            </div>
            <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full ${
                  currentDossier.complianceScore >= 85
                    ? 'bg-[#166534]'
                    : currentDossier.complianceScore >= 60
                    ? 'bg-[#B45309]'
                    : 'bg-[#991B1B]'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, currentDossier.complianceScore))}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] text-[#555555] font-mono">
            {currentDossier.complianceScore >= 85 ? 'High Concordance' : currentDossier.complianceScore >= 60 ? 'Requires Review' : 'Deficit Detected'}
          </span>
        </div>

        {/* Mandatory Requirements */}
        <div className="lg:col-span-1 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777] font-semibold">
            Mandatory Criteria
          </span>
          <div className="my-2">
            <span className="text-3xl font-extrabold font-mono text-[#111111]">
              {mandatoryPassed} / {mandatoryTotal}
            </span>
            <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full ${mandatoryPassed === mandatoryTotal ? 'bg-[#166534]' : 'bg-[#991B1B]'}`}
                style={{ width: `${mandatoryTotal > 0 ? (mandatoryPassed / mandatoryTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] font-mono font-semibold text-[#555555]">
            {mandatoryPassed === mandatoryTotal ? '✓ 100% Gates Met' : `⚠ ${mandatoryTotal - mandatoryPassed} Non-Compliant`}
          </span>
        </div>

        {/* Overall Risk */}
        <div className="lg:col-span-1 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777] font-semibold">
            Overall Risk
          </span>
          <div className="my-2">
            {getRiskBadge(currentDossier.riskLevel)}
          </div>
          <span className="text-[10px] text-[#555555] truncate font-mono" title={currentDossier.riskReasons?.[0] || 'Deterministic rating'}>
            {currentDossier.riskReasons?.[0] || 'All primary criteria valid'}
          </span>
        </div>

        {/* Verification Coverage */}
        <div className="lg:col-span-1 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777] font-semibold">
            Verification Coverage
          </span>
          <div className="my-2">
            <span className="text-3xl font-extrabold font-mono text-[#111111]">
              {docCoverage.verified} / {totalCount}
            </span>
            <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-[#111111]"
                style={{ width: `${totalCount > 0 ? (docCoverage.verified / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] text-[#555555] font-mono">
            {Math.round((docCoverage.verified / Math.max(totalCount, 1)) * 100)}% Verified Evidence
          </span>
        </div>

        {/* Missing Documents */}
        <div className="lg:col-span-1 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777] font-semibold">
            Missing Documents
          </span>
          <div className="my-2">
            <span className={`text-3xl font-extrabold font-mono ${missingCount > 0 ? 'text-[#C2410C]' : 'text-[#111111]'}`}>
              {missingCount}
            </span>
          </div>
          <span className="text-[10px] text-[#555555] font-mono">
            {missingCount === 0 ? 'All Documents Present' : `${missingCount} Evidentiary Gaps`}
          </span>
        </div>

        {/* Critical Findings */}
        <div className="lg:col-span-1 rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-2xs flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777] font-semibold">
            Critical Findings
          </span>
          <div className="my-2">
            <span className={`text-3xl font-extrabold font-mono ${criticalFindings.length > 0 || failCount > 0 ? 'text-[#991B1B]' : 'text-[#111111]'}`}>
              {criticalFindings.length + failCount}
            </span>
          </div>
          <span className="text-[10px] text-[#555555] font-mono">
            {criticalFindings.length + failCount === 0 ? 'Zero Contradictions' : `${criticalFindings.length} Discrepancies`}
          </span>
        </div>
      </div>

      {/* =========================================================================
          SECTIONS 3, 4, 5: BREAKDOWN CHART, CATEGORIES & MANDATORY/OPTIONAL SPLIT
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SECTION 3: Compliance Breakdown Bar Chart (4 Cols) */}
        <div className="lg:col-span-4 rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2.5 mb-4">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
                Compliance Breakdown Chart
              </h2>
              <span className="text-[10px] font-mono text-[#777777]">Actual Counts</span>
            </div>

            <div className="space-y-4">
              {/* PASS Bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-semibold text-[#166534] flex items-center gap-1">
                    <Check className="w-3 h-3 stroke-[2.5]" /> PASS
                  </span>
                  <span className="font-bold text-[#111111]">{passCount}</span>
                </div>
                <div className="w-full bg-[#F5F5F5] h-3.5 rounded-sm overflow-hidden border border-[#E5E5E5] p-0.5">
                  <div
                    className="h-full bg-[#166534] rounded-2xs transition-all duration-300"
                    style={{ width: `${totalCount > 0 ? (passCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* FAIL Bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-semibold text-[#991B1B] flex items-center gap-1">
                    <X className="w-3 h-3 stroke-[2.5]" /> FAIL
                  </span>
                  <span className="font-bold text-[#111111]">{failCount}</span>
                </div>
                <div className="w-full bg-[#F5F5F5] h-3.5 rounded-sm overflow-hidden border border-[#E5E5E5] p-0.5">
                  <div
                    className="h-full bg-[#991B1B] rounded-2xs transition-all duration-300"
                    style={{ width: `${totalCount > 0 ? (failCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* MISSING Bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-semibold text-[#C2410C] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 stroke-[2.5]" /> MISSING
                  </span>
                  <span className="font-bold text-[#111111]">{missingCount}</span>
                </div>
                <div className="w-full bg-[#F5F5F5] h-3.5 rounded-sm overflow-hidden border border-[#E5E5E5] p-0.5">
                  <div
                    className="h-full bg-[#C2410C] rounded-2xs transition-all duration-300"
                    style={{ width: `${totalCount > 0 ? (missingCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* WARNING Bar */}
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <span className="font-semibold text-[#B45309] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 stroke-[2.5]" /> WARNING
                  </span>
                  <span className="font-bold text-[#111111]">{warningCount}</span>
                </div>
                <div className="w-full bg-[#F5F5F5] h-3.5 rounded-sm overflow-hidden border border-[#E5E5E5] p-0.5">
                  <div
                    className="h-full bg-[#B45309] rounded-2xs transition-all duration-300"
                    style={{ width: `${totalCount > 0 ? (warningCount / totalCount) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E5E5] text-[10px] text-[#555555] font-mono flex items-center justify-between">
            <span>Total Evaluated: {totalCount} Requirements</span>
            <span>Ratio: {Math.round((passCount / Math.max(totalCount, 1)) * 100)}% Pass</span>
          </div>
        </div>

        {/* SECTION 4: Category-Wise Compliance (5 Cols) */}
        <div className="lg:col-span-5 rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2.5 mb-3">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
              Category-Wise Compliance
            </h2>
            <span className="text-[10px] font-mono text-[#777777]">Actual Categories in Tender</span>
          </div>

          <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {categoryBreakdown.map((cat) => (
              <div key={cat.category} className="p-2.5 rounded border border-[#E5E5E5] bg-[#FAFAFA]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-[#111111]">{cat.category}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-[#166534] font-semibold">{cat.passed}P</span>
                    {cat.failed > 0 && <span className="text-[#991B1B] font-semibold">{cat.failed}F</span>}
                    {cat.missing > 0 && <span className="text-[#C2410C] font-semibold">{cat.missing}M</span>}
                    {cat.warnings > 0 && <span className="text-[#B45309] font-semibold">{cat.warnings}W</span>}
                    <span className="font-bold text-[#111111] ml-1">{cat.completionPct}%</span>
                  </div>
                </div>
                <div className="w-full bg-[#E5E5E5] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      cat.completionPct === 100
                        ? 'bg-[#166534]'
                        : cat.completionPct >= 50
                        ? 'bg-[#B45309]'
                        : 'bg-[#991B1B]'
                    }`}
                    style={{ width: `${cat.completionPct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 5: Mandatory vs Optional Split (3 Cols) */}
        <div className="lg:col-span-3 rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="border-b border-[#E5E5E5] pb-2.5 mb-3">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
                Mandatory vs Optional
              </h2>
              <span className="text-[10px] text-[#777777]">Qualification Gating Protocol</span>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded border border-[#E5E5E5] bg-[#F7F7F7]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#111111]">MANDATORY</span>
                  <span className="font-mono text-xs font-bold text-[#111111]">
                    {mandatoryPassed} / {mandatoryTotal}
                  </span>
                </div>
                <div className="w-full bg-[#E5E5E5] h-2 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full ${mandatoryPassed === mandatoryTotal ? 'bg-[#166534]' : 'bg-[#991B1B]'}`}
                    style={{ width: `${mandatoryTotal > 0 ? (mandatoryPassed / mandatoryTotal) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-[#555555] block">
                  {mandatoryPassed === mandatoryTotal
                    ? 'All mandatory requirements satisfied.'
                    : 'Disqualification risk: Mandatory deficit.'}
                </span>
              </div>

              <div className="p-3 rounded border border-[#E5E5E5] bg-[#FAFAFA]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-[#555555]">OPTIONAL</span>
                  <span className="font-mono text-xs font-bold text-[#111111]">
                    {optionalPassed} / {optionalTotal}
                  </span>
                </div>
                <div className="w-full bg-[#E5E5E5] h-2 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-[#555555]"
                    style={{ width: `${optionalTotal > 0 ? (optionalPassed / optionalTotal) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-[#555555] block">
                  Optional scoring points (e.g. ISO certs).
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-2 rounded bg-[#FFFBEB] border border-[#FDE68A] text-[10px] text-[#B45309] font-medium leading-snug">
            <strong>Rule:</strong> Passing optional criteria cannot mask missing or failed mandatory requirements.
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 6: "WHAT IS MISSING?" SECTION (CRITICAL)
         ========================================================================= */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#C2410C]" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#111111]">
              WHAT&apos;S MISSING ({missingItems.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-[#777777]">
            Exact requirements lacking submitted proof
          </span>
        </div>

        {missingItems.length === 0 ? (
          <div className="p-6 text-center bg-[#F0FDF4] border border-[#BBF7D0] rounded-md">
            <CheckCircle2 className="w-6 h-6 text-[#166534] mx-auto mb-1.5" />
            <h4 className="text-xs font-bold font-mono uppercase text-[#166534]">
              ✓ ALL REQUIREMENTS SATISFIED
            </h4>
            <p className="text-xs text-[#166534] mt-0.5">
              Zero mandatory or optional documents are currently missing for this bidder.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {missingItems.map((item) => (
              <div
                key={item.requirementId}
                className="rounded-md border border-[#FFEDD5] bg-[#FFF7ED]/50 p-4 flex flex-col justify-between hover:border-[#FDBA74] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-[#C2410C] bg-[#FFEDD5] px-1.5 py-0.5 rounded">
                      {item.clauseCode}
                    </span>
                    <span className="text-[10px] font-mono uppercase text-[#777777]">
                      {item.category}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-[#111111] leading-snug">
                    {item.title}
                  </h4>

                  <div className="mt-2.5 space-y-1.5 text-[11px] text-[#444444]">
                    <p>
                      <strong className="text-[#111111]">Why Required:</strong>{' '}
                      {item.mandatory ? 'Mandatory Gate Criterion' : 'Technical Evaluation Bonus'}
                    </p>
                    <p>
                      <strong className="text-[#111111]">Required Evidence:</strong>{' '}
                      <span className="font-mono bg-white px-1 py-0.2 rounded border border-[#E5E5E5] text-[#111111]">
                        {item.expectedValue || 'Documentary Proof'}
                      </span>
                    </p>
                    <p>
                      <strong className="text-[#111111]">Current Status:</strong>{' '}
                      <span className="text-[#C2410C] font-mono font-semibold">MISSING</span>
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#FED7AA] flex items-center justify-between text-[10px]">
                  <span className="font-mono text-[#777777]">Action Required:</span>
                  <span className="font-mono font-semibold text-[#111111] bg-white px-2 py-0.5 rounded border border-[#FED7AA]">
                    {item.mandatory ? 'Issue Clarification / Upload Notice' : 'Optional Gap (Proceed)'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 7: FAILED REQUIREMENTS
         ========================================================================= */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#991B1B]" />
            <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#111111]">
              FAILED REQUIREMENTS ({failedItems.length})
            </h2>
          </div>
          <span className="text-xs font-mono text-[#777777]">
            Non-compliant values violating tender thresholds
          </span>
        </div>

        {failedItems.length === 0 ? (
          <div className="p-6 text-center bg-[#F0FDF4] border border-[#BBF7D0] rounded-md">
            <CheckCircle2 className="w-6 h-6 text-[#166534] mx-auto mb-1.5" />
            <h4 className="text-xs font-bold font-mono uppercase text-[#166534]">
              ✓ ZERO DEFICITS DETECTED
            </h4>
            <p className="text-xs text-[#166534] mt-0.5">
              No submitted requirements failed deterministic threshold or format rules.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {failedItems.map((item) => (
              <div
                key={item.requirementId}
                className="rounded-md border border-[#FECACA] bg-[#FEF2F2]/40 p-4 hover:bg-[#FEF2F2]/60 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#FECACA] pb-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-white bg-[#991B1B] px-2 py-0.5 rounded">
                      FAIL &bull; {item.clauseCode}
                    </span>
                    <h4 className="text-xs font-bold text-[#111111]">{item.title}</h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#991B1B] bg-white px-2 py-0.5 rounded border border-[#FECACA]">
                    Severity: {item.riskFactor || 'CRITICAL'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#777777] block">Required Value:</span>
                    <span className="font-bold text-[#111111]">{item.expectedValue}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777777] block">Submitted / Verified:</span>
                    <span className="font-bold text-[#991B1B]">{item.verifiedValue}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777777] block">Evaluated Rule:</span>
                    <span className="font-semibold text-[#111111]">{item.ruleType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#777777] block">Evidence Document:</span>
                    <span className="text-[#111111] truncate block" title={item.evidence?.documentName || 'N/A'}>
                      {item.evidence?.documentName || 'No exhibit'} {item.evidence?.pageNumber ? `(p. ${item.evidence.pageNumber})` : ''}
                    </span>
                  </div>
                </div>

                <div className="mt-3 p-2.5 rounded bg-white border border-[#FECACA] text-xs text-[#991B1B]">
                  <strong>Engine Explanation:</strong> {item.reason}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 8: WARNINGS / ATTENTION REQUIRED
         ========================================================================= */}
      {attentionItems.length > 0 && (
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#B45309]" />
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#111111]">
                WARNINGS / ATTENTION REQUIRED ({attentionItems.length})
              </h2>
            </div>
            <span className="text-xs font-mono text-[#777777]">
              Condition flags requiring officer discretion
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {attentionItems.map((item) => (
              <div
                key={item.requirementId}
                className="rounded-md border border-[#FDE68A] bg-[#FFFBEB]/50 p-4 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#B45309]">{item.clauseCode}</span>
                  <span className="text-[10px] font-mono uppercase text-[#777777]">{item.category}</span>
                </div>
                <h4 className="font-bold text-[#111111]">{item.title}</h4>
                <div className="space-y-1 text-[11px] text-[#555555]">
                  <p><strong className="text-[#111111]">What:</strong> {item.reason}</p>
                  <p><strong className="text-[#111111]">Source:</strong> {item.evidence?.documentName || 'Registry Audit'}</p>
                  <p><strong className="text-[#111111]">Action:</strong> Review during technical committee evaluation.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTIONS 11 & 12: GOVERNMENT VERIFICATION VISUAL & DOCUMENT COVERAGE
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SECTION 11: Government Verification Visual (7 Cols) */}
        <div className="lg:col-span-7 rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3 mb-3">
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
                Government Verification Visual (G2G Audit)
              </h2>
              <p className="text-[10px] text-[#777777] mt-0.5">
                Authoritative validation against central statutory databases
              </p>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#F7F7F7] border border-[#E5E5E5] text-[#555555] font-bold">
              DEMO / SANDBOX VERIFICATION
            </span>
          </div>

          <div className="divide-y divide-[#E5E5E5] max-h-[280px] overflow-y-auto pr-1">
            {statutoryResults.slice(0, 5).map((stat) => {
              const isMatch = stat.verified || stat.governmentVerification?.status === 'MATCH';
              const statusText = stat.governmentVerification?.status || (stat.verified ? 'VERIFIED' : stat.status.replace(/_/g, ' '));
              const govRecord = stat.governmentVerification?.governmentRecord as { status?: string; taxpayerStatus?: string } | undefined;
              const taxpayerStatus = govRecord?.taxpayerStatus || govRecord?.status || (isMatch ? 'ACTIVE' : 'ATTENTION');

              return (
                <div key={stat.providerId} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#111111]">{stat.provider.split('(')[0].trim()}</span>
                      <span className="text-[9px] font-mono text-[#777777] bg-[#F5F5F5] px-1.5 py-0.2 rounded">
                        {stat.governmentVerification?.identifierQueried || stat.providerId}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#555555] mt-0.5">
                      {stat.governmentVerification?.statusMessage || stat.findingMessage}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      isMatch
                        ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]'
                        : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                    }`}>
                      {isMatch ? <Check className="w-3 h-3 stroke-[2.5]" /> : <X className="w-3 h-3 stroke-[2.5]" />}
                      {statusText}
                    </span>
                    <span className="text-[9px] font-mono text-[#777777]">
                      {taxpayerStatus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 12: Document Coverage (5 Cols) */}
        <div className="lg:col-span-5 rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3 mb-4">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
                Document Coverage
              </h2>
              <span className="text-[10px] font-mono text-[#777777]">Vault Ingestion</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#555555]">Required Documents:</span>
                <span className="font-bold text-[#111111]">{docCoverage.required}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#555555]">Submitted Documents:</span>
                <span className="font-bold text-[#111111]">{docCoverage.submitted}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#555555]">Processed:</span>
                <span className="font-bold text-[#111111]">{docCoverage.processed}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#555555]">Verified with Evidence:</span>
                <span className="font-bold text-[#166534]">{docCoverage.verified}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#555555]">Missing:</span>
                <span className={`font-bold ${docCoverage.missing > 0 ? 'text-[#C2410C]' : 'text-[#111111]'}`}>{docCoverage.missing}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#555555]">Failed Thresholds:</span>
                <span className={`font-bold ${docCoverage.failed > 0 ? 'text-[#991B1B]' : 'text-[#111111]'}`}>{docCoverage.failed}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E5E5] mt-4">
            <div className="flex items-center justify-between text-xs font-mono mb-1.5">
              <span className="text-[10px] uppercase text-[#777777]">Vault Coverage Progress</span>
              <span className="font-bold text-[#111111]">{docCoverage.progressPct}%</span>
            </div>
            <div className="w-full bg-[#E5E5E5] h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#111111]"
                style={{ width: `${docCoverage.progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTIONS 14 & 15: SEARCH & REQUIREMENT FILTERS
         ========================================================================= */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search requirement, clause, document, excerpt, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F7F7F7] border border-[#E5E5E5] rounded-md text-[#111111] placeholder:text-[#888888] focus:outline-none focus:border-[#111111]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#111111]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['ALL', 'PASS', 'FAIL', 'MISSING', 'WARNING', 'MANUAL_REVIEW'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer border ${
                  statusFilter === st
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-[#FAFAFA] text-[#555555] border-[#E5E5E5] hover:bg-[#F0F0F0]'
                }`}
              >
                {st === 'ALL' ? 'ALL' : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Row: Mandatory/Optional & Category */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E5E5E5]">
          <span className="text-[10px] font-mono text-[#777777] uppercase font-semibold">Scope:</span>
          {(['ALL', 'MANDATORY', 'OPTIONAL'] as const).map((tp) => (
            <button
              key={tp}
              onClick={() => setTypeFilter(tp)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                typeFilter === tp
                  ? 'bg-[#E5E5E5] text-[#111111] font-bold'
                  : 'text-[#777777] hover:text-[#111111]'
              }`}
            >
              {tp}
            </button>
          ))}

          <span className="text-[#CCCCCC] mx-1">|</span>
          <span className="text-[10px] font-mono text-[#777777] uppercase font-semibold">Category:</span>
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
              categoryFilter === 'ALL'
                ? 'bg-[#E5E5E5] text-[#111111] font-bold'
                : 'text-[#777777] hover:text-[#111111]'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                categoryFilter === c
                  ? 'bg-[#E5E5E5] text-[#111111] font-bold'
                  : 'text-[#777777] hover:text-[#111111]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTIONS 9, 10, 13, 16: REQUIREMENT -> DOCUMENT MATRIX (CORE TABLE)
         ========================================================================= */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#E5E5E5] bg-[#F7F7F7] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
              Requirement &rarr; Document Evidence Matrix
            </h2>
            <p className="text-[10px] text-[#777777] mt-0.5">
              Click any row to inspect atomic extracted evidence, rule parameters, and statutory verification records.
            </p>
          </div>
          <span className="text-xs font-mono text-[#555555]">
            Showing {filteredRequirements.length} of {totalCount} Requirements
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed border-collapse text-xs min-w-[950px]">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[12%]" />
              <col className="w-[20%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[#111111] font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3.5 font-semibold">Tender Clause &amp; Requirement</th>
                <th className="py-3 px-3.5 font-semibold">Category &amp; Type</th>
                <th className="py-3 px-3.5 font-semibold">Supporting Document</th>
                <th className="py-3 px-3.5 font-semibold">Evidence &amp; Page</th>
                <th className="py-3 px-3.5 font-semibold">Verified Value</th>
                <th className="py-3 px-3.5 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredRequirements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#777777] font-mono">
                    NO REQUIREMENTS MATCHING CURRENT FILTER CRITERIA
                  </td>
                </tr>
              ) : (
                filteredRequirements.map((req) => {
                  const isExpanded = !!expandedRows[req.requirementId];
                  return (
                    <React.Fragment key={req.requirementId}>
                      <tr
                        onClick={() => toggleRowExpansion(req.requirementId)}
                        className="hover:bg-[#FAFAFA] cursor-pointer transition-colors"
                      >
                        {/* Requirement & Clause */}
                        <td className="py-3 px-3.5 align-top break-words overflow-wrap-anywhere">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-[#111111] text-[11px]">
                                {req.clauseCode}
                              </span>
                              {req.mandatory ? (
                                <span className="text-[9px] font-mono font-bold uppercase text-[#111111] bg-[#F0F0F0] px-1 py-0.2 rounded border border-[#E5E5E5]">
                                  Mandatory
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono text-[#777777]">
                                  Optional
                                </span>
                              )}
                            </div>
                            <p className="font-semibold text-[#111111] text-xs leading-snug">
                              {req.title}
                            </p>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3.5 align-top font-mono text-[11px] text-[#555555]">
                          <span className="block font-medium text-[#111111]">{req.category}</span>
                          <span className="text-[9px] text-[#777777]">{req.ruleType}</span>
                        </td>

                        {/* Document */}
                        <td className="py-3 px-3.5 align-top text-xs break-words overflow-wrap-anywhere">
                          {req.evidence ? (
                            <div>
                              <span className="font-semibold text-[#111111] block leading-tight">
                                {req.evidence.documentName}
                              </span>
                              <div className="mt-1 flex items-center gap-1">
                                {getSourceBadge(req.evidence.sourceType)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#991B1B] font-mono italic">
                              No document attached
                            </span>
                          )}
                        </td>

                        {/* Evidence & Page */}
                        <td className="py-3 px-3.5 align-top text-[11px] font-mono text-[#555555] break-words overflow-wrap-anywhere">
                          {req.evidence ? (
                            <div>
                              <span className="text-[#111111] font-semibold block">
                                Page {req.evidence.pageNumber}
                              </span>
                              <span className="text-[10px] text-[#777777] block truncate" title={req.evidence.extractedText}>
                                {req.evidence.extractedText.slice(0, 45)}...
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#777777]">—</span>
                          )}
                        </td>

                        {/* Verified Value */}
                        <td className="py-3 px-3.5 align-top font-mono text-xs text-[#111111] break-words overflow-wrap-anywhere">
                          <span className="font-semibold block">{req.verifiedValue || '—'}</span>
                          <span className="text-[10px] text-[#777777] block">
                            Req: {req.expectedValue}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3.5 align-top text-center">
                          <div className="flex flex-col items-center gap-1">
                            {getStatusBadge(req.status)}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectingResult(req);
                              }}
                              className="text-[10px] font-mono text-[#555555] hover:text-[#111111] underline cursor-pointer mt-0.5"
                            >
                              Inspect
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Traceability Drawer */}
                      {isExpanded && (
                        <tr className="bg-[#F9FAFB] border-b border-[#E5E5E5]">
                          <td colSpan={6} className="p-4 text-xs font-mono">
                            <div className="rounded border border-[#E5E5E5] bg-white p-3.5 space-y-2.5">
                              <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
                                <span className="font-bold text-[#111111]">
                                  EVIDENCE TRACEABILITY AUDIT LEDGER &bull; {req.clauseCode}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setInspectingResult(req)}
                                  className="h-6 px-2 text-[10px] gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" /> Full Metadata
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                                <div>
                                  <span className="text-[#777777] block">Extracted Evidence Citation:</span>
                                  <p className="text-[#111111] mt-0.5 font-sans italic bg-[#FAFAFA] p-2 rounded border border-[#E5E5E5]">
                                    &ldquo;{req.evidence?.extractedText || 'No verbatim excerpt available.'}&rdquo;
                                  </p>
                                </div>
                                <div>
                                  <span className="text-[#777777] block">Statutory Source Comparison:</span>
                                  <div className="mt-0.5 space-y-1">
                                    <p><strong className="text-[#111111]">Submitted:</strong> {req.declaredValue || req.verifiedValue}</p>
                                    <p><strong className="text-[#111111]">Verified:</strong> {req.verifiedValue}</p>
                                    <p><strong className="text-[#111111]">Result:</strong> {req.status === 'PASS' ? '✓ MATCH' : '⚠ DISCREPANCY'}</p>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[#777777] block">Rule Evaluation Rationale:</span>
                                  <p className="text-[#555555] mt-0.5 leading-relaxed font-sans">
                                    {req.reason}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          SECTIONS 17 & 18: RISK EXPLANATION & SCORE EXPLANATION
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 17: WHY THIS BID IS HIGH / MEDIUM / LOW RISK */}
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
                  WHY THIS BID IS {currentDossier.riskLevel} RISK
                </span>
              </div>
              {getRiskBadge(currentDossier.riskLevel)}
            </div>

            <p className="text-xs text-[#555555] mb-3">
              Directly grounded in deterministic engine findings and cross-document discrepancy records:
            </p>

            <div className="space-y-2">
              {currentDossier.riskReasons && currentDossier.riskReasons.length > 0 ? (
                currentDossier.riskReasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded bg-[#FAFAFA] border border-[#E5E5E5] text-xs">
                    <span className="font-mono font-bold text-[#111111] shrink-0">{idx + 1}.</span>
                    <p className="text-[#333333] leading-snug">{reason}</p>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534]">
                  All mandatory criteria satisfied. No high-severity contradictions or statutory mismatches detected.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E5E5] mt-4 text-[10px] font-mono text-[#777777]">
            Source: Clausentis Deterministic Risk Engine v4.2
          </div>
        </div>

        {/* SECTION 18: HOW THE SCORE WAS CALCULATED */}
        <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3 mb-3">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
                HOW THE SCORE WAS CALCULATED
              </h2>
              <span className="text-xs font-mono font-bold text-[#111111]">
                {currentDossier.complianceScore}%
              </span>
            </div>

            <p className="text-xs text-[#555555] mb-3">
              Deterministic scoring formula combining weighted mandatory gating with optional bonus criteria:
            </p>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#111111] block">Mandatory Requirements</span>
                  <span className="text-[10px] text-[#777777]">{mandatoryPassed} of {mandatoryTotal} passed (80% Weight)</span>
                </div>
                <span className="font-bold text-[#111111]">
                  {mandatoryTotal > 0 ? Math.round((mandatoryPassed / mandatoryTotal) * 80) : 0} pts
                </span>
              </div>

              <div className="p-2.5 rounded bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#111111] block">Optional Requirements</span>
                  <span className="text-[10px] text-[#777777]">{optionalPassed} of {optionalTotal} passed (20% Weight)</span>
                </div>
                <span className="font-bold text-[#111111]">
                  {optionalTotal > 0 ? Math.round((optionalPassed / optionalTotal) * 20) : 0} pts
                </span>
              </div>

              {criticalFindings.length > 0 && (
                <div className="p-2.5 rounded bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-between text-[#991B1B]">
                  <div>
                    <span className="font-bold block">Contradiction Deductions</span>
                    <span className="text-[10px] text-[#991B1B]">{criticalFindings.length} Cross-Document Discrepancies</span>
                  </div>
                  <span className="font-bold">
                    -{Math.min(30, criticalFindings.length * 15)} pts
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5E5E5] mt-4 flex items-center justify-between text-xs font-mono font-bold">
            <span>FINAL COMPLIANCE SCORE:</span>
            <span className="text-base text-[#111111]">{currentDossier.complianceScore}%</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 19: CROSS-DOCUMENT CONTRADICTIONS
         ========================================================================= */}
      {criticalFindings.length > 0 && (
        <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2]/30 p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#FECACA] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#991B1B]" />
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#991B1B]">
                CROSS-DOCUMENT CONTRADICTIONS ({criticalFindings.length})
              </h2>
            </div>
            <span className="text-xs font-mono text-[#991B1B]">
              Inconsistent claims across submitted exhibits
            </span>
          </div>

          <div className="space-y-3">
            {criticalFindings.map((finding) => (
              <div
                key={finding.id}
                className="rounded-md border border-[#FECACA] bg-white p-4 text-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[#111111] text-sm">{finding.title}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
                    {finding.severity}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                  <div className="p-2.5 rounded bg-[#F7F7F7] border border-[#E5E5E5]">
                    <span className="text-[#777777] block text-[10px] uppercase">Exhibit A</span>
                    <span className="font-bold text-[#111111] block mt-0.5">{finding.primaryDocument.name}</span>
                    <span className="text-[#555555]">Page {finding.primaryDocument.page} &bull; Claim: {finding.primaryDocument.value}</span>
                  </div>

                  <div className="p-2.5 rounded bg-[#FEF2F2] border border-[#FECACA]">
                    <span className="text-[#991B1B] block text-[10px] uppercase">Exhibit B (Conflicting)</span>
                    <span className="font-bold text-[#991B1B] block mt-0.5">{finding.conflictingDocument.name}</span>
                    <span className="text-[#991B1B]">Page {finding.conflictingDocument.page} &bull; Stated: {finding.conflictingDocument.value}</span>
                  </div>
                </div>

                <p className="text-[#555555] font-sans leading-relaxed">
                  <strong className="text-[#111111]">Engine Analysis:</strong> {finding.explanation}
                </p>

                <div className="text-[11px] font-mono text-[#991B1B] bg-[#FEF2F2] p-2 rounded border border-[#FECACA]">
                  <strong>Recommended Action:</strong> {finding.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 20: MANUAL REVIEW QUEUE
         ========================================================================= */}
      {manualReviewCount > 0 && (
        <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#475569]" />
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-[#111111]">
                REQUIRES HUMAN REVIEW ({manualReviewCount})
              </h2>
            </div>
            <span className="text-xs font-mono text-[#555555]">
              Officer Discretion Queue
            </span>
          </div>

          <div className="space-y-3">
            {results.filter(r => r.status === 'MANUAL_REVIEW').map((rev) => (
              <div key={rev.requirementId} className="p-3.5 rounded bg-white border border-[#E2E8F0] text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-bold text-[#111111]">{rev.clauseCode} &bull; {rev.title}</span>
                  <span className="text-[10px] font-mono font-bold bg-[#F1F5F9] px-2 py-0.5 rounded text-[#475569]">
                    MANUAL REVIEW
                  </span>
                </div>
                <p className="text-[#555555] mt-1">{rev.reason}</p>
                <div className="mt-2 text-[11px] font-mono text-[#111111] flex items-center justify-between">
                  <span>Document: {rev.evidence?.documentName || 'Statutory Portal'}</span>
                  <span>Recommended: Technical Committee Hearing</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 21: INTERACTIVE REQUIREMENT DETAIL DRAWER / MODAL
         ========================================================================= */}
      {inspectingResult && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-lg border border-[#E5E5E5] shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#E5E5E5] bg-[#F7F7F7] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#777777]">
                  Requirement Detail Ledger &bull; {inspectingResult.clauseCode}
                </span>
                <h3 className="text-sm font-bold text-[#111111] mt-0.5">
                  {inspectingResult.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectingResult(null)}
                className="h-7 w-7 rounded-md hover:bg-[#E5E5E5] flex items-center justify-center text-[#555555]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                <div className="p-2.5 rounded bg-[#FAFAFA] border border-[#E5E5E5]">
                  <span className="text-[#777777] block text-[10px]">Clause Code:</span>
                  <span className="font-bold text-[#111111]">{inspectingResult.clauseCode}</span>
                </div>
                <div className="p-2.5 rounded bg-[#FAFAFA] border border-[#E5E5E5]">
                  <span className="text-[#777777] block text-[10px]">Category:</span>
                  <span className="font-bold text-[#111111]">{inspectingResult.category}</span>
                </div>
                <div className="p-2.5 rounded bg-[#FAFAFA] border border-[#E5E5E5]">
                  <span className="text-[#777777] block text-[10px]">Mandatory:</span>
                  <span className="font-bold text-[#111111]">{inspectingResult.mandatory ? 'YES (Gate)' : 'NO (Optional)'}</span>
                </div>
                <div className="p-2.5 rounded bg-[#FAFAFA] border border-[#E5E5E5]">
                  <span className="text-[#777777] block text-[10px]">Rule Type:</span>
                  <span className="font-bold text-[#111111]">{inspectingResult.ruleType}</span>
                </div>
                <div className="p-2.5 rounded bg-[#FAFAFA] border border-[#E5E5E5]">
                  <span className="text-[#777777] block text-[10px]">Required Value:</span>
                  <span className="font-bold text-[#111111]">{inspectingResult.expectedValue}</span>
                </div>
                <div className="p-2.5 rounded bg-[#FAFAFA] border border-[#E5E5E5]">
                  <span className="text-[#777777] block text-[10px]">Status:</span>
                  <div>{getStatusBadge(inspectingResult.status)}</div>
                </div>
              </div>

              {/* Verbatim Evidence Box */}
              <div className="p-3.5 rounded bg-[#F7F7F7] border border-[#E5E5E5] space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="font-bold text-[#111111]">Document Source:</span>
                  <span className="text-[#555555]">
                    {inspectingResult.evidence?.documentName || 'No file attached'} (Page {inspectingResult.evidence?.pageNumber || '—'})
                  </span>
                </div>
                <div className="bg-white p-3 rounded border border-[#E5E5E5] text-[11px] font-sans italic text-[#333333]">
                  &ldquo;{inspectingResult.evidence?.extractedText || 'No direct text excerpt recorded.'}&rdquo;
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-[#777777]">
                  <span>Source Type: {inspectingResult.evidence?.sourceType || 'N/A'}</span>
                  <span>AI Extraction Confidence: {inspectingResult.evidence?.confidence ? `${Math.round(inspectingResult.evidence.confidence * 100)}%` : '—'}</span>
                </div>
              </div>

              {/* Rationale Box */}
              <div className="space-y-1">
                <span className="font-mono font-bold text-[#111111] text-[11px] block">
                  Deterministic Engine Evaluation:
                </span>
                <p className="text-[#444444] leading-relaxed bg-[#FAFAFA] p-3 rounded border border-[#E5E5E5]">
                  {inspectingResult.reason}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-[#E5E5E5] bg-[#F7F7F7] flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] text-[#777777]">
                Verified at: {inspectingResult.evidence?.createdAt ? new Date(inspectingResult.evidence.createdAt).toLocaleTimeString() : 'Evaluation Runtime'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInspectingResult(null)}
                className="h-8 px-3 text-xs"
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
