import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserProfile } from '@/app/auth/actions';
import { OfficerShell } from '@/components/v2/OfficerSidebar';
import { listBidSummaries } from '@/lib/views/officer';
import { getTenderSource } from '@/lib/tender-discovery/tender-source';

export default async function AuthorityLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Role comes only from profiles.role; user_metadata is user-writable and never trusted.
  const { data: roleRow } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (roleRow?.role !== 'tender_authority') redirect('/bidder/dashboard');

  const profile = await getUserProfile();
  const open = await getTenderSource('imported').searchTenders({});
  const awaiting = listBidSummaries().filter((b) => !b.decision).length;

  return (
    <OfficerShell
      identity={{
        name: profile?.fullName || user.email || 'Procurement officer',
        organisation: profile?.organisationName || 'Tender Authority',
      }}
      counts={{ tenders: open.totalCount, awaiting }}
    >
      {children}
    </OfficerShell>
  );
}
