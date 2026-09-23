/**
 * Clausentis Modular Document Forensics Engine - Data Contracts
 *
 * Implements structured, evidence-based technical forensics for public procurement.
 * Strictly separates confidence from severity, avoiding unvalidated "AI fraud probabilities".
 */

export type ForensicCheckType =
  | 'PDF_STRUCTURE_ANALYSIS'
  | 'PDF_METADATA_ANALYSIS'
  | 'PDF_REVISION_ANALYSIS'
  | 'TEXT_IMAGE_LAYER_ANALYSIS'
  | 'DIGITAL_SIGNATURE_CHECK'
  | 'IDENTIFIER_QR_DETECTION'
  | 'VISUAL_ANOMALY_DETECTION';

export type ForensicStatus =
  | 'PASS'
  | 'WARNING'
  | 'SUSPICIOUS'
  | 'FAILED'
  | 'NOT_AVAILABLE';

export type ForensicSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ForensicFinding {
  id: string;
  check: ForensicCheckType;
  checkLabel: string;
  status: ForensicStatus;
  severity: ForensicSeverity;
  confidence: number; // 0.0 to 1.0 (statistical certainty of the technical observation itself)
  page?: number;
  explanation: string;
  evidenceSnippet?: string;
  technicalDetails?: Record<string, unknown>;
}

export interface DocumentForensicReport {
  documentId: string;
  fileName: string;
  sha256Checksum: string;
  overallStatus: ForensicStatus;
  overallSeverity: ForensicSeverity;
  findings: ForensicFinding[];
  hasDigitalSignature: boolean;
  revisionCount: number;
  producerTool?: string;
  creationDate?: string;
  modificationDate?: string;
  analyzedAt: string;
  engineVersion: string;
  summary: string;
}
