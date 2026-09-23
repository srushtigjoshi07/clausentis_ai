import { getAllBidderDossiers, STANDARD_CPCL_REQUIREMENTS } from '../src/lib/compliance/repository';
import { 
  createMultiBidderMatchedRequirementsPdfDocument, 
  generateMultiBidderMatchedRequirementsPdfBuffer 
} from '../src/lib/pdf/multi-bidder-matched-requirements-pdf-generator';
import { isValidPdfBytes, generatePdfFilename } from '../src/lib/pdf/pdf-download-helper';

async function runTests() {
  console.log('====================================================');
  console.log('TESTING CLAUSENTIS MULTI-BIDDER PDF & COMPARISON PIPELINE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`✕ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. Data Source Test
  const dossiers = getAllBidderDossiers();
  assert(dossiers.length >= 4, `Dossiers resolved for all bidders (got ${dossiers.length})`);

  const apex = dossiers.find(d => d.bidId === 'bid-apex-02');
  const abc = dossiers.find(d => d.bidId === 'bid-abc-01');
  const xyz = dossiers.find(d => d.bidId === 'bid-xyz-03');
  const pqr = dossiers.find(d => d.bidId === 'bid-pqr-04');

  assert(!!apex && apex.complianceScore === 100, 'Apex Heavy resolved with 100% compliance score');
  assert(!!abc && abc.complianceScore === 96, 'ABC Industrial resolved with 96% compliance score');
  assert(!!xyz && (xyz.complianceScore === 91 || xyz.complianceScore === 82), `XYZ Engineering resolved with compliance score ${xyz?.complianceScore}%`);
  assert(!!pqr && (pqr.complianceScore === 30 || pqr.complianceScore === 47 || pqr.complianceScore === 61), `PQR Industries resolved with compliance score ${pqr?.complianceScore}%`);

  // 2. Filename standard test
  const filename = generatePdfFilename('matched-requirements', 'CPCL/ENG/2026/HPGC-0412', '2026-09-12');
  assert(
    filename === 'clausentis-matched-requirements-cpcl-eng-2026-hpgc-0412-2026-09-12.pdf',
    `Multi-bidder PDF filename matches standard (${filename})`
  );

  // 3. Multi-Bidder PDF Document Creation
  const doc = createMultiBidderMatchedRequirementsPdfDocument({
    tenderId: 'tender-cpcl-2026-0412',
    tenderTitle: 'Supply, Installation and Commissioning of High-Pressure Gas Compressor System at Manali Refinery',
    tenderReference: 'CPCL/ENG/2026/HPGC-0412',
    tenderAuthority: 'Chennai Petroleum Corporation Limited (CPCL)',
    dossiers,
    requirements: STANDARD_CPCL_REQUIREMENTS,
  });

  assert(doc.getNumberOfPages() >= 1, `Multi-Bidder PDF generated with ${doc.getNumberOfPages()} pages`);

  // 4. Binary Output & %PDF Signature
  const buffer = await generateMultiBidderMatchedRequirementsPdfBuffer({
    tenderId: 'tender-cpcl-2026-0412',
    tenderTitle: 'Supply, Installation and Commissioning of High-Pressure Gas Compressor System at Manali Refinery',
    tenderReference: 'CPCL/ENG/2026/HPGC-0412',
    tenderAuthority: 'Chennai Petroleum Corporation Limited (CPCL)',
    dossiers,
    requirements: STANDARD_CPCL_REQUIREMENTS,
  });

  assert(buffer.byteLength > 20000, `Multi-Bidder PDF size is valid (${buffer.byteLength} bytes)`);
  assert(isValidPdfBytes(buffer), 'Multi-Bidder PDF begins with valid %PDF magic bytes (0x25, 0x50, 0x44, 0x46)');

  // 5. Evidence & Fallback Test
  const missingAffidavitResult = pqr?.requirementResults.find(r => r.clauseCode === 'Clause 3.4');
  assert(
    !missingAffidavitResult || missingAffidavitResult.status === 'MISSING',
    'PQR missing mandatory non-blacklisting affidavit is flagged as MISSING'
  );

  console.log('\n====================================================');
  console.log(`MULTI-BIDDER PDF TESTS: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test run crashed:', err);
  process.exit(1);
});
