import { redirect } from 'next/navigation';

export default async function BidderTenderEligibilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/bidder/tenders?tenderId=${id}&step=intake`);
}
