'use client';

import { 
  X, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Scale, 
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { RequirementEvidenceEvaluation } from '@/lib/ai/contradiction-engine';

interface ExplainabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: RequirementEvidenceEvaluation | null;
}

export function ExplainabilityModal({ isOpen, onClose, evaluation }: ExplainabilityModalProps) {
  if (!isOpen || !evaluation) return null;

  const isCompliant = evaluation.status === 'compliant';
  const isNonCompliant = evaluation.status === 'non_compliant';
  const isMissing = evaluation.status === 'missing_evidence';
  const isReview = evaluation.status === 'needs_review' || evaluation.status === 'partially_compliant';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 font-sans">
      <div 
        className="relative w-full max-w-2xl rounded-lg border border-[#E5E5E5] bg-white shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E5E5E5] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#777777]">
                AI DECISION EXPLAINABILITY
              </span>
              <span className="text-xs text-[#555555] font-mono">• {Math.round(evaluation.confidence * 100)}% Confidence</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-[#111111] tracking-tight">
              Why was this decision reached?
            </h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-[#777777] hover:text-[#111111] hover:bg-[#F7F7F7] rounded-md cursor-pointer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Requirement Badge & Status */}
        <div className="rounded-md border border-[#E5E5E5] bg-[#F7F7F7] p-4 flex items-center justify-between">
          <div className="space-y-1 pr-4">
            <span className="text-[10px] uppercase font-semibold text-[#777777] tracking-wider font-mono">
              {evaluation.category} CRITERION
            </span>
            <h4 className="text-sm sm:text-base font-semibold text-[#111111]">{evaluation.requirementName}</h4>
          </div>
          <div className={`px-3 py-1 rounded text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5 shrink-0 ${
            isCompliant ? 'bg-white text-[#111111] border border-[#E5E5E5]' :
            isNonCompliant ? 'bg-[#111111] text-white border border-[#111111]' :
            isMissing ? 'bg-white text-[#777777] border border-[#E5E5E5]' :
            'bg-white text-[#555555] border border-[#CCCCCC]'
          }`}>
            {isCompliant && <CheckCircle2 className="h-3.5 w-3.5" />}
            {isNonCompliant && <XCircle className="h-3.5 w-3.5" />}
            {isMissing && <HelpCircle className="h-3.5 w-3.5" />}
            {isReview && <AlertTriangle className="h-3.5 w-3.5" />}
            <span>{evaluation.explanation.decision}</span>
          </div>
        </div>

        {/* Comparison Logic Box */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-md border border-[#E5E5E5] bg-white p-4 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#777777] flex items-center gap-1.5 font-semibold">
              <Scale className="h-3.5 w-3.5 text-[#111111]" />
              RFP REQUIRED THRESHOLD
            </span>
            <div className="text-sm font-normal text-[#111111] bg-[#F7F7F7] p-3 rounded-md border border-[#E5E5E5]">
              {evaluation.explanation.expected}
            </div>
            <p className="text-xs text-[#555555]">
              Extracted from official tender qualification rules.
            </p>
          </div>

          <div className="rounded-md border border-[#E5E5E5] bg-white p-4 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#777777] flex items-center gap-1.5 font-semibold">
              <FileText className="h-3.5 w-3.5 text-[#111111]" />
              DETECTED VAULT EVIDENCE
            </span>
            <div className={`text-sm font-normal p-3 rounded-md border ${
              isNonCompliant 
                ? 'text-[#111111] bg-[#F7F7F7] border-[#111111] font-semibold' 
                : 'text-[#111111] bg-[#F7F7F7] border-[#E5E5E5]'
            }`}>
              {evaluation.explanation.detected}
            </div>
            <p className="text-xs text-[#555555]">
              {evaluation.matchedDocumentName ? `Grounding: ${evaluation.matchedDocumentName}` : 'No matching company record'}
            </p>
          </div>
        </div>

        {/* Exact Citation Grounding */}
        <div className="rounded-md border border-[#E5E5E5] bg-white p-4 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#777777] flex items-center gap-1.5 font-semibold">
            <BookOpen className="h-3.5 w-3.5 text-[#111111]" />
            TENDER CITATION GROUNDING
          </span>
          <div className="text-xs text-[#555555] italic bg-[#F7F7F7] p-3 rounded-md border border-[#E5E5E5] leading-relaxed">
            {evaluation.explanation.citation}
          </div>
        </div>

        {/* AI Rationale & Actionable Advice */}
        <div className="rounded-md border border-[#E5E5E5] bg-[#F7F7F7] p-4 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#111111] font-semibold block">
            EVALUATION RATIONALE
          </span>
          <MarkdownRenderer content={evaluation.explanation.rationale} />
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button 
            onClick={onClose}
            className="bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm h-9 px-6 rounded-md cursor-pointer"
          >
            Acknowledge & Close
          </Button>
        </div>
      </div>
    </div>
  );
}
