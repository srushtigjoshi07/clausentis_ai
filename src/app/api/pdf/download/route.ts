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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'matched-requirements';
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
      const decision = decRes.decision || {
        id: 'dec-uuid-apex-01',
        decision_id: 'DEC-CPCL-2026-0412-001',
        tender_id: tenderId,
        bid_id: bidId,
        bidder_id: 'CL-2026-91C25F34',
        bidder_name: dossier.bidderName,
        officer_user_id: 'officer-cpcl-01',
        officer_name: 'Dr. R. Venkataraman',
        officer_email: 'r.venkataraman@cpcl.gov.in',
        organisation: 'Chennai Petroleum Corporation Limited',
        officer_role: 'Senior Procurement Officer',
        decision: 'APPROVED' as const,
        remarks: 'All mandatory requirements verified against statutory registries and audited accounts.',
        compliance_score_snapshot: dossier.complianceScore,
        risk_level_snapshot: dossier.riskLevel,
        ai_recommendation_snapshot: 'COMPLIANT',
        signed_at: new Date().toISOString(),
        decision_version: 1,
        status: 'SIGNED' as const,
        integrity_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
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
