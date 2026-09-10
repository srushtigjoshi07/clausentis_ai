'use client';

import React, { useState } from 'react';
import { Download, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <Button
        variant={variant}
        size={size}
        onClick={handleExport}
        disabled={loading}
        className={className || "h-8 px-3 text-xs border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] rounded-md bg-white cursor-pointer gap-1.5"}
      >
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#111111]" />
            <span>Generating PDF...</span>
          </>
        ) : (
          <>
            <Download className="w-3.5 h-3.5 text-[#111111]" />
            <span>{label}</span>
          </>
        )}
      </Button>

      {/* Inline Feedback Toast */}
      {message && (
        <div
          className={`absolute top-full mt-2 right-0 z-50 flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs shadow-md whitespace-nowrap animate-in fade-in duration-200 ${
            message.type === 'success'
              ? 'bg-white text-[#111111] border-[#E5E5E5]'
              : 'bg-[#FFF5F5] text-[#991B1B] border-[#FCA5A5]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#111111]" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-[#991B1B]" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}
    </div>
  );
}
