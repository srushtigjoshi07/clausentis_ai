'use client';

import { 
  Cpu, 
  FileCheck2, 
  Clock, 
  Sparkles, 
  SearchCheck, 
  Eye, 
  AlertTriangle 
} from 'lucide-react';

const benefits = [
  {
    icon: Cpu,
    title: 'Deterministic AI Extraction',
    description: 'Groq-powered models parse multi-page PDFs to capture explicit financial turnover, experience thresholds, and mandatory certificates.',
  },
  {
    icon: FileCheck2,
    title: 'Company Vault Integration',
    description: 'Upload bidder balance sheets, certificates, and statutory filings once. Clausentis automatically maps them against each tender requirement.',
  },
  {
    icon: Clock,
    title: 'Hours to Minutes Analysis',
    description: 'Reduce comprehensive 100+ page RFP compliance checks from 2 working days to under 45 seconds of verifiable analysis.',
  },
  {
    icon: SearchCheck,
    title: 'Exact Citation Backing',
    description: 'Every extracted requirement links directly to its source PDF page, paragraph, and clause reference for instant auditability.',
  },
  {
    icon: Eye,
    title: 'Complete Requirement Visibility',
    description: 'Categorized cleanly across Legal, Financial, Technical, Past Experience, and Mandatory Documentation.',
  },
  {
    icon: AlertTriangle,
    title: 'Actionable Remediation Guidance',
    description: 'Receive concrete advice on how to cure missing criteria with alternative qualifying certificates.',
  },
];

export function Benefits() {
  return (
    <section id="benefits" className="relative py-24 sm:py-32 overflow-hidden border-t border-[#E5E5E5] bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] px-3.5 py-1 text-xs font-mono text-[#555555] mb-3">
            <Sparkles className="h-3.5 w-3.5 text-[#111111]" />
            <span>Engineered for Competitive Advantage</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-[#111111]">
            Built for procurement teams that win bids
          </h2>
          
          <p className="mt-4 text-base sm:text-lg text-[#555555] font-light leading-relaxed">
            Clausentis combines high-speed clause extraction with verifiable compliance intelligence to provide complete audit certainty.
          </p>
        </div>

        {/* Benefits grid */}
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-xs hover:border-[#111111] transition-colors duration-200"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5]">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#111111]">{b.title}</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#555555]">
                {b.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}