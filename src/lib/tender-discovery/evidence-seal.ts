/**
 * Evidence Integrity Seal
 *
 * Extracted document facts are produced on the server but travel through the
 * bidder's browser before verification and submission. Without a seal, a bidder
 * could edit `extractedFacts` (e.g. raise turnover) before calling the
 * verification action. The seal is an HMAC over the server-extracted evidence;
 * documents whose seal does not verify are stripped back to "unverified".
 *
 * Server-only: never import this from a client component.
 */

import crypto from 'crypto';
import type { BidUploadedDocument } from '@/types/tender-discovery';
import { getDemoFlawedDocuments, getDemoPassingDocuments } from './bid-compliance-verifier';

function getSecret(): string | undefined {
  return process.env.EVIDENCE_SIGNING_SECRET || undefined;
}

/** JSON with recursively sorted keys so the digest does not depend on key order. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(',')}}`;
}

function digest(doc: BidUploadedDocument, secret: string): string {
  const payload = stableStringify({
    id: doc.id,
    sha256Hash: doc.sha256Hash,
    documentType: doc.documentType,
    extractedFacts: doc.extractedFacts,
    forensicReport: doc.forensicReport,
  });
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function sealEvidence(doc: BidUploadedDocument): BidUploadedDocument {
  const secret = getSecret();
  if (!secret) return doc;
  return { ...doc, evidenceSeal: digest(doc, secret) };
}

const DEMO_DOCUMENTS = new Map(
  [...getDemoFlawedDocuments(), ...getDemoPassingDocuments()].map((d) => [`${d.id}:${d.fileName}`, d])
);

export interface SanitizedDocuments {
  documents: BidUploadedDocument[];
  /** File names whose evidence could not be trusted and was discarded. */
  unverifiedFiles: string[];
}

/**
 * Returns documents whose facts can be trusted:
 * - demo preset documents are replaced by the server's own copy;
 * - uploaded documents keep their facts only if the seal verifies.
 * When EVIDENCE_SIGNING_SECRET is not configured (local development), documents pass through unchanged.
 */
export function sanitizeSubmittedDocuments(documents: BidUploadedDocument[]): SanitizedDocuments {
  const secret = getSecret();
  const unverifiedFiles: string[] = [];

  const sanitized = documents.map((doc) => {
    const demo = DEMO_DOCUMENTS.get(`${doc.id}:${doc.fileName}`);
    if (demo) return demo;
    if (!secret) return doc;

    const expected = digest(doc, secret);
    const provided = doc.evidenceSeal || '';
    const valid =
      provided.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
    if (valid) return doc;

    unverifiedFiles.push(doc.fileName);
    return { ...doc, extractedFacts: undefined, forensicReport: undefined, evidenceSeal: undefined };
  });

  return { documents: sanitized, unverifiedFiles };
}
