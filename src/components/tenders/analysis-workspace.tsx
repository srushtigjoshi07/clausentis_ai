'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  ShieldCheck,
  Download,
  FileText,
  ArrowRight,
  Layers,
  AlertOctagon,
  Eye,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  ShieldAlert,
  Edit3,
  Check,
  Calculator,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  getTenderSignedUrl,
  updateRequirementReview,
  TenderRequirementRow,
  ComplianceResultRow
} from '@/lib/actions/tenders';
import {
  RequirementEvidenceEvaluation,
  ContradictionRadarSummary,
  getDemoIntelligenceDataset,
  ComplianceMatrixStatus,
  ComplianceRiskLevel,
  calculateTransparentComplianceScore
} from '@/lib/ai/contradiction-engine';
import { normalizeProcurementCategory } from '@/lib/ai/extractor';
import { ComplianceIntelligenceGraph } from './ComplianceIntelligenceGraph';
import { ComplianceIntelligenceGraph3D } from '@/components/3d/ComplianceIntelligenceGraph3D';
import { ContradictionRadar } from './ContradictionRadar';
import { ExplainabilityModal } from './ExplainabilityModal';
import { EvidenceViewerModal } from './EvidenceViewerModal';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { IntelligenceFindings } from './IntelligenceFindings';
import { AnalysisTimeline } from './AnalysisTimeline';
import { BidReadinessCard } from './BidReadinessCard';
import { CrossDocumentIntelligence } from './CrossDocumentIntelligence';
import type { CrossDocumentFindingRow, CrossDocumentSummary } from '@/types/cross-document';

interface TenderAnalysisWorkspaceProps {
  tender: {
    id: string;
    title: string;
    status: string;
    compliance_score?: number | null;
    risk_level?: string | null;
    original_filename?: string;
    storage_path?: string;
    file_size_bytes?: number;
    created_at: string;
    snapshot?: Record<string, unknown>;
  };
  requirements: TenderRequirementRow[];
  complianceResults?: ComplianceResultRow[];
  crossDocSummary?: CrossDocumentSummary | null;
  crossDocFindings?: CrossDocumentFindingRow[];
}

const PROCUREMENT_CATEGORIES = [
  { id: 'all', label: 'All Criteria' },
  { id: 'Statutory', label: 'Statutory' },
  { id: 'Financial', label: 'Financial' },
  { id: 'Technical', label: 'Technical' },
  { id: 'Experience', label: 'Experience' },
  { id: 'Eligibility', label: 'Eligibility' },
  { id: 'Legal', label: 'Legal' },
  { id: 'Registration', label: 'Registration' },
  { id: 'Certification', label: 'Certification' },
  { id: 'Local Content / Make in India', label: 'Make in India' },
  { id: 'MSME / Startup', label: 'MSME / Startup' },
  { id: 'Documentation', label: 'Documentation' },
  { id: 'Other', label: 'Other' }
];

export function AnalysisWorkspace({
  tender,
  requirements,
  complianceResults = [],
  crossDocSummary = null,
  crossDocFindings = []
}: TenderAnalysisWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<'matrix' | 'graph' | 'radar' | 'cross-doc'>('matrix');
  const [graph3DMode, setGraph3DMode] = useState<boolean>(true);
  const [useDemoData, setUseDemoData] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'mandatory' | 'optional'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [downloadingDoc, setDownloadingDoc] = useState(false);

  // Officer review override state
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<ComplianceMatrixStatus>('COMPLIANT');
  const [officerNotes, setOfficerNotes] = useState('');
  const [isSavingReview, setIsSavingReview] = useState(false);

  // Modals state
  const [explainEvaluation, setExplainEvaluation] = useState<RequirementEvidenceEvaluation | null>(null);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [evidenceEvaluation, setEvidenceEvaluation] = useState<RequirementEvidenceEvaluation | null>(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);

  // 1. Compute Demo Dataset
  const demoDataset = useMemo(() => {
    return getDemoIntelligenceDataset(tender.id, tender.title);
  }, [tender.id, tender.title]);

  // Evaluated requirements map
  const activeEvaluations: RequirementEvidenceEvaluation[] = useMemo(() => {
    if (useDemoData) {
      return demoDataset.evaluations;
    }

    return requirements.map((req, idx) => {
      const comp = complianceResults.find((c) => c.requirement_id === req.id);
      const rawCat = req.category || 'other';
      const normCat = normalizeProcurementCategory(rawCat);

      const isComp = comp?.status === 'compliant' || comp?.status === 'passed' || comp?.status === 'pass';
      const isPartial = comp?.status === 'partially_compliant' || comp?.status === 'review';
      const isNonComp = comp?.status === 'non_compliant' || comp?.status === 'failed' || comp?.status === 'fail';
      const isMissing = comp?.status === 'missing' || comp?.status === 'missing_evidence';

      let status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'missing_evidence' | 'needs_review' | 'not_verified' = 'compliant';
      let matrixStatus: ComplianceMatrixStatus = 'COMPLIANT';

      if (isNonComp) {
        status = 'non_compliant';
        matrixStatus = 'NON-COMPLIANT';
      } else if (isMissing) {
        status = 'missing_evidence';
        matrixStatus = 'MISSING';
      } else if (isPartial) {
        status = 'partially_compliant';
        matrixStatus = 'PARTIALLY COMPLIANT';
      } else if (isComp) {
        status = 'compliant';
        matrixStatus = 'COMPLIANT';
      } else if (req.mandatory) {
        status = 'missing_evidence';
        matrixStatus = 'MISSING';
      } else {
        status = 'needs_review';
        matrixStatus = 'REQUIRES MANUAL REVIEW';
      }

      let riskLevel: ComplianceRiskLevel = 'LOW';
      let riskReason = 'Standard requirement verified against company submission.';
      if (matrixStatus === 'NON-COMPLIANT' || (req.mandatory && matrixStatus === 'MISSING')) {
        riskLevel = 'HIGH';
        riskReason = req.mandatory
          ? 'Mandatory qualification requirement not satisfied. Disqualification risk.'
          : 'Non-compliant technical criterion.';
      } else if (matrixStatus === 'PARTIALLY COMPLIANT' || matrixStatus === 'REQUIRES MANUAL REVIEW') {
        riskLevel = 'MEDIUM';
        riskReason = 'Supporting evidence requires officer verification or clarification.';
      }

      const reqCode = req.requirement_code || `REQ-${String(idx + 1).padStart(3, '0')}`;
      const clauseRef = `Page ${req.source_page || 1}`;

      return {
        requirementId: req.id,
        requirementCode: reqCode,
        requirementName: req.name,
        clauseReference: clauseRef,
        category: normCat,
        mandatory: req.mandatory,
        requiredValue: req.threshold_value ? `${req.threshold_value} ${req.threshold_unit || ''}` : req.description,
        evidenceRequired: `Valid ${normCat} certificate or documentation`,
        evidenceFound: comp?.explanation ? 'Verified against Vault Credential' : 'No supporting document in vault',
        status,
        matrixStatus,
        riskLevel,
        riskReason,
        confidence: comp?.confidence || 0.95,
        sourcePage: req.source_page || 1,
        sourceExcerpt: req.source_text || req.description,
        detectedValue: comp?.explanation || null,
        explanation: {
          expected: req.description || req.name,
          detected: comp?.explanation || 'Grounded from document vault citation',
          citation: `${clauseRef}: "${req.source_text || req.description}"`,
          decision: matrixStatus,
          rationale: comp?.recommendation || 'Evidence cross-referenced with company credentials.'
        },
        recommendedAction:
          matrixStatus === 'MISSING'
            ? 'Manual verification / request supporting document from bidder.'
            : matrixStatus === 'NON-COMPLIANT'
            ? 'Review requirement threshold with technical committee.'
            : 'Evidence grounded and verified.'
      };
    });
  }, [useDemoData, demoDataset, requirements, complianceResults]);

  const activeContradictions: ContradictionRadarSummary = useMemo(() => {
    if (useDemoData) {
      return demoDataset.contradictions;
    }
    return {
      criticalCount: 0,
      warningCount: 0,
      consistentCount: requirements.length > 0 ? 1 : 0,
      issues: []
    };
  }, [useDemoData, demoDataset, requirements.length]);

  // Transparent Compliance Score calculation
  const scoringBreakdown = useMemo(() => {
    return calculateTransparentComplianceScore(activeEvaluations);
  }, [activeEvaluations]);

  // Filtered requirements list
  const filteredEvaluations = useMemo(() => {
    return activeEvaluations.filter((req) => {
      const matchesCategory =
        selectedCategory === 'all' || req.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesStatus =
        selectedStatus === 'all' || req.matrixStatus.toLowerCase() === selectedStatus.toLowerCase();

      const matchesRisk = selectedRisk === 'all' || req.riskLevel.toLowerCase() === selectedRisk.toLowerCase();

      const matchesPriority =
        selectedPriority === 'all' ||
        (selectedPriority === 'mandatory' && req.mandatory) ||
        (selectedPriority === 'optional' && !req.mandatory);

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        req.requirementName.toLowerCase().includes(q) ||
        (req.requirementCode && req.requirementCode.toLowerCase().includes(q)) ||
        (req.clauseReference && req.clauseReference.toLowerCase().includes(q)) ||
        (req.sourceExcerpt && req.sourceExcerpt.toLowerCase().includes(q)) ||
        (req.category && req.category.toLowerCase().includes(q));

      return matchesCategory && matchesStatus && matchesRisk && matchesPriority && matchesSearch;
    });
  }, [activeEvaluations, selectedCategory, selectedStatus, selectedRisk, selectedPriority, searchQuery]);

  const selectedEvaluation =
    activeEvaluations.find((e) => e.requirementId === selectedReqId) || filteredEvaluations[0] || null;

  const handleDownloadSourceDoc = async () => {
    if (!tender.storage_path) return;
    setDownloadingDoc(true);
    try {
      const signedUrl = await getTenderSignedUrl(tender.storage_path);
      if (signedUrl) {
        window.open(signedUrl, '_blank');
      } else {
        alert('Could not generate download link.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingDoc(false);
    }
  };

  const handleOpenExplain = (evaluation: RequirementEvidenceEvaluation) => {
    setExplainEvaluation(evaluation);
    setIsExplainOpen(true);
  };

  const handleOpenEvidence = (evaluation: RequirementEvidenceEvaluation) => {
    setEvidenceEvaluation(evaluation);
    setIsEvidenceOpen(true);
  };

  const handleSaveOfficerReview = async (reqId: string) => {
    const compResult = complianceResults.find((c) => c.requirement_id === reqId);
    if (!compResult) {
      alert('Cannot update review on simulated demo data.');
      return;
    }

    setIsSavingReview(true);
    try {
      await updateRequirementReview({
        tenderId: tender.id,
        complianceResultId: compResult.id,
        overrideStatus,
        officerNotes
      });
      setEditingReviewId(null);
    } catch (err) {
      console.error('Failed to update officer review:', err);
      alert('Failed to save review. Please try again.');
    } finally {
      setIsSavingReview(false);
    }
  };

  const getStatusBadge = (status: ComplianceMatrixStatus) => {
    switch (status) {
      case 'COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider bg-[#F7F7F7] text-[#111111] border border-[#E5E5E5]">
            <CheckCircle2 className="h-3 w-3" /> Compliant
          </span>
        );
      case 'PARTIALLY COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider bg-[#F7F7F7] text-[#555555] border border-[#E5E5E5]">
            <AlertTriangle className="h-3 w-3" /> Partially Compliant
          </span>
        );
      case 'NON-COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#111111] text-white border border-[#111111]">
            <ShieldAlert className="h-3 w-3" /> Non-Compliant
          </span>
        );
      case 'MISSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#111111] text-white border border-[#111111]">
            <HelpCircle className="h-3 w-3" /> Missing
          </span>
        );
      case 'REQUIRES MANUAL REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider bg-[#F7F7F7] text-[#111111] border border-[#E5E5E5]">
            <Clock className="h-3 w-3" /> Manual Review
          </span>
        );
      case 'NOT VERIFIED':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium uppercase tracking-wider bg-white text-[#777777] border border-[#E5E5E5]">
            Not Verified
          </span>
        );
    }
  };

  const getRiskBadge = (risk: ComplianceRiskLevel) => {
    switch (risk) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#111111] text-white border border-[#111111]">
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-[#F7F7F7] text-[#111111] border border-[#E5E5E5]">
            Medium
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-white text-[#555555] border border-[#E5E5E5]">
            Low
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-8 font-sans">
      {/* 1. Header Overview Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 border-b border-[#E5E5E5] pb-7 pt-2">
        <div className="space-y-2 max-w-3xl">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777]">
              01. COMPLIANCE COMMAND CENTER
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" />
            <span className="text-[11px] font-mono text-[#111111] uppercase tracking-wider font-medium">
              AUDITED DOSSIER
            </span>
            {useDemoData && (
              <span className="px-2.5 py-0.5 rounded bg-[#F7F7F7] text-[#111111] border border-[#E5E5E5] text-[10px] uppercase font-semibold font-mono">
                Demo Benchmark
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#111111]">
            {useDemoData ? 'Smart City Metro Signaling EPC Tender (Demo)' : tender.title}
          </h1>
          <p className="text-sm text-[#555555] leading-relaxed">
            Clause extraction, grounded source traceability, and evidence verification matrix.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseDemoData(!useDemoData)}
            className="text-xs sm:text-sm h-10 px-4 bg-white border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7]"
          >
            {useDemoData ? 'Switch to Uploaded Tender' : 'Toggle Demo Benchmark'}
          </Button>

          {tender.storage_path && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSourceDoc}
              disabled={downloadingDoc}
              className="bg-white border-[#E5E5E5] text-[#111111] text-xs sm:text-sm hover:bg-[#F7F7F7] h-10 px-4"
            >
              <Download className="mr-1.5 h-3.5 w-3.5 text-[#555555]" />
              {downloadingDoc ? 'Preparing...' : 'Source Document'}
            </Button>
          )}

          <Link href={`/reports/${tender.id}`}>
            <Button
              size="sm"
              className="bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm h-10 px-5"
            >
              Procurement Report <ArrowRight className="ml-1.5 h-3.5 w-3.5 stroke-[1.5]" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Transparent Compliance Scorecard Banner */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-[#E5E5E5] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-[#111111]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777]">
                Transparent Compliance Assessment
              </span>
            </div>
            <h3 className="text-xl font-semibold text-[#111111]">Overall Bid Readiness Score</h3>
            <p className="text-xs text-[#555555] max-w-2xl leading-relaxed">
              Calculated dynamically from {scoringBreakdown.totalRequirements} extracted requirements. Mandatory criteria
              are weighted at 20 points, optional criteria at 10 points. Zero arbitrary numbers.
            </p>
          </div>

          <div className="flex items-center gap-5 bg-[#F7F7F7] px-6 py-4 rounded-xl border border-[#E5E5E5]">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#777777] block font-medium">
                Readiness Score
              </span>
              <span className="text-4xl font-semibold tracking-tight text-[#111111]">
                {scoringBreakdown.score}%
              </span>
            </div>
            <div className="h-10 w-px bg-[#E5E5E5]" />
            <div className="text-left text-xs space-y-0.5">
              <span className="text-[#555555] block">
                Points: <span className="text-[#111111] font-semibold font-mono">{scoringBreakdown.pointsEarned.toFixed(0)}</span> /{' '}
                {scoringBreakdown.maxPoints}
              </span>
              <span className="text-[#777777] text-[11px] block">
                Risk Rating:{' '}
                <span className="text-[#111111] font-semibold uppercase">{tender.risk_level || 'Medium'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* 6 Breakdown Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-5 text-center">
          <div className="bg-[#F7F7F7] p-3 rounded-lg border border-[#E5E5E5]">
            <span className="text-[10px] uppercase text-[#777777] tracking-wider block font-medium">Total Criteria</span>
            <span className="text-xl font-semibold text-[#111111] mt-1 block">{scoringBreakdown.totalRequirements}</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-[#E5E5E5]">
            <span className="text-[10px] uppercase text-[#555555] tracking-wider block font-medium">Compliant</span>
            <span className="text-xl font-semibold text-[#111111] mt-1 block">{scoringBreakdown.compliantCount}</span>
          </div>
          <div className="bg-[#F7F7F7] p-3 rounded-lg border border-[#E5E5E5]">
            <span className="text-[10px] uppercase text-[#555555] tracking-wider block font-medium">Partially Compliant</span>
            <span className="text-xl font-semibold text-[#111111] mt-1 block">
              {scoringBreakdown.partiallyCompliantCount}
            </span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-[#E5E5E5]">
            <span className="text-[10px] uppercase text-[#111111] tracking-wider block font-semibold">Non-Compliant</span>
            <span className="text-xl font-semibold text-[#111111] mt-1 block">{scoringBreakdown.nonCompliantCount}</span>
          </div>
          <div className="bg-[#F7F7F7] p-3 rounded-lg border border-[#E5E5E5]">
            <span className="text-[10px] uppercase text-[#111111] tracking-wider block font-semibold">Missing Evidence</span>
            <span className="text-xl font-semibold text-[#111111] mt-1 block">{scoringBreakdown.missingCount}</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-[#E5E5E5]">
            <span className="text-[10px] uppercase text-[#555555] tracking-wider block font-medium">Manual Review</span>
            <span className="text-xl font-semibold text-[#111111] mt-1 block">{scoringBreakdown.manualReviewCount}</span>
          </div>
        </div>
      </div>

      {/* 3. Navigation View Tabs */}
      <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 border ${
              activeTab === 'matrix'
                ? 'bg-[#111111] text-white border-[#111111]'
                : 'bg-white text-[#555555] border-[#E5E5E5] hover:text-[#111111] hover:bg-[#F7F7F7]'
            }`}
          >
            <Layers className="h-4 w-4" />
            Compliance Matrix
            <span className={`ml-1.5 px-2 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === 'matrix' ? 'bg-white/20 text-white' : 'bg-[#F7F7F7] text-[#555555]'
            }`}>
              {activeEvaluations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 border ${
              activeTab === 'graph'
                ? 'bg-[#111111] text-white border-[#111111]'
                : 'bg-white text-[#555555] border-[#E5E5E5] hover:text-[#111111] hover:bg-[#F7F7F7]'
            }`}
          >
            <Eye className="h-4 w-4" />
            Intelligence Graph
          </button>

          <button
            onClick={() => setActiveTab('radar')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 border ${
              activeTab === 'radar'
                ? 'bg-[#111111] text-white border-[#111111]'
                : 'bg-white text-[#555555] border-[#E5E5E5] hover:text-[#111111] hover:bg-[#F7F7F7]'
            }`}
          >
            <AlertOctagon className="h-4 w-4" />
            Contradiction Radar
            {activeContradictions.criticalCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-[#111111] text-white font-mono">
                {activeContradictions.criticalCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('cross-doc')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-2 border ${
              activeTab === 'cross-doc'
                ? 'bg-[#111111] text-white border-[#111111]'
                : 'bg-white text-[#555555] border-[#E5E5E5] hover:text-[#111111] hover:bg-[#F7F7F7]'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Cross-Document Intelligence
            {crossDocSummary && crossDocSummary.high_count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-[#111111] text-white font-mono">
                {crossDocSummary.high_count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4. Tab 1: Interactive Compliance Matrix Table */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Filtering Bar */}
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#777777]" />
                <input
                  type="search"
                  placeholder="Search requirement, clause, source excerpt..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] text-xs sm:text-sm text-[#111111] placeholder:text-[#777777] focus:outline-none focus:border-[#111111] transition-colors"
                />
              </div>

              {/* Status & Risk Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                >
                  <option value="all">All Statuses</option>
                  <option value="compliant">COMPLIANT</option>
                  <option value="partially compliant">PARTIALLY COMPLIANT</option>
                  <option value="non-compliant">NON-COMPLIANT</option>
                  <option value="missing">MISSING</option>
                  <option value="requires manual review">REQUIRES MANUAL REVIEW</option>
                </select>

                <select
                  value={selectedRisk}
                  onChange={(e) => setSelectedRisk(e.target.value)}
                  className="h-9 px-3 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                >
                  <option value="all">All Risk Levels</option>
                  <option value="high">High Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="low">Low Risk</option>
                </select>

                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as 'all' | 'mandatory' | 'optional')}
                  className="h-9 px-3 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                >
                  <option value="all">Mandatory & Optional</option>
                  <option value="mandatory">Mandatory Only</option>
                  <option value="optional">Optional Only</option>
                </select>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-t border-[#E5E5E5] pt-3">
              <span className="text-[#777777] font-semibold uppercase text-[10px] tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Categories:
              </span>
              {PROCUREMENT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-all text-xs border ${
                    selectedCategory === cat.id
                      ? 'bg-[#111111] text-white border-[#111111] font-medium'
                      : 'bg-[#F7F7F7] text-[#555555] border-[#E5E5E5] hover:text-[#111111] hover:bg-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Compliance Matrix Table */}
          <div className="rounded-xl border border-[#E5E5E5] bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#F7F7F7] border-b border-[#E5E5E5] text-[11px] uppercase tracking-wider text-[#555555]">
                  <tr>
                    <th className="px-4 py-3.5 font-medium">Requirement</th>
                    <th className="px-4 py-3.5 font-medium">Category</th>
                    <th className="px-4 py-3.5 font-medium text-center">Mandatory</th>
                    <th className="px-4 py-3.5 font-medium">Evidence</th>
                    <th className="px-4 py-3.5 font-medium text-center">Status</th>
                    <th className="px-4 py-3.5 font-medium text-center">Risk</th>
                    <th className="px-4 py-3.5 font-medium">Source Citation</th>
                    <th className="px-4 py-3.5 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {filteredEvaluations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-[#777777]">
                        No requirements match your active filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredEvaluations.map((evalItem) => {
                      const isSelected = selectedReqId === evalItem.requirementId;
                      return (
                        <tr
                          key={evalItem.requirementId}
                          onClick={() => setSelectedReqId(evalItem.requirementId)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-[#F7F7F7]' : 'hover:bg-[#FAFAFA]'
                          }`}
                        >
                          {/* Column 1: Requirement */}
                          <td className="px-4 py-4 max-w-xs">
                            <div className="font-medium text-[#111111] tracking-tight">
                              {evalItem.requirementName}
                            </div>
                            <span className="text-[11px] font-mono text-[#777777] block mt-0.5">
                              {evalItem.requirementCode || 'REQ'}
                            </span>
                          </td>

                          {/* Column 2: Category */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-[#F7F7F7] border border-[#E5E5E5] text-[11px] text-[#555555]">
                              {evalItem.category}
                            </span>
                          </td>

                          {/* Column 3: Mandatory */}
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            {evalItem.mandatory ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#111111] text-white">
                                Mandatory
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-[#F7F7F7] text-[#555555] border border-[#E5E5E5]">
                                Optional
                              </span>
                            )}
                          </td>

                          {/* Column 4: Evidence */}
                          <td className="px-4 py-4 max-w-xs">
                            {evalItem.matchedDocumentName ? (
                              <div className="flex items-center gap-1.5 text-xs text-[#111111] truncate">
                                <FileText className="h-3.5 w-3.5 text-[#555555] shrink-0" />
                                <span className="truncate">{evalItem.matchedDocumentName}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-[#777777] italic">No supporting document</span>
                            )}
                          </td>

                          {/* Column 5: Status */}
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            {getStatusBadge(evalItem.matrixStatus)}
                          </td>

                          {/* Column 6: Risk */}
                          <td className="px-4 py-4 whitespace-nowrap text-center">
                            {getRiskBadge(evalItem.riskLevel)}
                          </td>

                          {/* Column 7: Source */}
                          <td className="px-4 py-4 max-w-xs">
                            <div className="text-xs text-[#555555] truncate" title={evalItem.sourceExcerpt}>
                              <span className="text-[#111111] font-mono mr-1">{evalItem.clauseReference}</span>
                              &ldquo;{evalItem.sourceExcerpt}&rdquo;
                            </div>
                          </td>

                          {/* Column 8: Action */}
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenExplain(evalItem);
                              }}
                              className="text-xs text-[#111111] hover:bg-[#E5E5E5] h-7 px-2.5"
                            >
                              Inspect WHY
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Drilldown Inspector for Selected Requirement */}
          {selectedEvaluation && (
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono text-[#111111] font-semibold">
                      {selectedEvaluation.requirementCode}
                    </span>
                    <span className="text-[#CCCCCC]">&bull;</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777]">
                      {selectedEvaluation.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-[#111111] tracking-tight">
                    {selectedEvaluation.requirementName}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedEvaluation.matrixStatus)}
                  {getRiskBadge(selectedEvaluation.riskLevel)}
                </div>
              </div>

              {/* 3 Inspection Sections */}
              <div className="grid md:grid-cols-2 gap-5">
                {/* 1. Source Traceability */}
                <div className="bg-[#F7F7F7] p-5 rounded-xl border border-[#E5E5E5] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777] flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-[#111111]" /> Source Traceability
                    </span>
                    <span className="text-[11px] font-mono text-[#555555]">
                      Page {selectedEvaluation.sourcePage || 1}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#111111] italic bg-white p-3.5 rounded-lg border border-[#E5E5E5] leading-relaxed">
                    &ldquo;{selectedEvaluation.sourceExcerpt}&rdquo;
                  </p>
                  <div className="text-xs text-[#555555]">
                    <span className="text-[#111111] font-semibold">Clause Reference:</span>{' '}
                    {selectedEvaluation.clauseReference || 'Tender Specifications'}
                  </div>
                </div>

                {/* 2. Evidence Grounding ("WHY") */}
                <div className="bg-[#F7F7F7] p-5 rounded-xl border border-[#E5E5E5] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
                      <FileText className="h-4 w-4" /> Evidence Grounding (WHY)
                    </span>
                    <span className="text-[11px] font-mono text-[#111111] font-semibold">
                      Confidence: {Math.round(selectedEvaluation.confidence * 100)}%
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-[#E5E5E5]">
                      <span className="text-[10px] text-[#777777] uppercase block font-semibold">Expected:</span>
                      <span className="text-[#111111] font-medium">{selectedEvaluation.explanation.expected}</span>
                    </div>

                    <div className="bg-white p-2.5 rounded-lg border border-[#E5E5E5]">
                      <span className="text-[10px] text-[#777777] uppercase block font-semibold">Detected:</span>
                      <span className="text-[#111111] font-medium">{selectedEvaluation.explanation.detected}</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-[#E5E5E5] text-xs text-[#555555] leading-relaxed">
                    <MarkdownRenderer content={selectedEvaluation.explanation.rationale} />
                  </div>
                </div>
              </div>

              {/* 3. Procurement Officer Decision & Status Override */}
              <div className="rounded-xl border border-[#E5E5E5] bg-[#F7F7F7] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#111111] flex items-center gap-2">
                    <Edit3 className="h-4 w-4 text-[#111111]" />
                    Procurement Officer Decision & Review Override
                  </span>
                  <span className="text-[11px] text-[#777777] italic">
                    The system provides an assessment. The procurement officer makes the final decision.
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#777777] uppercase font-semibold block">Override Status</label>
                    <select
                      value={overrideStatus}
                      onChange={(e) => setOverrideStatus(e.target.value as ComplianceMatrixStatus)}
                      className="h-9 px-3 rounded-lg bg-white border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
                    >
                      <option value="COMPLIANT">COMPLIANT</option>
                      <option value="PARTIALLY COMPLIANT">PARTIALLY COMPLIANT</option>
                      <option value="NON-COMPLIANT">NON-COMPLIANT</option>
                      <option value="MISSING">MISSING</option>
                      <option value="REQUIRES MANUAL REVIEW">REQUIRES MANUAL REVIEW</option>
                    </select>
                  </div>

                  <div className="space-y-1 flex-1 w-full">
                    <label className="text-[11px] text-[#777777] uppercase font-semibold block">Review Notes / Rationale</label>
                    <input
                      type="text"
                      placeholder="e.g., Exemption verified under MSME notification / Board resolution verified."
                      value={officerNotes}
                      onChange={(e) => setOfficerNotes(e.target.value)}
                      className="h-9 px-3 w-full rounded-lg bg-white border border-[#E5E5E5] text-xs text-[#111111] placeholder:text-[#777777] focus:outline-none focus:border-[#111111]"
                    />
                  </div>

                  <div className="sm:pt-5">
                    <Button
                      size="sm"
                      onClick={() => handleSaveOfficerReview(selectedEvaluation.requirementId)}
                      disabled={isSavingReview}
                      className="bg-[#111111] hover:bg-[#222222] text-white text-xs h-9 px-4 gap-1.5"
                    >
                      <Check className="h-3.5 w-3.5" />
                      {isSavingReview ? 'Saving...' : 'Confirm Decision'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Tab 2: Compliance Intelligence Graph */}
      {activeTab === 'graph' && (
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E5E5E5] text-xs shadow-xs">
              <button
                onClick={() => setGraph3DMode(true)}
                className={`px-3 py-1 rounded-md transition-all ${
                  graph3DMode
                    ? 'bg-[#111111] text-white font-medium'
                    : 'text-[#555555] hover:text-[#111111]'
                }`}
              >
                3D Spatial Network
              </button>
              <button
                onClick={() => setGraph3DMode(false)}
                className={`px-3 py-1 rounded-md transition-all ${
                  !graph3DMode
                    ? 'bg-[#111111] text-white font-medium'
                    : 'text-[#555555] hover:text-[#111111]'
                }`}
              >
                2D Flow View
              </button>
            </div>
          </div>

          {graph3DMode ? (
            <ComplianceIntelligenceGraph3D
              tenderTitle={useDemoData ? 'Smart City Metro Signaling EPC Tender (Demo)' : tender.title}
              evaluations={activeEvaluations}
              contradictions={activeContradictions.issues}
              onOpenExplain={handleOpenExplain}
              onOpenEvidence={handleOpenEvidence}
            />
          ) : (
            <ComplianceIntelligenceGraph
              tenderTitle={useDemoData ? 'Smart City Metro Signaling EPC Tender (Demo)' : tender.title}
              evaluations={activeEvaluations}
              contradictions={activeContradictions.issues}
              onOpenExplain={handleOpenExplain}
              onOpenEvidence={handleOpenEvidence}
            />
          )}
        </div>
      )}

      {/* 6. Tab 3: Contradiction Radar */}
      {activeTab === 'radar' && <ContradictionRadar summary={activeContradictions} />}

      {/* 6b. Tab 4: Cross-Document Intelligence */}
      {activeTab === 'cross-doc' && (
        <CrossDocumentIntelligence
          tenderId={tender.id}
          initialSummary={crossDocSummary}
          initialFindings={crossDocFindings}
        />
      )}

      {/* 7. Deep Audit Matrix & Intelligence Findings */}
      <IntelligenceFindings
        evaluations={activeEvaluations}
        contradictions={activeContradictions.issues}
        onSelectRequirement={(req) => setSelectedReqId(req.requirementId)}
        onOpenExplain={handleOpenExplain}
        onOpenEvidence={handleOpenEvidence}
      />

      {/* 8. Analysis Timeline / Audit Trail */}
      <AnalysisTimeline />

      {/* 9. Final Bid Readiness Assessment Verdict */}
      <BidReadinessCard
        tenderId={tender.id}
        score={scoringBreakdown.score}
        satisfiedCount={activeEvaluations.filter((e) => e.matrixStatus === 'COMPLIANT').length}
        gapsCount={activeEvaluations.filter((e) => e.matrixStatus === 'MISSING').length}
        risksCount={activeContradictions.criticalCount}
        onReviewCritical={() => setActiveTab('radar')}
      />

      {/* 10. Modals */}
      <ExplainabilityModal
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
        evaluation={explainEvaluation}
      />

      <EvidenceViewerModal
        isOpen={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
        evaluation={evidenceEvaluation}
        onOpenExplain={() => {
          setIsEvidenceOpen(false);
          setIsExplainOpen(true);
          setExplainEvaluation(evidenceEvaluation);
        }}
      />
    </div>
  );
}
