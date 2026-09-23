/**
 * Clausentis Automated Forensics & Tamper Detection Verification Suite
 * 
 * Tests the deterministic byte-level forensics engine against synthetic and realistic artifacts:
 * - Case A: Genuine PDF (%PDF-1.7, 1 EOF, standard enterprise producer, digital signature)
 * - Case B: Incremental Alterations (Multiple %%EOF markers indicating appended revisions)
 * - Case C: Graphic Editor Footprint (Canva / Adobe Photoshop metadata on statutory document)
 * - Case D: Scanned Raster Image (Pure image scan without vector text layer)
 * - Case E: Unreachable Government Portal (Fail-safe UNABLE_TO_VERIFY fallback)
 */

import { analyzeDocumentForensics } from '../src/lib/forensics/analyzer';
import { UdyamProvider } from '../src/lib/providers/providers';
import type { DocumentForensicReport } from '../src/lib/forensics/types';

function createSyntheticPdf(options: {
  version?: string;
  revisions?: number;
  producer?: string;
  creator?: string;
  hasSignature?: boolean;
  hasTextStream?: boolean;
  hasImageStream?: boolean;
}): Buffer {
  const version = options.version ?? '1.7';
  let content = `%PDF-${version}\n`;
  content += `%âãÏÓ\n`; // Binary marker
  
  content += `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  content += `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;

  // Info object
  const producer = options.producer ?? 'Apache FOP Version 2.3';
  const creator = options.creator ?? 'Government of India e-Tendering Engine';
  content += `4 0 obj\n<< /Producer (${producer}) /Creator (${creator}) /CreationDate (D:20260901120000Z) >>\nendobj\n`;

  // Page object
  content += `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 5 0 R >>\nendobj\n`;

  // Stream object
  if (options.hasTextStream !== false) {
    content += `5 0 obj\n<< /Length 68 /Filter /FlateDecode >>\nstream\nBT /F1 12 Tf 100 700 Td (Verified Form GST REG-06 Active Taxpayer) Tj ET\nendstream\nendobj\n`;
  } else if (options.hasImageStream) {
    content += `5 0 obj\n<< /Length 40 /Type /XObject /Subtype /Image /Width 100 /Height 100 /ColorSpace /DeviceRGB >>\nstream\n[BINARY_PIXEL_DATA]\nendstream\nendobj\n`;
  }

  // Digital signature dictionary
  if (options.hasSignature) {
    content += `6 0 obj\n<< /Type /Sig /Filter /Adobe.PPKLite /SubFilter /adbe.pkcs7.detached /ByteRange [0 1000 1200 400] /Contents <308202...> >>\nendobj\n`;
  }

  // Xref and EOF revisions
  const revisions = options.revisions ?? 1;
  for (let r = 1; r <= revisions; r++) {
    content += `xref\n0 7\n0000000000 65535 f \ntrailer\n<< /Size 7 /Root 1 0 R /Info 4 0 R >>\nstartxref\n${500 * r}\n%%EOF\n`;
  }

  return Buffer.from(content, 'utf-8');
}

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('CLAUSENTIS FORENSICS & TAMPER DETECTION AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // Case A: Genuine PDF
  // -------------------------------------------------------------
  console.log('TEST 1: Genuine PDF Verification');
  const genuinePdfBuffer = createSyntheticPdf({
    version: '1.7',
    revisions: 1,
    producer: 'Apache FOP 2.3 - GSTN Portal',
    hasSignature: true,
    hasTextStream: true,
  });

  const reportA = analyzeDocumentForensics(genuinePdfBuffer, 'Genuine_GST_Certificate.pdf');
  assert(reportA.overallStatus === 'PASS', 'Case A: Overall status is PASS');
  assert(reportA.overallSeverity === 'LOW', 'Case A: Overall severity is LOW');
  assert(reportA.hasDigitalSignature === true, 'Case A: Detects valid digital signature dictionary');
  assert(reportA.revisionCount === 1, 'Case A: Exactly 1 revision detected');
  assert(reportA.sha256Checksum.length === 64, 'Case A: Computes valid 64-char SHA-256 hash');
  console.log('');

  // -------------------------------------------------------------
  // Case B: Incremental Alterations (Multiple Revisions)
  // -------------------------------------------------------------
  console.log('TEST 2: Incremental Alteration Detection');
  const multiEofPdfBuffer = createSyntheticPdf({
    version: '1.5',
    revisions: 3, // 3 %%EOF markers!
    producer: 'Nitro PDF Pro v13.4',
    hasSignature: false,
    hasTextStream: true,
  });

  const reportB = analyzeDocumentForensics(multiEofPdfBuffer, 'Altered_Turnover_Form.pdf');
  assert(reportB.revisionCount === 3, 'Case B: Correctly counts 3 %%EOF revision markers');
  const revFinding = reportB.findings.find(f => f.check === 'PDF_REVISION_ANALYSIS');
  assert(revFinding !== undefined, 'Case B: PDF_REVISION_ANALYSIS check was executed');
  assert(revFinding?.status === 'WARNING' || revFinding?.status === 'SUSPICIOUS', 'Case B: Flagged as WARNING or SUSPICIOUS');
  assert(revFinding?.severity === 'MEDIUM', 'Case B: Severity is MEDIUM for multi-revision document');
  console.log('');

  // -------------------------------------------------------------
  // Case C: Graphic Editor Footprint on Statutory Document
  // -------------------------------------------------------------
  console.log('TEST 3: Graphic Design Software Footprint Detection');
  const canvaPdfBuffer = createSyntheticPdf({
    version: '1.4',
    revisions: 1,
    producer: 'Canva Web PDF Export',
    creator: 'Canva Desktop Application',
    hasSignature: false,
    hasTextStream: true,
  });

  const reportC = analyzeDocumentForensics(canvaPdfBuffer, 'Fabricated_Udyam_Certificate.pdf');
  assert(reportC.overallStatus === 'SUSPICIOUS', 'Case C: Overall status is SUSPICIOUS');
  assert(reportC.overallSeverity === 'HIGH', 'Case C: Severity is HIGH for graphic editor on statutory certificate');
  const metaFinding = reportC.findings.find(f => f.check === 'PDF_METADATA_ANALYSIS');
  assert(Boolean(metaFinding?.explanation.includes('Canva')), 'Case C: Identifies Canva software in explanation');
  assert(Boolean(metaFinding?.confidence && metaFinding.confidence >= 0.90), 'Case C: Confidence is >= 0.90 (certainty of tool string)');
  console.log('');

  // -------------------------------------------------------------
  // Case D: Scanned Raster Image Layer Classification
  // -------------------------------------------------------------
  console.log('TEST 4: Scanned Raster Layer Classification');
  const rasterPdfBuffer = createSyntheticPdf({
    version: '1.4',
    revisions: 1,
    producer: 'HP LaserJet Scanner',
    hasSignature: false,
    hasTextStream: false,
    hasImageStream: true,
  });

  const reportD = analyzeDocumentForensics(rasterPdfBuffer, 'Scanned_Affidavit.pdf');
  const layerFinding = reportD.findings.find(f => f.check === 'TEXT_IMAGE_LAYER_ANALYSIS');
  assert(layerFinding !== undefined, 'Case D: TEXT_IMAGE_LAYER_ANALYSIS check executed');
  assert(layerFinding?.status === 'WARNING', 'Case D: Pure raster scan flagged as WARNING');
  assert(layerFinding?.severity === 'LOW', 'Case D: Severity is LOW (scanned affidavits are common and not malicious)');
  console.log('');

  // -------------------------------------------------------------
  // Case E: Government Portal Gateway Fallback (UNABLE_TO_VERIFY)
  // -------------------------------------------------------------
  console.log('TEST 5: Government Registry Fallback (Fail-Safe)');
  const udyamProvider = new UdyamProvider();
  const fallbackResult = udyamProvider.verify({
    companyName: 'Apex Heavy Engineering Pvt Ltd',
    udyamNumber: 'UDYAM-TN-02-0049182-OFFLINE',
    pan: 'ABCDE1234F',
    documentsSubmitted: [
      {
        documentId: 'doc-01',
        documentType: 'udyam_certificate',
        documentName: 'Udyam_Certificate.pdf',
        pageNumber: 1,
      }
    ],
    verificationMode: 'DEMO_SANDBOX',
    evaluationDate: '2026-09-12',
  });

  assert(fallbackResult.status === 'UNABLE_TO_VERIFY', 'Case E: Provider status is UNABLE_TO_VERIFY');
  assert(fallbackResult.verified === false, 'Case E: Verified is false during offline window');
  assert(fallbackResult.governmentVerification?.status === 'UNABLE_TO_VERIFY', 'Case E: G2G record status is UNABLE_TO_VERIFY');
  assert(
    Boolean(fallbackResult.findingMessage?.includes('review') || fallbackResult.governmentVerification?.statusMessage.includes('review')),
    'Case E: Directs officer to manual review'
  );
  console.log('');

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('================================================================');
  console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
  console.log('================================================================');

  if (passedTests === totalTests) {
    console.log('ALL FORENSICS AND TAMPER DETECTION SCENARIOS PASSED CONCORDANTLY.');
    process.exit(0);
  } else {
    console.error('TEST FAILURES DETECTED.');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Error running test suite:', err);
  process.exit(1);
});
