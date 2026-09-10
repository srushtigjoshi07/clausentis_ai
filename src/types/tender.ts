export type TenderStatus = 'uploaded' | 'processing' | 'analyzed' | 'failed';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Tender {
  id: string;
  userId: string;
  title: string;
  description?: string;
  issuingAuthority?: string;
  tenderReference?: string;
  submissionDeadline?: string;
  filePath: string;
  fileName: string;
  fileSizeBytes?: number;
  status: TenderStatus;
  readinessScore?: number;
  riskLevel?: RiskLevel;
  totalRequirements: number;
  passedCount: number;
  reviewCount: number;
  failedCount: number;
  missingCount: number;
  processingStartedAt?: string;
  processingCompletedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TenderSummary {
  id: string;
  title: string;
  status: TenderStatus;
  readinessScore?: number;
  riskLevel?: RiskLevel;
  totalRequirements: number;
  passedCount: number;
  failedCount: number;
  createdAt: string;
}
