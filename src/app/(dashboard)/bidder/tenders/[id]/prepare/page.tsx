import { notFound } from 'next/navigation';
import { getDiscoveredTenderAction, getSavedBidderProfileAction } from '@/lib/actions/tender-discovery';
import { getDemoBidderProfile } from '@/lib/tender-discovery/bid-compliance-verifier';
import { PrepareBid } from '@/components/v2/bidder/PrepareBid';
import { PageBody } from '@/components/v2/ui';

export const metadata = { title: 'Prepare & check bid · Clausentis bidder portal' };
export const dynamic = 'force-dynamic';

export default async function PrepareBidPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tender = await getDiscoveredTenderAction(decodeURIComponent(id));
  if (!tender) notFound();
  const saved = await getSavedBidderProfileAction();

  return (
    <PageBody className="max-w-none">
      <PrepareBid tender={tender} profile={saved ?? getDemoBidderProfile()} profileSaved={Boolean(saved)} />
    </PageBody>
  );
}
