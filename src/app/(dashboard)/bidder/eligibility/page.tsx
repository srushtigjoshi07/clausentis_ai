import React from 'react';
import { PreBidEligibilityChecker } from '@/components/eligibility/PreBidEligibilityChecker';

export const metadata = {
  title: 'Check Bid Eligibility | Bidder Workspace',
  description: 'Evaluate vendor eligibility, analyze compliance gaps, and inspect required documents before bid submission.',
};

export default function GeneralBidderEligibilityPage() {
  return (
    <div className="max-w-7xl mx-auto pb-16">
      <PreBidEligibilityChecker />
    </div>
  );
}
