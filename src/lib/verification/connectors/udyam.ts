/**
 * Government Verification Gateway — Udyam (MSME) Connector
 *
 * Verifies Udyam registration details against the demo government database.
 * In PRODUCTION mode, this would connect to an authorized Udyam verification API.
 *
 * IMPORTANT: Does NOT implement CAPTCHA bypassing or unauthorized scraping.
 */

import type {
  IGovVerificationConnector,
  GovConnectorId,
  GovVerificationResult,
  GovVerificationStatus,
  GovFieldComparison,
  GovVerificationEvidence,
  BidderExtractedIdentity,
  GovVerificationEnvironment,
} from '../types';
import { getCurrentTimestamp, resolveSourceType, normalizeLegalName, normalizeIdentifier, namesMatch, identifiersMatch } from './base';
import udyamData from '@/data/government/udyam.json';

interface UdyamRecord {
  udyamNumber: string;
  enterpriseName: string;
  organisationType: string;
  status: string;
  enterpriseType: string;
  majorActivity: string;
  registrationDate: string;
  address: string;
  district: string;
  state: string;
  pan: string;
  dateOfCommencement: string;
  nicCode: string;
}

function lookupUdyamRecord(udyamNumber: string): UdyamRecord | null {
  const normalized = normalizeIdentifier(udyamNumber);
  const records = udyamData.records as UdyamRecord[];
  return records.find(r => normalizeIdentifier(r.udyamNumber) === normalized) || null;
}

// Also lookup by PAN if udyam number not found
function lookupByPan(pan: string): UdyamRecord | null {
  const normalized = normalizeIdentifier(pan);
  const records = udyamData.records as UdyamRecord[];
  return records.find(r => normalizeIdentifier(r.pan) === normalized) || null;
}

export class UdyamConnector implements IGovVerificationConnector {
  id: GovConnectorId = 'udyam';
  name = 'Udyam Registration (Ministry of MSME)';

  verify(identity: BidderExtractedIdentity, environment: GovVerificationEnvironment): GovVerificationResult {
    const checkedAt = getCurrentTimestamp();
    const sourceType = resolveSourceType(environment);
    const udyamNum = identity.udyamNumber;

    // No Udyam number provided
    if (!udyamNum) {
      return {
        connectorId: this.id,
        source: this.name,
        sourceType,
        status: 'UNAVAILABLE',
        identifier: 'NOT PROVIDED',
        checkedAt,
        fields: [],
        message: 'No Udyam registration number was found in the bidder documents.',
      };
    }

    // Look up in government database
    let govRecord = lookupUdyamRecord(udyamNum);
    
    // If not found by Udyam number, try PAN as fallback
    if (!govRecord && identity.pan) {
      govRecord = lookupByPan(identity.pan);
    }

    // Not found
    if (!govRecord) {
      return {
        connectorId: this.id,
        source: this.name,
        sourceType,
        status: 'NOT_FOUND',
        identifier: udyamNum,
        checkedAt,
        fields: [{
          field: 'udyamNumber',
          fieldLabel: 'Udyam Registration Number',
          documentValue: udyamNum,
          governmentValue: 'NOT REGISTERED',
          match: false,
        }],
        evidence: [{
          label: 'Lookup Result',
          value: `No registration found for ${udyamNum} in government registry`,
        }],
        message: `Government Record Not Found: No Udyam registration exists for ${udyamNum}.`,
      };
    }

    // Build field comparisons
    const fields: GovFieldComparison[] = [];

    // Udyam Number
    const udyamMatch = identifiersMatch(udyamNum, govRecord.udyamNumber);
    fields.push({
      field: 'udyamNumber',
      fieldLabel: 'Udyam Registration Number',
      documentValue: udyamNum,
      governmentValue: govRecord.udyamNumber,
      match: udyamMatch,
      confidence: udyamMatch ? 1.0 : 0,
    });

    // Enterprise Name
    const nameResult = namesMatch(identity.legalName, govRecord.enterpriseName);
    fields.push({
      field: 'enterpriseName',
      fieldLabel: 'Enterprise Legal Name',
      documentValue: identity.legalName || 'Not Extracted',
      governmentValue: govRecord.enterpriseName,
      match: nameResult.match,
      confidence: nameResult.confidence,
    });

    // PAN
    if (identity.pan || govRecord.pan) {
      const panMatch = identifiersMatch(identity.pan, govRecord.pan);
      fields.push({
        field: 'pan',
        fieldLabel: 'Income Tax PAN',
        documentValue: identity.pan || 'Not Extracted',
        governmentValue: govRecord.pan,
        match: panMatch,
        confidence: panMatch ? 1.0 : 0,
      });
    }

    // Status
    const govStatusActive = govRecord.status.toUpperCase() === 'ACTIVE';
    const statusMatch = govStatusActive;
    fields.push({
      field: 'status',
      fieldLabel: 'Registration Status',
      documentValue: identity.status || 'ACTIVE',
      governmentValue: govRecord.status,
      match: statusMatch,
      confidence: 1.0,
    });

    // Organisation Type (only compare if extracted from document)
    if (identity.organisationType) {
      const orgResult = namesMatch(identity.organisationType, govRecord.organisationType);
      fields.push({
        field: 'organisationType',
        fieldLabel: 'Organisation Type',
        documentValue: identity.organisationType,
        governmentValue: govRecord.organisationType,
        match: orgResult.match,
        confidence: orgResult.confidence,
      });
    }

    // Registration Date
    if (identity.registrationDate) {
      const dateMatch = identity.registrationDate === govRecord.registrationDate;
      fields.push({
        field: 'registrationDate',
        fieldLabel: 'Date of Registration',
        documentValue: identity.registrationDate,
        governmentValue: govRecord.registrationDate,
        match: dateMatch,
        confidence: dateMatch ? 1.0 : 0,
      });
    }

    // Evidence
    const evidence: GovVerificationEvidence[] = [
      { label: 'Enterprise Type', value: govRecord.enterpriseType },
      { label: 'Major Activity', value: govRecord.majorActivity },
      { label: 'District', value: govRecord.district },
      { label: 'State', value: govRecord.state },
      { label: 'NIC Code', value: govRecord.nicCode },
    ];

    // Determine overall status
    let status: GovVerificationStatus;
    let message: string;

    const hasCriticalMismatch = fields.some(f => !f.match && ['pan', 'udyamNumber'].includes(f.field));
    const hasAnyMismatch = fields.some(f => !f.match);

    if (!govStatusActive) {
      status = 'INACTIVE';
      message = `Registration status is ${govRecord.status} in the government registry. This certificate is not currently valid.`;
    } else if (hasCriticalMismatch) {
      status = 'MISMATCH';
      const mismatched = fields.filter(f => !f.match).map(f => f.fieldLabel).join(', ');
      message = `Critical field discrepancies detected: ${mismatched}. Requires immediate review.`;
    } else if (hasAnyMismatch) {
      status = 'REQUIRES_REVIEW';
      const reviewFields = fields.filter(f => !f.match).map(f => f.fieldLabel).join(', ');
      message = `Minor discrepancies detected in: ${reviewFields}. Officer review recommended.`;
    } else {
      status = 'VERIFIED';
      message = 'All Udyam registration fields confirmed against the government registry.';
    }

    return {
      connectorId: this.id,
      source: this.name,
      sourceType,
      status,
      identifier: udyamNum,
      checkedAt,
      fields,
      evidence,
      message,
    };
  }
}
