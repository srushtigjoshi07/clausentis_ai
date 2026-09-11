import crypto from 'crypto';

/**
 * Computes a deterministic SHA-256 integrity hash over a decision snapshot payload.
 * Utility function usable in both server environments and client verification scripts.
 */
export function computeDecisionIntegrityHash(fields: {
  decisionId: string;
  tenderId: string;
  bidId: string;
  officerUserId: string;
  decision: string;
  remarks: string;
  complianceScoreSnapshot: number;
  riskLevelSnapshot: string;
  aiRecommendationSnapshot: string;
  signedAt: string;
  decisionVersion: number;
}): string {
  const serialized = [
    fields.decisionId,
    fields.tenderId,
    fields.bidId,
    fields.officerUserId,
    fields.decision,
    fields.remarks.trim(),
    fields.complianceScoreSnapshot.toString(),
    fields.riskLevelSnapshot,
    fields.aiRecommendationSnapshot,
    fields.signedAt,
    fields.decisionVersion.toString(),
  ].join('|');

  return crypto.createHash('sha256').update(serialized, 'utf8').digest('hex');
}
