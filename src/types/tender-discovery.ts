/**
 * Clausentis Tender Discovery & Bid Submission Data Contracts
 *
 * Core interfaces for:
 * 1. Public tender discovery, search, and document catalog
 * 2. Bidder profile and uploaded credentials intake
 * 3. Requirement-by-requirement compliance verification matrix
 * 4. Bid readiness gate and versioned re-verification
 * 5. Clausentis Prototype Bid Submission and immutable audit receipt
 */

export type DiscoveredTenderCategory =
  | 'Goods'
  | 'Works'
  | 'Services'
  | 'Consultancy'
  | 'Turnkey / EPC'
  | 'Maintenance';

export type DiscoveredTenderStatus = 'ACTIVE' | 'CLOSING_SOON' | 'CLOSED' | 'ARCHIVED';

export interface DiscoveredTenderDocument {
  id: string;
  title: string;
  documentType: 'NIT' | 'Technical Specification' | 'BOQ' | 'Eligibility Criteria' | 'General Conditions' | 'Annexure';
  fileName: string;
  fileSizeBytes: number;
  format: 'pdf' | 'xlsx' | 'docx';
  description?: string;
  isMandatory: boolean;
  downloadUrl?: string;
}

export interface DiscoveredTender {
  id: string;
  tenderId: string; // e.g. 2026_CPCL_784912_1
  referenceNumber: string; // e.g. CPCL/ENG/2026/HPGC-0412
  title: string;
  issuingOrganisation: string; // e.g. Chennai Petroleum Corporation Limited
  category: DiscoveredTenderCategory;
  publishedDate: string; // ISO format or display string
  closingDate: string; // Must be in future for ACTIVE tenders
  closingTime: string; // e.g. 15:00 IST
  bidValidityDays: number;
  emdAmount: string; // e.g. ₹29,00,000 or Exempted for MSME
  estimatedValue: string; // e.g. ₹14.50 Crore
  tenderStatus: DiscoveredTenderStatus;
  location: string;
  contactDetails?: string;
  documents: DiscoveredTenderDocument[];
  sourceName: string; // e.g. "Central Public Procurement Portal (CPPP)"
  sourceUrl?: string;
  isLiveSource: boolean;
  summaryDescription: string;
  minimumTurnoverRequired: number; // in Crores INR
  minimumExperienceYears: number;
  similarProjectsRequired: number;
  keyTechnicalSpecs: string[];
}

export interface TenderSearchParams {
  organisation?: string;
  tenderId?: string;
  referenceNumber?: string;
  keyword?: string;
  category?: string;
  location?: string;
  activeOnly?: boolean;
}

export interface TenderSearchResult {
  tenders: DiscoveredTender[];
  totalCount: number;
  sourceUsed: string;
  searchDurationMs: number;
  isFallbackDataset: boolean;
}

export type WorkflowStepId =
  | 'search'
  | 'overview'
  | 'intake'
  | 'verification'
  | 'remediation'
  | 'submission';

export interface BidderProfile {
  companyName: string;
  registrationNumber: string; // CIN or RoC
  gstin: string;
  pan: string;
  udyamNumber?: string;
  entityType: 'Private Limited' | 'Public Limited' | 'LLP' | 'Partnership' | 'Proprietorship';
  registeredAddress: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  annualTurnoverInCr?: number;
  relevantExperienceYears?: number;
}

export interface BidUploadedDocument {
  id: string;
  fileName: string;
  documentType:
    | 'gst_certificate'
    | 'pan_card'
    | 'audited_financials'
    | 'experience_certificate'
    | 'non_blacklisting_declaration'
    | 'local_content_declaration'
    | 'technical_compliance'
    | 'emd_proof'
    | 'udyam_certificate'
    | 'other';
  displayName: string;
  fileSizeBytes: number;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  uploadedAt: string;
  extractedFacts?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────
// Compliance Verification Matrix & Report
// ─────────────────────────────────────────────────────────────

export type ComplianceCheckStatus = 'PASS' | 'FAIL' | 'MISSING' | 'WARNING';
export type ComplianceRiskRating = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ComplianceMatrixRow {
  id: string;
  requirementTitle: string;
  category: 'Financial' | 'Technical' | 'Legal & Regulatory' | 'Documentation' | 'Declarations';
  tenderClauseReference: string;
  requiredCriteria: string;
  bidderEvidence: string;
  status: ComplianceCheckStatus;
  confidence: number;
  riskLevel: ComplianceRiskRating;
  sourceDocument: string;
  sourcePage?: number;
  failureReason?: string;
  remediationAction?: string;
  isMandatory: boolean;
}

export interface CrossDocumentMismatch {
  field: string;
  documentA: string;
  documentB: string;
  detectedDifference: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  pageRef?: string;
  impactExplanation: string;
}

export interface CriticalFindingItem {
  id: string;
  title: string;
  required: string;
  evidence: string;
  source: string;
  page?: number;
  status: 'FAIL' | 'MISSING' | 'HIGH_RISK';
  remediation: string;
}

export interface BidComplianceReport {
  overallScore: number; // 0 to 100
  status: 'READY_FOR_SUBMISSION' | 'REQUIRES_ATTENTION' | 'BLOCKED_CRITICAL_FAILURES';
  mandatoryTotal: number;
  mandatoryPassed: number;
  mandatoryFailed: number;
  mandatoryMissing: number;
  warningsCount: number;
  categoryBreakdown: {
    category: string;
    total: number;
    passed: number;
    percentage: number;
  }[];
  criticalFindings: CriticalFindingItem[];
  matrix: ComplianceMatrixRow[];
  crossDocumentMismatches: CrossDocumentMismatch[];
  verifiedAt: string;
  version: number;
  documentsCount: number;
}

// ─────────────────────────────────────────────────────────────
// Final Bid Submission Record
// ─────────────────────────────────────────────────────────────

export interface BidSubmissionAuditItem {
  timestamp: string;
  action: string;
  actor: string;
  details?: string;
}

export interface BidSubmissionRecord {
  id: string;
  submissionId: string; // e.g. CL-2026-8491024
  tenderId: string;
  tenderTitle: string;
  tenderReference: string;
  issuingOrganisation: string;
  bidderProfile: BidderProfile;
  complianceScore: number;
  verificationVersion: number;
  mandatoryCompliancePassed: boolean;
  documentsManifest: {
    name: string;
    type: string;
    sizeBytes: number;
  }[];
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'VERIFIED' | 'DISQUALIFIED';
  submittedAt: string;
  sha256Checksum: string;
  submissionType: 'Clausentis Prototype Verified Bid Package';
  disclaimer: string;
  auditTrail: BidSubmissionAuditItem[];
}
