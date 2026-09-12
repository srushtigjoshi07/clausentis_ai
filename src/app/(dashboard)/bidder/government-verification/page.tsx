import React from 'react';
import { GovernmentVerificationDashboard } from '@/components/government-verification/GovernmentVerificationDashboard';

export const metadata = {
  title: 'Government Verification Gateway | Bidder Workspace',
  description: 'Self-verify and audit company credentials across statutory government registries (Udyam, GST, MCA).',
};

export default function BidderGovernmentVerificationPage() {
  return <GovernmentVerificationDashboard />;
}
