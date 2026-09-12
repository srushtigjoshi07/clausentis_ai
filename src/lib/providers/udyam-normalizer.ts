/**
 * Deterministic Normalization & Field Comparison Engine for Government Record Cross-Verification
 *
 * Implements strict, auditable, mathematical and rule-based equivalence checks.
 * Under SIH26100, LLMs are NEVER used to decide whether two legal entity or tax values match.
 */

import type {
  FieldComparisonResult,
  GovernmentRecordComparisonResult,
  GovernmentRecordVerificationStatus,
  GovernmentVerificationMode,
} from '@/lib/providers/types';
import type { UdyamGovernmentRecord } from '@/lib/providers/data/udyam-demo-records';

/**
 * Canonicalizes an enterprise legal entity name for deterministic comparison.
 * Normalizes punctuation, case, whitespace, and common Indian corporate legal suffixes.
 */
export function normalizeEnterpriseName(name: string | undefined | null): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^m\/s\s+/i, '')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .replace(/\bprivate\s+limited\b/g, 'pvt ltd')
    .replace(/\bpvt\s+limited\b/g, 'pvt ltd')
    .replace(/\bpvt\s*\.?\s*ltd\s*\.?/g, 'pvt ltd')
    .replace(/\blimited\b/g, 'ltd')
    .replace(/\bltd\s*\.?/g, 'ltd')
    .replace(/\blimited\s+liability\s+partnership\b/g, 'llp')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes an identifier (Udyam Number, PAN, GSTIN)
 */
export function normalizeIdentifier(id: string | undefined | null): string {
  if (!id) return '';
  return id.replace(/[^A-Za-z0-9-]/g, '').toUpperCase().trim();
}

export interface SubmittedUdyamDocumentData {
  udyamNumber?: string;
  enterpriseName?: string;
  pan?: string;
  status?: string;
  organisationType?: string;
  registrationDate?: string;
  validityDate?: string;
  documentName?: string;
  sourcePage?: number;
}

/**
 * Deterministically compares submitted document values against a Government Record.
 */
export function compareUdyamRecord(
  submitted: SubmittedUdyamDocumentData,
  govtRecord: UdyamGovernmentRecord | null,
  mode: GovernmentVerificationMode = 'DEMO_SANDBOX',
  evaluationDateStr?: string
): GovernmentRecordComparisonResult {
  const verifiedAt = new Date().toLocaleString('en-GB', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  }) + ' IST';

  const sourceRef = mode === 'DEMO_SANDBOX'
    ? 'Ministry of MSME — Udyam Registration Portal (DEMO / SANDBOX VERIFICATION)'
    : mode === 'OFFICIAL_PORTAL_MANUAL'
    ? 'Official Udyam Portal (Manual Officer Verification Session)'
    : 'National API Gateway (Authorized Live Government Connector)';

  const submittedUdyam = normalizeIdentifier(submitted.udyamNumber);

  // 1. Missing Identifier / Unreadable Document
  if (!submittedUdyam) {
    return {
      providerId: 'udyam',
      providerName: 'Ministry of MSME (Udyam Verification)',
      verificationMode: mode,
      status: 'UNABLE_TO_VERIFY',
      identifierQueried: '—',
      statusMessage: 'Unable to verify: No valid Udyam registration number could be extracted from the submitted document.',
      fieldComparisons: [],
      matchedFields: [],
      mismatchedFields: [],
      verifiedAt,
      sourceReference: sourceRef,
      submittedRecord: submitted as Record<string, unknown>,
    };
  }

  // 2. Not Found in Government Registry
  if (!govtRecord) {
    return {
      providerId: 'udyam',
      providerName: 'Ministry of MSME (Udyam Verification)',
      verificationMode: mode,
      status: 'NOT_FOUND',
      identifierQueried: submittedUdyam,
      statusMessage: `Government Record Not Found: No registration record exists for ${submittedUdyam} in the official registry.`,
      fieldComparisons: [
        {
          fieldName: 'udyamNumber',
          fieldLabel: 'Udyam Number',
          submittedValue: submittedUdyam,
          governmentValue: 'NOT REGISTERED',
          status: 'MISMATCH',
          isKeyField: true,
        },
      ],
      matchedFields: [],
      mismatchedFields: ['udyamNumber'],
      verifiedAt,
      sourceReference: sourceRef,
      submittedRecord: submitted as Record<string, unknown>,
    };
  }

  // 3. Field-by-Field Deterministic Comparison
  const comparisons: FieldComparisonResult[] = [];
  const matchedFields: string[] = [];
  const mismatchedFields: string[] = [];

  // Field: Udyam Number
  const udyamMatch = submittedUdyam === normalizeIdentifier(govtRecord.udyamNumber);
  comparisons.push({
    fieldName: 'udyamNumber',
    fieldLabel: 'Udyam Registration Number',
    submittedValue: submittedUdyam,
    governmentValue: govtRecord.udyamNumber,
    status: udyamMatch ? 'MATCH' : 'MISMATCH',
    isKeyField: true,
  });
  if (udyamMatch) matchedFields.push('udyamNumber');
  else mismatchedFields.push('udyamNumber');

  // Field: Enterprise Name
  const normSubName = normalizeEnterpriseName(submitted.enterpriseName);
  const normGovName = normalizeEnterpriseName(govtRecord.enterpriseName);
  const nameMatch = Boolean(normSubName && normGovName && (normSubName === normGovName || normGovName.includes(normSubName) || normSubName.includes(normGovName)));
  comparisons.push({
    fieldName: 'enterpriseName',
    fieldLabel: 'Enterprise Legal Name',
    submittedValue: submitted.enterpriseName || 'Not Extracted',
    governmentValue: govtRecord.enterpriseName,
    status: nameMatch ? 'MATCH' : 'MISMATCH',
    isKeyField: true,
  });
  if (nameMatch) matchedFields.push('enterpriseName');
  else mismatchedFields.push('enterpriseName');

  // Field: Permanent Account Number (PAN)
  if (submitted.pan || govtRecord.pan) {
    const subPan = normalizeIdentifier(submitted.pan);
    const govPan = normalizeIdentifier(govtRecord.pan);
    const panMatch = Boolean(subPan && govPan && subPan === govPan);
    comparisons.push({
      fieldName: 'pan',
      fieldLabel: 'Income Tax PAN',
      submittedValue: subPan || 'Not Extracted',
      governmentValue: govPan,
      status: panMatch ? 'MATCH' : 'MISMATCH',
      isKeyField: true,
    });
    if (panMatch) matchedFields.push('pan');
    else mismatchedFields.push('pan');
  }

  // Field: Registry Status
  const govStatus = govtRecord.status.toUpperCase();
  const subStatus = (submitted.status || 'ACTIVE').toUpperCase();
  const isStatusActive = govStatus === 'ACTIVE';
  const statusMatch = isStatusActive && subStatus === 'ACTIVE';
  comparisons.push({
    fieldName: 'status',
    fieldLabel: 'Government Registry Status',
    submittedValue: subStatus,
    governmentValue: govStatus,
    status: statusMatch ? 'MATCH' : 'MISMATCH',
    isKeyField: true,
  });
  if (statusMatch) matchedFields.push('status');
  else mismatchedFields.push('status');

  // Field: Organisation Type (if available)
  if (govtRecord.organisationType) {
    const subOrg = (submitted.organisationType || '').toLowerCase();
    const govOrg = govtRecord.organisationType.toLowerCase();
    const orgMatch = !subOrg || govOrg.includes(subOrg) || subOrg.includes(govOrg);
    comparisons.push({
      fieldName: 'organisationType',
      fieldLabel: 'Organisation Category',
      submittedValue: submitted.organisationType || 'Private Limited',
      governmentValue: govtRecord.organisationType,
      status: orgMatch ? 'MATCH' : 'MISMATCH',
      isKeyField: false,
    });
    if (orgMatch) matchedFields.push('organisationType');
  }

  // 4. Determine Overall Government Verification Status
  let finalStatus: GovernmentRecordVerificationStatus = 'MATCH';
  let statusMessage = 'Government Record Match: All statutory identity fields confirmed against official registry.';

  // Check Inactive / Cancelled
  if (govStatus === 'CANCELLED' || govStatus === 'SUSPENDED') {
    finalStatus = 'INACTIVE';
    statusMessage = `Government Status Inactive: Udyam certificate registration has been ${govStatus} in the official registry.`;
  }
  // Check Expiration
  else if (govtRecord.validityDate) {
    const evalDate = evaluationDateStr ? new Date(evaluationDateStr) : new Date('2026-09-12');
    const [d, m, y] = govtRecord.validityDate.split('-').map(Number);
    const validUntil = new Date(y, m - 1, d);
    if (!isNaN(validUntil.getTime()) && validUntil < evalDate) {
      finalStatus = 'EXPIRED';
      statusMessage = `Certificate Expired: Udyam registration expired on ${govtRecord.validityDate} prior to tender evaluation date.`;
    }
  }

  // Check Mismatches on Key Fields
  if (finalStatus === 'MATCH' && mismatchedFields.length > 0) {
    finalStatus = 'MISMATCH';
    const diffList = mismatchedFields.map((f) => {
      const c = comparisons.find((item) => item.fieldName === f);
      return `${c?.fieldLabel || f} (Submitted: ${c?.submittedValue} vs Govt: ${c?.governmentValue})`;
    }).join('; ');
    statusMessage = `Government Record Mismatch: Statutory discrepancies detected across fields: ${diffList}.`;
  }

  return {
    providerId: 'udyam',
    providerName: 'Ministry of MSME (Udyam Verification)',
    verificationMode: mode,
    status: finalStatus,
    identifierQueried: submittedUdyam,
    statusMessage,
    fieldComparisons: comparisons,
    matchedFields,
    mismatchedFields,
    verifiedAt,
    sourceReference: sourceRef,
    governmentRecord: govtRecord as unknown as Record<string, unknown>,
    submittedRecord: submitted as unknown as Record<string, unknown>,
  };
}
