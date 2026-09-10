import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AuthorityShell } from '@/components/authority/authority-shell';

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

  return <AuthorityShell user={user}>{children}</AuthorityShell>;
}
