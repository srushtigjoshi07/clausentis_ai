import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  // Refresh the session and get the user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const roleCookie = request.cookies.get('clausentis_role')?.value;
  const userRole = roleCookie === 'tender_authority' ? 'tender_authority' : 'bidder';

  // 1. Unauthenticated users cannot access protected routes
  const isProtectedRoute = 
    url.pathname.startsWith('/bidder') ||
    url.pathname.startsWith('/authority') ||
    url.pathname.startsWith('/dashboard') ||
    url.pathname.startsWith('/documents') ||
    url.pathname.startsWith('/reports') ||
    url.pathname.startsWith('/settings');

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

  return supabaseResponse;
}
