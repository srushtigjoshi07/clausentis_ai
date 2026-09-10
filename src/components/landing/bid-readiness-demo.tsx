'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const CATEGORY_BREAKDOWN = [
  { name: 'Legal & Statutory', score: 96, status: 'PASS', color: 'text-emerald-700', bar: 'bg-emerald-500' },
  { name: 'Financial Eligibility', score: 92, status: 'PASS', color: 'text-emerald-700', bar: 'bg-emerald-500' },
  { name: 'Past Experience', score: 85, status: 'REVIEW', color: 'text-amber-700', bar: 'bg-amber-500' },
  { name: 'Technical Certifications', score: 78, status: 'REVIEW', color: 'text-amber-700', bar: 'bg-amber-500' },
  { name: 'Mandatory Documentation', score: 100, status: 'PASS', color: 'text-emerald-700', bar: 'bg-emerald-500' },
];

export function BidReadinessDemo() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Conceptual Readiness Engine
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B1220] mt-1">
            Deterministic Bid Readiness Score
          </h3>
          <p className="text-xs text-[#475569] mt-0.5">
            Real-time multi-dimensional scoring calculated against matched company credentials.
          </p>
        </div>

        <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 font-semibold">
          Simulation Demo
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left: Big Circular Readiness Score Gauge */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-xl border border-blue-100 bg-blue-50/40 text-center">
          <div className="relative flex h-36 w-36 items-center justify-center">
            {/* Background Circle */}
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-200"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray="264"
                initial={{ strokeDashoffset: 264 }}
                whileInView={{ strokeDashoffset: 264 * (1 - 0.87) }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
                className="text-blue-600"
              />
            </svg>

            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold tracking-tight text-[#0B1220]">87</span>
              <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">/ 100</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold text-slate-900">Low Disqualification Risk</span>
          </div>

          <p className="text-[11px] text-[#475569] mt-1 max-w-xs">
            18/20 mandatory criteria fully verified. 2 items flagged for recommended CA update.
          </p>
        </div>

        {/* Right: Category Breakdown Matrix */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {CATEGORY_BREAKDOWN.map((cat, idx) => (
            <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{cat.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    cat.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {cat.status}
                  </span>
                  <span className="font-mono font-bold text-slate-900">{cat.score}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${cat.score}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: idx * 0.08 }}
                  className={`h-full rounded-full ${cat.bar}`}
                />
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
