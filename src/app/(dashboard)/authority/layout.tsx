import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AuthorityShell } from '@/components/authority/authority-shell';
import type { UserRole } from '@/types/auth-roles';

export default async function AuthorityLayout({
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

  // If a bidder attempts to access authority routes directly, redirect to bidder dashboard
  if (role !== 'tender_authority') {
    redirect('/bidder/dashboard');
  }

  return <AuthorityShell user={user}>{children}</AuthorityShell>;
}
