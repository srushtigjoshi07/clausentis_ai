import React from 'react';
import { GovernmentVerificationDashboard } from '@/components/government-verification/GovernmentVerificationDashboard';

export const metadata = {
  title: 'Government Verification Gateway | Clausentis',
  description: 'Cross-verify bidder certificates against government registries (Udyam, GST, MCA).',
};

export default function GovernmentVerificationPage() {
  return <GovernmentVerificationDashboard />;
}
