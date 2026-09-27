import { getAllBidderDossiers } from '@/lib/compliance/repository';
import { PageBody, PageHeader, SandboxBadge } from '@/components/v2/ui';
import { PortalVerification, type PrefillBid } from '@/components/v2/officer/PortalVerification';

export const metadata = { title: 'Portal verification · Clausentis officer portal' };
export const dynamic = 'force-dynamic';

export default function PortalVerificationPage() {
  const bids: PrefillBid[] = getAllBidderDossiers().map((d) => ({
    bidId: d.bidId,
    bidderName: d.bidderName,
    pan: d.pan,
    gstin: d.gstin,
    udyamNumber: d.udyamNumber,
    cin: /^(CIN\s*)?[LU]\d{5}/i.test(d.registrationNumber) ? d.registrationNumber.replace(/^CIN\s*/i, '') : '',
  }));

  return (
    <PageBody>
      <PageHeader
        eyebrow="Portal verification"
        title="Check an entity across government sources"
        actions={<SandboxBadge label="Sandbox data · no live APIs yet" tone="review" />}
      />
      <PortalVerification bids={bids} />
    </PageBody>
  );
}
