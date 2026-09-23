import { 
  generatePdfFilename, 
  sanitizeFilenamePart, 
  isValidPdfBytes 
} from '../src/lib/pdf/pdf-download-helper';
import { 
  createMatchedRequirementsPdfDocument, 
  generateMatchedRequirementsPdfBuffer 
} from '../src/lib/pdf/matched-requirements-pdf-generator';
import { 
  createAuditPdfDocument, 
  generateAuditPdfBuffer 
} from '../src/lib/pdf/audit-pdf-generator';
import { 
  createSignedDecisionPdfDocument, 
  generateSignedDecisionPdfBuffer 
} from '../src/lib/pdf/signed-decision-pdf-generator';
import { getBidderDossier } from '../src/lib/compliance/repository';
import type { ProcurementDecisionRecord } from '../src/types/procurement-decision';

async function runPdfTests() {
  console.log('====================================================');
  console.log('TESTING CLAUSENTIS PDF GENERATION & DOWNLOAD PIPELINE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✕ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Filename Sanitization & Generation Tests
  const name1 = generatePdfFilename('matched-requirements', 'Apex Heavy Engineering Pvt Ltd', '2026-09-12');
  assert(name1 === 'clausentis-matched-requirements-apex-heavy-engineering-pvt-ltd-2026-09-12.pdf', 'Matched Requirements filename matches standard convention');

  const name2 = generatePdfFilename('audit', 'bid-apex-02', '2026-09-12');
  assert(name2 === 'clausentis-audit-bid-apex-02-2026-09-12.pdf', 'Audit PDF filename matches user example format');

  const name3 = generatePdfFilename('compliance-report', 'Apex Heavy', '2026-09-12');
  assert(name3 === 'clausentis-compliance-report-apex-heavy-2026-09-12.pdf', 'Compliance report filename matches user example');

  const name4 = generatePdfFilename('signed-decision', 'Apex Heavy', '2026-09-12');
  assert(name4 === 'clausentis-signed-decision-apex-heavy-2026-09-12.pdf', 'Signed decision filename matches user example');

  const sanitizedIllegal = sanitizeFilenamePart('ABC/DEF:GHI*JKL?MNO"PQR<STU>VWX|YZ 2026');
  assert(!/[/\\:*?"<>|]/.test(sanitizedIllegal), 'Sanitizer removes all forbidden OS characters');
  assert(!sanitizedIllegal.includes(' '), 'Sanitizer replaces whitespace with hyphens');
  assert(!sanitizedIllegal.includes('--'), 'Sanitizer collapses multiple hyphens');

  // 2. Matched Requirements PDF Generation
  const dossier = getBidderDossier('bid-apex-02');
  assert(dossier !== null, 'Dossier for bid-apex-02 resolved');

  if (dossier) {
    const matchedPdfBuffer = await generateMatchedRequirementsPdfBuffer({ dossier });
    assert(matchedPdfBuffer.byteLength > 0, `Matched Requirements PDF generated (${matchedPdfBuffer.byteLength} bytes)`);
    assert(isValidPdfBytes(matchedPdfBuffer), 'Matched Requirements PDF starts with %PDF magic bytes');

    // 3. Audit Trail PDF Generation
    const auditPdfBuffer = await generateAuditPdfBuffer({
      tenderTitle: dossier.tenderTitle,
      tenderReference: dossier.tenderReference,
      bidderName: dossier.bidderName,
      identifier: dossier.bidId,
      records: [
        {
          timestamp: '12 Sep 2026, 14:30 IST',
          actor: 'Dr. R. Venkataraman',
          role: 'Procurement Officer',
          action: 'Compliance Evaluated',
          details: 'Evaluated 10 mandatory and optional requirements.',
        }
      ],
      dossier,
    });
    assert(auditPdfBuffer.byteLength > 0, `Audit Trail PDF generated (${auditPdfBuffer.byteLength} bytes)`);
    assert(isValidPdfBytes(auditPdfBuffer), 'Audit Trail PDF starts with %PDF magic bytes');

    // 4. Signed Decision PDF Generation
    const dummyDecision: ProcurementDecisionRecord = {
      id: 'dec-uuid-test-01',
      decision_id: 'DEC-CPCL-2026-0412-001',
      tender_id: dossier.tenderId,
      bid_id: dossier.bidId,
      bidder_id: dossier.registrationNumber,
      bidder_name: dossier.bidderName,
      officer_user_id: 'officer-01',
      officer_name: 'Dr. R. Venkataraman',
      officer_email: 'r.venkataraman@cpcl.gov.in',
      organisation: 'Chennai Petroleum Corporation Limited',
      officer_role: 'Senior Procurement Officer',
      decision: 'APPROVED',
      remarks: 'All criteria satisfied.',
      compliance_score_snapshot: 100,
      risk_level_snapshot: 'LOW',
      ai_recommendation_snapshot: 'COMPLIANT',
      signed_at: new Date().toISOString(),
      decision_version: 1,
      status: 'SIGNED',
      integrity_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const signedPdfBuffer = generateSignedDecisionPdfBuffer({
      decision: dummyDecision,
      dossier,
    });
    assert(signedPdfBuffer.byteLength > 0, `Signed Decision PDF generated (${signedPdfBuffer.byteLength} bytes)`);
    assert(isValidPdfBytes(signedPdfBuffer), 'Signed Decision PDF starts with %PDF magic bytes');
  }

  console.log('\n====================================================');
  console.log(`PDF TESTS COMPLETED: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPdfTests().catch((err) => {
  console.error('Fatal error running PDF tests:', err);
  process.exit(1);
});
