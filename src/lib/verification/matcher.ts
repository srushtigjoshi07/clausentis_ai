/**
 * Government Verification Gateway — Entity Resolution Engine
 *
 * Collects identity values (legal name, PAN) from the bidder's documents
 * AND from each government source. Normalizes them and determines whether
 * all references resolve to the same legal entity or whether conflicts exist.
 *
 * This is the "killer feature": GST, Udyam, MCA, PAN all pointing
 * to the same entity — or flagging conflicts.
 */

import type {
  BidderExtractedIdentity,
  GovVerificationResult,
  EntityResolutionResult,
} from './types';
import {
  normalizeLegalName,
  normalizeIdentifier,
  namesMatch,
} from './connectors/base';

/** Connector label map for readable source names */
const CONNECTOR_LABELS: Record<string, string> = {
  udyam: 'Udyam Registration',
  gst: 'GST (GSTN)',
  mca: 'MCA21 Corporate Registry',
};

export function resolveEntity(
  identity: BidderExtractedIdentity,
  verifications: GovVerificationResult[]
): EntityResolutionResult {
  // ─── Collect name variations ───
  const nameVariations: EntityResolutionResult['nameVariations'] = [];

  if (identity.legalName) {
    nameVariations.push({
      source: 'Submitted Documents',
      name: identity.legalName,
      normalized: normalizeLegalName(identity.legalName),
    });
  }
  if (identity.tradeName && identity.tradeName !== identity.legalName) {
    nameVariations.push({
      source: 'Submitted Documents (Trade Name)',
      name: identity.tradeName,
      normalized: normalizeLegalName(identity.tradeName),
    });
  }

  for (const v of verifications) {
    if (v.status === 'NOT_FOUND' || v.status === 'UNAVAILABLE') continue;
    const sourceLabel = CONNECTOR_LABELS[v.connectorId] || v.source;

    const nameField = v.fields.find(
      (f) =>
        f.field === 'enterpriseName' ||
        f.field === 'legalName' ||
        f.field === 'companyName'
    );
    if (nameField?.governmentValue && nameField.governmentValue !== 'Not Extracted') {
      nameVariations.push({
        source: sourceLabel,
        name: nameField.governmentValue,
        normalized: normalizeLegalName(nameField.governmentValue),
      });
    }
  }

  // ─── Collect PAN values ───
  const panValues: EntityResolutionResult['panValues'] = [];

  if (identity.pan) {
    panValues.push({
      source: 'Submitted Documents',
      pan: normalizeIdentifier(identity.pan),
    });
  }

  for (const v of verifications) {
    if (v.status === 'NOT_FOUND' || v.status === 'UNAVAILABLE') continue;
    const sourceLabel = CONNECTOR_LABELS[v.connectorId] || v.source;

    const panField = v.fields.find((f) => f.field === 'pan');
    if (panField?.governmentValue && panField.governmentValue !== 'Not Extracted') {
      const normalizedPan = normalizeIdentifier(panField.governmentValue);
      if (normalizedPan) {
        panValues.push({ source: sourceLabel, pan: normalizedPan });
      }
    }
  }

  // ─── Determine name consistency ───
  const uniqueNormalizedNames = [...new Set(nameVariations.map((n) => n.normalized).filter(Boolean))];
  let nameConsistency: EntityResolutionResult['nameConsistency'] = 'CONSISTENT';

  if (uniqueNormalizedNames.length > 1) {
    // Check if all names are at least fuzzy-equivalent
    let allFuzzyMatch = true;
    for (let i = 0; i < uniqueNormalizedNames.length; i++) {
      for (let j = i + 1; j < uniqueNormalizedNames.length; j++) {
        if (!namesMatch(uniqueNormalizedNames[i], uniqueNormalizedNames[j]).match) {
          allFuzzyMatch = false;
          break;
        }
      }
      if (!allFuzzyMatch) break;
    }

    nameConsistency = allFuzzyMatch ? 'VARIATION_DETECTED' : 'CONFLICT';
  }

  // ─── Determine PAN consistency ───
  const uniquePans = [...new Set(panValues.map((p) => p.pan).filter(Boolean))];
  let panConsistency: EntityResolutionResult['panConsistency'] = 'CONSISTENT';

  if (uniquePans.length === 0) {
    panConsistency = 'INCOMPLETE';
  } else if (uniquePans.length > 1) {
    panConsistency = 'CONFLICT';
  }

  // ─── Build conflicts list ───
  const conflicts: EntityResolutionResult['conflicts'] = [];

  if (nameConsistency === 'CONFLICT') {
    const distinctNames = nameVariations
      .map((n) => `${n.source}: "${n.name}"`)
      .join('; ');
    conflicts.push({
      field: 'legalName',
      description: `Entity name conflict detected across sources. ${distinctNames}`,
      severity: 'MEDIUM',
    });
  }

  if (panConsistency === 'CONFLICT') {
    const distinctPans = panValues
      .map((p) => `${p.source}: ${p.pan}`)
      .join('; ');
    conflicts.push({
      field: 'pan',
      description: `PAN conflict detected across sources. ${distinctPans}`,
      severity: 'HIGH',
    });
  }

  // Detect GSTIN-PAN mismatch (characters 3-12 of GSTIN should be the PAN)
  if (identity.gstin && identity.pan) {
    const gstinPan = normalizeIdentifier(identity.gstin).substring(2, 12);
    const docPan = normalizeIdentifier(identity.pan);
    if (gstinPan && docPan && gstinPan !== docPan) {
      conflicts.push({
        field: 'gstin-pan',
        description: `PAN derived from GSTIN (${gstinPan}) does not match submitted PAN (${docPan}).`,
        severity: 'HIGH',
      });
    }
  }

  // ─── Determine primary normalized name ───
  const normalizedName =
    uniqueNormalizedNames[0]
      ? uniqueNormalizedNames[0]
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      : identity.legalName || '';

  return {
    normalizedName,
    nameConsistency,
    panConsistency,
    nameVariations,
    panValues,
    conflicts,
  };
}
