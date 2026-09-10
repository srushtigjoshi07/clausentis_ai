'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export interface AnalysisStageItem {
  id: string;
  label: string;
}

const ORDERED_STAGES: AnalysisStageItem[] = [
  { id: 'reading', label: 'Reading tender document and extracting text layers' },
  { id: 'extracting_clauses', label: 'Extracting clauses and section references' },
  { id: 'identifying_requirements', label: 'Identifying requirements via AI engine' },
  { id: 'classifying', label: 'Classifying requirements into procurement categories' },
  { id: 'matching_evidence', label: 'Matching bidder evidence against company vault' },
  { id: 'contradictions', label: 'Detecting contradictions & checking date validities' },
  { id: 'building_matrix', label: 'Building interactive compliance matrix & transparent score' }
];

export function AnalyzeButton({
  tenderId,
  isReanalyze = false
}: {
  tenderId: string;
  status?: string;
  isReanalyze?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [currentStageId, setCurrentStageId] = useState<string>('reading');
  const [stageMessage, setStageMessage] = useState<string>('Initiating procurement compliance analysis...');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setCurrentStageId('reading');
    setStageMessage('Connecting to Clausentis verification engine...');

    try {
      const response = await fetch(`/api/tenders/${tenderId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || `Analysis failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Streaming response is not supported by browser.');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;

          let eventType = 'message';
          let eventData: Record<string, unknown> = {};

          const blockLines = block.split('\n');
          for (const line of blockLines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              try {
                eventData = JSON.parse(line.slice(6));
              } catch {
                // ignore json error on chunk boundary
              }
            }
          }

          if (eventType === 'progress') {
            const stage = String(eventData.stage || '');
            const label = String(eventData.label || '');
            if (stage) setCurrentStageId(stage);
            if (label) setStageMessage(label);
          } else if (eventType === 'complete') {
            setCurrentStageId('complete');
            setStageMessage('Analysis completed successfully!');
            router.refresh();
            return;
          } else if (eventType === 'error') {
            const err = String(eventData.error || 'AI analysis encountered an error.');
            throw new Error(err);
          }
        }
      }

      // Final refresh on stream close
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during analysis';
      console.error('Analyze error:', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const currentStageIndex = ORDERED_STAGES.findIndex((s) => s.id === currentStageId);
  const activeIdx = currentStageIndex >= 0 ? currentStageIndex : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-lg py-4 font-sans">
        {/* Real-time Backend Processing Tracker */}
        <div className="w-full space-y-4 bg-[#F7F7F7] p-6 rounded-xl border border-[#E5E5E5] text-left shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#111111] flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#111111]" />
              Statutory Processing Pipeline
            </span>
            <span className="text-[11px] font-mono text-[#777777]">
              Stage {activeIdx + 1} of {ORDERED_STAGES.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {ORDERED_STAGES.map((stage, idx) => {
              const isPast = idx < activeIdx;
              const isCurrent = idx === activeIdx;

              return (
                <div key={stage.id} className="flex items-center gap-3 text-xs sm:text-sm">
                  {isPast ? (
                    <CheckCircle2 className="h-4 w-4 text-[#111111] shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 text-[#111111] animate-spin shrink-0" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-[#CCCCCC] ml-1 mr-1 shrink-0" />
                  )}
                  <span
                    className={
                      isCurrent
                        ? 'text-[#111111] font-semibold'
                        : isPast
                        ? 'text-[#555555]'
                        : 'text-[#999999]'
                    }
                  >
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#E5E5E5] text-[11px] text-[#555555] font-mono">
            Status: {stageMessage}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 font-sans">
      <Button
        onClick={handleAnalyze}
        size="lg"
        className="bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm h-11 px-8 gap-2 transition-colors"
      >
        <Sparkles className="h-4 w-4" />
        {isReanalyze ? 'Re-Run Compliance Analysis' : 'Start Document Analysis'}
      </Button>

      {error && (
        <div className="flex flex-col gap-2 max-w-md bg-[#F7F7F7] border border-[#E5E5E5] p-4 rounded-xl text-left mt-3">
          <div className="flex items-center gap-2 text-[#111111] font-semibold text-xs sm:text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Analysis Error</span>
          </div>
          <p className="text-xs text-[#555555] leading-relaxed">{error}</p>
          <div className="pt-1 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              className="text-xs h-7 px-3 bg-white border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] gap-1.5"
            >
              <RefreshCw className="h-3 w-3" /> Retry Analysis
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
