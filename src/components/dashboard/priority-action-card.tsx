'use client';

import { ArrowRight, Clock, FolderOpen, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PriorityActionCardProps {
  hasTenders: boolean;
  pendingTendersCount: number;
  firstPendingTender?: { id: string; title: string } | null;
  criticalIssuesCount: number;
}

export function PriorityActionCard({
  hasTenders,
  pendingTendersCount,
  firstPendingTender,
  criticalIssuesCount
}: PriorityActionCardProps) {
  return (
    <div className="p-5 sm:p-6 rounded-xl border border-border bg-surface shadow-sm font-sans">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[11px] font-normal uppercase tracking-[0.14em] text-muted-foreground">
          02. PRIORITY ACTION
        </span>
      </div>

      {!hasTenders ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-5 rounded-lg bg-background border border-border">
          <div className="space-y-1.5">
            <h4 className="text-base sm:text-lg font-medium text-foreground tracking-[-0.01em]">
              Ready to analyze your first tender?
            </h4>
            <p className="text-sm font-light text-muted-foreground leading-relaxed max-w-xl">
              Upload a government tender PDF to extract requirements, evaluate compliance, and identify risks.
            </p>
          </div>
          <Link href="/authority/tenders/new" className="shrink-0 w-full sm:w-auto">
            <Button 
              size="sm" 
              className="w-full sm:w-auto bg-[#111111] hover:bg-[#222222] dark:bg-white dark:hover:bg-[#EEEEEE] text-white dark:text-[#111111] font-medium text-xs sm:text-sm tracking-wide gap-1.5 h-9 px-5 shadow-sm"
            >
              Upload Tender <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
            </Button>
          </Link>
        </div>
      ) : pendingTendersCount > 0 && firstPendingTender ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-5 rounded-lg bg-background border border-border">
          <div className="flex items-start gap-3.5">
            <Clock className="h-5 w-5 text-foreground mt-0.5 shrink-0 stroke-[1.5]" />
            <div className="space-y-1.5">
              <h4 className="text-base sm:text-lg font-medium text-foreground tracking-[-0.01em]">
                Continue Analysis: {pendingTendersCount} Tender{pendingTendersCount > 1 ? 's' : ''} Awaiting Review
              </h4>
              <p className="text-sm font-light text-muted-foreground leading-relaxed max-w-xl truncate">
                &ldquo;{firstPendingTender.title}&rdquo; is ready for structured statutory requirement extraction.
              </p>
            </div>
          </div>
          <Link href={`/authority/tenders`} className="shrink-0 w-full sm:w-auto">
            <Button 
              size="sm" 
              className="w-full sm:w-auto bg-[#111111] hover:bg-[#222222] dark:bg-white dark:hover:bg-[#EEEEEE] text-white dark:text-[#111111] font-medium text-xs sm:text-sm tracking-wide gap-1.5 h-9 px-5 shadow-sm"
            >
              Continue Analysis <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
            </Button>
          </Link>
        </div>
      ) : criticalIssuesCount > 0 ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-5 rounded-lg bg-background border border-border">
          <div className="flex items-start gap-3.5">
            <AlertTriangle className="h-5 w-5 text-foreground mt-0.5 shrink-0 stroke-[1.5]" />
            <div className="space-y-1.5">
              <h4 className="text-base sm:text-lg font-medium text-foreground tracking-[-0.01em]">
                Review Critical Requirements
              </h4>
              <p className="text-sm font-light text-muted-foreground leading-relaxed max-w-xl">
                {criticalIssuesCount} high-risk eligibility alerts detected across evaluated criteria.
              </p>
            </div>
          </div>
          <Link href="/authority/dashboard" className="shrink-0 w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto bg-[#111111] hover:bg-[#222222] dark:bg-white dark:hover:bg-[#EEEEEE] text-white dark:text-[#111111] font-medium text-xs sm:text-sm tracking-wide gap-1.5 h-9 px-5 shadow-sm">
              Review Critical Issues <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-5 rounded-lg bg-background border border-border">
          <div className="flex items-start gap-3.5">
            <FolderOpen className="h-5 w-5 text-foreground mt-0.5 shrink-0 stroke-[1.5]" />
            <div className="space-y-1.5">
              <h4 className="text-base sm:text-lg font-medium text-foreground tracking-[-0.01em]">
                Tender Workspace Up to Date
              </h4>
              <p className="text-sm font-light text-muted-foreground leading-relaxed max-w-xl">
                Manage your company credentials in the Document Vault for automatic evidence matching and verification.
              </p>
            </div>
          </div>
          <Link href="/documents" className="shrink-0 w-full sm:w-auto">
            <Button size="sm" variant="outline" className="w-full sm:w-auto bg-transparent border-border text-foreground font-medium text-xs sm:text-sm hover:bg-muted/10 h-9 px-4">
              Open Document Vault
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
