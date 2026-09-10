import React from 'react';
import { getAuthorityManagedTenders } from '@/lib/actions/tenders';
import { AuthorityTendersClient } from '@/components/authority/AuthorityTendersClient';

export const metadata = {
  title: 'My Managed Tenders | Authority Portal',
  description: 'Manage departmental tenders and monitor multi-vendor compliance evaluation.',
};

export default async function AuthorityTendersPage() {
  const tenders = await getAuthorityManagedTenders();

  return <AuthorityTendersClient initialTenders={tenders} />;
}
