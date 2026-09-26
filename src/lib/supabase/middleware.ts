import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

  const url = request.nextUrl.clone();
  const isProtectedRoute =
    url.pathname.startsWith('/bidder') ||
    url.pathname.startsWith('/authority') ||
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/documents') ||
    url.pathname.startsWith('/reports') ||
    url.pathname.startsWith('/settings') ||
    url.pathname.startsWith('/tenders');

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtectedRoute) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  try {
    // Refresh the session and get the user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Resolve role from the profiles table only. user_metadata is writable by the
    // user via supabase.auth.updateUser() and cookies are client-controlled, so
    // neither can be trusted for authorization.
    let userRole: 'tender_authority' | 'bidder' = 'bidder';
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      userRole = profile?.role === 'tender_authority' ? 'tender_authority' : 'bidder';
    }

    // 1. Unauthenticated users cannot access protected routes
    if (isProtectedRoute && !user) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // 2. Redirect authenticated users away from auth pages to their dedicated dashboard
    if (url.pathname.startsWith('/login') || url.pathname.startsWith('/signup')) {
      if (user) {
        url.pathname = userRole === 'tender_authority' ? '/authority/dashboard' : '/bidder/dashboard';
        return NextResponse.redirect(url);
      }
    }

    // 3. Root /dashboard redirect to role-specific dashboard
    if (url.pathname === '/dashboard') {
      url.pathname = userRole === 'tender_authority' ? '/authority/dashboard' : '/bidder/dashboard';
      return NextResponse.redirect(url);
    }

    // 4. Role Guard: Bidder attempting to access Authority routes
    if (url.pathname.startsWith('/authority') && userRole !== 'tender_authority') {
      url.pathname = '/bidder/dashboard';
      return NextResponse.redirect(url);
    }

    // 5. Role Guard: Authority attempting to access Bidder-only private routes
    if (url.pathname.startsWith('/bidder') && userRole === 'tender_authority') {
      url.pathname = '/authority/dashboard';
      return NextResponse.redirect(url);
    }
  } catch {
    if (isProtectedRoute) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

