import React, { Suspense } from 'react';
import { getAllBidderDossiers, STANDARD_CPCL_REQUIREMENTS } from '@/lib/compliance/repository';
import { VisualComplianceAnalysisCenter } from '@/components/compliance/VisualComplianceAnalysisCenter';

export const metadata = {
  title: 'Matched Requirements Analysis Center | Clausentis Authority',
  description: 'Evidence-grounded qualification and requirement matching analysis across submitted bidder proposals.',
};

interface AuthorityMatchedRequirementsPageProps {
  searchParams?: Promise<{ bidId?: string }>;
}

export default async function AuthorityMatchedRequirementsPage({ searchParams }: AuthorityMatchedRequirementsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const tenderId = 'tender-cpcl-2026-0412';
  const dossiers = getAllBidderDossiers(tenderId);
  const requirements = STANDARD_CPCL_REQUIREMENTS;

  const initialDossier = (resolvedSearchParams?.bidId && dossiers.find(d => d.bidId === resolvedSearchParams.bidId))
    || dossiers.find(d => d.bidId === 'bid-apex-02')
    || dossiers[0];

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-[#777777]">Loading Visual Compliance Analysis Center...</div>}>
      <VisualComplianceAnalysisCenter
        initialDossier={initialDossier}
        allDossiers={dossiers}
        requirements={requirements}
      />
    </Suspense>
  );
}
