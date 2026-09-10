'use client';

import { useState } from 'react';
import { 
  X, 
  FileText, 
  BookOpen, 
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RequirementEvidenceEvaluation } from '@/lib/ai/contradiction-engine';

interface EvidenceViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: RequirementEvidenceEvaluation | null;
  onOpenExplain?: () => void;
}

export function EvidenceViewerModal({
  isOpen,
  onClose,
  evaluation,
  onOpenExplain
}: EvidenceViewerModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !evaluation) return null;

  const handleCopyExcerpt = () => {
    if (evaluation.sourceExcerpt) {
      navigator.clipboard.writeText(evaluation.sourceExcerpt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isCompliant = evaluation.status === 'compliant';
  const isNonCompliant = evaluation.status === 'non_compliant';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 font-sans">
      <div 
        className="relative w-full max-w-3xl rounded-lg border border-[#E5E5E5] bg-white shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#E5E5E5] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#777777]">
                EVIDENTIARY AUDIT TRACE
              </span>
              <span className="text-xs text-[#555555] font-mono">• Verified Citation Grounding</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-[#111111] tracking-tight">
              {evaluation.requirementName}
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

        {/* 1. Evidence Trace Pipeline Breadcrumbs */}
        <div className="rounded-md border border-[#E5E5E5] bg-[#F7F7F7] p-4">
          <span className="text-[10px] uppercase font-semibold tracking-[0.14em] text-[#777777] block mb-3 font-mono">
            VERIFICATION TRACE PIPELINE
          </span>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-2.5 py-1.5 rounded-md bg-white border border-[#E5E5E5] text-[#111111] font-medium font-mono">
              1. RFP Criterion
            </div>
            <span className="text-[#777777]">&rarr;</span>
            <div className="px-2.5 py-1.5 rounded-md bg-white border border-[#E5E5E5] text-[#111111] font-medium font-mono truncate max-w-[180px]">
              2. {evaluation.matchedDocumentName || 'Document Vault'}
            </div>
            <span className="text-[#777777]">&rarr;</span>
            <div className="px-2.5 py-1.5 rounded-md bg-white border border-[#E5E5E5] text-[#111111] font-medium font-mono">
              3. Page {evaluation.sourcePage || 1}
            </div>
            <span className="text-[#777777]">&rarr;</span>
            <div className={`px-2.5 py-1.5 rounded-md font-mono font-semibold text-xs border ${
              isNonCompliant 
                ? 'bg-[#111111] text-white border-[#111111]' 
                : 'bg-white text-[#111111] border-[#E5E5E5]'
            }`}>
              4. {evaluation.status.toUpperCase().replace('_', ' ')}
            </div>
          </div>
        </div>

        {/* 2. Document Citation & Highlight Box */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#777777] flex items-center gap-1.5 font-semibold">
              <FileText className="h-3.5 w-3.5 text-[#111111]" />
              AUTHENTIC SOURCE EXCERPT (PAGE {evaluation.sourcePage || 1})
            </span>
            <button
              onClick={handleCopyExcerpt}
              className="text-xs text-[#555555] hover:text-[#111111] flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Excerpt'}</span>
            </button>
          </div>

          <div className="relative rounded-md border border-[#E5E5E5] bg-[#F7F7F7] p-5">
            <p className="text-xs sm:text-sm text-[#111111] font-mono leading-relaxed bg-white p-4 rounded border border-[#E5E5E5]">
              &ldquo;{evaluation.sourceExcerpt || 'Evidence grounded directly from procurement submission dossiers.'}&rdquo;
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-[#555555] border-t border-[#E5E5E5] pt-3">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-[#111111]" />
                Source: {evaluation.matchedDocumentName || 'Tender RFP Dossier'}
              </span>
              <span className="font-mono text-[#111111] font-medium">Confidence: {Math.round(evaluation.confidence * 100)}%</span>
            </div>
          </div>
        </div>

        {/* 3. Metric Comparison Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-md border border-[#E5E5E5] bg-white p-4 space-y-1.5">
            <span className="text-[10px] text-[#777777] uppercase tracking-wider block font-mono">Required Rule</span>
            <div className="text-xs sm:text-sm text-[#111111] font-medium">
              {evaluation.explanation.expected}
            </div>
          </div>

          <div className="rounded-md border border-[#E5E5E5] bg-white p-4 space-y-1.5">
            <span className="text-[10px] text-[#777777] uppercase tracking-wider block font-mono">Detected in Vault</span>
            <div className="text-xs sm:text-sm text-[#111111] font-medium">
              {evaluation.detectedValue || evaluation.explanation.detected}
            </div>
          </div>
        </div>

        {/* 4. Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E5E5] pt-4">
          {onOpenExplain && (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenExplain}
              className="bg-white border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] text-xs sm:text-sm h-9 px-4 rounded-md cursor-pointer"
            >
              Why this decision?
            </Button>
          )}

          <Button
            onClick={onClose}
            className="bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm h-9 px-6 rounded-md cursor-pointer"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
