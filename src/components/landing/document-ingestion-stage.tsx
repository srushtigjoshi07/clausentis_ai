'use client';

import { motion } from 'framer-motion';
import { FileUp, CheckCircle2, Sparkles } from 'lucide-react';

const DOC_SHEETS = [
  { title: 'NIT_NOTICE_INVITING_TENDER.PDF', pages: '42 Pages', tag: 'GENERAL_ELIGIBILITY', delay: 0 },
  { title: 'TECHNICAL_SPECIFICATIONS_VOL_2.PDF', pages: '88 Pages', tag: 'ISO_STANDARDS', delay: 0.1 },
  { title: 'FINANCIAL_BOQ_SCHEDULE.PDF', pages: '16 Pages', tag: 'TURNOVER_CRITERIA', delay: 0.2 },
];

export function DocumentIngestionStage() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden border-t border-slate-100/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Stage Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3.5 py-1 text-xs font-semibold text-blue-700 mb-3 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Stage 01 // Neural Core &rarr; Document Ingestion
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0B1220]">
            High-Volume Procurement Parsing
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#475569]">
            The neural core opens to ingest multi-page government tender documents, structuring tabular data and legal clauses.
          </p>
        </div>

        {/* Floating White Document Cards with Subtle Shadows */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {DOC_SHEETS.map((doc) => (
            <motion.div
              key={doc.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: doc.delay }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="relative rounded-2xl border border-slate-200/90 bg-white/85 p-6 shadow-md shadow-blue-900/5 backdrop-blur-md group overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {doc.tag}
                </span>
                <span className="text-xs text-slate-500 font-mono font-medium">{doc.pages}</span>
              </div>

              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
                <FileUp className="h-5 w-5" />
              </div>

              <h3 className="font-mono text-sm font-bold text-slate-900 truncate">{doc.title}</h3>

              {/* Wireframe lines simulating document text */}
              <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-100">
                <div className="h-1.5 w-full rounded bg-slate-100" />
                <div className="h-1.5 w-5/6 rounded bg-slate-100" />
                <div className="h-1.5 w-4/6 rounded bg-slate-100" />
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-[11px] text-emerald-600 font-mono font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Text Layer Ingested into 3D Space</span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
