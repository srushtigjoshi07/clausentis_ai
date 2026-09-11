'use client';

import React, { useState } from 'react';
import { Loader2, AlertCircle, FileCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createSignedDecisionPdfDocument } from '@/lib/pdf/signed-decision-pdf-generator';
import { getLatestProcurementDecision } from '@/lib/actions/decisions';
import type { ProcurementDecisionRecord } from '@/types/procurement-decision';
import type { BidderEvaluationDossier } from '@/lib/compliance/types';

interface SignedDecisionPdfButtonProps {
  decision?: ProcurementDecisionRecord | null;
  bidId?: string;
  dossier?: BidderEvaluationDossier | null;
  tenderTitle?: string;
  tenderReference?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  label?: string;
}

export function SignedDecisionPdfButton({
  decision: initialDecision,
  bidId,
  dossier,
  tenderTitle,
  tenderReference,
  variant = 'outline',
  size = 'sm',
  className,
  label = 'Download Signed Decision PDF',
}: SignedDecisionPdfButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setErrorMsg(null);

    try {
      let activeDecision = initialDecision;

      // If decision wasn't provided directly, fetch by bidId
      if (!activeDecision && bidId) {
        const res = await getLatestProcurementDecision(bidId);
        if (res.success && res.decision) {
          activeDecision = res.decision;
        } else {
          throw new Error(res.error || 'No signed decision found for this bid.');
        }
      }

      if (!activeDecision) {
        throw new Error('A signed decision record is required to export the PDF.');
      }

      const doc = createSignedDecisionPdfDocument({
        decision: activeDecision,
        dossier,
        tenderTitle: tenderTitle || dossier?.tenderTitle,
        tenderReference: tenderReference || dossier?.tenderReference,
        tenderOrganisation: activeDecision.organisation || 'Chennai Petroleum Corporation Limited',
      });

      const filename = `Clausentis_Decision_${activeDecision.decision_id || 'RECORD'}.pdf`;
      doc.save(filename);
    } catch (err: unknown) {
      console.error('[SignedDecisionPdfButton] Download failed:', err);
      setErrorMsg((err as Error)?.message || 'Failed to generate PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <Button
        variant={variant}
        size={size}
        onClick={handleDownload}
        disabled={downloading}
        className={`h-8 px-3.5 text-xs gap-1.5 font-medium border-[#E5E5E5] bg-white text-[#111111] hover:bg-[#F7F7F7] rounded-md cursor-pointer transition-colors shadow-xs ${className || ''}`}
      >
        {downloading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#111111]" />
            <span>Generating PDF...</span>
          </>
        ) : (
          <>
            <FileCheck2 className="w-3.5 h-3.5 text-[#111111]" />
            <span>{label}</span>
          </>
        )}
      </Button>

      {errorMsg && (
        <span className="text-[10px] text-[#991B1B] font-mono flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {errorMsg}
        </span>
      )}
    </div>
  );
}
