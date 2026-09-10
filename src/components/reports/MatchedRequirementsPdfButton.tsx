'use client';

import React, { useState } from 'react';
import { Download, Bookmark, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMatchedRequirementsPayload, saveMatchedRequirementsReport } from '@/lib/actions/matched-requirements';
import { downloadMatchedRequirementsPdf } from '@/lib/pdf/matched-requirements-pdf-generator';

interface MatchedRequirementsPdfButtonProps {
  tenderId?: string;
  bidId?: string;
  bidderCompanyName?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  label?: string;
  showSaveButton?: boolean;
}

export function MatchedRequirementsPdfButton({
  tenderId,
  bidId,
  bidderCompanyName,
  variant = 'outline',
  size = 'sm',
  className,
  label = 'Matched Requirements PDF',
  showSaveButton = false,
}: MatchedRequirementsPdfButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
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
          text: payload.error || 'Failed to load evaluation dossier.',
        });
        setDownloading(false);
        return;
      }

      const result = await downloadMatchedRequirementsPdf({
        dossier: payload.dossier,
        role: payload.role || 'bidder',
        userFullName: payload.userFullName,
        userOrgName: payload.userOrgName,
      });

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Matched Requirements PDF downloaded.',
        });
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Unable to generate PDF.',
        });
      }
    } catch (err: unknown) {
      console.error('[MatchedReqButton] Export error:', err);
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred while generating PDF.',
      });
    } finally {
      setDownloading(false);
      setTimeout(() => setMessage(null), 4000);
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
