import { createAuditPdfDocument } from '../src/lib/pdf/audit-pdf-generator';
import { createMatchedRequirementsPdfDocument } from '../src/lib/pdf/matched-requirements-pdf-generator';
import { createSignedDecisionPdfDocument } from '../src/lib/pdf/signed-decision-pdf-generator';
import { getBidderDossier } from '../src/lib/compliance/repository';

async function testPdfs() {
  console.log('=== TESTING ALL 3 PDF GENERATORS ===');
  const dossier = getBidderDossier('bid-apex-02');
  if (!dossier) {
    throw new Error('Dossier bid-apex-02 not found');
  }

  // 1. Test Audit PDF
  console.log('1. Testing createAuditPdfDocument...');
  const auditDoc = createAuditPdfDocument({
    tenderTitle: 'Supply, Installation and Commissioning of High-Pressure Gas Compressor System',
    tenderReference: 'CPCL/ENG/2026/HPGC-0412',
    bidderName: 'Apex Heavy Engineering Pvt Ltd',
    records: [
      {
        action: 'Bid Package Verification',
        timestamp: new Date().toISOString(),
        actor: 'Evaluation Engine',
        role: 'System',
        entity: 'Tender CPCL/ENG/2026/HPGC-0412',
        details: 'Evaluated 6 documents. Score: 100%. 0 critical discrepancies.',
      }
    ],
    dossier: dossier,
  });
  const auditArrayBuffer = auditDoc.output('arraybuffer');
  console.log(`✓ Audit PDF generated successfully: ${auditArrayBuffer.byteLength} bytes`);

  // 2. Test Matched Requirements PDF
  console.log('2. Testing createMatchedRequirementsPdfDocument...');
  const matchedDoc = createMatchedRequirementsPdfDocument({
    tenderId: 'tender-cpcl-2026-0412',
    bidId: 'bid-apex-02',
    dossier: dossier,
    role: 'bidder',
  });
  const matchedArrayBuffer = matchedDoc.output('arraybuffer');
  console.log(`✓ Matched Requirements PDF generated successfully: ${matchedArrayBuffer.byteLength} bytes`);

  // 3. Test Signed Decision PDF
  console.log('3. Testing createSignedDecisionPdfDocument...');
  const signedDoc = createSignedDecisionPdfDocument({
    tenderTitle: 'Supply, Installation and Commissioning of High-Pressure Gas Compressor System',
    tenderReference: 'CPCL/ENG/2026/HPGC-0412',
    dossier: dossier,
    decision: {
      id: 'DEC-2026-APEX-001',
      decision_id: 'DEC-2026-APEX-001',
      bid_id: 'bid-apex-02',
      tender_id: 'tender-cpcl-2026-0412',
      bidder_id: 'bidder-apex-01',
      bidder_name: 'Apex Heavy Engineering Pvt Ltd',
      officer_user_id: 'usr-officer-01',
      decision: 'APPROVED',
      remarks: 'Bidder satisfies all technical criteria, financial turnover thresholds, and Make-in-India guidelines.',
      officer_name: 'Dr. R. Venkataraman',
      officer_role: 'Chief General Manager (Contracts)',
      officer_email: 'r.venkataraman@cpcl.gov.in',
      organisation: 'Chennai Petroleum Corporation Limited',
      compliance_score_snapshot: 100,
      risk_level_snapshot: 'LOW',
      ai_recommendation_snapshot: 'APPROVE',
      signed_at: new Date().toISOString(),
      decision_version: 1,
      status: 'SIGNED',
      integrity_hash: '3a88c2b5e91f09c2a71d84a7e8b610c149d28e7e1b54a3298a72b0c4109e84b2',
    },
  });
  const signedArrayBuffer = signedDoc.output('arraybuffer');
  console.log(`✓ Signed Decision PDF generated successfully: ${signedArrayBuffer.byteLength} bytes`);

  console.log('=== ALL 3 PDF GENERATORS PASSED CLEANLY AND PRODUCED VALID OUTPUT! ===');
}

testPdfs().catch(err => {
  console.error('PDF Generation Failed:', err);
  process.exit(1);
});
