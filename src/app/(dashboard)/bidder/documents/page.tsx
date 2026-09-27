import { getBidderDocuments } from '@/lib/actions/documents';
import { searchActiveTendersAction } from '@/lib/actions/tender-discovery';
import { Legend, PageBody, PageHeader } from '@/components/v2/ui';
import { ValidityTimeline } from '@/components/v2/charts';
import { VaultTable, VaultUpload } from '@/components/v2/bidder/VaultManager';
import { formatDate } from '@/components/v2/status';

export const metadata = { title: 'Document vault · Clausentis bidder portal' };
export const dynamic = 'force-dynamic';

export default async function DocumentVaultPage() {
  const now = new Date();
  const [docs, search] = await Promise.all([getBidderDocuments(), searchActiveTendersAction({})]);

  return (
    <PageBody className="max-w-none">
      <PageHeader eyebrow="Document vault" title="Upload once, reuse in every bid" actions={<VaultUpload />} />

      <section aria-label="Validity timeline" className="card flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="h2">Validity against upcoming closing dates</h2>
            <span className="text-xs text-fg-3">Next six months · today {formatDate(now.toISOString())}</span>
          </div>
          <Legend
            items={[
              { label: 'Valid', swatch: 'ink' },
              { label: 'Expires in window', swatch: 'review' },
              { label: 'Tender closes', swatch: 'line' },
            ]}
          />
        </div>
        <ValidityTimeline
          from={now}
          docs={[]}
          closes={search.tenders.map((t) => ({ key: t.id, label: t.referenceNumber.split('/')[0], date: t.closingDate }))}
        />
        <span className="text-xs text-fg-2">
          Vault documents don&apos;t carry an expiry date yet, so only tender closing dates are shown. Certificates are checked for validity when you run a bid check.
        </span>
      </section>

      <section aria-label="Documents" className="card overflow-x-auto">
        <VaultTable docs={docs} />
      </section>
    </PageBody>
  );
}
