/**
 * SIH26100 Canonical Compliance & Evidence Types
 * Standardized data contracts for AI extraction, deterministic validation,
 * statutory provider verification, cross-document checks, and CVC auditability.
 */

export type ComplianceRuleType =
  | 'NUMERIC_THRESHOLD'
  | 'MINIMUM_VALUE'
  | 'MAXIMUM_VALUE'
  | 'DATE_VALIDITY'
  | 'YEARS_EXPERIENCE'
  | 'DOCUMENT_REQUIRED'
  | 'BOOLEAN_REQUIREMENT'
  | 'ENUM_REQUIREMENT'
  | 'TEXT_MATCH'
  | 'ENTITY_MATCH'
  | 'CROSS_DOCUMENT_MATCH'
  | 'PERCENTAGE_THRESHOLD'
  | 'COUNT_THRESHOLD';

export type ComplianceStatus =
  | 'PASS'
  | 'FAIL'
  | 'MISSING'
  | 'WARNING'
  | 'MANUAL_REVIEW'
  | 'NOT_APPLICABLE';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AIRecommendationType =
  | 'COMPLIANT'
  | 'NON-COMPLIANT'
  | 'REQUIRES MANUAL REVIEW';

export type OfficerDecisionType =
  | 'QUALIFIED'
  | 'DISQUALIFIED'
  | 'REQUIRES CLARIFICATION'
  | 'PENDING REVIEW';

/**
 * Structured requirement clause extracted from Tender document
 */
export interface StructuredRequirement {
  id: string;
  clauseCode: string;
  category: 'Financial' | 'Technical' | 'Statutory' | 'Experience' | 'Legal' | 'Quality';
  title: string;
  description: string;
  ruleType: ComplianceRuleType;
  thresholdValue?: number;
  thresholdUnit?: string;
  currency?: string;
  mandatory: boolean;
  evidenceRequired: boolean;
  expectedDocumentType: string;
  sourcePage?: number;
  sourceClause?: string;
}

/**
 * Atomic evidence unit grounded in submitted documents
 */
export interface EvidenceRecord {
  evidenceId: string;
  documentId: string;
  documentName: string;
  pageNumber: number;
  extractedText: string;
  fieldName: string;
  extractedValue: string | number;
  sourceType: 'DOCUMENT' | 'STATUTORY_PORTAL' | 'DECLARED_FORM';
  confidence: number;
  createdAt: string;
}

/**
 * Evaluation of a single requirement against extracted evidence
 */
export interface RequirementComplianceResult {
  requirementId: string;
  clauseCode: string;
  title: string;
  category: string;
  ruleType: ComplianceRuleType;
  mandatory: boolean;
  status: ComplianceStatus;
  expectedValue: string;
  declaredValue?: string;
  verifiedValue: string;
  reason: string;
  discrepancyDelta?: string;
  evidence?: EvidenceRecord;
  riskFactor: RiskLevel;
}

/**
 * Discrepancy detected across two or more submitted or statutory documents
 */
export interface CrossDocumentFinding {
  id: string;
  findingType:
    | 'TURNOVER_MISMATCH'
    | 'ENTITY_NAME_MISMATCH'
    | 'GST_PAN_MISMATCH'
    | 'EXPERIENCE_MISMATCH'
    | 'EXPIRED_DOCUMENT'
    | 'OEM_MISMATCH'
    | 'LOCAL_CONTENT_DEFICIT'
    | 'DEBARMENT_FLAG';
  title: string;
  severity: RiskLevel;
  primaryDocument: {
    name: string;
    page: number;
    value: string;
    excerpt?: string;
  };
  conflictingDocument: {
    name: string;
    page: number;
    value: string;
    excerpt?: string;
  };
  explanation: string;
  recommendedAction: string;
}

/**
 * Full Evaluation Dossier for a submitted bidder proposal
 */
export interface BidderEvaluationDossier {
  bidId: string;
  submissionId: string;
  tenderId: string;
  tenderReference: string;
  tenderTitle: string;
  bidderName: string;
  shortName: string;
  registrationNumber: string;
  gstin: string;
  pan: string;
  udyamNumber: string;
  registeredAddress: string;
  contactPerson: string;
  contactEmail: string;
  bidValue: string;
  submittedAt: string;
  status: 'READY_FOR_REVIEW' | 'REQUIRES_ATTENTION' | 'NON_COMPLIANT';
  complianceScore: number;
  riskLevel: RiskLevel;
  riskReasons: string[];
  mandatoryTotal: number;
  mandatoryPassed: number;
  failuresCount: number;
  missingCount: number;
  warningsCount: number;
  requirementResults: RequirementComplianceResult[];
  crossDocumentFindings: CrossDocumentFinding[];
  statutoryVerifications: {
    providerId: string;
    providerName: string;
    status: string;
    concordant: boolean;
    details: string;
  }[];
  aiRecommendation: {
    recommendation: AIRecommendationType;
    confidence: number;
    summary: string;
    keyRiskFactors: string[];
  };
  officerDecision?: {
    decision: OfficerDecisionType;
    officerName: string;
    officerRole: string;
    timestamp: string;
    notes: string;
  };
  auditEvents?: AuditPdfRecord[];
}

export interface AuditPdfRecord {
  timestamp: string;
  actor: string;
  role: string;
  action: string;
  entity?: string;
  details: string;
}
