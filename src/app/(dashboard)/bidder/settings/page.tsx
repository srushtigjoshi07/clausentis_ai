import { createClient } from '@/lib/supabase/server';
import { logout } from '@/app/auth/actions';
import { getSavedBidderProfileAction } from '@/lib/actions/tender-discovery';
import { CompanyProfileForm } from '@/components/v2/bidder/CompanyProfileForm';
import { PageBody, PageHeader } from '@/components/v2/ui';

export const metadata = { title: 'Company profile · Clausentis bidder portal' };
export const dynamic = 'force-dynamic';

export default async function BidderSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getSavedBidderProfileAction();

  return (
    <PageBody className="max-w-[960px]">
      <PageHeader
        eyebrow="Company profile"
        title={profile?.companyName || 'Complete your company profile'}
        sub="Used to pre-check eligibility. Every figure here is verified against your documents when you bid."
      />
      <CompanyProfileForm initial={profile} email={user?.email ?? ''} />
      <section aria-label="Account" className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="h2">Account</h2>
          <span className="text-[13px] text-fg-2">Bidder account · {user?.email}</span>
        </div>
        <form action={logout}>
          <button type="submit" className="btn btn-secondary">Sign out</button>
        </form>
      </section>
    </PageBody>
  );
}
