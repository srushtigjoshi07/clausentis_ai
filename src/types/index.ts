export type { Tender, TenderSummary, TenderStatus, RiskLevel } from './tender';
export type {
  TenderRequirement,
  StructuredRequirement,
  RequirementCategory,
  RequirementStatus,
  RequirementPriority,
} from './requirement';
export type {
  ComplianceResult,
  EvidenceItem,
  BidderDocument,
  DocumentType,
  DocumentProcessingStatus,
  EvaluationMethod,
} from './compliance';
export type { Profile, AuditEvent } from './database';
export type {
  ExtractedBidderFacts,
  NormalizedValue,
  CrossDocFactType,
  CrossDocResult,
  CrossDocSeverity,
  CrossDocComparisonMethod,
  CrossDocDocumentEvidence,
  CrossDocumentFinding,
  CrossDocumentCategoryScore,
  CrossDocumentSummary,
  CrossDocumentFindingRow,
} from './cross-document';
export type {
  GovVerificationStatus,
  GovVerificationSource,
  GovVerificationEnvironment,
  GovConnectorId,
  GovFieldComparison,
  GovVerificationEvidence,
  GovVerificationResult,
  BidderExtractedIdentity,
  GovernmentVerificationReport,
  EntityResolutionResult,
  GovernmentVerificationScore,
  IGovVerificationConnector,
} from '@/lib/verification/types';

