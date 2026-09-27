import Link from 'next/link';
import { Plus } from 'lucide-react';
import { listBidSummaries, listPortalTenders } from '@/lib/views/officer';
import { PageBody, PageHeader } from '@/components/v2/ui';
import { TendersTable, type TenderRow } from '@/components/v2/officer/TendersTable';
import { daysUntil, formatDate, relativeDays, toCrore } from '@/components/v2/status';

export const metadata = { title: 'Tenders · Clausentis officer portal' };
export const dynamic = 'force-dynamic';

export default async function AuthorityTendersPage() {
  const now = new Date();
  const [tenders, bids] = [await listPortalTenders(), listBidSummaries()];

  const rows: TenderRow[] = tenders.map((t) => {
    const tBids = bids.filter((b) => b.tenderId === t.id);
    const days = t.closingDate ? daysUntil(t.closingDate, now) : null;
    const undecided = tBids.filter((b) => !b.decision).length;
    const stage: TenderRow['stage'] =
      tBids.length > 0 && undecided === 0 ? 'Decided' : tBids.length > 0 ? 'Evaluating' : days !== null && days < 0 ? 'Closed' : 'Accepting bids';
    return {
      id: t.id,
      reference: t.reference,
      title: t.title,
      organisation: t.organisation,
      location: t.location,
      category: t.category,
      valueLabel: toCrore(t.estimatedValue) !== null ? `₹${toCrore(t.estimatedValue)!.toFixed(2)} Cr` : t.estimatedValue,
      valueCr: toCrore(t.estimatedValue),
      closeLabel: t.closingDate ? formatDate(t.closingDate) : 'Not set',
      closeRelative: relativeDays(days),
      bids: tBids.length,
      stage,
    };
  });

  return (
    <PageBody>
      <PageHeader
        eyebrow="Tenders"
        title="Tenders on Clausentis"
        actions={
          <Link href="/authority/tenders/new" className="btn btn-primary">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Publish tender
          </Link>
        }
      />
      <TendersTable rows={rows} />
    </PageBody>
  );
}
