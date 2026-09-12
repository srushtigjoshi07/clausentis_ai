/**
 * SIH26100 Statutory & Government Verification Provider Types
 *
 * Models the architecture for all 16 government and statutory sources:
 * GeM, Udyam, GSTN, PAN, Income Tax, MCA21, Startup India, NSIC, EPFO, ESIC,
 * DigiLocker, Make in India (DPIIT), BIS, DPIIT, OEM Authorization, Debarment/Blacklisting.
 */

export type StatutoryProviderId =
  | 'gem'
  | 'udyam'
  | 'gstn'
  | 'pan'
  | 'income_tax'
  | 'mca21'
  | 'startup_india'
  | 'nsic'
  | 'epfo'
  | 'esic'
  | 'digilocker'
  | 'make_in_india'
  | 'bis'
  | 'dpiit'
  | 'oem_auth'
  | 'blacklisting';

export type VerificationSourceStatus =
  | 'LIVE_VERIFIED'
  | 'DOCUMENT_VERIFIED'
  | 'PROTOTYPE_VERIFIED'
  | 'INTEGRATION_READY'
  | 'SOURCE_UNAVAILABLE'
  | 'MANUAL_REVIEW'
  | 'NOT_APPLICABLE';

export interface StatutoryProviderMetadata {
  id: StatutoryProviderId;
  name: string;
  department: string;
  portalUrl: string;
  description: string;
  defaultStatus: VerificationSourceStatus;
  statusRationale: string;
  apiEndpointSimulated?: string;
  supportedIdentifiers: string[]; // e.g. ['GSTIN'], ['PAN'], ['UDYAM-XX-00-0000000']
  primaryDocumentProof: string; // e.g. 'Form GST REG-06'
  cvcDefensibilityNote: string;
}

export interface ProviderVerificationResult {
  providerId: StatutoryProviderId;
  providerName: string;
  status: VerificationSourceStatus;
  identifierQueried?: string;
  entityNameMatched?: string;
  isConcordant: boolean;
  timestamp: string;
  sourceType: 'API_DIRECT' | 'DOCUMENT_GROUNDED' | 'PROTOTYPE_SIMULATED';
  details: string;
  confidence: number; // 0 to 1
  evidenceExcerpt?: string;
  sourceDocument?: string;
  sourcePage?: number;
}

export type GovernmentVerificationMode =
  | 'DEMO_SANDBOX'
  | 'OFFICIAL_PORTAL_MANUAL'
  | 'LIVE_AUTHORIZED';

export type GovernmentRecordVerificationStatus =
  | 'MATCH'
  | 'MISMATCH'
  | 'NOT_FOUND'
  | 'INACTIVE'
  | 'EXPIRED'
  | 'UNABLE_TO_VERIFY'
  | 'PENDING'
  | 'ERROR';

export interface FieldComparisonResult {
  fieldName: string;
  fieldLabel: string;
  submittedValue: string | null;
  governmentValue: string | null;
  status: 'MATCH' | 'MISMATCH' | 'NOT_AVAILABLE';
  isKeyField?: boolean;
}

export interface GovernmentRecordComparisonResult {
  providerId: StatutoryProviderId;
  providerName: string;
  verificationMode: GovernmentVerificationMode;
  status: GovernmentRecordVerificationStatus;
  identifierQueried: string;
  statusMessage: string;
  fieldComparisons: FieldComparisonResult[];
  matchedFields: string[];
  mismatchedFields: string[];
  verifiedAt: string;
  sourceReference: string;
  governmentRecord?: Record<string, unknown>;
  submittedRecord?: Record<string, unknown>;
}

export interface NormalizedVerificationResult {
  provider: string;
  providerId: StatutoryProviderId;
  status: VerificationSourceStatus;
  verified: boolean;
  data: Record<string, unknown>;
  evidence: {
    documentName: string;
    pageNumber: number;
    excerpt?: string;
    confidence: number;
  } | string;
  checked_at: string;
  confidence: number;
  manual_review_required: boolean;
  findingMessage?: string;
  governmentVerification?: GovernmentRecordComparisonResult;
}

export interface StatutoryVerificationRequest {
  companyName: string;
  pan?: string;
  gstin?: string;
  udyamNumber?: string;
  cin?: string;
  localContentPercent?: number;
  oemAuthRef?: string;
  oemManufacturer?: string;
  epfoApplicable?: boolean;
  esicApplicable?: boolean;
  verificationMode?: GovernmentVerificationMode;
  evaluationDate?: string;
  documentsSubmitted?: Array<{
    documentId: string;
    documentType: string;
    documentName: string;
    pageNumber?: number;
    extractedValues?: Record<string, unknown>;
    expiryDate?: string;
  }>;
}

export interface IStatutoryProvider {
  id: StatutoryProviderId;
  name: string;
  verify(context: StatutoryVerificationRequest, tenderRequirement?: unknown): NormalizedVerificationResult;
}

