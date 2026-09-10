'use client';

/**
 * Cross-Document Intelligence UI Component
 *
 * Displays cross-document consistency analysis results within the
 * Clausentis enterprise procurement analysis workspace. Shows:
 * 1. Consistency Summary (Category bars with % scores)
 * 2. Finding List (compact rows with severity, result, affected docs)
 * 3. Evidence Detail Panel (selected finding with full traceability)
 */

import { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  FileText,
  Search,
  Building2,
  FileCheck,
  IndianRupee,
  Award,
  Briefcase,
  Calendar,
  ArrowRight,
  Cpu,
  Regex,
  BrainCircuit,
  Loader2,
} from 'lucide-react';
import { runCrossDocumentAnalysis } from '@/lib/actions/cross-document';
import type {
  CrossDocumentFinding,
  CrossDocumentFindingRow,
  CrossDocumentSummary,
  CrossDocResult,
  CrossDocSeverity,
  CrossDocFactType,
  CrossDocDocumentEvidence,
} from '@/types/cross-document';

// ────────────────────────────────────────────────
// Props
// ────────────────────────────────────────────────

interface CrossDocumentIntelligenceProps {
  tenderId: string;
  initialSummary: CrossDocumentSummary | null;
  initialFindings: CrossDocumentFindingRow[];
}

// ────────────────────────────────────────────────
// Category Config
// ────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<CrossDocFactType, {
  label: string;
  icon: typeof Building2;
}> = {
  identity: { label: 'Identity', icon: Building2 },
  registration: { label: 'Registration', icon: FileCheck },
  financial: { label: 'Financial', icon: IndianRupee },
  experience: { label: 'Experience', icon: Briefcase },
  certification: { label: 'Certifications', icon: Award },
  date: { label: 'Date Validity', icon: Calendar },
};

// ────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────

export function CrossDocumentIntelligence({
  tenderId,
  initialSummary,
  initialFindings,
}: CrossDocumentIntelligenceProps) {
  const [summary, setSummary] = useState<CrossDocumentSummary | null>(initialSummary);
  const [findings, setFindings] = useState<CrossDocumentFindingRow[]>(initialFindings);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(
    initialFindings.length > 0 ? initialFindings[0].id : null
  );
  const [filterSeverity, setFilterSeverity] = useState<'all' | CrossDocSeverity>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | CrossDocFactType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);

  // ──── Filter findings ────
  const filteredFindings = useMemo(() => {
    return findings.filter(f => {
      // Exclude MATCH findings from the issues list (they're shown in summary)
      if (f.result === 'MATCH') return false;

      const matchesSeverity = filterSeverity === 'all' || f.severity === filterSeverity;
      const matchesCategory = filterCategory === 'all' || f.fact_type === filterCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        f.fact_label.toLowerCase().includes(q) ||
        (f.explanation || '').toLowerCase().includes(q) ||
        f.documents.some(d => d.document_name.toLowerCase().includes(q) || d.original_value.toLowerCase().includes(q));

      return matchesSeverity && matchesCategory && matchesSearch;
    });
  }, [findings, filterSeverity, filterCategory, searchQuery]);

  // All non-match findings
  const issueFindings = useMemo(() => findings.filter(f => f.result !== 'MATCH'), [findings]);

  const selectedFinding = findings.find(f => f.id === selectedFindingId) || filteredFindings[0] || null;

  // ──── Run analysis ────
  const handleRunAnalysis = async () => {
    setIsRunning(true);
    setRunError(null);
    try {
      const result = await runCrossDocumentAnalysis(tenderId);
      if (result.success && result.summary) {
        setSummary(result.summary);
        // Re-map findings from summary
        const mappedFindings: CrossDocumentFindingRow[] = result.summary.findings.map((f: CrossDocumentFinding) => ({
          id: f.id,
          tender_id: tenderId,
          fact_type: f.fact_type,
          fact_label: f.fact_label,
          documents: f.documents,
          result: f.result,
          severity: f.severity,
          severity_reason: f.severity_reason,
          explanation: f.explanation,
          recommended_action: f.recommended_action,
          comparison_method: f.comparison_method,
          created_at: new Date().toISOString(),
        }));
        setFindings(mappedFindings);
        if (mappedFindings.length > 0) {
          const firstIssue = mappedFindings.find(f => f.result !== 'MATCH');
          setSelectedFindingId(firstIssue?.id || mappedFindings[0].id);
        }
      } else {
        setRunError(result.error || 'Analysis failed');
      }
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsRunning(false);
    }
  };

  // ──── No data yet ────
  if (!summary && findings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-[#E5E5E5] bg-white rounded-xl p-8">
        <div className="h-12 w-12 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-center text-[#111111] mb-4">
          <ShieldCheck className="h-6 w-6 stroke-[1.5]" />
        </div>
        <h3 className="text-xl font-semibold text-[#111111] mb-2 tracking-tight">
          Cross-Document Intelligence
        </h3>
        <p className="text-sm text-[#555555] max-w-md mb-6 leading-relaxed">
          Compare information across all uploaded bidder documents to detect contradictions,
          validate dates, and verify numerical consistency.
        </p>
        {runError && (
          <p className="text-xs text-[#111111] font-mono bg-[#F7F7F7] border border-[#E5E5E5] p-2 rounded mb-4">{runError}</p>
        )}
        <button
          onClick={handleRunAnalysis}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#111111] hover:bg-[#222222] text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing Documents...
            </>
          ) : (
            <>
              <BrainCircuit className="h-4 w-4" />
              Run Cross-Document Analysis
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 font-sans">
      {/* ──── 1. CONSISTENCY SUMMARY ──── */}
      {summary && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777]">
                CROSS-DOCUMENT CONSISTENCY
              </span>
              <span className="text-xs text-[#555555] font-mono">
                {summary.document_count} documents analyzed
              </span>
            </div>
            <div className="flex items-center gap-2">
              {summary.high_count > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#111111] text-white">
                  {summary.high_count} HIGH
                </span>
              )}
              {summary.medium_count > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-[#F7F7F7] text-[#111111] border border-[#E5E5E5]">
                  {summary.medium_count} MEDIUM
                </span>
              )}
              {summary.low_count > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-white text-[#555555] border border-[#E5E5E5]">
                  {summary.low_count} LOW
                </span>
              )}
            </div>
          </div>

          {/* Category bars */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {(Object.entries(CATEGORY_CONFIG) as [CrossDocFactType, typeof CATEGORY_CONFIG[CrossDocFactType]][])
              .filter(([key]) => key !== 'date')
              .map(([key, config]) => {
                const score = summary[key as keyof Pick<CrossDocumentSummary, 'identity' | 'registration' | 'financial' | 'experience' | 'certification'>];
                if (!score) return null;

                const pct = score.percentage;
                const IconComp = config.icon;

                return (
                  <div key={key} className="rounded-lg border border-[#E5E5E5] bg-white p-3.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <IconComp className="h-3.5 w-3.5 text-[#555555] stroke-[1.5]" />
                      <span className="text-[11px] font-medium text-[#777777] uppercase tracking-wider">
                        {config.label}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-xl font-semibold text-[#111111] tracking-tight">
                        {score.total_checks > 0 ? `${pct}%` : '—'}
                      </span>
                      {score.total_checks > 0 && (
                        <span className="text-[10px] font-mono text-[#777777]">
                          {score.consistent_checks}/{score.total_checks}
                        </span>
                      )}
                    </div>
                    {score.total_checks > 0 && (
                      <div className="w-full h-1.5 bg-[#E5E5E5] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#111111] transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ──── 2. FINDINGS ──── */}
      {issueFindings.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Left: Finding List */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777]">
                FINDINGS ({issueFindings.length} {issueFindings.length === 1 ? 'issue' : 'issues'})
              </span>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[140px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#777777]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search findings..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-[#E5E5E5] text-xs text-[#111111] placeholder:text-[#777777] focus:outline-none focus:border-[#111111]"
                />
              </div>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as 'all' | CrossDocSeverity)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
              >
                <option value="all">All Severity</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as 'all' | CrossDocFactType)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
              >
                <option value="all">All Types</option>
                <option value="identity">Identity</option>
                <option value="registration">Registration</option>
                <option value="financial">Financial</option>
                <option value="experience">Experience</option>
                <option value="certification">Certification</option>
                <option value="date">Date</option>
              </select>
            </div>

            {/* Finding rows */}
            <div className="flex flex-col gap-1.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredFindings.length === 0 ? (
                <div className="text-center py-8 text-[#777777] text-sm">
                  No findings match your filters.
                </div>
              ) : (
                filteredFindings.map((finding) => (
                  <button
                    key={finding.id}
                    onClick={() => setSelectedFindingId(finding.id)}
                    className={`group w-full text-left rounded-lg border p-3 transition-all ${
                      selectedFindingId === finding.id
                        ? 'border-[#111111] bg-[#F7F7F7]'
                        : 'border-[#E5E5E5] bg-white hover:border-[#CCCCCC] hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getSeverityDot(finding.severity as CrossDocSeverity)}
                          <span className="text-xs font-medium text-[#111111] truncate">
                            {finding.fact_label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getResultBadge(finding.result as CrossDocResult)}
                          <span className="text-[10px] text-[#777777] font-mono">
                            {finding.documents.length} {finding.documents.length === 1 ? 'doc' : 'docs'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`h-3.5 w-3.5 mt-1 text-[#777777] transition-colors ${
                        selectedFindingId === finding.id ? 'text-[#111111]' : 'group-hover:text-[#111111]'
                      }`} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Evidence Detail */}
          <div className="lg:col-span-3">
            {selectedFinding ? (
              <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 space-y-5 shadow-sm">
                {/* Finding header */}
                <div className="space-y-2 border-b border-[#E5E5E5] pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getFactTypeIcon(selectedFinding.fact_type as CrossDocFactType)}
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777]">
                        {CATEGORY_CONFIG[selectedFinding.fact_type as CrossDocFactType]?.label || selectedFinding.fact_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getResultBadge(selectedFinding.result as CrossDocResult)}
                      {getSeverityBadge(selectedFinding.severity as CrossDocSeverity)}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-[#111111] tracking-tight">
                    {selectedFinding.fact_label}
                  </h3>
                </div>

                {/* Evidence table */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777]">
                    AFFECTED DOCUMENTS
                  </span>
                  <div className="rounded-lg border border-[#E5E5E5] overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#F7F7F7] border-b border-[#E5E5E5]">
                          <th className="text-left px-3 py-2 text-[#555555] font-medium">Document</th>
                          <th className="text-left px-3 py-2 text-[#555555] font-medium">Original Value</th>
                          <th className="text-left px-3 py-2 text-[#555555] font-medium">Normalized</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5]">
                        {selectedFinding.documents.map((doc: CrossDocDocumentEvidence, idx: number) => (
                          <tr
                            key={idx}
                            className="hover:bg-[#F7F7F7]"
                          >
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-[#555555] shrink-0" />
                                <span className="text-[#111111] font-medium truncate max-w-[160px]" title={doc.document_name}>
                                  {doc.document_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="text-[#555555]">
                                {doc.original_value || '—'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="text-[#111111] font-mono text-[11px]">
                                {doc.normalized_value || '—'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Source excerpts */}
                {selectedFinding.documents.some((d: CrossDocDocumentEvidence) => d.source_excerpt) && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777]">
                      SOURCE EXCERPTS
                    </span>
                    <div className="space-y-2">
                      {selectedFinding.documents
                        .filter((d: CrossDocDocumentEvidence) => d.source_excerpt)
                        .map((doc: CrossDocDocumentEvidence, idx: number) => (
                          <div key={idx} className="rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <FileText className="h-3 w-3 text-[#555555]" />
                              <span className="text-[11px] text-[#555555] font-medium">{doc.document_name}</span>
                              {doc.page_number && (
                                <span className="text-[11px] text-[#777777]">• Page {doc.page_number}</span>
                              )}
                            </div>
                            <p className="text-xs text-[#555555] italic leading-relaxed">
                              &ldquo;{doc.source_excerpt}&rdquo;
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {selectedFinding.explanation && (
                  <div className="space-y-1.5 border-t border-[#E5E5E5] pt-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777]">
                      ANALYSIS
                    </span>
                    <p className="text-xs text-[#555555] leading-relaxed">
                      {selectedFinding.explanation}
                    </p>
                  </div>
                )}

                {/* Severity reason */}
                {selectedFinding.severity_reason && (
                  <div className="space-y-1.5 border-t border-[#E5E5E5] pt-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777]">
                      SEVERITY RATIONALE
                    </span>
                    <p className="text-xs text-[#555555] leading-relaxed">
                      {selectedFinding.severity_reason}
                    </p>
                  </div>
                )}

                {/* Comparison method */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {selectedFinding.comparison_method && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5]">
                      {getComparisonMethodIcon(selectedFinding.comparison_method)}
                      <span className="text-[10px] text-[#555555] uppercase tracking-wider font-mono">
                        {selectedFinding.comparison_method} comparison
                      </span>
                    </div>
                  )}
                </div>

                {selectedFinding.recommended_action && (
                  <div className="rounded-lg border border-[#E5E5E5] bg-[#F7F7F7] p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <ArrowRight className="h-3 w-3 text-[#111111]" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#111111]">
                        RECOMMENDED ACTION
                      </span>
                    </div>
                    <p className="text-xs text-[#555555] leading-relaxed">
                      {selectedFinding.recommended_action}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-[#E5E5E5] bg-white p-12 flex items-center justify-center text-[#777777] text-sm">
                Select a finding to view evidence details
              </div>
            )}
          </div>
        </div>
      ) : (
        /* No issues found */
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-8 text-center space-y-3">
          <div className="h-12 w-12 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-center text-[#111111] mx-auto">
            <CheckCircle2 className="h-6 w-6 stroke-[1.5]" />
          </div>
          <h3 className="text-lg font-semibold text-[#111111] tracking-tight">
            All Documents Consistent
          </h3>
          <p className="text-xs text-[#555555] max-w-md mx-auto leading-relaxed">
            No contradictions detected across uploaded bidder documents.
            All identity, financial, and certification information is consistent.
          </p>
        </div>
      )}

      {/* ──── Re-run button ──── */}
      {summary && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleRunAnalysis}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#F7F7F7] border border-[#E5E5E5] text-xs text-[#111111] font-medium transition-colors disabled:opacity-50"
          >
            {isRunning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <BrainCircuit className="h-3.5 w-3.5" />
            )}
            {isRunning ? 'Analyzing...' : 'Re-run Analysis'}
          </button>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// Badge Helpers
// ────────────────────────────────────────────────

function getSeverityDot(severity: CrossDocSeverity) {
  const colors: Record<CrossDocSeverity, string> = {
    HIGH: 'bg-[#111111]',
    MEDIUM: 'bg-[#555555]',
    LOW: 'bg-[#888888]',
  };
  return <span className={`h-2 w-2 rounded-full shrink-0 ${colors[severity]}`} />;
}

function getSeverityBadge(severity: CrossDocSeverity) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
      severity === 'HIGH'
        ? 'bg-[#111111] text-white border-[#111111]'
        : 'bg-[#F7F7F7] text-[#111111] border-[#E5E5E5]'
    }`}>
      {severity}
    </span>
  );
}

function getResultBadge(result: CrossDocResult) {
  const config: Record<CrossDocResult, { label: string; className: string; icon: typeof CheckCircle2 }> = {
    MATCH: { label: 'Match', className: 'bg-[#F7F7F7] text-[#111111] border-[#E5E5E5]', icon: CheckCircle2 },
    PARTIAL_MATCH: { label: 'Partial', className: 'bg-[#F7F7F7] text-[#555555] border-[#E5E5E5]', icon: HelpCircle },
    POTENTIAL_MISMATCH: { label: 'Potential Mismatch', className: 'bg-white text-[#111111] border-[#CCCCCC]', icon: AlertTriangle },
    CONFIRMED_MISMATCH: { label: 'Mismatch', className: 'bg-[#111111] text-white border-[#111111]', icon: ShieldAlert },
    NOT_FOUND: { label: 'Not Found', className: 'bg-[#F7F7F7] text-[#777777] border-[#E5E5E5]', icon: HelpCircle },
    REQUIRES_MANUAL_REVIEW: { label: 'Manual Review', className: 'bg-[#F7F7F7] text-[#111111] border-[#E5E5E5]', icon: HelpCircle },
  };
  const c = config[result] || config.REQUIRES_MANUAL_REVIEW;
  const IconComp = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border ${c.className}`}>
      <IconComp className="h-2.5 w-2.5" />
      {c.label}
    </span>
  );
}

function getFactTypeIcon(factType: CrossDocFactType) {
  const IconComp = CATEGORY_CONFIG[factType]?.icon || FileText;
  return <IconComp className="h-3.5 w-3.5 text-[#555555] stroke-[1.5]" />;
}

function getComparisonMethodIcon(method: string) {
  switch (method) {
    case 'deterministic':
      return <Cpu className="h-3 w-3 text-[#111111]" />;
    case 'normalization':
      return <Regex className="h-3 w-3 text-[#111111]" />;
    case 'ai_semantic':
      return <BrainCircuit className="h-3 w-3 text-[#111111]" />;
    default:
      return <Cpu className="h-3 w-3 text-[#777777]" />;
  }
}
