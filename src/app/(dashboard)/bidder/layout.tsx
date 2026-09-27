import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSavedBidderProfileAction } from '@/lib/actions/tender-discovery';
import { BidderTopbar } from '@/components/v2/BidderTopbar';

export default async function BidderLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Role comes only from profiles.role; user_metadata is user-writable and never trusted.
  const { data: roleRow } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (roleRow?.role === 'tender_authority') redirect('/authority/dashboard');

  const company = await getSavedBidderProfileAction();
  const metaOrg = typeof user.user_metadata?.organisation_name === 'string' ? user.user_metadata.organisation_name : '';

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <BidderTopbar
        companyName={company?.companyName || metaOrg || user.email || 'Your company'}
        identifier={company?.gstin || user.email || undefined}
      />
      <main id="main" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {children}
      </main>
    </div>
  );
}
