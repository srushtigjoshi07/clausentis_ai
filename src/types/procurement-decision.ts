/**
 * Clausentis — Digital Approval & Decision Signing Data Contracts
 * Defines types for sovereign Procurement Officer decisions, integrity hashing,
 * and immutable decision records under SIH26100.
 */

export type OfficerDecisionAction =
  | 'APPROVED'
  | 'REJECTED'
  | 'CLARIFICATION_REQUIRED'
  | 'MANUAL_REVIEW';

export type DecisionStatus =
  | 'PENDING_OFFICER_REVIEW'
  | 'SIGNED'
  | 'REVISED'
  | 'SUPERSEDED';

export interface ProcurementDecisionRecord {
  id: string;
  decision_id: string;
  tender_id: string;
  bid_id: string;
  bidder_id: string;
  bidder_name: string;
  officer_user_id: string;
  officer_name: string;
  officer_email: string;
  organisation: string;
  officer_role: string;
  decision: OfficerDecisionAction;
  remarks: string;
  compliance_score_snapshot: number;
  risk_level_snapshot: string;
  ai_recommendation_snapshot: string;
  signed_at: string;
  decision_version: number;
  status: DecisionStatus;
  integrity_hash: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SignDecisionPayload {
  tenderId: string;
  tenderTitle?: string;
  tenderReference?: string;
  bidId: string;
  bidderId: string;
  bidderName: string;
  decision: OfficerDecisionAction;
  remarks: string;
  complianceScoreSnapshot: number;
  riskLevelSnapshot: string;
  aiRecommendationSnapshot: string;
  isRevision?: boolean;
}

export interface SignDecisionResult {
  success: boolean;
  error?: string;
  decision?: ProcurementDecisionRecord;
  integrityHash?: string;
  timestamp?: string;
}

export interface DecisionHistoryItem {
  version: number;
  decision: OfficerDecisionAction;
  officerName: string;
  signedAt: string;
  remarks: string;
  integrityHash: string;
  status: DecisionStatus;
}
