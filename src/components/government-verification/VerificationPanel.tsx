'use client';

/**
 * VerificationPanel — Collapsible panel for a single connector's result
 */

import React, { useState } from 'react';
import type { GovVerificationResult } from '@/lib/verification/types';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { VerificationStatus } from './VerificationStatus';
import { SourceBadge } from './SourceBadge';
import { FieldComparison } from './FieldComparison';
import { EvidenceViewer } from './EvidenceViewer';

interface VerificationPanelProps {
  result: GovVerificationResult;
  defaultExpanded?: boolean;
  onViewEvidence?: (result: GovVerificationResult) => void;
  className?: string;
}

/** Connector ID to display name mapping */
const CONNECTOR_NAMES: Record<string, string> = {
  udyam: 'Udyam Registration (Ministry of MSME)',
  gst: 'GST Network (GSTN)',
  mca: 'MCA21 Corporate Registry',
  digilocker: 'DigiLocker / EntityLocker Protocol',
  pan: 'Income Tax Department (CBDT PAN)',
  blacklisting: 'CVC & GeM Debarment Index',
  epfo: 'EPFO & ESIC Labour Compliance',
  startup_india: 'Startup India (DPIIT)',
};

export function VerificationPanel({
  result,
  defaultExpanded = false,
  onViewEvidence,
  className = '',
}: VerificationPanelProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const displayName = CONNECTOR_NAMES[result.connectorId] || result.source;

  return (
    <div
      className={`rounded-lg border border-[#E5E5E5] bg-white overflow-hidden shadow-2xs ${className}`}
    >
      {/* Header — always visible */}
      <div
        className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer hover:bg-[#FAFAFA] transition-colors select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-medium text-[#111111] text-sm">{displayName}</h3>
            <SourceBadge sourceType={result.sourceType} />
          </div>
          <div className="font-mono text-[11px] text-[#555555]">
            Identifier: <span className="font-semibold text-[#111111]">{result.identifier}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewEvidence?.(result);
            }}
            className="cursor-pointer hover:opacity-85 transition-opacity"
            title="Click to open full audit evidence drawer"
          >
            <VerificationStatus status={result.status} />
          </button>
          {expanded ? (
            <ChevronUp size={16} className="text-[#777777] shrink-0" />
          ) : (
            <ChevronDown size={16} className="text-[#777777] shrink-0" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="p-4 sm:p-5 border-t border-[#E5E5E5] bg-white space-y-5">
          {/* Message */}
          {result.message && (
            <p className="text-[11px] text-[#555555] bg-[#FAFAFA] p-3 rounded-md border border-[#EEEEEE] leading-relaxed">
              {result.message}
            </p>
          )}

          {/* Field Comparison Table */}
          {result.fields && result.fields.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-mono text-[10px] uppercase tracking-wider text-[#777777] font-semibold">
                FIELD-BY-FIELD COMPARISON
              </h4>
              <FieldComparison fields={result.fields} />
            </div>
          )}

          {/* Evidence */}
          {result.evidence && result.evidence.length > 0 && (
            <EvidenceViewer
              evidence={result.evidence}
              source={result.source}
              checkedAt={result.checkedAt}
            />
          )}

          {/* Action to open drawer */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => onViewEvidence?.(result)}
              className="text-xs font-medium text-[#111111] hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <span>Open Side-by-Side Audit Drawer &rarr;</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
