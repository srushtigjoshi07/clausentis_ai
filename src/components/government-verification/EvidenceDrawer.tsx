'use client';

/**
 * Government Verification Evidence Drawer
 *
 * Slide-over drawer modal displaying audit-grade evidence for a statutory verification:
 * - Field-by-field side-by-side comparison (Document Value vs Government Registry Value)
 * - Source registry, verified timestamp, and official verification badges
 * - Actions to view source or view submitted document proof
 */

import React from 'react';
import type { GovVerificationResult } from '@/lib/verification/types';
import { X, CheckCircle2, XCircle, AlertTriangle, ExternalLink, FileText, Clock, Building } from 'lucide-react';
import { SourceBadge } from './SourceBadge';
import { VerificationStatus } from './VerificationStatus';

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  result: GovVerificationResult | null;
}

export function EvidenceDrawer({ isOpen, onClose, result }: EvidenceDrawerProps) {
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl border-l border-[#E5E5E5] flex flex-col animate-in slide-in-from-right duration-200">
          
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-[#E5E5E5] flex items-center justify-between bg-[#FAFAFA]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#111111] bg-white px-2 py-0.5 rounded border border-[#E5E5E5]">
                  AUDIT EVIDENCE DOSSIER
                </span>
                <SourceBadge sourceType={result.sourceType} />
              </div>
              <h2 className="text-lg font-semibold text-[#111111] mt-1 flex items-center gap-2">
                <Building className="w-4 h-4 text-[#555555]" />
                {result.source}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#777777] hover:text-[#111111] hover:bg-[#F0F0F0] transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5 stroke-[1.5]" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
            {/* Status Summary Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-lg border bg-[#FAFAFA] border-[#E5E5E5]">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#777777] block">Verification Outcome</span>
                <div className="mt-1">
                  <VerificationStatus status={result.status} size="md" />
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-[#777777] block">Identifier Queried</span>
                <span className="font-mono text-xs font-bold text-[#111111] mt-1 block">{result.identifier}</span>
              </div>
            </div>

            {/* Explanation Message */}
            {result.message && (
              <p className="text-xs text-[#555555] leading-relaxed p-3 rounded-lg bg-[#FAFAFA] border border-[#EEEEEE]">
                {result.message}
              </p>
            )}

            {/* Field-by-Field Evidence Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
                  Field Comparison Evidence
                </h3>
                <span className="text-[10px] font-mono text-[#777777]">
                  {result.fields.filter(f => f.match).length}/{result.fields.length} MATCHED
                </span>
              </div>

              <div className="rounded-lg border border-[#E5E5E5] overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7F7F7] border-b border-[#E5E5E5] font-mono text-[10px] uppercase text-[#777777]">
                      <th className="py-2.5 px-3 font-semibold">Statutory Field</th>
                      <th className="py-2.5 px-3 font-semibold">Submitted Value</th>
                      <th className="py-2.5 px-3 font-semibold">Govt Record</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F0F0]">
                    {result.fields.map((f, idx) => (
                      <tr key={idx} className={!f.match ? 'bg-[#FFFDF5]' : 'hover:bg-[#FAFAFA]'}>
                        <td className="py-2.5 px-3 font-medium text-[#111111] text-[11px]">
                          {f.fieldLabel}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#555555] break-all">
                          {f.documentValue || '—'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-[#111111] break-all">
                          {f.governmentValue || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {f.match ? (
                            <span className="inline-flex items-center gap-1 font-mono font-semibold text-[10px] text-[#065F46] bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-[#A7F3D0]">
                              <CheckCircle2 className="w-3 h-3" /> MATCH
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-mono font-bold text-[10px] text-[#DC2626] bg-[#FEF2F2] px-1.5 py-0.5 rounded border border-[#FECACA]">
                              <XCircle className="w-3 h-3" /> MISMATCH
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Registry Metadata Evidence */}
            {result.evidence && result.evidence.length > 0 && (
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111] mb-3">
                  Registry Metadata Records
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {result.evidence.map((item, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA]">
                      <span className="text-[9px] font-mono uppercase text-[#777777] block">{item.label}</span>
                      <span className="text-xs font-medium text-[#111111] mt-0.5 block break-words">{item.value || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit & Legal Defensibility Notice */}
            <div className="p-3.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] space-y-2">
              <div className="flex items-center gap-2 text-[#111111] text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-[#555555]" />
                Audit Trail Information
              </div>
              <p className="text-[11px] text-[#777777] leading-relaxed">
                Checked at <strong className="text-[#111111] font-mono">{result.checkedAt}</strong> via{' '}
                <strong className="text-[#111111]">{result.source}</strong> ({result.sourceType}).
                Under SIH26100 audit guidelines, discrepancies are preserved in the permanent tender record.
              </p>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] text-xs font-medium text-[#111111] transition-colors cursor-pointer"
            >
              Close
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => alert(`Simulating navigation to official statutory portal for ${result.source}`)}
                className="px-3.5 py-2 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] text-xs font-medium text-[#555555] hover:text-[#111111] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>View Source</span>
              </button>
              <button
                type="button"
                onClick={() => alert(`Simulating opening original submitted document for ${result.identifier}`)}
                className="px-3.5 py-2 rounded-lg bg-[#111111] hover:bg-[#222222] text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Document</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
