'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileUp, BrainCircuit, Network, ShieldCheck, Award, Sparkles } from 'lucide-react';
import { DocumentIntelligenceDemo } from './document-intelligence-demo';
import { BidReadinessDemo } from './bid-readiness-demo';

const STAGES = [
  {
    step: '01',
    id: 'ingest',
    title: 'INGEST',
    subtitle: 'Upload Tender RFP',
    description: 'Upload complex government procurement documents (PDF). The system parses multi-page layouts, tabular data, and legal clauses.',
    icon: FileUp,
    badge: 'Page-Aware Parser'
  },
  {
    step: '02',
    id: 'extract',
    title: 'EXTRACT',
    subtitle: 'AI Requirement Extraction',
    description: 'Groq AI models extract explicit financial turnover, experience thresholds, technical specs, and mandatory forms with exact page citations.',
    icon: BrainCircuit,
    badge: 'Deterministic Extraction'
  },
  {
    step: '03',
    id: 'graph',
    title: 'GRAPH',
    subtitle: '3D Knowledge Network',
    description: 'Extracted requirement tokens travel into a multi-dimensional knowledge graph with active citations.',
    icon: Network,
    badge: 'Knowledge Graph'
  },
  {
    step: '04',
    id: 'evaluate',
    title: 'EVALUATE',
    subtitle: 'Compliance & Gap Detection',
    description: 'Every tender condition resolves into Pass, Review, or Missing with unambiguous evidence-backed explanations.',
    icon: ShieldCheck,
    badge: 'Traceable Verification'
  },
  {
    step: '05',
    id: 'decide',
    title: 'DECIDE',
    subtitle: 'Bid Readiness Score',
    description: 'Receive an actionable bid readiness score (e.g. 87/100) and an executive audit trail to decide with certainty before committing capital.',
    icon: Award,
    badge: 'Decision Intelligence'
  },
];

export function ScrollPipeline() {
  const [activeStage, setActiveStage] = useState(1);

  return (
    <section id="workflow" className="relative py-24 sm:py-32 overflow-hidden border-t border-slate-100/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3.5 py-1 text-xs font-semibold text-blue-700 mb-3 backdrop-blur-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            End-to-End Procurement Lifecycle
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0B1220]"
          >
            From tender to winning decision
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-base sm:text-lg text-[#475569] leading-relaxed"
          >
            A continuous intelligence pipeline turning 100+ page government RFPs into structured eligibility criteria and verified readiness proof.
          </motion.p>
        </div>

        {/* 5-Stage Interactive Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-12">
          {STAGES.map((s, idx) => {
            const Icon = s.icon;
            const isActive = activeStage === idx;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStage(idx)}
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all relative overflow-hidden backdrop-blur-md ${
                  isActive
                    ? 'border-blue-600 bg-blue-50/90 shadow-md shadow-blue-500/10'
                    : 'border-slate-200/80 bg-white/70 hover:bg-white/90 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className={`text-xs font-mono font-bold ${isActive ? 'text-blue-700' : 'text-slate-400'}`}>
                    {s.step}
                  </span>
                  <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                </div>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-slate-900 font-extrabold' : 'text-slate-700'}`}>
                  {s.title}
                </h4>
                <span className="text-[11px] text-slate-500 truncate w-full mt-0.5">
                  {s.subtitle}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="activeStageGlow"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Stage Demonstration Container */}
        <div className="mt-8">
          {activeStage === 1 && <DocumentIntelligenceDemo />}
          {activeStage === 4 && <BidReadinessDemo />}
          {activeStage !== 1 && activeStage !== 4 && (
            <div className="rounded-2xl border border-blue-100 bg-white/85 p-8 backdrop-blur-xl shadow-xl shadow-blue-900/5 text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 border border-blue-200">
                {(() => {
                  const CurrentIcon = STAGES[activeStage].icon;
                  return <CurrentIcon className="h-7 w-7" />;
                })()}
              </div>
              <span className="text-xs font-mono font-bold uppercase text-blue-700 tracking-widest">
                Stage {STAGES[activeStage].step} &bull; {STAGES[activeStage].title}
              </span>
              <h3 className="text-2xl font-bold mt-2 text-[#0B1220]">
                {STAGES[activeStage].subtitle}
              </h3>
              <p className="text-sm text-[#475569] max-w-xl mt-2 leading-relaxed">
                {STAGES[activeStage].description}
              </p>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
