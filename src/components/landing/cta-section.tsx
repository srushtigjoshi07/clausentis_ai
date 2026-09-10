'use client';

import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CtaSection() {
  return (
    <section className="relative py-24 sm:py-32 overflow-hidden border-t border-[#E5E5E5] bg-transparent font-sans">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] px-3.5 py-1 text-xs font-mono text-[#555555]">
            <Sparkles className="h-3.5 w-3.5 text-[#111111]" />
            <span>Immediate Procurement Impact</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-[-0.03em] text-[#111111] max-w-3xl mx-auto leading-[1.1]">
            Ready to transform your tender compliance?
          </h2>

          <p className="mt-4 text-sm sm:text-lg text-[#555555] font-light leading-relaxed max-w-xl mx-auto">
            Upload your first government tender PDF and receive a complete, verifiable compliance dossier in under 60 seconds.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="h-11 px-7 bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm tracking-wide gap-2 border border-[#222222] transition-colors">
                <span>Get Started Free</span>
                <ArrowRight className="h-4 w-4 stroke-[1.5]" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="h-11 px-7 border-[#111111] bg-white hover:bg-[#F5F5F5] text-[#111111] font-medium text-xs sm:text-sm tracking-wide transition-colors">
                <span>Sign In to Workspace</span>
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
