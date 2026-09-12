import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PreBidEligibilityChecker } from '@/components/eligibility/PreBidEligibilityChecker';
import { getDiscoveredTenderAction } from '@/lib/actions/tender-discovery';

export const metadata = {
  title: 'Pre-Bid Eligibility Assessment | Bidder Workspace',
  description: 'AI-assisted pre-bid eligibility assessment and gap analysis.',
};

export default async function BidderTenderEligibilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tender = await getDiscoveredTenderAction(id);

  return (
    <div className="max-w-7xl mx-auto pb-16 space-y-6">
      <div className="flex items-center gap-2">
        <Link 
          href={`/bidder/tenders?tenderId=${id}&step=overview`}
          className="inline-flex items-center gap-1.5 text-xs text-[#555555] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Tender Overview</span>
        </Link>
      </div>

      <PreBidEligibilityChecker 
        tenderId={id}
        tenderTitle={tender?.title}
        referenceNumber={tender?.referenceNumber}
      />
    </div>
  );
}
