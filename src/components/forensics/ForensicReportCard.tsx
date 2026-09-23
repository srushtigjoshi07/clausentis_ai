'use client';

/**
 * Clausentis Document Forensics Findings Card
 *
 * Renders structured technical forensic checks:
 * - PDF Structure, Headers & EOF Markers
 * - Revision count and incremental update detection
 * - Generator / Producer software metadata
 * - Embedded PKCS#7 digital signature streams
 * - Explicit separation of confidence from severity
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  FileCode,
  FileWarning,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  Info,
} from 'lucide-react';
import type { DocumentForensicReport, ForensicFinding } from '@/lib/forensics/types';

interface ForensicReportCardProps {
  report: DocumentForensicReport;
  className?: string;
  compact?: boolean;
}

export function ForensicReportCard({
  report,
  className = '',
  compact = false,
}: ForensicReportCardProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);

  const {
    fileName,
    sha256Checksum,
    overallStatus,
    overallSeverity,
    findings,
    hasDigitalSignature,
    revisionCount,
    producerTool,
    summary,
    engineVersion,
    analyzedAt,
  } = report;

  const statusBadge =
    overallStatus === 'PASS' ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F7F7F7] text-[#111111] border border-[#CCCCCC]">
        <CheckCircle2 className="w-3 h-3 text-[#111111]" />
        CLEAN FORENSICS
      </span>
    ) : overallStatus === 'SUSPICIOUS' ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
        <AlertTriangle className="w-3 h-3 text-[#B45309]" />
        FORENSIC NOTICES ({overallSeverity} SEVERITY)
      </span>
    ) : overallStatus === 'WARNING' ? (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#F7F7F7] text-[#555555] border border-[#E5E5E5]">
        <Info className="w-3 h-3 text-[#555555]" />
        TECHNICAL WARNINGS
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
        <FileWarning className="w-3 h-3 text-[#991B1B]" />
        STRUCTURAL ANOMALY
      </span>
    );

  return (
    <div className={`rounded-lg border border-[#E5E5E5] bg-white shadow-xs overflow-hidden font-sans ${className}`}>
      {/* Top Bar */}
      <div
        className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-[#FAFAFA] transition-colors border-b border-[#E5E5E5]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] shrink-0 mt-0.5 sm:mt-0">
            <Fingerprint className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-semibold text-[#111111]">{fileName}</h4>
              <span className="text-[10px] font-mono text-[#777777]">
                SHA-256: {sha256Checksum ? `${sha256Checksum.substring(0, 10)}...${sha256Checksum.substring(sha256Checksum.length - 8)}` : 'N/A'}
              </span>
            </div>
            <p className="text-[11px] text-[#555555] mt-0.5">{summary}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {statusBadge}
          <button
            type="button"
            className="text-[#777777] hover:text-[#111111] transition-colors p-1"
            aria-label="Toggle forensic details"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4 bg-white">
          {/* Metadata Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
            <div className="p-2.5 rounded bg-[#F7F7F7] border border-[#E5E5E5]">
              <span className="text-[10px] text-[#777777] uppercase block">Revision Streams</span>
              <span className="font-semibold text-[#111111] mt-0.5 block">
                {revisionCount} {revisionCount === 1 ? '(Single)' : '(Incremental Update)'}
              </span>
            </div>

            <div className="p-2.5 rounded bg-[#F7F7F7] border border-[#E5E5E5]">
              <span className="text-[10px] text-[#777777] uppercase block">Digital Signature</span>
              <span className="font-semibold text-[#111111] mt-0.5 block">
                {hasDigitalSignature ? 'PKCS#7 Detected' : 'Not Embedded'}
              </span>
            </div>

            <div className="p-2.5 rounded bg-[#F7F7F7] border border-[#E5E5E5] col-span-2">
              <span className="text-[10px] text-[#777777] uppercase block">Generator / Producer</span>
              <span className="font-semibold text-[#111111] mt-0.5 block truncate">
                {producerTool || 'Standard Institutional PDF Engine'}
              </span>
            </div>
          </div>

          {/* Detailed Forensic Findings Table */}
          <div className="space-y-2">
            <h5 className="text-[11px] font-mono uppercase tracking-wider text-[#777777] font-semibold">
              Structural &amp; Integrity Analysis Checks
            </h5>

            <div className="rounded border border-[#E5E5E5] overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                <thead className="bg-[#F7F7F7] border-b border-[#E5E5E5] text-[10px] font-mono uppercase text-[#777777]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Forensic Check</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Severity</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Confidence</th>
                    <th className="py-2.5 px-3 font-semibold">Diagnostic Observation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {findings.map((finding) => (
                    <tr key={finding.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="py-2.5 px-3 font-medium text-[#111111] align-top">
                        <div className="font-mono text-xs">{finding.checkLabel}</div>
                        <div className="text-[10px] text-[#777777] font-mono mt-0.5">{finding.check}</div>
                      </td>

                      <td className="py-2.5 px-3 text-center align-top">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                            finding.status === 'PASS'
                              ? 'bg-[#F7F7F7] text-[#111111] border-[#CCCCCC]'
                              : finding.status === 'SUSPICIOUS'
                              ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                              : finding.status === 'WARNING'
                              ? 'bg-[#F7F7F7] text-[#555555] border-[#E5E5E5]'
                              : finding.status === 'NOT_AVAILABLE'
                              ? 'bg-white text-[#888888] border-[#E5E5E5]'
                              : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                          }`}
                        >
                          {finding.status}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center align-top">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            finding.severity === 'CRITICAL'
                              ? 'text-[#991B1B]'
                              : finding.severity === 'HIGH'
                              ? 'text-[#B45309]'
                              : finding.severity === 'MEDIUM'
                              ? 'text-[#444444]'
                              : 'text-[#777777]'
                          }`}
                        >
                          {finding.severity}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center align-top font-mono text-[11px] text-[#555555]">
                        {Math.round(finding.confidence * 100)}%
                      </td>

                      <td className="py-2.5 px-3 text-[#555555] align-top leading-relaxed text-[11px]">
                        {finding.explanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full SHA-256 Digest Bar */}
          <div className="p-2.5 rounded bg-[#F7F7F7] border border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <span className="text-[#555555] text-[11px]">
              SHA-256 Digest: <span className="text-[#111111] select-all">{sha256Checksum || 'Unavailable'}</span>
            </span>
            <span className="text-[10px] text-[#777777]">
              Engine: {engineVersion} ({analyzedAt})
            </span>
          </div>

          {/* Defense Disclaimer */}
          <p className="text-[10px] text-[#777777] italic leading-snug">
            Defensible Audit Standard: Technical forensic checks evaluate container structural integrity and metadata consistency. Findings serve as evidence for Procurement Officer review and do not constitute automated fraud determinations.
          </p>
        </div>
      )}
    </div>
  );
}
