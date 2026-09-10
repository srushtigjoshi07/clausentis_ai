'use client';

import { useState } from 'react';
import { 
  AlertOctagon, 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
} from 'lucide-react';
import { RequirementEvidenceEvaluation, ContradictionIssue } from '@/lib/ai/contradiction-engine';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

interface IntelligenceFindingsProps {
  evaluations: RequirementEvidenceEvaluation[];
  contradictions: ContradictionIssue[];
  onSelectRequirement?: (req: RequirementEvidenceEvaluation) => void;
  onOpenExplain?: (req: RequirementEvidenceEvaluation) => void;
  onOpenEvidence?: (req: RequirementEvidenceEvaluation) => void;
}

export function IntelligenceFindings({
  evaluations,
  contradictions,
  onOpenExplain,
  onOpenEvidence
}: IntelligenceFindingsProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'contradictions' | 'missing' | 'expiring' | 'verified'>('all');

  const missingEvidence = evaluations.filter(e => e.status === 'missing_evidence');
  const verifiedCompliant = evaluations.filter(e => e.status === 'compliant');
  const expiringOrNonCompliant = evaluations.filter(e => e.status === 'non_compliant' || e.isDateValidAtBidDate === false);

  const findingsCounts = {
    contradictions: contradictions.length,
    missing: missingEvidence.length,
    expiring: expiringOrNonCompliant.length,
    verified: verifiedCompliant.length
  };

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-xs space-y-6 font-sans">
      {/* Header & Findings Filter Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-5">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#777777] block mb-1">
            04. DEEP AUDIT MATRIX
          </span>
          <h3 className="text-xl sm:text-2xl font-semibold text-[#111111] tracking-tight">
            Intelligence Findings & Evidence Breakdown
          </h3>
        </div>

        <span className="text-xs text-[#555555]">
          Audited against {evaluations.length} RFP criteria
        </span>
      </div>

      {/* 4 Interactive Metric Strips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          onClick={() => setActiveFilter(activeFilter === 'contradictions' ? 'all' : 'contradictions')}
          className={`p-4 rounded-md border text-left transition-colors cursor-pointer flex flex-col justify-between ${
            activeFilter === 'contradictions'
              ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
              : 'border-[#E5E5E5] bg-[#F7F7F7] hover:border-[#CCCCCC] text-[#111111]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase tracking-wider font-semibold font-mono ${activeFilter === 'contradictions' ? 'text-white' : 'text-[#777777]'}`}>
              CONTRADICTIONS
            </span>
            <AlertOctagon className={`h-4 w-4 ${activeFilter === 'contradictions' ? 'text-white' : 'text-[#111111]'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono mt-2 mb-0.5 ${activeFilter === 'contradictions' ? 'text-white' : 'text-[#111111]'}`}>
            {findingsCounts.contradictions}
          </div>
          <span className={`text-[11px] ${activeFilter === 'contradictions' ? 'text-white/80' : 'text-[#555555]'}`}>Cross-vault mismatches</span>
        </button>

        <button
          onClick={() => setActiveFilter(activeFilter === 'missing' ? 'all' : 'missing')}
          className={`p-4 rounded-md border text-left transition-colors cursor-pointer flex flex-col justify-between ${
            activeFilter === 'missing'
              ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
              : 'border-[#E5E5E5] bg-[#F7F7F7] hover:border-[#CCCCCC] text-[#111111]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase tracking-wider font-semibold font-mono ${activeFilter === 'missing' ? 'text-white' : 'text-[#777777]'}`}>
              MISSING EVIDENCE
            </span>
            <HelpCircle className={`h-4 w-4 ${activeFilter === 'missing' ? 'text-white' : 'text-[#111111]'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono mt-2 mb-0.5 ${activeFilter === 'missing' ? 'text-white' : 'text-[#111111]'}`}>
            {findingsCounts.missing}
          </div>
          <span className={`text-[11px] ${activeFilter === 'missing' ? 'text-white/80' : 'text-[#555555]'}`}>Proof required in vault</span>
        </button>

        <button
          onClick={() => setActiveFilter(activeFilter === 'expiring' ? 'all' : 'expiring')}
          className={`p-4 rounded-md border text-left transition-colors cursor-pointer flex flex-col justify-between ${
            activeFilter === 'expiring'
              ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
              : 'border-[#E5E5E5] bg-[#F7F7F7] hover:border-[#CCCCCC] text-[#111111]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase tracking-wider font-semibold font-mono ${activeFilter === 'expiring' ? 'text-white' : 'text-[#777777]'}`}>
              EXPIRING / DEFICITS
            </span>
            <Clock className={`h-4 w-4 ${activeFilter === 'expiring' ? 'text-white' : 'text-[#111111]'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono mt-2 mb-0.5 ${activeFilter === 'expiring' ? 'text-white' : 'text-[#111111]'}`}>
            {findingsCounts.expiring}
          </div>
          <span className={`text-[11px] ${activeFilter === 'expiring' ? 'text-white/80' : 'text-[#555555]'}`}>Invalid at bid submission</span>
        </button>

        <button
          onClick={() => setActiveFilter(activeFilter === 'verified' ? 'all' : 'verified')}
          className={`p-4 rounded-md border text-left transition-colors cursor-pointer flex flex-col justify-between ${
            activeFilter === 'verified'
              ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
              : 'border-[#E5E5E5] bg-[#F7F7F7] hover:border-[#CCCCCC] text-[#111111]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[10px] uppercase tracking-wider font-semibold font-mono ${activeFilter === 'verified' ? 'text-white' : 'text-[#777777]'}`}>
              VERIFIED COMPLIANT
            </span>
            <CheckCircle2 className={`h-4 w-4 ${activeFilter === 'verified' ? 'text-white' : 'text-[#111111]'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono mt-2 mb-0.5 ${activeFilter === 'verified' ? 'text-white' : 'text-[#111111]'}`}>
            {findingsCounts.verified}
          </div>
          <span className={`text-[11px] ${activeFilter === 'verified' ? 'text-white/80' : 'text-[#555555]'}`}>100% grounded proof</span>
        </button>
      </div>

      {/* Filtered Findings List View */}
      <div className="space-y-3">
        {/* Contradiction Cards */}
        {(activeFilter === 'all' || activeFilter === 'contradictions') && contradictions.map((con) => (
          <div key={con.id} className="rounded-md border border-[#E5E5E5] bg-[#F7F7F7] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertOctagon className="h-4 w-4 text-[#111111] shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-[#111111]">{con.title}</span>
              </div>
              <span className="text-[10px] uppercase font-mono font-semibold text-[#111111] bg-white border border-[#E5E5E5] px-2 py-0.5 rounded">
                {con.severity}
              </span>
            </div>

            <MarkdownRenderer content={con.explanation} />

            <div className="flex flex-wrap items-center gap-2 text-xs text-[#555555] border-t border-[#E5E5E5] pt-2">
              <span className="text-[#111111] font-medium font-mono text-[11px]">Affected Documents:</span>
              {con.affectedDocuments.map((doc, idx) => (
                <span key={idx} className="bg-white border border-[#E5E5E5] px-2 py-0.5 rounded text-[#111111] text-[11px] font-mono">
                  {doc.documentName} (Page {doc.pageNumber})
                </span>
              ))}
            </div>
          </div>
        ))}

        {/* Missing Evidence Cards */}
        {(activeFilter === 'all' || activeFilter === 'missing') && missingEvidence.map((ev) => (
          <div key={ev.requirementId} className="rounded-md border border-[#E5E5E5] bg-[#F7F7F7] p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#111111] shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-[#111111]">{ev.requirementName}</span>
              </div>
              <span className="text-[10px] uppercase font-mono font-semibold text-[#555555] bg-white border border-[#E5E5E5] px-2 py-0.5 rounded">
                Evidence Not Found
              </span>
            </div>

            <p className="text-xs text-[#555555] italic">
              &ldquo;{ev.sourceExcerpt}&rdquo;
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E5E5] pt-2 text-xs">
              <span className="text-[#555555]">
                <span className="text-[#111111] font-medium">Recommended Action:</span> Upload official {ev.category} credential to Document Vault.
              </span>

              <div className="flex items-center gap-2">
                {onOpenExplain && (
                  <button
                    onClick={() => onOpenExplain(ev)}
                    className="text-[#111111] hover:underline text-xs flex items-center gap-1 font-medium cursor-pointer"
                  >
                    Why? <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Expiring / Non-compliant Criteria */}
        {(activeFilter === 'all' || activeFilter === 'expiring') && expiringOrNonCompliant.map((ev) => (
          <div key={ev.requirementId} className="rounded-md border border-[#E5E5E5] bg-[#F7F7F7] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#111111] shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-[#111111]">{ev.requirementName}</span>
              </div>
              <span className="text-[10px] uppercase font-mono font-semibold text-[#111111] bg-white border border-[#E5E5E5] px-2 py-0.5 rounded">
                Non-Compliant / Deficit
              </span>
            </div>

            <MarkdownRenderer content={ev.explanation.rationale} />

            <div className="flex items-center justify-between border-t border-[#E5E5E5] pt-2 text-xs text-[#555555]">
              <span className="font-mono text-[11px]">Grounding: {ev.matchedDocumentName || 'Vault Dossier'}</span>
              {onOpenEvidence && (
                <button
                  onClick={() => onOpenEvidence(ev)}
                  className="text-[#111111] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                >
                  View Evidence &rarr;
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Verified Criteria */}
        {(activeFilter === 'all' || activeFilter === 'verified') && verifiedCompliant.map((ev) => (
          <div key={ev.requirementId} className="rounded-md border border-[#E5E5E5] bg-[#F7F7F7] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#111111] shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-[#111111]">{ev.requirementName}</span>
              </div>
              <span className="text-[10px] uppercase font-mono font-semibold text-[#111111] bg-white border border-[#E5E5E5] px-2 py-0.5 rounded">
                100% Grounded
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-[#555555]">
              <span className="font-mono text-[11px]">{ev.detectedValue}</span>
              {onOpenEvidence && (
                <button
                  onClick={() => onOpenEvidence(ev)}
                  className="text-[#111111] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                >
                  Inspect Evidence &rarr;
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
