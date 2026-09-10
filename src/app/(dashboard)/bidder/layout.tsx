import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BidderShell } from '@/components/bidder/bidder-shell';

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

  return <BidderShell user={user}>{children}</BidderShell>;
}
