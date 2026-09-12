'use client';

/**
 * Clausentis Government Record Cross-Verification Card
 *
 * Renders deterministic, field-by-field verification results comparing
 * submitted bidder documents against official government registries.
 * Truthfully labels source mode (DEMO / SANDBOX vs LIVE / OFFICIAL PORTAL).
 */

import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  Building,
  CheckCircle2,
} from 'lucide-react';
import type { GovernmentRecordComparisonResult } from '@/lib/providers/types';

interface GovernmentVerificationCardProps {
  verification: GovernmentRecordComparisonResult;
  className?: string;
  compact?: boolean;
}

export function GovernmentVerificationCard({
  verification,
  className = '',
  compact = false,
}: GovernmentVerificationCardProps) {
  const {
    providerName,
    verificationMode,
    status,
    identifierQueried,
    statusMessage,
    fieldComparisons,
    verifiedAt,
    sourceReference,
  } = verification;

  // Source mode badge styling
  const modeBadge =
    verificationMode === 'LIVE_AUTHORIZED' ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#111111] text-white border border-[#111111] font-semibold tracking-wider">
        AUTHORIZED LIVE API
      </span>
    ) : verificationMode === 'OFFICIAL_PORTAL_MANUAL' ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#F7F7F7] text-[#111111] border border-[#CCCCCC] font-semibold tracking-wider">
        OFFICIAL PORTAL / MANUAL
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#F0F0F0] text-[#111111] border border-[#CCCCCC] font-semibold tracking-wider">
        DEMO / SANDBOX VERIFICATION
      </span>
    );

  // Overall status banner styling
  const renderStatusBanner = () => {
    switch (status) {
      case 'MATCH':
        return (
          <div className="flex items-center justify-between p-3 rounded-md bg-[#F7F7F7] border border-[#111111] text-[#111111]">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-[#111111] shrink-0 stroke-[2]" />
              <span className="text-xs font-mono font-bold tracking-wide uppercase">
                ✓ GOVERNMENT RECORD MATCH
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#555555] uppercase">
              ALL FIELDS CONFIRMED
            </span>
          </div>
        );
      case 'MISMATCH':
        return (
          <div className="flex items-center justify-between p-3 rounded-md bg-[#FFFBEB] border border-[#F59E0B] text-[#92400E]">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 text-[#D97706] shrink-0 stroke-[2]" />
              <span className="text-xs font-mono font-bold tracking-wide uppercase">
                ⚠ GOVERNMENT RECORD MISMATCH
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#B45309] uppercase">
              FIELD DISCREPANCIES DETECTED
            </span>
          </div>
        );
      case 'NOT_FOUND':
        return (
          <div className="flex items-center justify-between p-3 rounded-md bg-[#FEF2F2] border border-[#EF4444] text-[#991B1B]">
            <div className="flex items-center gap-2.5">
              <XCircle className="h-4 w-4 text-[#DC2626] shrink-0 stroke-[2]" />
              <span className="text-xs font-mono font-bold tracking-wide uppercase">
                ❌ GOVERNMENT RECORD NOT FOUND
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#B91C1C] uppercase">
              NOT REGISTERED
            </span>
          </div>
        );
      case 'INACTIVE':
        return (
          <div className="flex items-center justify-between p-3 rounded-md bg-[#FEF2F2] border border-[#EF4444] text-[#991B1B]">
            <div className="flex items-center gap-2.5">
              <XCircle className="h-4 w-4 text-[#DC2626] shrink-0 stroke-[2]" />
              <span className="text-xs font-mono font-bold tracking-wide uppercase">
                ❌ GOVERNMENT STATUS MISMATCH / INACTIVE
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#B91C1C] uppercase">
              CANCELLED / SUSPENDED
            </span>
          </div>
        );
      case 'EXPIRED':
        return (
          <div className="flex items-center justify-between p-3 rounded-md bg-[#FEF2F2] border border-[#EF4444] text-[#991B1B]">
            <div className="flex items-center gap-2.5">
              <XCircle className="h-4 w-4 text-[#DC2626] shrink-0 stroke-[2]" />
              <span className="text-xs font-mono font-bold tracking-wide uppercase">
                ❌ CERTIFICATE EXPIRED
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#B91C1C] uppercase">
              VALIDITY LAPSED
            </span>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-between p-3 rounded-md bg-[#F7F7F7] border border-[#777777] text-[#333333]">
            <div className="flex items-center gap-2.5">
              <HelpCircle className="h-4 w-4 text-[#555555] shrink-0 stroke-[2]" />
              <span className="text-xs font-mono font-bold tracking-wide uppercase">
                ⚠ UNABLE TO VERIFY — HUMAN REVIEW REQUIRED
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#777777] uppercase">
              INCONCLUSIVE
            </span>
          </div>
        );
    }
  };

  return (
    <div
      className={`rounded-lg border border-[#E5E5E5] bg-white p-4 sm:p-5 space-y-4 shadow-2xs font-sans ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5E5E5] gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#111111] shrink-0" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
            GOVERNMENT RECORD VERIFICATION
          </h4>
        </div>
        <div>{modeBadge}</div>
      </div>

      {/* Provider & Query Context */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FAFAFA] p-3 rounded-md border border-[#EEEEEE]">
        <div>
          <span className="text-[10px] font-mono uppercase text-[#777777] block">
            Statutory Provider
          </span>
          <span className="font-semibold text-[#111111] flex items-center gap-1.5 mt-0.5">
            <Building className="h-3.5 w-3.5 text-[#555555]" />
            {providerName}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase text-[#777777] block">
            Identifier Queried
          </span>
          <span className="font-mono text-xs text-[#111111] font-semibold mt-0.5 block">
            {identifierQueried}
          </span>
        </div>
      </div>

      {/* Field-by-Field Comparison Table */}
      {fieldComparisons && fieldComparisons.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E5E5E5] text-[10px] font-mono uppercase text-[#777777]">
                <th className="py-2 px-2.5 font-semibold">Statutory Field</th>
                {!compact && <th className="py-2 px-2.5 font-semibold">Submitted Document</th>}
                <th className="py-2 px-2.5 font-semibold">Government Registry</th>
                <th className="py-2 px-2.5 font-semibold text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {fieldComparisons.map((item, idx) => (
                <tr
                  key={idx}
                  className={`hover:bg-[#FAFAFA] transition-colors ${
                    item.status === 'MISMATCH' ? 'bg-[#FFFDF5]' : ''
                  }`}
                >
                  <td className="py-2 px-2.5 font-medium text-[#111111]">
                    {item.fieldLabel}
                  </td>
                  {!compact && (
                    <td className="py-2 px-2.5 text-[#555555] font-mono text-[11px] break-all">
                      {item.submittedValue || '—'}
                    </td>
                  )}
                  <td className="py-2 px-2.5 text-[#111111] font-mono text-[11px] font-medium break-all">
                    {item.governmentValue || '—'}
                  </td>
                  <td className="py-2 px-2.5 text-right whitespace-nowrap">
                    {item.status === 'MATCH' ? (
                      <span className="inline-flex items-center gap-1 font-mono font-semibold text-[10px] text-[#111111] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E0E0E0]">
                        ✓ MATCH
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-[10px] text-[#DC2626] bg-[#FEF2F2] px-2 py-0.5 rounded border border-[#FECACA]">
                        ✗ MISMATCH
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Result Box */}
      <div className="space-y-2">
        <span className="text-[10px] font-mono uppercase text-[#777777] tracking-wider block">
          VERIFICATION OUTCOME
        </span>
        {renderStatusBanner()}
        <p className="text-[11px] text-[#555555] leading-relaxed pt-0.5">
          {statusMessage}
        </p>
      </div>

      {/* Footer / Defensibility Note */}
      <div className="pt-3 border-t border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-[#777777] font-mono gap-1">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-[#999999]" />
          <span>Verified: {verifiedAt}</span>
        </div>
        <span className="truncate max-w-xs sm:max-w-sm text-right" title={sourceReference}>
          {sourceReference}
        </span>
      </div>
    </div>
  );
}
