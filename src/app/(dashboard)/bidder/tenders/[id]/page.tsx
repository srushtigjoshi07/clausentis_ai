import { redirect } from 'next/navigation';

export default async function BidderTenderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/bidder/tenders?tenderId=${id}&step=overview`);
}
