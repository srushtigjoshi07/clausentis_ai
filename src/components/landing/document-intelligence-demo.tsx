'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';

const RAW_CLAUSES = [
  {
    id: 'turnover',
    category: 'Financial',
    tag: 'FIN-001',
    rawText: '“The bidder must have achieved a minimum average annual financial turnover of at least ₹5.00 Crore during the last 3 financial years (2023-24, 2024-25, 2025-26) certified by a Chartered Accountant with valid UDIN.”',
    page: 18,
    name: 'Minimum Average Annual Turnover',
    threshold: '₹5.00 Crore',
    period: 'Last 3 FYs',
    mandatory: true,
  },
  {
    id: 'experience',
    category: 'Experience',
    tag: 'EXP-002',
    rawText: '“Bidder should have successfully executed at least 3 similar government software infrastructure projects of value not less than ₹2.00 Crore each in the preceding 5 years.”',
    page: 24,
    name: 'Similar Project Track Record',
    threshold: '3 Projects (≥ ₹2 Cr each)',
    period: 'Past 5 Years',
    mandatory: true,
  },
  {
    id: 'iso',
    category: 'Technical',
    tag: 'TEC-003',
    rawText: '“The bidder must hold valid ISO 9001:2015 and ISO/IEC 27001:2022 certifications as on the date of bid submission. Certificates must be submitted in Envelope A.”',
    page: 31,
    name: 'Quality & Security Certifications',
    threshold: 'ISO 9001 & ISO 27001',
    period: 'Active at Submission',
    mandatory: true,
  }
];

export function DocumentIntelligenceDemo() {
  const [activeClause, setActiveClause] = useState(0);
  const current = RAW_CLAUSES[activeClause];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700">
              Live Extraction Engine Demonstration
            </span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-[#0B1220] mt-1">
            Raw Document to Structured Intelligence
          </h3>
        </div>

        {/* Clause Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
          {RAW_CLAUSES.map((clause, idx) => (
            <button
              key={clause.id}
              onClick={() => setActiveClause(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeClause === idx
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {clause.category}
            </button>
          ))}
        </div>
      </div>

      {/* Two-Column Transformation View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* Left: Raw Unstructured PDF Text */}
        <motion.div
          key={`raw-${current.id}`}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-6 rounded-xl border border-slate-200 bg-slate-50/70 p-5 relative overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-600 font-medium">
              <FileText className="h-4 w-4 text-blue-600" />
              <span>TENDER_RFP_PAGE_{current.page}.PDF</span>
            </div>
            <span className="text-[10px] font-mono bg-slate-200/80 px-2 py-0.5 rounded text-slate-700 font-semibold">
              Page {current.page}
            </span>
          </div>

          <div className="relative">
            <p className="text-xs font-serif leading-relaxed text-slate-800 italic p-3 rounded-lg bg-white border border-slate-200 shadow-sm">
              {current.rawText}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600 font-mono">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" /> Text Extracted
            </span>
            <span>Confidence: 98.4%</span>
          </div>
        </motion.div>

        {/* Center Conversion Icon */}
        <div className="hidden lg:flex lg:col-span-1 justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 border border-blue-200 text-blue-600">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        {/* Right: Extracted Structured Requirement Card */}
        <motion.div
          key={`structured-${current.id}`}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="lg:col-span-5 rounded-xl border-2 border-blue-200 bg-blue-50/40 p-5 shadow-sm relative"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded">
              {current.tag}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-rose-100 text-rose-700 px-2 py-0.5 rounded">
              Mandatory
            </span>
          </div>

          <h4 className="text-base font-bold text-slate-900">
            {current.name}
          </h4>

          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded bg-white border border-slate-200 shadow-xs">
              <span className="text-slate-500">Threshold Value:</span>
              <span className="font-semibold text-slate-900">{current.threshold}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-white border border-slate-200 shadow-xs">
              <span className="text-slate-500">Applicable Period:</span>
              <span className="font-medium text-slate-900">{current.period}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-white border border-slate-200 shadow-xs">
              <span className="text-slate-500">Source Evidence Citation:</span>
              <span className="font-mono text-blue-700 font-bold flex items-center gap-1">
                <BookOpen className="h-3 w-3" /> Page {current.page}
              </span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
