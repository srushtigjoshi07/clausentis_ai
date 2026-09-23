import fs from 'fs';
import path from 'path';
import { 
  generateMultiBidderMatchedRequirementsPdfBuffer 
} from '../src/lib/pdf/multi-bidder-matched-requirements-pdf-generator';
import { 
  generateMatchedRequirementsPdfBuffer 
} from '../src/lib/pdf/matched-requirements-pdf-generator';
import { 
  generateAuditPdfBuffer 
} from '../src/lib/pdf/audit-pdf-generator';
import { 
  generateSignedDecisionPdfBuffer 
} from '../src/lib/pdf/signed-decision-pdf-generator';
import { 
  getAllBidderDossiers, 
  getBidderDossier, 
  STANDARD_CPCL_REQUIREMENTS 
} from '../src/lib/compliance/repository';

async function generateAllPdfs() {
  console.log('Generating official Clausentis PDFs...\n');

  const publicDir = path.resolve('public', 'downloads');
  const brainDir = path.resolve('C:\\Users\\srush\\.gemini\\antigravity-ide\\brain\\49872be0-3e61-42b1-8b36-b1f1674477f1');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const dossiers = getAllBidderDossiers();
  const apex = getBidderDossier('bid-apex-02') || dossiers[0];

  // 1. Multi-Bidder Matched Requirements PDF
  const multiBuffer = await generateMultiBidderMatchedRequirementsPdfBuffer({
    tenderId: 'tender-cpcl-2026-0412',
    tenderTitle: 'Supply, Installation and Commissioning of High-Pressure Gas Compressor System at Manali Refinery',
    tenderReference: 'CPCL/ENG/2026/HPGC-0412',
    tenderAuthority: 'Chennai Petroleum Corporation Limited (CPCL)',
    dossiers,
    requirements: STANDARD_CPCL_REQUIREMENTS,
  });

  const multiFilename = 'clausentis-matched-requirements-cpcl-eng-2026-hpgc-0412-2026-09-12.pdf';
  fs.writeFileSync(path.join(publicDir, multiFilename), Buffer.from(multiBuffer));
  fs.writeFileSync(path.join(brainDir, multiFilename), Buffer.from(multiBuffer));
  console.log(`✓ Generated ${multiFilename} (${multiBuffer.byteLength} bytes)`);

  // 2. Single-Bidder Matched Requirements PDF (Apex Heavy)
  const singleBuffer = await generateMatchedRequirementsPdfBuffer({
    dossier: apex,
    role: 'tender_authority',
    documentType: 'matched-requirements',
  });

  const singleFilename = 'clausentis-matched-requirements-apex-heavy-2026-09-12.pdf';
  fs.writeFileSync(path.join(publicDir, singleFilename), Buffer.from(singleBuffer));
  fs.writeFileSync(path.join(brainDir, singleFilename), Buffer.from(singleBuffer));
  console.log(`✓ Generated ${singleFilename} (${singleBuffer.byteLength} bytes)`);

  // 3. Audit Trail PDF
  const auditBuffer = await generateAuditPdfBuffer({
    tenderTitle: apex.tenderTitle,
    tenderReference: apex.tenderReference,
    bidderName: apex.bidderName,
    bidderGstin: apex.gstin,
    identifier: apex.bidId,
    records: apex.auditEvents || [],
    dossier: apex,
    documentType: 'audit',
  });

  const auditFilename = 'clausentis-audit-bid-apex-02-2026-09-12.pdf';
  fs.writeFileSync(path.join(publicDir, auditFilename), Buffer.from(auditBuffer));
  fs.writeFileSync(path.join(brainDir, auditFilename), Buffer.from(auditBuffer));
  console.log(`✓ Generated ${auditFilename} (${auditBuffer.byteLength} bytes)`);

  // 4. Signed Decision PDF
  const decisionRecord = {
    id: 'dec-uuid-apex-01',
    decision_id: 'DEC-CPCL-2026-0412-001',
    tender_id: 'tender-cpcl-2026-0412',
    bid_id: 'bid-apex-02',
    bidder_id: 'CL-2026-91C25F34',
    bidder_name: apex.bidderName,
    officer_user_id: 'officer-cpcl-01',
    officer_name: 'Dr. R. Venkataraman',
    officer_email: 'r.venkataraman@cpcl.gov.in',
    organisation: 'Chennai Petroleum Corporation Limited',
    officer_role: 'Senior Procurement Officer',
    decision: 'APPROVED' as const,
    remarks: 'All mandatory requirements verified against statutory registries and audited accounts. Qualified for commercial opening.',
    compliance_score_snapshot: 100,
    risk_level_snapshot: 'LOW' as const,
    ai_recommendation_snapshot: 'COMPLIANT' as const,
    signed_at: new Date('2026-09-10T18:15:00.000Z').toISOString(),
    decision_version: 1,
    status: 'SIGNED' as const,
    integrity_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    created_at: new Date('2026-09-10T18:15:00.000Z').toISOString(),
    updated_at: new Date('2026-09-10T18:15:00.000Z').toISOString()
  };

  const decisionUint8 = generateSignedDecisionPdfBuffer({
    decision: decisionRecord,
    dossier: apex,
    tenderTitle: apex.tenderTitle,
    tenderReference: apex.tenderReference,
  });

  const decisionFilename = 'clausentis-signed-decision-apex-heavy-2026-09-12.pdf';
  fs.writeFileSync(path.join(publicDir, decisionFilename), Buffer.from(decisionUint8));
  fs.writeFileSync(path.join(brainDir, decisionFilename), Buffer.from(decisionUint8));
  console.log(`✓ Generated ${decisionFilename} (${decisionUint8.byteLength} bytes)`);

  console.log('\nAll 4 official PDFs generated and saved successfully.');
}

generateAllPdfs().catch(err => {
  console.error('Error generating PDFs:', err);
  process.exit(1);
});
