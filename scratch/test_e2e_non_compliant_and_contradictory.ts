import fs from 'fs';
import path from 'path';
import { processBidderDocumentAction } from '../src/lib/actions/bid-document-processor';
import { runBidComplianceEvaluation } from '../src/lib/tender-discovery/bid-compliance-verifier';
import { getDiscoveredTenderAction } from '../src/lib/actions/tender-discovery';
import type { BidUploadedDocument, BidderProfile } from '../src/types/tender-discovery';

async function testNonCompliantAndContradictory() {
  console.log('=== STARTING NON-COMPLIANT & CONTRADICTORY BIDDER AUDIT ===\n');

  const tender = await getDiscoveredTenderAction('tender-cpcl-2026-0412');
  if (!tender) throw new Error('Tender not found');

  // ─────────────────────────────────────────────────────────────
  // TEST 1: BIDDER 02 (NON-COMPLIANT)
  // ─────────────────────────────────────────────────────────────
  console.log('--- AUDITING BIDDER 02 (NON-COMPLIANT) ---');
  const nonCompliantDir = path.resolve('bidders/bidder_02_non_compliant');
  const ncFiles = fs.readdirSync(nonCompliantDir).filter(f => f.endsWith('.pdf'));

  const ncDocs: BidUploadedDocument[] = [];
  for (const filename of ncFiles) {
    const filePath = path.join(nonCompliantDir, filename);
    const buffer = fs.readFileSync(filePath);
    const file = new File([buffer], filename, { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', file);

    const result = await processBidderDocumentAction(formData);
    if (!result.success || !result.doc) {
      throw new Error(`Failed to process ${filename}: ${result.error}`);
    }
    ncDocs.push(result.doc);
    console.log(`  Processed ${filename.padEnd(38)} -> Tag: ${result.doc.documentType.padEnd(26)} Facts: ${JSON.stringify(result.doc.extractedFacts)}`);
  }

  const ncProfile: BidderProfile = {
    companyName: 'Zenith Marine & Mechanical Works Ltd',
    registrationNumber: 'ROC-MH-MUM-2021-081726',
    gstin: '27AABCZ5678K1Z3',
    pan: 'AABCZ5678K',
    entityType: 'Public Limited',
    registeredAddress: 'Plot 18, MIDC Tarapur, Palghar, Maharashtra - 401506',
    contactPerson: 'Karan Mehra, VP Commercial',
    contactEmail: 'karan@zenithworks.co.in',
    contactPhone: '+91 98200 88776',
    annualTurnoverInCr: 4.8, // DEFICIT: required 10 Cr
    relevantExperienceYears: 2, // DEFICIT: required 5 years
  };

  const ncReport = runBidComplianceEvaluation(tender, ncProfile, ncDocs, 1);
  console.log(`\nBidder 02 Results:`);
  console.log(`  Overall Score: ${ncReport.overallScore}%`);
  console.log(`  Status: ${ncReport.status}`);
  console.log(`  Mandatory Passed: ${ncReport.mandatoryPassed}/${ncReport.mandatoryTotal}`);
  console.log(`  Mandatory Failed: ${ncReport.mandatoryFailed}`);
  console.log(`  Critical Findings Count: ${ncReport.criticalFindings.length}`);

  for (const finding of ncReport.criticalFindings) {
    console.log(`    [FAIL/HIGH_RISK] ${finding.title}: ${finding.required} | Bidder had: ${finding.evidence}`);
  }

  if (ncReport.mandatoryFailed === 0) {
    throw new Error('Bidder 02 was expected to have mandatory failures, but had 0!');
  }
  console.log('✓ Bidder 02 Non-Compliance correctly flagged with real failures!\n');

  // ─────────────────────────────────────────────────────────────
  // TEST 2: BIDDER 03 (CONTRADICTORY)
  // ─────────────────────────────────────────────────────────────
  console.log('--- AUDITING BIDDER 03 (CONTRADICTORY DATA) ---');
  const contradictoryDir = path.resolve('bidders/bidder_03_contradictory');
  const cdFiles = fs.readdirSync(contradictoryDir).filter(f => f.endsWith('.pdf'));

  const cdDocs: BidUploadedDocument[] = [];
  for (const filename of cdFiles) {
    const filePath = path.join(contradictoryDir, filename);
    const buffer = fs.readFileSync(filePath);
    const file = new File([buffer], filename, { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', file);

    const result = await processBidderDocumentAction(formData);
    if (!result.success || !result.doc) {
      throw new Error(`Failed to process ${filename}: ${result.error}`);
    }
    cdDocs.push(result.doc);
    console.log(`  Processed ${filename.padEnd(38)} -> Tag: ${result.doc.documentType.padEnd(26)} Facts: ${JSON.stringify(result.doc.extractedFacts)}`);
  }

  const cdProfile: BidderProfile = {
    companyName: 'Vertex Industrial Solutions Pvt Ltd',
    registrationNumber: 'ROC-DL-DEL-2016-041928',
    gstin: '07AABCV9012D1Z5',
    pan: 'AABCV9012D',
    entityType: 'Private Limited',
    registeredAddress: 'Building 14, Okhla Industrial Area Phase-III, New Delhi - 110020',
    contactPerson: 'Rajesh Khanna, General Manager',
    contactEmail: 'rajesh@vertexsolutions.in',
    contactPhone: '+91 98110 33445',
    annualTurnoverInCr: 11.2,
    relevantExperienceYears: 6,
  };

  const cdReport = runBidComplianceEvaluation(tender, cdProfile, cdDocs, 1);
  console.log(`\nBidder 03 Results:`);
  console.log(`  Overall Score: ${cdReport.overallScore}%`);
  console.log(`  Status: ${cdReport.status}`);
  console.log(`  Cross-Document Mismatches Count: ${cdReport.crossDocumentMismatches.length}`);

  for (const mismatch of cdReport.crossDocumentMismatches) {
    console.log(`    [MISMATCH: ${mismatch.severity}] Field: ${mismatch.field}`);
    console.log(`      Doc A: ${mismatch.documentA} vs Doc B: ${mismatch.documentB}`);
    console.log(`      Detail: ${mismatch.detectedDifference}`);
    console.log(`      Impact: ${mismatch.impactExplanation}`);
  }

  console.log('\n=== ALL NEGATIVE AND CONTRADICTORY QA TESTS COMPLETED SUCCESSFULLY ===');
}

testNonCompliantAndContradictory().catch(err => {
  console.error('\nNegative Test Failed:', err);
  process.exit(1);
});
