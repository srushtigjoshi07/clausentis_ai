/* eslint-disable @typescript-eslint/no-explicit-any -- loose test double for the Supabase client */
// Test-only stand-in for '@/lib/supabase/server' so server actions can run outside a Next request.
// STUB_ROLE selects the profile role returned for the fake signed-in user.
const USER_ID = '00000000-0000-0000-0000-000000000001';
function query(table: string): any {
  const result = table === 'profiles'
    ? { data: { id: USER_ID, role: process.env.STUB_ROLE || 'bidder', full_name: 'Test User', company_name: 'Test Org' }, error: null }
    : { data: null, error: { message: 'stub' } };
  const q: any = new Proxy(function () {}, {
    get: (_t, p) => (p === 'then' ? (resolve: any) => resolve(result) : () => q),
    apply: () => q,
  });
  return q;
}
export async function createClient() {
  return {
    auth: { getUser: async () => ({ data: { user: { id: USER_ID, email: 'test@example.com', user_metadata: {} } } }) },
    from: (t: string) => query(t),
    storage: { from: () => query('storage') },
  } as any;
}
