/**
 * Government Verification Gateway — Base Connector Utilities
 */

import type { GovVerificationSource, GovVerificationEnvironment } from '../types';

/** Get current IST timestamp string */
export function getCurrentTimestamp(): string {
  return new Date().toLocaleString('en-GB', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  }) + ' IST';
}

/** Resolve verification source type based on environment */
export function resolveSourceType(environment: GovVerificationEnvironment): GovVerificationSource {
  return environment === 'PRODUCTION' ? 'GOVERNMENT_API' : 'MOCK_GOVERNMENT';
}

/** Normalize an enterprise/legal name for deterministic comparison */
export function normalizeLegalName(name: string | undefined | null): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^m\/s\s+/i, '')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, ' ')
    .replace(/\bprivate\s+limited\b/g, 'pvt ltd')
    .replace(/\bpvt\s+limited\b/g, 'pvt ltd')
    .replace(/\bpvt\s*\.?\s*ltd\s*\.?/g, 'pvt ltd')
    .replace(/\blimited\b/g, 'ltd')
    .replace(/\bltd\s*\.?/g, 'ltd')
    .replace(/\blimited\s+liability\s+partnership\b/g, 'llp')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalize an identifier (PAN, GSTIN, CIN, Udyam Number) */
export function normalizeIdentifier(id: string | undefined | null): string {
  if (!id) return '';
  return id.replace(/[^A-Za-z0-9-]/g, '').toUpperCase().trim();
}

/** Check if two names are equivalent after normalization, with fuzzy inclusion */
export function namesMatch(a: string | undefined | null, b: string | undefined | null): { match: boolean; confidence: number } {
  const normA = normalizeLegalName(a);
  const normB = normalizeLegalName(b);
  if (!normA || !normB) return { match: false, confidence: 0 };
  if (normA === normB) return { match: true, confidence: 1.0 };
  if (normA.includes(normB) || normB.includes(normA)) return { match: true, confidence: 0.9 };
  return { match: false, confidence: 0 };
}

/** Check if two identifiers match exactly after normalization */
export function identifiersMatch(a: string | undefined | null, b: string | undefined | null): boolean {
  const normA = normalizeIdentifier(a);
  const normB = normalizeIdentifier(b);
  return Boolean(normA && normB && normA === normB);
}
