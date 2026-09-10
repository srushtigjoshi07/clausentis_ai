'use client';

import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';

const MATCHES = [
  {
    reqCategory: 'FINANCIAL REQUIREMENT',
    reqTitle: 'Turnover >= ₹15.00 Crore in 3 FYs',
    reqPage: 'Tender RFP Page 18, Clause 4.2',
    docCategory: 'COMPANY VAULT MATCH',
    docTitle: 'CA Audited Balance Sheet & UDIN Certificate',
    docValue: 'Average ₹17.20 Cr Verified',
    status: 'PASS',
    confidence: '99.2%'
  },
  {
    reqCategory: 'TECHNICAL SPECIFICATION',
    reqTitle: 'ISO 9001:2015 & ISO/IEC 27001:2022',
    reqPage: 'Tender RFP Page 31, Section 8',
    docCategory: 'COMPANY VAULT MATCH',
    docTitle: 'TUV Nord ISO 9001 & 27001 Accredited Certs',
    docValue: 'Valid through Nov 2027',
    status: 'PASS',
    confidence: '100%'
  },
  {
    reqCategory: 'EXPERIENCE RECORD',
    reqTitle: '3 Railway Software Executions (>= ₹12 Cr)',
    reqPage: 'Tender RFP Page 24, Clause 5.1',
    docCategory: 'COMPANY VAULT MATCH',
    docTitle: 'RailTel & Western Railway Completion Certificates',
    docValue: '3 Projects Matched (₹18.40 Cr total)',
    status: 'PASS',
    confidence: '97.8%'
  }
];

export function EvidenceMatchingStage() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden border-t border-slate-100/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Stage Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3.5 py-1 text-xs font-semibold text-blue-700 mb-3 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Stage 04 // Traceable Evidence Matching
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0B1220]">
            Bidder Evidence Linked to Exact RFP Clauses
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#475569]">
            Clausentis cross-references bidder credentials against extracted requirements with verifiable citation trails.
          </p>
        </div>

        {/* Evidence Link Pairs */}
        <div className="space-y-4 max-w-5xl mx-auto">
          {MATCHES.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 rounded-2xl border border-slate-200/90 bg-white/85 items-center shadow-md shadow-blue-900/5 hover:border-blue-300 transition-all backdrop-blur-md"
            >
              {/* Left Requirement Clause */}
              <div className="md:col-span-5 space-y-1">
                <span className="text-[10px] font-mono font-bold text-blue-700 tracking-wider">{item.reqCategory}</span>
                <h3 className="text-sm font-bold text-slate-900">{item.reqTitle}</h3>
                <span className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                  <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                  {item.reqPage}
                </span>
              </div>

              {/* Center Connection Indicator */}
              <div className="md:col-span-2 flex items-center justify-center">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[10px] font-bold">
                  <span>MATCH</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>

              {/* Right Company Document Match */}
              <div className="md:col-span-5 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-indigo-600 tracking-wider">{item.docCategory}</span>
                  <h3 className="text-sm font-semibold text-slate-800">{item.docTitle}</h3>
                  <span className="text-xs text-emerald-600 font-mono font-bold">{item.docValue}</span>
                </div>

                <div className="flex flex-col items-end shrink-0 ml-3">
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {item.status}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 font-semibold">{item.confidence}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
