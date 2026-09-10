'use client';

import { ArrowUpRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function ProductPreview() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden border-t border-[#E5E5E5] bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] px-3.5 py-1 text-xs font-mono text-[#555555] mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" />
            <span>01 // INTELLIGENT WORKSPACE</span>
          </div>
          
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-[#111111]">
            Autonomous Tender Decomposition & Compliance Matrix
          </h2>
          
          <p className="mt-4 text-sm sm:text-base text-[#555555] font-light max-w-xl mx-auto">
            From raw government RFP to granular clause-by-clause evaluation in seconds.
          </p>
        </div>

        {/* Interactive Workspace Simulator */}
        <div className="rounded-2xl border border-[#E5E5E5] bg-white p-4 sm:p-6 shadow-sm">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-[#111111]" />
              <div>
                <div className="text-[10px] font-mono text-[#555555] flex items-center gap-1.5">
                  <span>ACTIVE INTAKE</span>
                  <span>&bull;</span>
                  <span>DATA STREAM VERIFIED</span>
                </div>
                <div className="text-sm font-medium text-[#111111] truncate max-w-md">
                  Railway Signaling & Automation EPC (NIT-2025/WR-04)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="text-[#555555]">Status:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5]">
                <CheckCircle2 className="h-3 w-3" /> 24/24 Evaluated
              </span>
            </div>
          </div>

          {/* 3-Column Split Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
            
            {/* Left Nav */}
            <div className="lg:col-span-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-3 space-y-1.5 font-mono">
              <div className="text-[10px] uppercase tracking-wider text-[#777777] px-2 py-1">
                Categories
              </div>
              <div className="p-2 rounded bg-[#F0F0F0] text-[#111111] font-semibold border border-[#E5E5E5] flex justify-between">
                <span>All Criteria</span>
                <span>24</span>
              </div>
              <div className="p-2 rounded text-[#555555] hover:bg-white flex justify-between transition-colors duration-150">
                <span>Financial Criteria</span>
                <span>6</span>
              </div>
              <div className="p-2 rounded text-[#555555] hover:bg-white flex justify-between transition-colors duration-150">
                <span>Past Experience</span>
                <span>8</span>
              </div>
              <div className="p-2 rounded text-[#555555] hover:bg-white flex justify-between transition-colors duration-150">
                <span>Technical Certs</span>
                <span>5</span>
              </div>
            </div>

            {/* Center Requirements Feed */}
            <div className="lg:col-span-5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-3 space-y-2">
              <div className="p-3 rounded-lg border-l-2 border-l-[#111111] bg-white border border-[#E5E5E5]">
                <div className="flex justify-between text-[10px] font-mono text-[#555555] mb-1">
                  <span className="font-semibold text-[#111111]">FIN-001</span>
                  <span className="text-[#111111] font-semibold">Mandatory</span>
                </div>
                <div className="font-medium text-[#111111] text-sm">Minimum Average Annual Turnover</div>
                <div className="text-[#555555] text-xs mt-1">Turnover &ge; ₹15.00 Cr in preceding 3 FYs</div>
              </div>

              <div className="p-3 rounded-lg border border-[#E5E5E5] bg-white">
                <div className="flex justify-between text-[10px] font-mono text-[#555555] mb-1">
                  <span className="font-semibold text-[#111111]">EXP-002</span>
                  <span className="text-[#111111] font-semibold">Mandatory</span>
                </div>
                <div className="font-medium text-[#111111]">Similar Railway Software Execution</div>
                <div className="text-[#555555] text-xs mt-0.5">3 completed projects &ge; ₹12.00 Cr</div>
              </div>
            </div>

            {/* Right Evidence & Source Citation */}
            <div className="lg:col-span-4 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] p-4 flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-mono text-[#555555] uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-[#111111]" />
                  <span>SOURCE VERIFICATION</span>
                </div>
                <div className="font-medium text-[#111111]">Clause 4.2 Proof</div>
                <p className="mt-2 text-[#333333] leading-relaxed italic p-3 rounded bg-white border border-[#E5E5E5] text-xs">
                  &ldquo;The bidder shall have minimum average annual financial turnover of ₹15.00 Crore during the last 3 financial years...&rdquo;
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5E5E5] flex items-center justify-between text-xs font-mono">
                <span className="text-[#555555]">Citation:</span>
                <span className="text-[#111111] font-bold">Page 18, Clause 4.2</span>
              </div>
            </div>

          </div>

          {/* Bottom Action Bar */}
          <div className="mt-6 pt-4 border-t border-[#E5E5E5] flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-[#555555] font-light">
              Experience deterministic tender intelligence on your own procurement files.
            </span>
            <Link href="/signup">
              <Button size="sm" className="font-medium gap-1.5 bg-[#111111] text-white hover:bg-[#222222] text-xs h-9 px-4">
                <span>Start Analyzing Free</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}