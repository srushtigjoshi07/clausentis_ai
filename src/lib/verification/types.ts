/**
 * Government Verification Gateway — Type Definitions
 *
 * Common type contracts for the modular government verification layer.
 * Every connector (Udyam, GST, MCA, future sources) returns the same
 * GovVerificationResult format, enabling uniform cross-verification
 * and entity resolution.
 *
 * IMPORTANT: This module does NOT implement CAPTCHA bypassing, unauthorized
 * scraping, credential harvesting, or any mechanism intended to circumvent
 * government portal access controls.
 */

export type GovVerificationStatus =
  | 'VERIFIED'
  | 'MISMATCH'
  | 'NOT_FOUND'
  | 'INACTIVE'
  | 'EXPIRED'
  | 'UNAVAILABLE'
  | 'REQUIRES_REVIEW';

export type GovVerificationSource =
  | 'GOVERNMENT_API'
  | 'GOVERNMENT_PORTAL'
  | 'DIGILOCKER'
  | 'MOCK_GOVERNMENT'
  | 'MANUAL';

export type GovVerificationEnvironment = 'DEMO' | 'PRODUCTION';

export type GovConnectorId = 
  | 'udyam' 
  | 'gst' 
  | 'mca'
  | 'digilocker'
  | 'pan'
  | 'income_tax'
  | 'epfo'
  | 'esic'
  | 'nsic'
  | 'startup_india'
  | 'bis'
  | 'gem'
  | 'blacklisting';

export interface GovFieldComparison {
  field: string;
  fieldLabel: string;
  documentValue?: string;
  governmentValue?: string;
  match: boolean;
  confidence?: number;
}

export interface GovVerificationEvidence {
  label: string;
  value: string;
}

export interface GovVerificationResult {
  connectorId: GovConnectorId;
  source: string;
  sourceType: GovVerificationSource;
  status: GovVerificationStatus;
  identifier: string;
  checkedAt: string;
  fields: GovFieldComparison[];
  evidence?: GovVerificationEvidence[];
  message?: string;
}

// What gets extracted from a bidder's documents
export interface BidderExtractedIdentity {
  legalName?: string;
  tradeName?: string;
  pan?: string;
  gstin?: string;
  cin?: string;
  udyamNumber?: string;
  registeredAddress?: string;
  status?: string;
  organisationType?: string;
  registrationDate?: string;
}

// Full verification report for a bidder across all sources
export interface GovernmentVerificationReport {
  bidderId: string;
  bidderName: string;
  environment: GovVerificationEnvironment;
  extractedIdentity: BidderExtractedIdentity;
  verifications: GovVerificationResult[];
  entityResolution: EntityResolutionResult;
  overallScore: GovernmentVerificationScore;
  generatedAt: string;
}

export interface EntityResolutionResult {
  normalizedName: string;
  nameConsistency: 'CONSISTENT' | 'VARIATION_DETECTED' | 'CONFLICT';
  panConsistency: 'CONSISTENT' | 'CONFLICT' | 'INCOMPLETE';
  nameVariations: { source: string; name: string; normalized: string }[];
  panValues: { source: string; pan: string }[];
  conflicts: { field: string; description: string; severity: 'HIGH' | 'MEDIUM' | 'LOW' }[];
}

export interface GovernmentVerificationScore {
  total: number;       // out of 100
  matchedFields: number;
  reviewFields: number;
  mismatchedFields: number;
  breakdown: {
    identity: { score: number; maxScore: number; label: string };
    registration: { score: number; maxScore: number; label: string };
    status: { score: number; maxScore: number; label: string };
    crossVerification: { score: number; maxScore: number; label: string };
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Abstract connector interface
export interface IGovVerificationConnector {
  id: GovConnectorId;
  name: string;
  verify(identity: BidderExtractedIdentity, environment: GovVerificationEnvironment): GovVerificationResult;
}
