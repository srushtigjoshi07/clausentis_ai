'use client';

import { useState } from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Building2, 
  Receipt, 
  Award, 
  ChevronRight, 
  ShieldAlert,
  Info
} from 'lucide-react';
import { ContradictionRadarSummary } from '@/lib/ai/contradiction-engine';

interface ContradictionRadarProps {
  summary: ContradictionRadarSummary;
  onSelectDocument?: (documentId: string) => void;
}

export function ContradictionRadar({ summary }: ContradictionRadarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeIssueId, setActiveIssueId] = useState<string | null>(
    summary.issues.length > 0 ? summary.issues[0].id : null
  );

  const categories = [
    { id: 'all', label: 'All Inconsistencies', count: summary.issues.length },
    { id: 'entity', label: 'Entity & Names', icon: Building2, count: summary.issues.filter(i => i.category === 'entity').length },
    { id: 'financial', label: 'Financial & Turnover', icon: Receipt, count: summary.issues.filter(i => i.category === 'financial').length },
    { id: 'certificate', label: 'Validity & Dates', icon: Award, count: summary.issues.filter(i => i.category === 'certificate' || i.category === 'validity').length },
  ];

  const filteredIssues = summary.issues.filter(
    issue => selectedCategory === 'all' || issue.category === selectedCategory || (selectedCategory === 'certificate' && issue.category === 'validity')
  );

  const activeIssue = summary.issues.find(i => i.id === activeIssueId) || filteredIssues[0] || null;

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* 1. Header & Radar Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777]">
              CONTRADICTION RADAR
            </span>
            <div className="text-2xl font-semibold text-[#111111] tracking-tight">
              {summary.issues.length} {summary.issues.length === 1 ? 'Anomaly' : 'Anomalies'}
            </div>
            <p className="text-xs text-[#555555]">Cross-vault document audit</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-center text-[#111111]">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E5E5] bg-[#F7F7F7] p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777]">
              CRITICAL DISQUALIFIERS
            </span>
            <div className="text-2xl font-semibold text-[#111111] tracking-tight">
              {summary.criticalCount}
            </div>
            <p className="text-xs text-[#555555]">Immediate rejection risks</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-white border border-[#E5E5E5] flex items-center justify-center text-[#111111]">
            <AlertOctagon className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777]">
              PRE-QUAL WARNINGS
            </span>
            <div className="text-2xl font-semibold text-[#111111] tracking-tight">
              {summary.warningCount}
            </div>
            <p className="text-xs text-[#555555]">Pre-bid query exposure</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-center text-[#111111]">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E5E5] bg-white p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777]">
              VERIFIED CONCORDANT
            </span>
            <div className="text-2xl font-semibold text-[#111111] tracking-tight">
              {summary.consistentCount}
            </div>
            <p className="text-xs text-[#555555]">Cross-verified fields</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-center text-[#111111]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 2. Main Radar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Category Tabs & Issue List */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                  selectedCategory === cat.id
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-white text-[#555555] border-[#E5E5E5] hover:bg-[#F7F7F7] hover:text-[#111111]'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-[#F7F7F7] text-[#555555]'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* List of Detected Issues */}
          <div className="space-y-3">
            {filteredIssues.length === 0 ? (
              <div className="rounded-xl border border-[#E5E5E5] bg-white p-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-[#111111] mx-auto mb-2 stroke-[1.5]" />
                <p className="text-sm text-[#111111] font-medium">No Inconsistencies Detected</p>
                <p className="text-xs text-[#777777] mt-1">All verified vault documents are concordant.</p>
              </div>
            ) : (
              filteredIssues.map((issue) => {
                const isActive = activeIssue?.id === issue.id;
                const isCritical = issue.severity === 'critical';

                return (
                  <div
                    key={issue.id}
                    onClick={() => setActiveIssueId(issue.id)}
                    className={`rounded-xl border p-4 cursor-pointer transition-all ${
                      isActive
                        ? 'border-[#111111] bg-[#F7F7F7] shadow-sm'
                        : 'border-[#E5E5E5] bg-white hover:border-[#CCCCCC] hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        {isCritical ? (
                          <AlertOctagon className="h-4 w-4 text-[#111111] shrink-0" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-[#555555] shrink-0" />
                        )}
                        <span className={`text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded border ${
                          isCritical 
                            ? 'bg-[#111111] text-white border-[#111111]' 
                            : 'bg-[#F7F7F7] text-[#111111] border-[#E5E5E5]'
                        }`}>
                          {issue.severity}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#777777] font-mono">
                        {Math.round(issue.confidence * 100)}% Confidence
                      </span>
                    </div>

                    <h4 className="text-sm font-medium text-[#111111] leading-snug">
                      {issue.title}
                    </h4>

                    <div className="mt-3 flex items-center justify-between text-xs text-[#555555] border-t border-[#E5E5E5] pt-2">
                      <span>{issue.affectedDocuments.length} Vault Documents Affected</span>
                      <ChevronRight className={`h-3.5 w-3.5 text-[#555555] transition-transform ${isActive ? 'translate-x-1 text-[#111111]' : ''}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Deep Inconsistency Inspector */}
        <div className="lg:col-span-7">
          {activeIssue ? (
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="border-b border-[#E5E5E5] pb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] uppercase font-semibold tracking-wider px-2.5 py-0.5 rounded border ${
                    activeIssue.severity === 'critical' 
                      ? 'bg-[#111111] text-white border-[#111111]' 
                      : 'bg-[#F7F7F7] text-[#111111] border-[#E5E5E5]'
                  }`}>
                    {activeIssue.severity} RISK
                  </span>
                  <span className="text-xs text-[#777777] uppercase tracking-wider font-mono">
                    CATEGORY: {activeIssue.category}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#111111] tracking-tight">
                  {activeIssue.title}
                </h3>
              </div>

              {/* Contradictory Evidence Matrix */}
              <div>
                <h4 className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold mb-3 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[#111111]" />
                  CONTRADICTORY VAULT EVIDENCE
                </h4>
                <div className="space-y-3">
                  {activeIssue.affectedDocuments.map((doc, idx) => (
                    <div key={idx} className="rounded-lg border border-[#E5E5E5] bg-[#F7F7F7] p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#111111]" />
                          <span className="text-xs sm:text-sm font-medium text-[#111111]">{doc.documentName}</span>
                        </div>
                        <span className="text-xs text-[#111111] font-medium bg-white border border-[#E5E5E5] px-2 py-0.5 rounded">
                          Page {doc.pageNumber}
                        </span>
                      </div>

                      <div className="text-xs text-[#111111] font-mono bg-white border border-[#E5E5E5] p-2.5 rounded font-medium">
                        Detected: {doc.detectedValue}
                      </div>

                      <p className="text-xs text-[#555555] italic bg-white border border-[#E5E5E5] p-2.5 rounded">
                        &ldquo;{doc.sourceExcerpt}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rationale & Bidding Impact */}
              <div className="grid sm:grid-cols-2 gap-4 border-t border-[#E5E5E5] pt-5">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777] block">
                    PROCUREMENT IMPACT
                  </span>
                  <p className="text-xs text-[#111111] leading-relaxed">
                    {activeIssue.impactOnBidding}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777] block">
                    RECOMMENDED REMEDIATION
                  </span>
                  <p className="text-xs text-[#111111] leading-relaxed">
                    {activeIssue.recommendation}
                  </p>
                </div>
              </div>

              {/* Detailed Explanation */}
              <div className="border-t border-[#E5E5E5] pt-4 bg-[#F7F7F7] -mx-6 -mb-6 p-6 rounded-b-xl">
                <div className="flex items-start gap-2.5 text-xs text-[#555555] leading-relaxed">
                  <Info className="h-4 w-4 text-[#111111] shrink-0 mt-0.5" />
                  <span>{activeIssue.explanation}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[#E5E5E5] bg-white p-12 text-center text-[#777777]">
              Select an anomaly from the radar to inspect contradictory vault citations.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
