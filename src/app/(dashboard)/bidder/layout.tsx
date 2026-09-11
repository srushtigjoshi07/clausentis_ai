import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BidderShell } from '@/components/bidder/bidder-shell';
import type { UserRole } from '@/types/auth-roles';

export default async function BidderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Authoritative role check: verify in profiles table or user_metadata
  let role: UserRole = (user.user_metadata?.role as UserRole) || 'bidder';
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role) {
      role = profile.role as UserRole;
    }
  } catch {
    // fallback to metadata
  }

  // If authority attempts to access bidder private routes, redirect to authority dashboard
  if (role === 'tender_authority') {
    redirect('/authority/dashboard');
  }

  return <BidderShell user={user}>{children}</BidderShell>;
}
