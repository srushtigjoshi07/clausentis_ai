'use client';

import React from 'react';
import { GovVerificationEvidence } from '@/lib/verification/types';
import { FileText, Calendar, Database } from 'lucide-react';

interface EvidenceViewerProps {
  evidence: GovVerificationEvidence[];
  source: string;
  checkedAt: string;
  className?: string;
}

export function EvidenceViewer({ evidence, source, checkedAt, className = '' }: EvidenceViewerProps) {
  if (!evidence || evidence.length === 0) return null;

  return (
    <div className={`bg-[#FAFAFA] border border-[#E5E5E5] rounded-md p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <FileText size={14} className="text-[#555555]" />
        <h4 className="font-mono text-[10px] uppercase tracking-wider text-[#555555] font-medium">Verification Evidence</h4>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {evidence.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-1">
            <span className="font-mono text-[9px] uppercase text-[#777777]">{item.label}</span>
            <span className="text-sm text-[#111111] break-all">{item.value || '-'}</span>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-[#E5E5E5] flex flex-wrap gap-4">
        <div className="flex items-center gap-1.5 text-[#555555]">
          <Database size={12} />
          <span className="font-mono text-[9px] uppercase tracking-wider">Source: {source}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#555555]">
          <Calendar size={12} />
          <span className="font-mono text-[9px] uppercase tracking-wider">Checked: {checkedAt}</span>
        </div>
      </div>
    </div>
  );
}
