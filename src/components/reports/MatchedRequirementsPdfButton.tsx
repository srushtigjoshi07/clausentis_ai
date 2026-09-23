'use client';

import React, { useState } from 'react';
import { Download, Bookmark, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  getMatchedRequirementsPayload, 
  getMultiBidderComparisonPayload, 
  saveMatchedRequirementsReport 
} from '@/lib/actions/matched-requirements';
import { downloadMatchedRequirementsPdf } from '@/lib/pdf/matched-requirements-pdf-generator';
import { downloadMultiBidderMatchedRequirementsPdf } from '@/lib/pdf/multi-bidder-matched-requirements-pdf-generator';
import { BidderEvaluationDossier } from '@/lib/compliance/types';
import { generatePdfFilename, triggerServerPdfDownload } from '@/lib/pdf/pdf-download-helper';

interface MatchedRequirementsPdfButtonProps {
  tenderId?: string;
  tenderTitle?: string;
  tenderRef?: string;
  tenderAuthority?: string;
  bidId?: string;
  bidderCompanyName?: string;
  isMultiBidder?: boolean;
  dossiers?: BidderEvaluationDossier[];
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  label?: string;
  showSaveButton?: boolean;
  documentType?: 'matched-requirements' | 'compliance-report';
}

export function MatchedRequirementsPdfButton({
  tenderId,
  tenderTitle,
  tenderRef,
  tenderAuthority,
  bidId,
  bidderCompanyName,
  isMultiBidder = false,
  dossiers,
  variant = 'outline',
  size = 'sm',
  className,
  label = 'Matched Requirements PDF',
  showSaveButton = false,
  documentType = 'matched-requirements',
}: MatchedRequirementsPdfButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setMessage(null);

    try {
      // 1. MULTI-BIDDER PATH (Use robust server streaming route with Content-Disposition)
      if (isMultiBidder) {
        const effectiveTenderId = tenderId || 'tender-cpcl-2026-0412';
        const expectedFilename = generatePdfFilename('matched-requirements', tenderRef || 'CPCL/ENG/2026/HPGC-0412');
        triggerServerPdfDownload(`/api/pdf/download?type=matched-requirements&tenderId=${effectiveTenderId}`, expectedFilename);
        setMessage({
          type: 'success',
          text: `Downloaded ${expectedFilename}.`,
        });
        return;
      }

      // 2. SINGLE-BIDDER PATH
      const docType = documentType === 'compliance-report' ? 'compliance-report' : 'single-matched-requirements';
      const expectedFilename = generatePdfFilename(documentType || 'matched-requirements', bidderCompanyName || bidId || 'bidder');
      triggerServerPdfDownload(`/api/pdf/download?type=${docType}&tenderId=${tenderId || ''}&bidId=${bidId || ''}`, expectedFilename);
      setMessage({
        type: 'success',
        text: `Downloaded ${expectedFilename}.`,
      });
      return;
    } catch (err: unknown) {
      console.error('[MatchedReqButton] Export error:', err);
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred while generating PDF.',
      });
    } finally {
      setDownloading(false);
      setTimeout(() => setMessage(null), 4500);
    }
  };

  const handleSaveReport = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const payload = await getMatchedRequirementsPayload({
        tenderId,
        bidId,
        bidderCompanyName,
      });

      if (!payload.success || !payload.dossier) {
        setMessage({
          type: 'error',
          text: payload.error || 'Unable to save report.',
        });
        setSaving(false);
        return;
      }

      const saveRes = await saveMatchedRequirementsReport({
        tenderId: payload.dossier.tenderId,
        bidId: payload.dossier.bidId,
        bidderName: payload.dossier.bidderName,
      });

      if (saveRes.success) {
        setMessage({
          type: 'success',
          text: 'Report recorded into immutable audit vault.',
        });
      } else {
        setMessage({
          type: 'error',
          text: saveRes.error || 'Failed to save report.',
        });
      }
    } catch (err: unknown) {
      console.error('[MatchedReqButton] Save error:', err);
      setMessage({
        type: 'error',
        text: 'Failed to record report.',
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      <Button
        variant={variant}
        size={size}
        onClick={handleDownload}
        disabled={downloading || saving}
        className={`inline-flex items-center gap-1.5 font-medium transition-colors ${className || ''}`}
      >
        {downloading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span>{label}</span>
      </Button>

      {showSaveButton && (
        <Button
          variant="outline"
          size={size}
          onClick={handleSaveReport}
          disabled={downloading || saving}
          className="inline-flex items-center gap-1.5 font-medium text-[#555555] hover:text-[#111111]"
          title="Save Report to Immutable Audit Trail"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Bookmark className="w-3.5 h-3.5" />
          )}
          <span>Save Report</span>
        </Button>
      )}

      {/* Floating Status Toast */}
      {message && (
        <div
          className={`absolute top-full mt-1.5 left-0 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium shadow-md border animate-in fade-in slide-in-from-top-1 whitespace-nowrap ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
}
