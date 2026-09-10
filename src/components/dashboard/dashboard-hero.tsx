import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function DashboardHero() {
  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 border-b border-border pb-8 pt-2">
      <div className="space-y-4 max-w-2xl">
        {/* Technical Architectural Annotation */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-normal uppercase tracking-[0.14em] text-muted-foreground">
            01. COMMAND CENTER
          </span>
          <span className="h-1 w-1 rounded-full bg-foreground" />
          <span className="text-[11px] font-mono uppercase tracking-[0.12em] text-foreground font-medium">
            INTELLIGENCE ACTIVE
          </span>
        </div>
        
        {/* Thin Editorial Hero Title */}
        <h1 className="text-5xl sm:text-6xl lg:text-[76px] font-light text-foreground tracking-[-0.04em] leading-[0.95]">
          WELCOME<br />BACK.
        </h1>

        {/* Subordinate Secondary Heading */}
        <p className="text-xl sm:text-2xl font-light text-muted-foreground tracking-[-0.02em] pt-1">
          Your procurement intelligence workspace.
        </p>

        {/* Quiet Description with Generous Leading */}
        <p className="text-sm sm:text-[15px] font-light text-muted-foreground leading-[1.65] max-w-lg">
          Connect requirements to evidence, surface risk signals, and maintain audit-ready verification for confident decisions.
        </p>
      </div>

      {/* Right Side: Primary CTA */}
      <div className="flex items-center gap-4 self-start lg:self-auto">
        <Link href="/authority/tenders/new" className="shrink-0 w-full sm:w-auto">
          <Button 
            size="lg" 
            className="w-full sm:w-auto h-11 px-6 bg-[#111111] hover:bg-[#222222] dark:bg-white dark:hover:bg-[#EEEEEE] text-white dark:text-[#111111] font-medium text-xs sm:text-sm tracking-wide gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4 stroke-[1.5]" />
            Analyze New Tender
          </Button>
        </Link>
      </div>
    </div>
  );
}
