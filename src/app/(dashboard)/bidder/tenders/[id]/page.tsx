import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDiscoveredTenderAction, getSavedBidderProfileAction } from '@/lib/actions/tender-discovery';
import { getBidderDocuments } from '@/lib/actions/documents';
import { BID_DOCS_NEEDED, BID_DOC_TO_VAULT, eligibilityFor } from '@/lib/views/bidder';
import { EmptyState, PageBody } from '@/components/v2/ui';
import { BulletChart, type BulletRow } from '@/components/v2/charts';
import { formatDate } from '@/components/v2/status';

export const dynamic = 'force-dynamic';

export default async function BidderTenderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tender = await getDiscoveredTenderAction(decodeURIComponent(id));
  if (!tender) notFound();
  const [profile, vault] = await Promise.all([getSavedBidderProfileAction(), getBidderDocuments()]);
  const e = eligibilityFor(tender, profile);

  const bullets: BulletRow[] = [
    { key: 't', label: 'Average turnover', sub: 'Financial · ₹ crore', threshold: e.turnover.need, actual: e.turnover.you, unit: 'Cr' },
    { key: 'e', label: 'Similar experience', sub: 'Experience · years', threshold: e.experience.need, actual: e.experience.you, unit: 'yrs' },
  ];
  const vaultTypes = new Set(vault.map((d) => d.document_type));
  const docs = BID_DOCS_NEEDED.map((d) => ({
    ...d,
    inVault: (BID_DOC_TO_VAULT[d.type] ?? []).some((v) => vaultTypes.has(v)),
  }));
  const inVault = docs.filter((d) => d.inVault).length;
  const statusPill =
    e.status === 'qualify'
      ? { cls: 'pill-pass', label: 'Likely eligible' }
      : e.status === 'short'
        ? { cls: 'pill-fail', label: 'Below a minimum' }
        : { cls: 'pill-neutral', label: 'Figures not declared' };

  return (
    <PageBody className="max-w-none">
      <header className="flex flex-col gap-2.5">
        <Link href="/bidder/tenders" className="self-start text-xs text-fg-2 hover:text-brand hover:underline">← Find tenders</Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-[820px] flex-col gap-1.5">
            <span className="mono text-xs text-fg-2">{tender.referenceNumber} · {tender.issuingOrganisation}</span>
            <h1 className="h1">{tender.title}</h1>
          </div>
          <Link href={`/bidder/tenders/${tender.id}/prepare`} className="btn btn-primary" style={{ minHeight: 44 }}>Prepare my bid</Link>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-fg-2">
          <span>Closes <strong className="text-fg">{formatDate(tender.closingDate)}, {tender.closingTime}</strong></span>
          <span>Estimate {tender.estimatedValue}</span>
          <span>EMD {tender.emdAmount}</span>
          <span>{tender.location}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <section aria-label="Eligibility pre-check" className="card flex flex-col gap-3.5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex flex-col gap-1">
              <h2 className="h2">Eligibility pre-check</h2>
              <span className="text-xs text-fg-3">From your company profile. Documents are verified in the next step.</span>
            </div>
            <span className={`pill ${statusPill.cls}`}>{statusPill.label}</span>
          </div>
          <BulletChart
            rows={bullets}
            ariaLabel="Your declared figures against this tender's minimums"
            actualLabel="Your profile"
            thresholdLabel="Tender minimum"
          />
          {e.status === 'unknown' ? (
            <span className="text-xs text-fg-2">
              Declared figures missing. <Link href="/bidder/settings" className="link">Add them to your profile</Link> to pre-check eligibility.
            </span>
          ) : null}
          <p className="m-0 text-xs text-fg-3">The tender also asks for {tender.similarProjectsRequired} similar completed projects; that is checked from your work orders.</p>
        </section>

        <section aria-label="Documents needed" className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 pb-2.5 pt-4">
            <h2 className="h2">Documents you&apos;ll need</h2>
            <span className="mono text-xs text-fg-2">{inVault} of {docs.length} in vault</span>
          </div>
          <ul className="m-0 list-none p-0">
            {docs.map((d) => (
              <li key={d.type} className="tr flex items-center justify-between gap-2.5 px-5 py-2.5 text-xs">
                <span>{d.label}</span>
                <span className={`pill ${d.inVault ? 'pill-pass' : 'pill-neutral'}`}>{d.inVault ? 'In vault' : 'Upload'}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-label="Tender documents" className="card overflow-hidden">
        <div className="px-5 pb-2 pt-4"><h2 className="h2">Tender documents</h2></div>
        {tender.documents.length ? (
          <ul className="m-0 list-none p-0">
            {tender.documents.map((d) => (
              <li key={d.id} className="tr flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-semibold">{d.title}</span>
                  {d.description ? <span className="text-xs text-fg-2">{d.description}</span> : null}
                </span>
                <span className="mono shrink-0 text-[11px] text-fg-3">{d.fileName}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 pb-5"><EmptyState title="No documents listed" /></div>
        )}
      </section>
    </PageBody>
  );
}
