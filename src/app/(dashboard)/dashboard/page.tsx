import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Retired shared dashboard. Retired routes (/tenders, /documents, /reports, /settings)
 * redirect here from next.config; this sends the user to their own portal using
 * profiles.role (the proxy does the same before this page renders).
 */
export default async function DashboardRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  redirect(data?.role === 'tender_authority' ? '/authority/dashboard' : '/bidder/dashboard');
}
