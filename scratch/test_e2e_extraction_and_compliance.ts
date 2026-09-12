import fs from 'fs';
import path from 'path';
import { processBidderDocumentAction } from '../src/lib/actions/bid-document-processor';
import { runBidComplianceEvaluation } from '../src/lib/tender-discovery/bid-compliance-verifier';
import { getDiscoveredTenderAction } from '../src/lib/actions/tender-discovery';
import { submitBidPackageAction } from '../src/lib/actions/tender-discovery';
import { getAllBidderDossiers } from '../src/lib/compliance/repository';
import type { BidUploadedDocument, BidderProfile } from '../src/types/tender-discovery';

async function runE2ETest() {
  console.log('=== STARTING E2E EXTRACTION & COMPLIANCE VERIFICATION AUDIT ===\n');

  // 1. Load Tender
  const tender = await getDiscoveredTenderAction('tender-cpcl-2026-0412');
  if (!tender) throw new Error('Tender not found');
  console.log(`[Tender Loaded] ${tender.title} (${tender.referenceNumber})`);

  // 2. Process Bidder 01 Compliant PDF files
  const compliantDir = path.resolve('bidders/bidder_01_compliant');
  const files = fs.readdirSync(compliantDir).filter(f => f.endsWith('.pdf'));
  console.log(`\nProcessing ${files.length} compliant PDF files from ${compliantDir}...`);

  const processedDocs: BidUploadedDocument[] = [];
  for (const filename of files) {
    const filePath = path.join(compliantDir, filename);
    const buffer = fs.readFileSync(filePath);
    const file = new File([buffer], filename, { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', file);

    const result = await processBidderDocumentAction(formData);

    if (!result.success || !result.doc) {
      throw new Error(`Failed to process ${filename}: ${result.error}`);
    }

    processedDocs.push(result.doc);
    console.log(`  ✓ Processed ${filename.padEnd(38)} -> Tag: ${result.doc.documentType.padEnd(26)} Facts: ${JSON.stringify(result.doc.extractedFacts)}`);
  }

  // 3. Run Deterministic Compliance Verification
  const bidderProfile: BidderProfile = {
    companyName: 'Apex Heavy Engineering Pvt Ltd',
    registrationNumber: 'ROC-TN-CHE-2018-091823',
    gstin: '33AABCA1234F1Z8',
    pan: 'ABCDE1234F',
    udyamNumber: 'UDYAM-TN-02-0049182',
    entityType: 'Private Limited',
    registeredAddress: 'Plot 42, Heavy Industrial Estate, Ambattur, Chennai - 600058',
    contactPerson: 'Suresh Narayanan, Director of Contracts',
    contactEmail: 'suresh@apexindustrial.in',
    contactPhone: '+91 98401 23456',
    annualTurnoverInCr: 12.4,
    relevantExperienceYears: 8,
  };

  console.log('\nRunning Deterministic Compliance Verification on Bidder 01...');
  const report = runBidComplianceEvaluation(tender, bidderProfile, processedDocs, 1);

  console.log(`\n=== COMPLIANCE RESULTS FOR BIDDER 01 ===`);
  console.log(`Overall Compliance Score: ${report.overallScore}%`);
  console.log(`Status: ${report.status}`);
  console.log(`Mandatory Total: ${report.mandatoryTotal}`);
  console.log(`Mandatory Passed: ${report.mandatoryPassed}`);
  console.log(`Mandatory Failed: ${report.mandatoryFailed}`);
  console.log(`Mandatory Missing: ${report.mandatoryMissing}`);

  for (const item of report.matrix) {
    console.log(`  Clause ${(item.tenderClauseReference || '').padEnd(12)}: ${item.requirementTitle.padEnd(40)} -> [${item.status}] (Evidence: ${item.bidderEvidence})`);
  }

  if (report.overallScore < 90) {
    throw new Error(`Expected score >= 90% for compliant bidder, got ${report.overallScore}%`);
  }

  // 4. Test Submission Action and Authority Live Sync
  console.log('\nTesting submitBidPackageAction...');
  const subResult = await submitBidPackageAction(tender.id, bidderProfile, report);
  if (!subResult.success || !subResult.submission) {
    throw new Error(`Submission action failed: ${subResult.error}`);
  }

  console.log(`✓ Submission Successful!`);
  console.log(`  Submission ID: ${subResult.submission.submissionId}`);
  console.log(`  SHA-256 Checksum: ${subResult.submission.sha256Checksum}`);
  console.log(`  Status: ${subResult.submission.status}`);

  // Check live sync into authority dossiers
  const authorityDossiers = getAllBidderDossiers(tender.id);
  const matchedDossier = authorityDossiers.find(d => d.submissionId === subResult.submission?.submissionId);
  if (!matchedDossier) {
    throw new Error('Submitted bid was not synced to authority dossiers!');
  }
  console.log(`✓ Live Sync Confirmed: Authority dossiers now include ${matchedDossier.bidderName} (${matchedDossier.submissionId})!`);

  console.log('\n=== ALL E2E PIPELINE AUDITS PASSED WITH 100% SUCCESS ===');
}

runE2ETest().catch(err => {
  console.error('\nE2E Test Failed:', err);
  process.exit(1);
});
