'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const highlights = [
  'Deterministic Eligibility Extraction',
  'Verifiable Document Citations',
  'Actionable Bid Readiness Scoring',
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-44 lg:pb-36 min-h-[85vh] flex items-center">
      {/* Quiet Text Safe Zone behind the headline to guarantee 100% crisp contrast */}
      <div className="absolute top-1/4 left-0 w-full lg:w-3/5 h-[550px] bg-[radial-gradient(ellipse_70%_70%_at_20%_40%,rgba(255,255,255,1)_0%,rgba(255,255,255,0.85)_70%,transparent_100%)] pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: High-Contrast Headline, Subheading & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                Next-Gen Procurement AI
              </span>
            </motion.div>

            {/* Headline - Charcoal Navy #0B1220 */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-5 text-4xl font-light tracking-[-0.04em] sm:text-5xl lg:text-6xl leading-[1.1] text-[#0B1220]"
            >
              Know before <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent font-light">
                you bid.
              </span>
            </motion.h1>

            {/* Subheading - Dark Cool-Gray #475569 */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg leading-relaxed text-[#475569] max-w-xl font-normal"
            >
              Turn complex government tenders into clear requirements, verified evidence, and actionable bid decisions.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto"
            >
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="h-12 px-8 text-sm font-normal shadow-md shadow-blue-500/15 gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white transition-all hover:translate-y-[-1px]">
                  Analyze a Tender
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#workflow" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="h-12 px-7 text-sm font-normal w-full sm:w-auto bg-white/90 border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm backdrop-blur-sm">
                  Explore Workflow
                </Button>
              </a>
            </motion.div>

            {/* Highlights */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2.5 pt-6 border-t border-slate-200/80 w-full"
            >
              {highlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600"
                >
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  {item}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Column: Open spatial viewport framing the 3D Neural Intelligence */}
          <div className="lg:col-span-5 relative flex flex-col items-end justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-4 py-1.5 text-xs font-mono font-semibold text-blue-800 shadow-sm backdrop-blur-md mb-2"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span>3D Neural Intelligence Core // Live</span>
            </motion.div>
            <div className="text-[11px] font-mono text-slate-500 pr-2">
              Scroll down to begin document ingestion &rarr;
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
