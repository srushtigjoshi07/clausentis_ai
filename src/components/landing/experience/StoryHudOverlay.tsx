'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileUp, Sparkles, BookOpen, ShieldCheck, Award, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StoryHudOverlayProps {
  dampedProgress: number;
}

function calcSmoothEnvelope(progress: number, start: number, end: number): number {
  const fadeInWindow = 0.05;
  const fadeOutWindow = 0.05;

  if (progress < start - fadeInWindow || progress > end + fadeOutWindow) {
    return 0;
  }

  // Fade in phase
  if (progress < start + fadeInWindow) {
    return Math.max(0, Math.min((progress - (start - fadeInWindow)) / (fadeInWindow * 2), 1));
  }

  // Steady phase
  if (progress <= end - fadeOutWindow) {
    return 1;
  }

  // Fade out phase
  return Math.max(0, Math.min(((end + fadeOutWindow) - progress) / (fadeOutWindow * 2), 1));
}

export function StoryHudOverlay({ dampedProgress }: StoryHudOverlayProps) {
  const heroOpacity = calcSmoothEnvelope(dampedProgress, 0.00, 0.14);
  const ingestOpacity = calcSmoothEnvelope(dampedProgress, 0.15, 0.28);
  const extractOpacity = calcSmoothEnvelope(dampedProgress, 0.29, 0.42);
  const graphOpacity = calcSmoothEnvelope(dampedProgress, 0.43, 0.56);
  const matchOpacity = calcSmoothEnvelope(dampedProgress, 0.57, 0.70);
  const complianceOpacity = calcSmoothEnvelope(dampedProgress, 0.71, 0.84);
  const readinessOpacity = calcSmoothEnvelope(dampedProgress, 0.85, 1.00);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 sm:p-8 lg:p-12">
      
      {/* Top stage progression indicator */}
      <div className="mx-auto w-full max-w-7xl flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-[#0B1220]/90 px-4 py-1.5 text-xs font-mono font-semibold text-blue-400 shadow-xl shadow-black/80 backdrop-blur-2xl">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span>
            {dampedProgress < 0.14 && 'PHASE 00 // NEURAL INTELLIGENCE'}
            {dampedProgress >= 0.14 && dampedProgress < 0.28 && 'PHASE 01 // DOCUMENT INGESTION'}
            {dampedProgress >= 0.28 && dampedProgress < 0.42 && 'PHASE 02 // DATA EXTRACTION'}
            {dampedProgress >= 0.42 && dampedProgress < 0.56 && 'PHASE 03 // 3D KNOWLEDGE GRAPH'}
            {dampedProgress >= 0.56 && dampedProgress < 0.70 && 'PHASE 04 // EVIDENCE MATCHING'}
            {dampedProgress >= 0.70 && dampedProgress < 0.84 && 'PHASE 05 // COMPLIANCE ENGINE'}
            {dampedProgress >= 0.84 && 'PHASE 06 // BID READINESS'}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-300 bg-[#0B1220]/90 px-3.5 py-1.5 rounded-full border border-white/15 backdrop-blur-xl shadow-lg shadow-black/60">
          <span>SCROLL PROGRESS</span>
          <span className="text-blue-400 font-bold">{Math.round(dampedProgress * 100)}%</span>
        </div>
      </div>

      {/* Main Center Content Container */}
      <div className="mx-auto w-full max-w-7xl my-auto relative">
        
        {/* STAGE 0: HERO (0.00 - 0.14) */}
        {heroOpacity > 0.01 && (
          <div
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            style={{ opacity: heroOpacity, transform: `translate3d(0, ${(1 - heroOpacity) * 20}px, 0)` }}
          >
            <div className="lg:col-span-7 flex flex-col items-start text-left pointer-events-auto">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/60 px-3.5 py-1 text-xs font-semibold text-blue-300 shadow-sm backdrop-blur-md mb-4">
                <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                Next-Gen Procurement AI
              </span>

              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.08] text-white">
                KNOW BEFORE <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent font-extrabold">
                  YOU BID.
                </span>
              </h1>

              <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-300 max-w-xl font-normal">
                Turn complex government tenders into clear requirements, verified evidence, and actionable bid decisions.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="lg" className="h-12 px-8 text-sm font-bold shadow-lg shadow-blue-600/40 gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white">
                    Analyze a Tender
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#workspace" className="w-full sm:w-auto">
                  <Button variant="outline" size="lg" className="h-12 px-7 text-sm font-bold w-full sm:w-auto bg-white/5 border-white/20 text-white hover:bg-white/10 shadow-sm backdrop-blur-sm">
                    View Product
                  </Button>
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 pt-5 border-t border-white/10 w-full">
                {['Deterministic Extraction', 'Verifiable Citations', 'Bid Readiness Score'].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STAGE 1: DOCUMENT INGESTION (0.14 - 0.28) */}
        {ingestOpacity > 0.01 && (
          <div
            className="max-w-2xl text-left pointer-events-auto bg-[#0B1220]/90 p-6 sm:p-8 rounded-3xl border border-white/15 shadow-2xl shadow-blue-950/80 backdrop-blur-2xl text-white"
            style={{ opacity: ingestOpacity, transform: `translate3d(0, ${(1 - ingestOpacity) * 20}px, 0)` }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/60 px-3 py-1 text-xs font-semibold text-blue-300 mb-3">
              <FileUp className="h-3.5 w-3.5" />
              Stage 01 // Multi-Page Ingestion
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ingesting Complex Government RFPs
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              The neural core unfolds to parse multi-page PDFs, capturing tabular schedules, technical clauses, and statutory criteria in 3D coordinate space.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t border-white/10">
              <span className="text-xs font-mono font-bold text-blue-300 bg-blue-950/90 px-2.5 py-1 rounded-lg border border-blue-500/40">
                NIT_NOTICE_INVITING_TENDER.PDF (42P)
              </span>
              <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-white/15">
                TECH_SPECS_VOL_2.PDF (88P)
              </span>
            </div>
          </div>
        )}

        {/* STAGE 2: DATA EXTRACTION (0.28 - 0.42) */}
        {extractOpacity > 0.01 && (
          <div
            className="max-w-2xl text-left pointer-events-auto ml-auto bg-[#0B1220]/90 p-6 sm:p-8 rounded-3xl border border-cyan-500/40 shadow-2xl shadow-cyan-950/80 backdrop-blur-2xl text-white"
            style={{ opacity: extractOpacity, transform: `translate3d(0, ${(1 - extractOpacity) * 20}px, 0)` }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3 py-1 text-xs font-semibold text-cyan-300 mb-3">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Stage 02 // Laser-Scan Extraction
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Decomposing Text into 3D Data Tokens
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              As the electric scanning beam sweeps across the RFP, text lines separate into structured data tokens, classifying financial turnovers, ISO standards, and experience minimums.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2 pt-4 border-t border-white/10 text-xs font-mono">
              <div className="p-2 rounded bg-blue-950/90 text-blue-300 font-bold border border-blue-500/40">
                FIN: ₹15.00 Cr Turnover
              </div>
              <div className="p-2 rounded bg-cyan-950/90 text-cyan-300 font-bold border border-cyan-500/40">
                ISO 9001 & 27001
              </div>
            </div>
          </div>
        )}

        {/* STAGE 3: KNOWLEDGE GRAPH (0.42 - 0.56) */}
        {graphOpacity > 0.01 && (
          <div
            className="max-w-2xl text-left pointer-events-auto bg-[#0B1220]/90 p-6 sm:p-8 rounded-3xl border border-indigo-500/40 shadow-2xl shadow-indigo-950/80 backdrop-blur-2xl text-white"
            style={{ opacity: graphOpacity, transform: `translate3d(0, ${(1 - graphOpacity) * 20}px, 0)` }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/60 px-3 py-1 text-xs font-semibold text-indigo-300 mb-3">
              <Network className="h-3.5 w-3.5" />
              Stage 03 // 3D Knowledge Network
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Connecting Criteria to Explicit Page Citations
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              Extracted tokens form an interconnected reasoning graph in 3D space. Every requirement is bound directly to its source page and clause reference.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-slate-200 bg-slate-900/90 p-2.5 rounded-xl border border-white/15">
              <BookOpen className="h-4 w-4 text-blue-400 shrink-0" />
              <span>Page 18, Clause 4.2 &bull; Deterministic Citation Anchored</span>
            </div>
          </div>
        )}

        {/* STAGE 4: EVIDENCE MATCHING (0.56 - 0.70) */}
        {matchOpacity > 0.01 && (
          <div
            className="max-w-2xl text-left pointer-events-auto ml-auto bg-[#0B1220]/90 p-6 sm:p-8 rounded-3xl border border-emerald-500/40 shadow-2xl shadow-emerald-950/80 backdrop-blur-2xl text-white"
            style={{ opacity: matchOpacity, transform: `translate3d(0, ${(1 - matchOpacity) * 20}px, 0)` }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3 py-1 text-xs font-semibold text-emerald-300 mb-3">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Stage 04 // Evidence Matching Vault
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Tender RFP vs Company Credentials
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              High-energy blue arcs cross-reference company balance sheets, certificates, and completion records against the RFP criteria, verifying proof with high confidence.
            </p>
            <div className="mt-4 p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/80 text-xs text-emerald-300 font-semibold flex items-center justify-between">
              <span>CA Audited Balance Sheet (₹17.20 Cr Verified)</span>
              <span className="font-mono font-bold bg-emerald-600 text-white px-2 py-0.5 rounded">MATCH 100%</span>
            </div>
          </div>
        )}

        {/* STAGE 5: COMPLIANCE ENGINE (0.70 - 0.84) */}
        {complianceOpacity > 0.01 && (
          <div
            className="max-w-2xl text-left pointer-events-auto bg-[#0B1220]/90 p-6 sm:p-8 rounded-3xl border border-blue-500/40 shadow-2xl shadow-blue-950/80 backdrop-blur-2xl text-white"
            style={{ opacity: complianceOpacity, transform: `translate3d(0, ${(1 - complianceOpacity) * 20}px, 0)` }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/60 px-3 py-1 text-xs font-semibold text-blue-300 mb-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              Stage 05 // Categorical Compliance Engine
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Structuring Criteria into 5 Decisive Pillars
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
              The network self-organizes into clean columns: Legal, Financial, Past Experience, Technical Specs, and Mandatory Documents.
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] font-mono font-bold">
              <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 px-2 py-1 rounded">LEGAL: 96%</span>
              <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 px-2 py-1 rounded">FINANCIAL: 92%</span>
              <span className="bg-amber-950/90 text-amber-300 border border-amber-500/40 px-2 py-1 rounded">EXPERIENCE: 85%</span>
              <span className="bg-amber-950/90 text-amber-300 border border-amber-500/40 px-2 py-1 rounded">TECHNICAL: 78%</span>
              <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 px-2 py-1 rounded">DOCS: 100%</span>
            </div>
          </div>
        )}

        {/* STAGE 6: BID READINESS CLIMAX (0.84 - 1.00) */}
        {readinessOpacity > 0.01 && (
          <div
            className="max-w-2xl text-center mx-auto pointer-events-auto bg-[#0B1220]/95 p-6 sm:p-10 rounded-3xl border border-blue-500/50 shadow-2xl shadow-blue-900/60 backdrop-blur-2xl text-white"
            style={{ opacity: readinessOpacity, transform: `translate3d(0, ${(1 - readinessOpacity) * 20}px, 0)` }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/60 px-3.5 py-1 text-xs font-semibold text-blue-300 mb-3">
              <Award className="h-4 w-4" />
              Stage 06 // Decision Intelligence
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              BID READINESS SCORE: <span className="text-blue-400 font-black">87/100</span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
              18/20 criteria verified with low disqualification risk. Ready to produce audited tender bid response.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup">
                <Button size="lg" className="h-11 px-7 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/40">
                  Upload Your Tender PDF
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </Link>
              <a href="#workspace">
                <Button variant="outline" size="lg" className="h-11 px-6 text-sm font-bold bg-white/5 text-white border-white/20 hover:bg-white/10">
                  Inspect Workspace Below &darr;
                </Button>
              </a>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Hint */}
      <div className="mx-auto text-center text-xs font-mono text-slate-400 select-none pb-2">
        {dampedProgress < 0.9 ? 'Scroll downwards to advance intelligence pipeline' : 'Scroll down to enter production workspace'}
      </div>

    </div>
  );
}
