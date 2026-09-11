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
      let role: UserRole = (user.user_metadata?.role as UserRole) || 'bidder';

      // Read database profile role if available
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

      const redirectPath = next || (role === 'tender_authority' ? '/authority/dashboard' : '/bidder/dashboard');
      const response = NextResponse.redirect(new URL(redirectPath, origin));
      response.cookies.set('clausentis_role', role, { path: '/', maxAge: 60 * 60 * 24 * 30 });
      response.cookies.set('clausentis_user_id', user.id, { path: '/', maxAge: 60 * 60 * 24 * 30 });
      return response;
    }
  }

  // If code exchange failed or expired
  return NextResponse.redirect(
    new URL('/login?error=verification_failed_or_expired', origin)
  );
}
