import type { RequirementStatus } from './requirement';

export type EvaluationMethod = 'rules_engine' | 'ai_extraction' | 'ai_explanation' | 'manual';

export interface ComplianceResult {
  id: string;
  requirementId: string;
  tenderId: string;
  status: RequirementStatus;
  confidence?: number;
  explanation?: string;
  recommendation?: string;
  evaluationMethod: EvaluationMethod;
  ruleId?: string;
  evaluatedAt: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface EvidenceItem {
  id: string;
  complianceResultId: string;
  documentId?: string;
  sourceType: 'tender_document' | 'bidder_document' | 'extracted';
  content?: string;
  pageNumber?: number;
  sectionReference?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type DocumentType =
  | 'financial_statement'
  | 'registration_certificate'
  | 'experience_certificate'
  | 'tax_document'
  | 'bank_guarantee'
  | 'technical_specification'
  | 'quality_certification'
  | 'insurance'
  | 'power_of_attorney'
  | 'affidavit'
  | 'other';

export type DocumentProcessingStatus = 'uploaded' | 'processing' | 'processed' | 'failed';

export interface BidderDocument {
  id: string;
  tenderId: string;
  userId: string;
  documentType: DocumentType;
  filePath: string;
  fileName: string;
  fileSizeBytes?: number;
  processingStatus: DocumentProcessingStatus;
  extractedData?: Record<string, unknown>;
  pageCount?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
