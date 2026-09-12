const fs = require('fs');
const path = require('path');
const { extractText } = require('unpdf');

const BASE_DIR = path.resolve(__dirname, '..', 'bidders');

async function auditAllDocs() {
  const folders = ['bidder_01_compliant', 'bidder_02_non_compliant', 'bidder_03_contradictory'];
  let totalDocs = 0;
  let allHaveDisclaimer = true;

  console.log('Auditing all generated PDFs across bidder directories...\n');

  for (const folder of folders) {
    const fullFolderPath = path.join(BASE_DIR, folder);
    const files = fs.readdirSync(fullFolderPath).filter(f => f.endsWith('.pdf'));
    console.log(`=== ${folder.toUpperCase()} (${files.length} PDFs) ===`);

    for (const file of files) {
      totalDocs++;
      const filePath = path.join(fullFolderPath, file);
      const buf = fs.readFileSync(filePath);
      const res = await extractText(new Uint8Array(buf));
      const fullText = res.text.join('\n');

      const hasDisclaimer = fullText.includes('SYNTHETIC DOCUMENT — FOR CLAUSENTIS PROTOTYPE DEMONSTRATION ONLY');
      if (!hasDisclaimer) allHaveDisclaimer = false;

      console.log(`  ✓ ${file.padEnd(42)} [${res.totalPages} pgs, ${buf.length} bytes] Disclaimer: ${hasDisclaimer ? 'YES' : 'NO'}`);
    }
    console.log('');
  }

  console.log(`SUMMARY: Total Documents Audited: ${totalDocs}`);
  console.log(`All Documents Have Mandatory Disclaimer: ${allHaveDisclaimer}`);
}

auditAllDocs();
