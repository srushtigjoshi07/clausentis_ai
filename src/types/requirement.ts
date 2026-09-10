export type RequirementCategory =
  | 'legal'
  | 'financial'
  | 'experience'
  | 'technical'
  | 'documentation'
  | 'other';

export type RequirementStatus = 'passed' | 'review' | 'failed' | 'missing';
export type RequirementPriority = 'mandatory' | 'optional' | 'desirable';

export interface StructuredRequirement {
  requirementType?: string;
  numericThreshold?: number;
  thresholdUnit?: string;
  thresholdOperator?: string;
  dateRequirement?: string;
  timePeriodMonths?: number;
  requiredDocuments?: string[];
  eligibilityConditions?: string[];
}

export interface TenderRequirement {
  id: string;
  tenderId: string;
  category: RequirementCategory;
  title: string;
  description?: string;
  structuredRequirement?: StructuredRequirement;
  priority: RequirementPriority;
  status?: RequirementStatus;
  confidence?: number;
  explanation?: string;
  recommendation?: string;
  sourcePage?: number;
  sourceSection?: string;
  sortOrder: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
