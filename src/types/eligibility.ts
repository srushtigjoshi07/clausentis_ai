/**
 * Pre-Bid Eligibility Check — Type Definitions
 *
 * Models preliminary eligibility criteria, bidder questionnaire answers,
 * gap analysis, and document checklist before formal document submission.
 */

export type EligibilityStatus = 
  | 'LIKELY_ELIGIBLE' 
  | 'POTENTIALLY_INELIGIBLE' 
  | 'INSUFFICIENT_INFORMATION';

export interface PreBidEligibilityCriteria {
  tenderId: string;
  tenderTitle: string;
  referenceNumber: string;
  minimumTurnoverCr: number;
  minimumExperienceYears: number;
  gstRequired: boolean;
  panRequired: boolean;
  msmeUdyamAllowedForExemption: boolean;
  startupIndiaRelaxationAllowed: boolean;
  oemAuthorizationMandatory: boolean;
  minimumLocalContentPercent: number; // Make in India (e.g. 50% for Class-I)
  nonBlacklistingMandatory: boolean;
  epfoEsicRequired: boolean;
  tenderSpecificRules?: { rule: string; mandatory: boolean }[];
}

export interface PreBidEligibilityAnswers {
  annualTurnoverCr: number;
  experienceYears: number;
  hasActiveGst: boolean;
  hasPan: boolean;
  isUdyamRegistered: boolean;
  isStartupIndiaRecognized: boolean;
  hasOemAuthorization: boolean;
  localContentPercent: number;
  hasNonBlacklistingAffidavit: boolean;
  hasEpfoEsicRegistration: boolean;
  additionalNotes?: string;
}

export interface EligibilityGapItem {
  id: string;
  criterion: string;
  requiredValue: string;
  declaredValue: string;
  status: 'MET' | 'GAP' | 'PARTIAL' | 'EXEMPTED';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  remediationAdvice: string;
}

export interface RequiredDocumentChecklistItem {
  id: string;
  documentName: string;
  purpose: string;
  mandatory: boolean;
  category: 'FINANCIAL' | 'TECHNICAL' | 'STATUTORY' | 'UNDERTAKING';
  sampleOrFormatNote: string;
}

export interface PreBidEligibilityEvaluation {
  tenderId: string;
  status: EligibilityStatus;
  preliminaryScore: number; // 0 - 100
  criteriaMetCount: number;
  totalCriteriaCount: number;
  gaps: EligibilityGapItem[];
  requiredDocuments: RequiredDocumentChecklistItem[];
  evaluatedAt: string;
  disclaimer: string;
}
