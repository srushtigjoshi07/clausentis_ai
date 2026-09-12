/**
 * Clausentis Automated Test Suite: Udyam Government Record Cross-Verification
 * 
 * Verifies all 5 required statutory cross-verification cases:
 * 1. Match: Registered details match official government registry record.
 * 2. Mismatch: Name or PAN in bid does not match registry record.
 * 3. Not Found: Registration number does not exist in registry.
 * 4. Inactive / Cancelled: Registration exists but status is CANCELLED/SUSPENDED.
 * 5. Expired: Registration exists but validity expired.
 * Plus existing production bidder profile verification (Apex Heavy Engineering).
 */

import { UdyamProvider } from '../src/lib/providers/providers';
import { normalizeEnterpriseName, compareUdyamRecord } from '../src/lib/providers/udyam-normalizer';
import { UDYAM_DEMO_GOVERNMENT_DATABASE } from '../src/lib/providers/data/udyam-demo-records';

console.log('===============================================================');
console.log('CLAUSENTIS: TESTING GOVERNMENT RECORD CROSS-VERIFICATION PIPELINE');
console.log('===============================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    if (detail) console.log(`       ${detail}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testName}`);
    if (detail) console.error(`       Detail: ${detail}`);
    failCount++;
  }
}

// -------------------------------------------------------------
// Test Group A: Deterministic Name Normalization
// -------------------------------------------------------------
console.log('--- Test Group A: Deterministic Name Normalization ---');
const n1 = normalizeEnterpriseName('Apex Technologies Private Limited');
const n2 = normalizeEnterpriseName('APEX TECHNOLOGIES PVT. LTD.');
const n3 = normalizeEnterpriseName('  apex   technologies  pvt   ltd  ');
assert(n1 === 'apex technologies pvt ltd', 'Normalizes "Private Limited" to canonical "pvt ltd"', `Got: "${n1}"`);
assert(n1 === n2, 'Equates "Private Limited" and "PVT. LTD."', `n1: "${n1}", n2: "${n2}"`);
assert(n1 === n3, 'Handles excess whitespace and case differences', `n3: "${n3}"`);

// -------------------------------------------------------------
// Test Case 1: Concordant Match
// -------------------------------------------------------------
console.log('\n--- Test Case 1: Concordant Match ---');
const udyamProvider = new UdyamProvider();
const resCase1 = udyamProvider.verify({
  companyName: 'ABC Robotics Private Limited', // Normalizes to match 'ABC Robotics Pvt Ltd'
  pan: 'ABCDE1234F',
  udyamNumber: 'UDYAM-DEMO-VALID-001',
});

assert(resCase1.verified === true, 'Case 1 verified === true');
assert(resCase1.governmentVerification?.status === 'MATCH', 'Case 1 status === MATCH');
assert(resCase1.governmentVerification?.verificationMode === 'DEMO_SANDBOX', 'Case 1 verificationMode === DEMO_SANDBOX');
assert(resCase1.governmentVerification?.mismatchedFields.length === 0, 'Case 1 zero mismatched fields');
assert(resCase1.governmentVerification?.matchedFields.includes('enterpriseName') ?? false, 'Case 1 matched enterpriseName');

// -------------------------------------------------------------
// Test Case 2: Mismatch (PAN Discrepancy)
// -------------------------------------------------------------
console.log('\n--- Test Case 2: Field Mismatch ---');
const resCase2 = udyamProvider.verify({
  companyName: 'ABC Robotics Private Limited',
  pan: 'ABCDE1234F', // In registry, Case 2 has PAN ABCDE9876F!
  udyamNumber: 'UDYAM-DEMO-MISMATCH-001',
});

assert(resCase2.verified === false, 'Case 2 verified === false');
assert(resCase2.governmentVerification?.status === 'MISMATCH', 'Case 2 status === MISMATCH');
assert(resCase2.governmentVerification?.mismatchedFields.includes('pan') ?? false, 'Case 2 flagged pan mismatch');
assert(resCase2.governmentVerification?.statusMessage.includes('discrepancies') ?? false, 'Case 2 statusMessage explains discrepancy');

// -------------------------------------------------------------
// Test Case 3: Record Not Found
// -------------------------------------------------------------
console.log('\n--- Test Case 3: Registration Not Found ---');
const resCase3 = udyamProvider.verify({
  companyName: 'Ghost Infra Solutions Ltd',
  pan: 'AABCZ9999Z',
  udyamNumber: 'UDYAM-DEMO-NOTFOUND-001',
});

assert(resCase3.verified === false, 'Case 3 verified === false');
assert(resCase3.governmentVerification?.status === 'NOT_FOUND', 'Case 3 status === NOT_FOUND');
assert(
  resCase3.governmentVerification?.fieldComparisons.length === 1 &&
  resCase3.governmentVerification?.fieldComparisons[0].governmentValue === 'NOT REGISTERED',
  'Case 3 has NOT REGISTERED field comparison',
  `Got: ${JSON.stringify(resCase3.governmentVerification?.fieldComparisons[0])}`
);
assert(
  resCase3.governmentVerification?.statusMessage.includes('No registration record exists') ?? false,
  'Case 3 message explains missing record'
);

// -------------------------------------------------------------
// Test Case 4: Inactive / Cancelled Registration
// -------------------------------------------------------------
console.log('\n--- Test Case 4: Inactive / Cancelled Registration ---');
const resCase4 = udyamProvider.verify({
  companyName: 'ABC Robotics Pvt Ltd',
  pan: 'ABCDE1234F',
  udyamNumber: 'UDYAM-DEMO-INACTIVE-001',
});

assert(resCase4.verified === false, 'Case 4 verified === false');
assert(resCase4.governmentVerification?.status === 'INACTIVE', 'Case 4 status === INACTIVE');
assert(resCase4.governmentVerification?.statusMessage.includes('CANCELLED') ?? false, 'Case 4 message explains cancelled status');

// -------------------------------------------------------------
// Test Case 5: Expired Registration
// -------------------------------------------------------------
console.log('\n--- Test Case 5: Expired Registration ---');
const resCase5 = udyamProvider.verify({
  companyName: 'ABC Robotics Pvt Ltd',
  pan: 'ABCDE1234F',
  udyamNumber: 'UDYAM-DEMO-EXPIRED-001',
});

assert(resCase5.verified === false, 'Case 5 verified === false');
assert(resCase5.governmentVerification?.status === 'EXPIRED', 'Case 5 status === EXPIRED');
assert(resCase5.governmentVerification?.statusMessage.includes('expired') ?? false, 'Case 5 message explains expired validity');

// -------------------------------------------------------------
// Test Case 6: Production Demo Bidder (Apex Heavy Engineering)
// -------------------------------------------------------------
console.log('\n--- Test Case 6: Production Demo Bidder (Apex Heavy Engineering) ---');
const resApex = udyamProvider.verify({
  companyName: 'Apex Heavy Engineering Pvt Ltd',
  pan: 'AABCA1234F',
  udyamNumber: 'UDYAM-TN-02-0049182',
});

assert(resApex.verified === true, 'Apex Heavy Engineering verified === true');
assert(
  resApex.governmentVerification?.sourceReference.includes('DEMO / SANDBOX VERIFICATION') ?? false,
  'Apex has explicit sandbox disclosure',
  `Got: "${resApex.governmentVerification?.sourceReference}"`
);

// -------------------------------------------------------------
// Final Summary
// -------------------------------------------------------------
console.log('\n===============================================================');
console.log(`TEST SUMMARY: Total Tests: ${passCount + failCount} | Passed: ${passCount} | Failed: ${failCount}`);
console.log('===============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('ALL STATUTORY CROSS-VERIFICATION TESTS PASSED SUCCESSFULLY.');
  process.exit(0);
}
