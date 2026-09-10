/**
 * Clausentis Multi-Role Data Contracts
 *
 * Types for:
 * 1. User Roles & Profiles (Tender Authority vs Bidder / Vendor)
 * 2. Role-Specific Dashboards (Bidder vs Authority)
 * 3. Bidder Eligibility Assessment ("CHECK MY ELIGIBILITY")
 * 4. Bidder "COMPARE MY COMPANY" side-by-side evidence analysis
 * 5. Authority Multi-Bidder Comparison Matrix
 * 6. Notifications & Corrigendum Tracking
 * 7. Context-Aware Clausentis Assistant
 */

export type UserRole = 'tender_authority' | 'bidder';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organisationName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// Dashboard Metrics
// ─────────────────────────────────────────────────────────────

export interface BidderDashboardMetrics {
  activeOpportunities: number;
  bidsInProgress: number;
  submittedBids: number;
  requiresAttention: number;
}

export interface AuthorityDashboardMetrics {
  activeTenders: number;
  closingSoon: number;
  bidsReceived: number;
  pendingReviews: number;
  flaggedBids: number;
}

// ─────────────────────────────────────────────────────────────
// Bidder Eligibility Check ("CHECK MY ELIGIBILITY")
// ─────────────────────────────────────────────────────────────

export type EligibilityStatus = 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'EVIDENCE_REQUIRED';
export type OverallEligibility = 'READY_TO_BID' | 'REQUIRES_ATTENTION' | 'NOT_ELIGIBLE';

export interface EligibilityCheckItem {
  id: string;
  requirementTitle: string;
  category: 'Financial' | 'Experience' | 'Statutory' | 'Technical' | 'Certifications';
  tenderRequirement: string;
  bidderCapability: string;
  status: EligibilityStatus;
  evidenceDocument?: string;
  evidencePage?: number;
  notes?: string;
}

export interface EligibilityAssessment {
  tenderId: string;
  tenderTitle: string;
  issuingOrganisation: string;
  bidderName: string;
  eligibleCount: number;
  notEligibleCount: number;
  evidenceRequiredCount: number;
  overallStatus: OverallEligibility;
  assessedAt: string;
  items: EligibilityCheckItem[];
}

// ─────────────────────────────────────────────────────────────
// Bidder "COMPARE MY COMPANY"
// ─────────────────────────────────────────────────────────────

export interface CompanyComparisonRow {
  id: string;
  requirement: string;
  tenderRequirement: string;
  companyCapability: string;
  result: 'PASS' | 'FAIL' | 'ACTION';
  evidenceDocument?: string;
  evidencePage?: number;
  evidenceSnippet?: string;
}

// ─────────────────────────────────────────────────────────────
// Authority Multi-Bidder Comparison Matrix
// ─────────────────────────────────────────────────────────────

export interface SubmittedBidderSummary {
  bidderId: string;
  companyName: string;
  registrationNumber: string;
  complianceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'Ready for review' | 'Requires review' | 'Non-compliant';
  mandatoryPassed: boolean;
  submissionId: string;
  submittedAt: string;
  turnoverCr: number;
  experienceYrs: number;
}

export interface RequirementComparisonRow {
  code: string;
  title: string;
  isMandatory: boolean;
  results: Record<string, 'PASS' | 'WARN' | 'FAIL' | 'MISSING'>;
}

export interface MultiBidderComparisonMatrix {
  tenderId: string;
  tenderTitle: string;
  referenceNumber: string;
  issuingOrganisation: string;
  totalBidsCount: number;
  bidders: SubmittedBidderSummary[];
  requirements: RequirementComparisonRow[];
}

// ─────────────────────────────────────────────────────────────
// Notifications & Corrigendum System
// ─────────────────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  userId: string;
  role: UserRole;
  title: string;
  message: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface TenderCorrigendum {
  id: string;
  tenderId: string;
  corrigendumNumber: number;
  title: string;
  summary: string;
  affectedClauses: string[];
  publishedAt: string;
  isAcknowledged?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Context-Aware Clausentis Assistant
// ─────────────────────────────────────────────────────────────

export interface AssistantEvidenceCitation {
  documentName: string;
  page?: number;
  snippet?: string;
}

export interface AssistantChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: AssistantEvidenceCitation[];
  timestamp: string;
}
