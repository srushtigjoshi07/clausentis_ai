/**
 * Government Verification Gateway — GST Connector
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
import gstData from '@/data/government/gst.json';

interface GstRecord {
  gstin: string;
  legalName: string;
  tradeName: string;
  status: string;
  registrationDate: string;
  taxpayerType: string;
  constitutionOfBusiness: string;
  state: string;
  stateCode: string;
  pan: string;
  lastReturnFiled: string;
  principalPlaceOfBusiness: string;
}

function lookupGstRecord(gstin: string): GstRecord | null {
  const normalized = normalizeIdentifier(gstin);
  const records = gstData.records as GstRecord[];
  return records.find(r => normalizeIdentifier(r.gstin) === normalized) || null;
}

function extractPanFromGstin(gstin: string): string {
  if (gstin && gstin.length >= 15) {
    return gstin.substring(2, 12);
  }
  return '';
}

/** Maximum months a return period may lag before filing is treated as lapsed. */
const MAX_RETURN_LAG_MONTHS = 3;

/** Parses "August 2026" style periods and checks the lag against today. */
function isReturnFilingCurrent(lastReturnFiled: string | undefined, now: Date = new Date()): boolean {
  if (!lastReturnFiled) return false;
  const period = new Date(`1 ${lastReturnFiled}`);
  if (isNaN(period.getTime())) return false;
  const lagMonths = (now.getFullYear() - period.getFullYear()) * 12 + (now.getMonth() - period.getMonth());
  return lagMonths <= MAX_RETURN_LAG_MONTHS;
}

export class GstConnector implements IGovVerificationConnector {
  id: GovConnectorId = 'gst';
  name = 'GST Network (GSTN)';

  verify(identity: BidderExtractedIdentity, environment: GovVerificationEnvironment): GovVerificationResult {
    const checkedAt = getCurrentTimestamp();
    const sourceType = resolveSourceType(environment);
    const gstin = identity.gstin;

    if (!gstin) {
      return {
        connectorId: this.id,
        source: this.name,
        sourceType,
        status: 'UNAVAILABLE',
        identifier: 'NOT PROVIDED',
        checkedAt,
        fields: [],
        message: 'No GSTIN was found in the bidder documents.',
      };
    }

    const govRecord = lookupGstRecord(gstin);

    if (!govRecord) {
      return {
        connectorId: this.id,
        source: this.name,
        sourceType,
        status: 'NOT_FOUND',
        identifier: gstin,
        checkedAt,
        fields: [{
          field: 'gstin',
          fieldLabel: 'GST Identification Number',
          documentValue: gstin,
          governmentValue: 'NOT REGISTERED',
          match: false,
        }],
        evidence: [{
          label: 'Lookup Result',
          value: `No registration found for ${gstin} in government registry`,
        }],
        message: `Government Record Not Found: No GST registration exists for ${gstin}.`,
      };
    }

    const fields: GovFieldComparison[] = [];

    // GSTIN
    const gstinMatch = identifiersMatch(gstin, govRecord.gstin);
    fields.push({
      field: 'gstin',
      fieldLabel: 'GST Identification Number',
      documentValue: gstin,
      governmentValue: govRecord.gstin,
      match: gstinMatch,
      confidence: gstinMatch ? 1.0 : 0,
    });

    // Legal Name
    const nameResult = namesMatch(identity.legalName, govRecord.legalName);
    fields.push({
      field: 'legalName',
      fieldLabel: 'Legal Name',
      documentValue: identity.legalName || 'Not Extracted',
      governmentValue: govRecord.legalName,
      match: nameResult.match,
      confidence: nameResult.confidence,
    });
    
    // Trade Name (only compare if extracted from document)
    if (identity.tradeName) {
      const tradeNameResult = namesMatch(identity.tradeName, govRecord.tradeName);
      fields.push({
        field: 'tradeName',
        fieldLabel: 'Trade Name',
        documentValue: identity.tradeName,
        governmentValue: govRecord.tradeName,
        match: tradeNameResult.match,
        confidence: tradeNameResult.confidence,
      });
    }

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
    const panFromGstin = extractPanFromGstin(govRecord.gstin);
    const expectedPan = govRecord.pan || panFromGstin;
    if (identity.pan || expectedPan) {
      const panMatch = identifiersMatch(identity.pan, expectedPan);
      fields.push({
        field: 'pan',
        fieldLabel: 'Income Tax PAN',
        documentValue: identity.pan || 'Not Extracted',
        governmentValue: expectedPan,
        match: panMatch,
        confidence: panMatch ? 1.0 : 0,
      });
    }

    // Return filing: a registration can be ACTIVE while returns have lapsed.
    const returnFilingCurrent = isReturnFilingCurrent(govRecord.lastReturnFiled);
    fields.push({
      field: 'lastReturnFiled',
      fieldLabel: 'GST Return Filing (GSTR-3B)',
      documentValue: 'Regular filer',
      governmentValue: govRecord.lastReturnFiled || 'No returns on record',
      match: returnFilingCurrent,
      confidence: 1.0,
    });

    const evidence: GovVerificationEvidence[] = [
      { label: 'State', value: govRecord.state },
      { label: 'Taxpayer Type', value: govRecord.taxpayerType },
      { label: 'Registration Date', value: govRecord.registrationDate },
      { label: 'Constitution of Business', value: govRecord.constitutionOfBusiness },
      { label: 'Last Return Filed', value: govRecord.lastReturnFiled },
    ];

    let status: GovVerificationStatus;
    let message: string;

    const hasCriticalMismatch = fields.some(f => !f.match && ['pan', 'gstin'].includes(f.field));
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
      message = 'All GST registration fields confirmed against the government registry.';
    }

    return {
      connectorId: this.id,
      source: this.name,
      sourceType,
      status,
      identifier: gstin,
      checkedAt,
      fields,
      evidence,
      message,
    };
  }
}
