import { NextRequest, NextResponse } from 'next/server';
import { 
  generateMultiBidderMatchedRequirementsPdfBuffer 
} from '@/lib/pdf/multi-bidder-matched-requirements-pdf-generator';
import { 
  generateMatchedRequirementsPdfBuffer 
} from '@/lib/pdf/matched-requirements-pdf-generator';
import { 
  generateAuditPdfBuffer 
} from '@/lib/pdf/audit-pdf-generator';
import { 
  generateSignedDecisionPdfBuffer 
} from '@/lib/pdf/signed-decision-pdf-generator';
import { getAllBidderDossiers, getBidderDossier, STANDARD_CPCL_REQUIREMENTS } from '@/lib/compliance/repository';
import { generatePdfFilename } from '@/lib/pdf/pdf-download-helper';
import { getLatestProcurementDecision } from '@/lib/actions/decisions';
import { getUserProfile } from '@/app/auth/actions';

// Documents that expose other bidders' data or officer decisions.
const AUTHORITY_ONLY_TYPES = new Set(['matched-requirements', 'multi-matched-requirements', 'audit', 'signed-decision']);

export async function GET(req: NextRequest) {
  const profile = await getUserProfile();
  if (!profile) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'matched-requirements';
    if (AUTHORITY_ONLY_TYPES.has(type) && profile.role !== 'tender_authority') {
      return NextResponse.json({ error: 'Only Tender Authority officers can download this document' }, { status: 403 });
    }
    const tenderId = searchParams.get('tenderId') || 'tender-cpcl-2026-0412';
    const bidId = searchParams.get('bidId') || 'bid-apex-02';

    let buffer: ArrayBuffer;
    let filename: string;

    if (type === 'matched-requirements' || type === 'multi-matched-requirements') {
      let dossiers = getAllBidderDossiers(tenderId);
      if (!dossiers || dossiers.length === 0) {
        dossiers = getAllBidderDossiers();
      }
      const tenderRef = dossiers[0]?.tenderReference || 'CPCL/ENG/2026/HPGC-0412';
      filename = generatePdfFilename('matched-requirements', tenderRef);
      buffer = await generateMultiBidderMatchedRequirementsPdfBuffer({
        tenderId,
        tenderTitle: dossiers[0]?.tenderTitle,
        tenderReference: tenderRef,
        tenderAuthority: 'Chennai Petroleum Corporation Limited (CPCL)',
        dossiers,
        requirements: STANDARD_CPCL_REQUIREMENTS,
      });
    } else if (type === 'single-matched-requirements' || type === 'compliance-report') {
      const dossier = getBidderDossier(bidId) || getAllBidderDossiers()[0];
      // Bidders may only export their own submitted bid (seeded demo dossiers have no owner).
      if (profile.role !== 'tender_authority' && dossier.ownerUserId && dossier.ownerUserId !== profile.id) {
        return NextResponse.json({ error: 'You can only download reports for your own bids' }, { status: 403 });
      }
      const docType = type === 'compliance-report' ? 'compliance-report' : 'matched-requirements';
      filename = generatePdfFilename(docType, dossier.shortName || dossier.bidderName);
      buffer = await generateMatchedRequirementsPdfBuffer({
        dossier,
        role: 'tender_authority',
        documentType: docType as 'compliance-report' | 'matched-requirements',
      });
    } else if (type === 'audit') {
      const dossier = getBidderDossier(bidId) || getAllBidderDossiers()[0];
      filename = generatePdfFilename('audit', dossier.bidId || tenderId);
      buffer = await generateAuditPdfBuffer({
        tenderTitle: dossier.tenderTitle,
        tenderReference: dossier.tenderReference,
        bidderName: dossier.bidderName,
        bidderGstin: dossier.gstin,
        identifier: dossier.bidId,
        records: dossier.auditEvents || [],
        dossier,
        documentType: 'audit',
      });
    } else if (type === 'signed-decision') {
      const dossier = getBidderDossier(bidId) || getAllBidderDossiers()[0];
      filename = generatePdfFilename('signed-decision', dossier.shortName || dossier.bidderName);
      const decRes = await getLatestProcurementDecision(bidId);
      // Never render a "signed" PDF for a decision that was not actually signed.
      const decision = decRes.decision;
      if (!decision) {
        return NextResponse.json({ error: 'No signed decision exists for this bid' }, { status: 404 });
      }
      const uint8 = generateSignedDecisionPdfBuffer({
        decision,
        dossier,
        tenderTitle: dossier.tenderTitle,
        tenderReference: dossier.tenderReference,
      });
      buffer = uint8.buffer as ArrayBuffer;
    } else {
      return NextResponse.json({ error: 'Unknown document type' }, { status: 400 });
    }

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: unknown) {
    console.error('[API:PDF:Download] Error generating PDF:', err);
    return NextResponse.json(
      { error: (err as Error)?.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
