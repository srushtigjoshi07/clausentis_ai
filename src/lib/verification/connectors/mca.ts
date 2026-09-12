/**
 * Government Verification Gateway — MCA Connector
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
import mcaData from '@/data/government/mca.json';

interface McaRecord {
  cin: string;
  companyName: string;
  status: string;
  companyClass: string;
  companyCategory: string;
  incorporationDate: string;
  registeredState: string;
  rocCode: string;
  authorizedCapital: number;
  paidUpCapital: number;
  pan: string;
  registeredAddress: string;
  lastAgmDate: string;
  lastBalanceSheetDate: string;
}

function lookupMcaRecord(cin: string): McaRecord | null {
  const normalized = normalizeIdentifier(cin);
  const records = mcaData.records as McaRecord[];
  return records.find(r => normalizeIdentifier(r.cin) === normalized) || null;
}

function lookupByPan(pan: string): McaRecord | null {
  const normalized = normalizeIdentifier(pan);
  const records = mcaData.records as McaRecord[];
  return records.find(r => normalizeIdentifier(r.pan) === normalized) || null;
}

export class McaConnector implements IGovVerificationConnector {
  id: GovConnectorId = 'mca';
  name = 'Ministry of Corporate Affairs (MCA)';

  verify(identity: BidderExtractedIdentity, environment: GovVerificationEnvironment): GovVerificationResult {
    const checkedAt = getCurrentTimestamp();
    const sourceType = resolveSourceType(environment);
    const cin = identity.cin;

    if (!cin) {
      return {
        connectorId: this.id,
        source: this.name,
        sourceType,
        status: 'UNAVAILABLE',
        identifier: 'NOT PROVIDED',
        checkedAt,
        fields: [],
        message: 'No CIN was found in the bidder documents.',
      };
    }

    let govRecord = lookupMcaRecord(cin);
    
    if (!govRecord && identity.pan) {
      govRecord = lookupByPan(identity.pan);
    }

    if (!govRecord) {
      return {
        connectorId: this.id,
        source: this.name,
        sourceType,
        status: 'NOT_FOUND',
        identifier: cin,
        checkedAt,
        fields: [{
          field: 'cin',
          fieldLabel: 'Corporate Identification Number (CIN)',
          documentValue: cin,
          governmentValue: 'NOT REGISTERED',
          match: false,
        }],
        evidence: [{
          label: 'Lookup Result',
          value: `No registration found for ${cin} in government registry`,
        }],
        message: `Government Record Not Found: No MCA registration exists for ${cin}.`,
      };
    }

    const fields: GovFieldComparison[] = [];

    // CIN
    const cinMatch = identifiersMatch(cin, govRecord.cin);
    fields.push({
      field: 'cin',
      fieldLabel: 'Corporate Identification Number (CIN)',
      documentValue: cin,
      governmentValue: govRecord.cin,
      match: cinMatch,
      confidence: cinMatch ? 1.0 : 0,
    });

    // Company Name
    const nameResult = namesMatch(identity.legalName, govRecord.companyName);
    fields.push({
      field: 'companyName',
      fieldLabel: 'Company Name',
      documentValue: identity.legalName || 'Not Extracted',
      governmentValue: govRecord.companyName,
      match: nameResult.match,
      confidence: nameResult.confidence,
    });
    
    // Status
    const govStatusActive = govRecord.status.toUpperCase() === 'ACTIVE';
    fields.push({
      field: 'status',
      fieldLabel: 'Registration Status',
      documentValue: identity.status || 'ACTIVE',
      governmentValue: govRecord.status,
      match: govStatusActive,
      confidence: 1.0,
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

    // Incorporation Date (only compare if extracted from document)
    if (identity.registrationDate) {
      const dateMatch = identity.registrationDate === govRecord.incorporationDate;
      fields.push({
        field: 'incorporationDate',
        fieldLabel: 'Date of Incorporation',
        documentValue: identity.registrationDate,
        governmentValue: govRecord.incorporationDate,
        match: dateMatch,
        confidence: dateMatch ? 1.0 : 0,
      });
    }

    const evidence: GovVerificationEvidence[] = [
      { label: 'Registered State', value: govRecord.registeredState },
      { label: 'Company Class', value: govRecord.companyClass },
      { label: 'Company Category', value: govRecord.companyCategory },
      { label: 'RoC Code', value: govRecord.rocCode },
      { label: 'Authorized Capital', value: `₹${govRecord.authorizedCapital.toLocaleString('en-IN')}` },
      { label: 'Paid-Up Capital', value: `₹${govRecord.paidUpCapital.toLocaleString('en-IN')}` },
      { label: 'Registered Address', value: govRecord.registeredAddress },
    ];

    let status: GovVerificationStatus;
    let message: string;

    const hasCriticalMismatch = fields.some(f => !f.match && ['pan', 'cin'].includes(f.field));
    const hasAnyMismatch = fields.some(f => !f.match);

    if (!govStatusActive) {
      status = 'INACTIVE';
      message = `Registration status is ${govRecord.status} in the government registry.`;
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
      message = 'All MCA registration fields confirmed against the government registry.';
    }

    return {
      connectorId: this.id,
      source: this.name,
      sourceType,
      status,
      identifier: cin,
      checkedAt,
      fields,
      evidence,
      message,
    };
  }
}
