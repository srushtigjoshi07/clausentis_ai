/**
 * Cross-Document Intelligence Types
 *
 * Defines the structured data model for cross-document consistency analysis.
 * Facts are extracted from multiple bidder documents, normalized, compared,
 * and findings are persisted with full traceability.
 */

// ────────────────────────────────────────────────
// Extracted Facts
// ────────────────────────────────────────────────

export interface NormalizedValue {
  original: string;
  normalized: string;
}

export interface ExtractedBidderFacts {
  // Identity
  legalName?: string;
  tradeName?: string;
  pan?: string;
  gstin?: string;
  cin?: string;
  registeredAddress?: string;
  authorizedSignatory?: string;

  // Registration
  registrationNumber?: string;
  registrationAuthority?: string;
  registrationIssueDate?: string;
  registrationExpiryDate?: string;

  // Financial
  turnover?: number;
  turnoverUnit?: string;       // 'Crore', 'Lakh', 'INR'
  netWorth?: number;
  financialYear?: string;
  bankName?: string;

  // Experience
  experiences?: Array<{
    clientName?: string;
    projectName?: string;
    contractValue?: number;
    projectDate?: string;
    completionDate?: string;
  }>;

  // Certifications
  certifications?: Array<{
    certificateName?: string;
    certificateNumber?: string;
    issuingAuthority?: string;
    issueDate?: string;
    expiryDate?: string;
  }>;
}

// ────────────────────────────────────────────────
// Findings
// ────────────────────────────────────────────────

export type CrossDocFactType =
  | 'identity'
  | 'registration'
  | 'financial'
  | 'experience'
  | 'certification'
  | 'date';

export type CrossDocResult =
  | 'MATCH'
  | 'PARTIAL_MATCH'
  | 'POTENTIAL_MISMATCH'
  | 'CONFIRMED_MISMATCH'
  | 'NOT_FOUND'
  | 'REQUIRES_MANUAL_REVIEW';

export type CrossDocSeverity = 'HIGH' | 'MEDIUM' | 'LOW';

export type CrossDocComparisonMethod = 'deterministic' | 'normalization' | 'ai_semantic';

export interface CrossDocDocumentEvidence {
  document_id: string;
  document_name: string;
  original_value: string;
  normalized_value: string;
  page_number?: number;
  source_excerpt?: string;
}

export interface CrossDocumentFinding {
  id: string;
  fact_type: CrossDocFactType;
  fact_label: string;
  documents: CrossDocDocumentEvidence[];
  result: CrossDocResult;
  severity: CrossDocSeverity;
  severity_reason: string;
  explanation: string;
  recommended_action: string;
  comparison_method: CrossDocComparisonMethod;
}

// ────────────────────────────────────────────────
// Summary
// ────────────────────────────────────────────────

export interface CrossDocumentCategoryScore {
  total_checks: number;
  consistent_checks: number;
  percentage: number;
}

export interface CrossDocumentSummary {
  identity: CrossDocumentCategoryScore;
  registration: CrossDocumentCategoryScore;
  financial: CrossDocumentCategoryScore;
  experience: CrossDocumentCategoryScore;
  certification: CrossDocumentCategoryScore;
  overall_issues_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  findings: CrossDocumentFinding[];
  analyzed_at: string;
  document_count: number;
}

// ────────────────────────────────────────────────
// Database Row (maps to cross_document_findings table)
// ────────────────────────────────────────────────

export interface CrossDocumentFindingRow {
  id: string;
  tender_id: string;
  fact_type: string;
  fact_label: string;
  documents: CrossDocDocumentEvidence[];
  result: string;
  severity: string;
  severity_reason?: string;
  explanation?: string;
  recommended_action?: string;
  comparison_method: string;
  created_at: string;
}
