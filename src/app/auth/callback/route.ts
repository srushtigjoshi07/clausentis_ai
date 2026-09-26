import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/auth-roles';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;
      let role: UserRole = 'bidder';

      // The profiles table is the only trusted source of the user's role
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile?.role) {
          role = profile.role as UserRole;
        }
      } catch (err) {
        console.warn('Profile role lookup in callback error:', err);
      }

      // Only allow same-origin relative paths; "//evil.com" or "https://..." would be an open redirect.
      const safeNext = next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : null;
      const redirectPath = safeNext || (role === 'tender_authority' ? '/authority/dashboard' : '/bidder/dashboard');
      return NextResponse.redirect(new URL(redirectPath, origin));
    }
  }

  // If code exchange failed or expired
  return NextResponse.redirect(
    new URL('/login?error=verification_failed_or_expired', origin)
  );
}
