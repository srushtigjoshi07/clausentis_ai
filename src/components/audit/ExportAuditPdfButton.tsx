'use client';

import React, { useState } from 'react';
import { Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getAuditEventsForExport } from '@/lib/actions/audit';
import { downloadAuditPdf, AuditPdfOptions } from '@/lib/pdf/audit-pdf-generator';

interface ExportAuditPdfButtonProps {
  tenderId?: string;
  tenderRef?: string;
  tenderTitle?: string;
  bidId?: string;
  bidderCompanyName?: string;
  variant?: 'default' | 'outline';
  size?: 'sm' | 'default';
  className?: string;
  label?: string;
  documentType?: string;
}

export function ExportAuditPdfButton({
  tenderId,
  tenderRef,
  tenderTitle,
  bidId,
  bidderCompanyName,
  variant = 'outline',
  size = 'sm',
  className,
  label = 'Export Audit PDF',
  documentType,
}: ExportAuditPdfButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // 1. Fetch audit events from server with permission verification
      const payload = await getAuditEventsForExport({
        tenderId,
        tenderRef,
        bidId,
        bidderCompanyName,
      });

      if (!payload.success) {
        console.error('[ExportAuditPDF] Server permission/fetch failure:', payload.error);
        setMessage({
          type: 'error',
          text: payload.error || 'Unable to export audit PDF. Please try again.',
        });
        setLoading(false);
        return;
      }

      // 2. Prepare options
      const options: AuditPdfOptions = {
        tenderTitle: tenderTitle || payload.tenderTitle || 'Procurement Tender',
        tenderReference: tenderRef || payload.tenderReference,
        bidderName: bidderCompanyName || payload.bidderName,
        bidderGstin: payload.bidderGstin,
        identifier: bidId || payload.identifier || tenderRef || 'audit',
        records: payload.records || [],
        dossier: payload.dossier,
        documentType: documentType || 'audit',
      };

      // 3. Generate and trigger download
      const result = await downloadAuditPdf(options);

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Audit PDF exported successfully.',
        });
      } else {
        console.error('[ExportAuditPDF] Generation failure:', result.error);
        setMessage({
          type: 'error',
          text: 'Unable to export audit PDF. Please try again.',
        });
      }
    } catch (err: unknown) {
      console.error('[ExportAuditPDF] Unexpected export error:', err);
      setMessage({
        type: 'error',
        text: 'Unable to export audit PDF. Please try again.',
      });
    } finally {
      setLoading(false);
      // Clear toast message after 4 seconds
      setTimeout(() => {
        setMessage(null);
      }, 4000);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className={className || (variant === 'default' ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm')}
        data-size={size}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Download className="h-3.5 w-3.5" aria-hidden="true" />}
        <span>{loading ? 'Generating PDF…' : label}</span>
      </button>
      <span role="status" aria-live="polite" className="sr-only-v2">{message?.text ?? ''}</span>
      {message && (
        <div
          className={`absolute right-0 top-full z-50 mt-2 flex items-center gap-2 whitespace-nowrap rounded-md border px-3 py-1.5 text-xs shadow-md ${
            message.type === 'success' ? 'border-line bg-white text-fg' : 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]'
          }`}
          aria-hidden="true"
        >
          {message.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5 text-pass" /> : <AlertCircle className="h-3.5 w-3.5" />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}
    </div>
  );
}
