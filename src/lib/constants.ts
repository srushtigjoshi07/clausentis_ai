export const SITE_CONFIG = {
  name: 'Clausentis',
  description: 'AI-powered bid compliance intelligence for government procurement. Procurement Intelligence, Made Verifiable.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
} as const;

export const REQUIREMENT_CATEGORIES = [
  { value: 'legal', label: 'Legal', color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950' },
  { value: 'financial', label: 'Financial', color: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950' },
  { value: 'experience', label: 'Experience', color: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950' },
  { value: 'technical', label: 'Technical', color: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950' },
  { value: 'documentation', label: 'Documentation', color: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950' },
  { value: 'other', label: 'Other', color: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900' },
] as const;

export const RISK_LEVEL_CONFIG = {
  low: { label: 'Low Risk', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-900' },
  medium: { label: 'Medium Risk', color: 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-900' },
  high: { label: 'High Risk', color: 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-900' },
  critical: { label: 'Critical Risk', color: 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-900' },
} as const;

export const STATUS_CONFIG = {
  passed: { label: 'Passed', color: 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950' },
  review: { label: 'Needs Review', color: 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950' },
  failed: { label: 'Failed', color: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950' },
  missing: { label: 'Missing', color: 'text-gray-700 bg-gray-50 dark:text-gray-400 dark:bg-gray-900' },
} as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ACCEPTED_FILE_TYPES = ['application/pdf'];
