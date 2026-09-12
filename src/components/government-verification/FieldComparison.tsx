'use client';

/**
 * FieldComparison — Renders a comparison table of document vs government values
 */

import React from 'react';
import type { GovFieldComparison } from '@/lib/verification/types';

interface FieldComparisonProps {
  fields: GovFieldComparison[];
  className?: string;
}

export function FieldComparison({ fields, className = '' }: FieldComparisonProps) {
  if (!fields || fields.length === 0) return null;

  return (
    <div className={`overflow-x-auto rounded-md border border-[#E5E5E5] ${className}`}>
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-[#E5E5E5] bg-[#F7F7F7] text-[10px] font-mono uppercase text-[#777777]">
            <th className="py-2.5 px-3 font-semibold">Statutory Field</th>
            <th className="py-2.5 px-3 font-semibold">Submitted Document</th>
            <th className="py-2.5 px-3 font-semibold">Government Registry</th>
            <th className="py-2.5 px-3 font-semibold text-right">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0F0F0]">
          {fields.map((field, idx) => (
            <tr
              key={idx}
              className={`hover:bg-[#FAFAFA] transition-colors ${
                !field.match ? 'bg-[#FFFDF5]' : ''
              }`}
            >
              <td className="py-2.5 px-3 font-medium text-[#111111]">
                {field.fieldLabel}
              </td>
              <td className="py-2.5 px-3 text-[#555555] font-mono text-[11px] break-all">
                {field.documentValue || '—'}
              </td>
              <td className="py-2.5 px-3 text-[#111111] font-mono text-[11px] font-medium break-all">
                {field.governmentValue || '—'}
              </td>
              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                {field.match ? (
                  <span className="inline-flex items-center gap-1 font-mono font-semibold text-[10px] text-[#065F46] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0]">
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
  );
}
