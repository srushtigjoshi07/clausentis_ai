/**
 * Government Verification Gateway — Deterministic Risk Scoring
 *
 * Calculates a 0–100 verification score using deterministic field-matching
 * rather than AI confidence. Each government field category has a fixed
 * point allocation.
 *
 * Scoring Weights:
 *   Identity (PAN, GSTIN match)          — 25 pts each (max 50)
 *   Legal Name match                     — 20 pts
 *   Registration Status = ACTIVE         — 15 pts
 *   Registration/Incorporation Date      — 10 pts
 *   Address / Other fields               —  5 pts
 *                                        ─────────
 *                                         100 pts
 *
 * Entity resolution conflicts apply penalties.
 */

import type {
  GovVerificationResult,
  EntityResolutionResult,
  GovernmentVerificationScore,
} from './types';

/** Field-to-category mapping and point values */
const FIELD_POINTS: Record<string, { points: number; category: 'identity' | 'registration' | 'status' | 'crossVerification' }> = {
  // Identity fields (PAN, GSTIN)
  pan: { points: 25, category: 'identity' },
  gstin: { points: 25, category: 'identity' },

  // Name fields
  enterpriseName: { points: 20, category: 'identity' },
  legalName: { points: 20, category: 'identity' },
  companyName: { points: 20, category: 'identity' },
  tradeName: { points: 5, category: 'identity' },

  // Status fields
  status: { points: 15, category: 'status' },

  // Registration fields
  registrationDate: { points: 10, category: 'registration' },
  incorporationDate: { points: 10, category: 'registration' },
  udyamNumber: { points: 10, category: 'registration' },
  cin: { points: 10, category: 'registration' },

  // Other fields
  organisationType: { points: 5, category: 'registration' },
  state: { points: 5, category: 'crossVerification' },
  registeredState: { points: 5, category: 'crossVerification' },
  address: { points: 5, category: 'crossVerification' },
  constitutionOfBusiness: { points: 5, category: 'crossVerification' },
};

/** Category max scores */
const CATEGORY_MAX: Record<string, number> = {
  identity: 50,
  registration: 25,
  status: 15,
  crossVerification: 10,
};

const CATEGORY_LABELS: Record<string, string> = {
  identity: 'Identity Verification (PAN, GSTIN, Legal Name)',
  registration: 'Registration Validation (Udyam, CIN, Dates)',
  status: 'Active Status Confirmation',
  crossVerification: 'Cross-Source Consistency',
};

export function calculateVerificationScore(
  verifications: GovVerificationResult[],
  entityResolution: EntityResolutionResult
): GovernmentVerificationScore {
  // Track scores per category
  const categoryScores: Record<string, number> = {
    identity: 0,
    registration: 0,
    status: 0,
    crossVerification: 0,
  };

  // Track field stats
  let matchedFields = 0;
  let reviewFields = 0;
  let mismatchedFields = 0;

  // Track which fields we've already scored (avoid double-counting across connectors)
  const scoredFields = new Set<string>();

  for (const v of verifications) {
    if (v.status === 'UNAVAILABLE') continue;

    if (v.status === 'NOT_FOUND') {
      // NOT_FOUND is a mismatch for the entire connector
      mismatchedFields += 1;
      continue;
    }

    for (const f of v.fields) {
      const fieldConfig = FIELD_POINTS[f.field];
      if (!fieldConfig) continue;

      if (f.match) {
        matchedFields++;
        // Only award points once per field type
        if (!scoredFields.has(f.field)) {
          categoryScores[fieldConfig.category] += fieldConfig.points;
          scoredFields.add(f.field);
        }
      } else {
        // Determine if it's a hard mismatch or just requires review
        if (f.confidence !== undefined && f.confidence > 0) {
          reviewFields++;
        } else {
          mismatchedFields++;
        }
      }
    }
  }

  // Cap each category to its max
  for (const cat of Object.keys(categoryScores)) {
    categoryScores[cat] = Math.min(categoryScores[cat], CATEGORY_MAX[cat] || 100);
  }

  // Base score from field matching
  let total =
    categoryScores.identity +
    categoryScores.registration +
    categoryScores.status +
    categoryScores.crossVerification;

  // Entity resolution penalties
  if (entityResolution.panConsistency === 'CONFLICT') {
    total -= 25;
  }
  if (entityResolution.nameConsistency === 'CONFLICT') {
    total -= 15;
  }
  if (entityResolution.nameConsistency === 'VARIATION_DETECTED') {
    total -= 5; // minor penalty for variations like "Pvt Ltd" vs "Private Limited"
  }

  // Clamp to 0-100
  total = Math.max(0, Math.min(100, total));

  // Determine risk level
  let riskLevel: GovernmentVerificationScore['riskLevel'];
  if (total < 40 || entityResolution.panConsistency === 'CONFLICT') {
    riskLevel = 'CRITICAL';
  } else if (total < 60) {
    riskLevel = 'HIGH';
  } else if (total < 80) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  return {
    total,
    matchedFields,
    reviewFields,
    mismatchedFields,
    breakdown: {
      identity: {
        score: categoryScores.identity,
        maxScore: CATEGORY_MAX.identity,
        label: CATEGORY_LABELS.identity,
      },
      registration: {
        score: categoryScores.registration,
        maxScore: CATEGORY_MAX.registration,
        label: CATEGORY_LABELS.registration,
      },
      status: {
        score: categoryScores.status,
        maxScore: CATEGORY_MAX.status,
        label: CATEGORY_LABELS.status,
      },
      crossVerification: {
        score: categoryScores.crossVerification,
        maxScore: CATEGORY_MAX.crossVerification,
        label: CATEGORY_LABELS.crossVerification,
      },
    },
    riskLevel,
  };
}
