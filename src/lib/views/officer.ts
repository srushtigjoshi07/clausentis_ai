/**
 * Server-side read models for the officer portal.
 *
 * The compliance repository is an in-memory store that lives in the server process.
 * Importing it from a client component gives the browser its own empty copy, so bids
 * registered by submitBidPackageAction never show up there. Pages must therefore read
 * dossiers here (on the server) and pass the plain summaries below to client components.
 *
 * Only import this module from server components, route handlers or server actions.
 */
import {
  getAllBidderDossiers,
  getBidderDossier,
  getSignedProcurementDecision,
} from '@/lib/compliance/repository';
import type { BidderEvaluationDossier, RequirementComplianceResult } from '@/lib/compliance/types';
import { getTenderSource } from '@/lib/tender-discovery/tender-source';
import { getPublishedAuthorityTenders } from '@/lib/actions/tenders';
import type { DiscoveredTender } from '@/types/tender-discovery';
import { countOutcomes, RISK_ORDER, toOutcome, type OutcomeCounts, type Outcome } from '@/components/v2/status';

export interface DecisionSummary {
  code: string;
  signedAt: string;
  officerName: string;
  version?: number;
  integrityHash?: string;
}

export interface BidSummary {
  bidId: string;
  submissionId: string;
  bidderName: string;
  shortName: string;
  tenderId: string;
  tenderReference: string;
  tenderTitle: string;
  submittedAt: string;
  score: number;
  risk: string;
  aiRecommendation: string;
  mandatoryPassed: number;
  mandatoryTotal: number;
  counts: OutcomeCounts;
  clauseCount: number;
  decision: DecisionSummary | null;
  critical: boolean;
  debarred: boolean;
}

/** Latest signed decision for a bid, from the signing store or the dossier record. */
export function decisionForDossier(d: BidderEvaluationDossier): DecisionSummary | null {
  const signed = getSignedProcurementDecision(d.bidId);
  if (signed && signed.status !== 'SUPERSEDED') {
    return {
      code: signed.decision,
      signedAt: signed.signed_at,
      officerName: signed.officer_name,
      version: signed.decision_version,
      integrityHash: signed.integrity_hash,
    };
  }
  if (d.officerDecision && (d.officerDecision.status === 'SIGNED' || d.officerDecision.decisionId)) {
    return {
      code: d.officerDecision.decision,
      signedAt: d.officerDecision.timestamp,
      officerName: d.officerDecision.officerName,
      version: d.officerDecision.decisionVersion,
      integrityHash: d.officerDecision.integrityHash,
    };
  }
  return null;
}

export function summarizeDossier(d: BidderEvaluationDossier): BidSummary {
  const counts = countOutcomes(d.requirementResults.map((r) => r.status));
  return {
    bidId: d.bidId,
    submissionId: d.submissionId,
    bidderName: d.bidderName,
    shortName: d.shortName,
    tenderId: d.tenderId,
    tenderReference: d.tenderReference,
    tenderTitle: d.tenderTitle,
    submittedAt: d.submittedAt,
    score: d.complianceScore,
    risk: d.riskLevel,
    aiRecommendation: d.aiRecommendation?.recommendation ?? '',
    mandatoryPassed: d.mandatoryPassed,
    mandatoryTotal: d.mandatoryTotal,
    counts,
    clauseCount: counts.pass + counts.review + counts.fail + counts.missing,
    decision: decisionForDossier(d),
    critical: d.riskLevel === 'CRITICAL',
    debarred: d.statutoryVerifications.some((s) => s.providerId === 'debarment' && !s.concordant),
  };
}

export function listBidSummaries(tenderId?: string): BidSummary[] {
  return getAllBidderDossiers(tenderId).map(summarizeDossier);
}

export function sortByUrgency(a: BidSummary, b: BidSummary): number {
  return (RISK_ORDER[a.risk] ?? 9) - (RISK_ORDER[b.risk] ?? 9) || a.score - b.score;
}

export function getDossier(bidId: string): BidderEvaluationDossier | null {
  return getBidderDossier(bidId) ?? getBidderDossier(bidId.toLowerCase());
}

/* ───────────── Tenders ───────────── */

export interface PortalTender {
  id: string;
  reference: string;
  title: string;
  organisation: string;
  location: string;
  category: string;
  estimatedValue: string;
  closingDate: string;
  closingTime: string;
  status: string;
  emd: string;
  minimumTurnover: number | null;
  minimumExperience: number | null;
  source: 'catalogue' | 'published';
  documents: DiscoveredTender['documents'];
}

function fromDiscovered(t: DiscoveredTender): PortalTender {
  return {
    id: t.id,
    reference: t.referenceNumber,
    title: t.title,
    organisation: t.issuingOrganisation,
    location: t.location,
    category: t.category,
    estimatedValue: t.estimatedValue,
    closingDate: t.closingDate,
    closingTime: t.closingTime,
    status: t.tenderStatus,
    emd: t.emdAmount,
    minimumTurnover: t.minimumTurnoverRequired ?? null,
    minimumExperience: t.minimumExperienceYears ?? null,
    source: 'catalogue',
    documents: t.documents,
  };
}

/** Every tender the officer portal knows about: the imported catalogue plus tenders published here. */
export async function listPortalTenders(): Promise<PortalTender[]> {
  const res = await getTenderSource('imported').searchTenders({ activeOnly: false });
  const catalogue = res.tenders.map(fromDiscovered);
  let published: PortalTender[] = [];
  try {
    published = (await getPublishedAuthorityTenders()).map((t) => ({
      id: t.id,
      reference: t.reference,
      title: t.title,
      organisation: 'Published on Clausentis',
      location: '',
      category: t.category,
      estimatedValue: t.estimatedValue,
      closingDate: t.closingDate,
      closingTime: '',
      status: t.status,
      emd: '',
      minimumTurnover: t.minimumTurnover ?? null,
      minimumExperience: t.minimumExperience ?? null,
      source: 'published' as const,
      documents: [],
    }));
  } catch {
    published = [];
  }
  const seen = new Set<string>();
  return [...published, ...catalogue].filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
}

export async function findPortalTender(id: string): Promise<PortalTender | null> {
  const direct = await getTenderSource('imported').getTenderDetails(id);
  if (direct) return fromDiscovered(direct);
  const all = await listPortalTenders();
  return all.find((t) => t.id === id || t.reference === id) ?? null;
}

/* ───────────── Clause matrix ───────────── */

export interface ClauseRow {
  key: string;
  code: string;
  title: string;
  category: string;
  mandatory: boolean;
}

function clauseKey(r: RequirementComplianceResult) {
  return r.clauseCode || r.requirementId;
}

/** Union of clauses evaluated across the given dossiers, in first-seen order. */
export function clauseUnion(dossiers: BidderEvaluationDossier[]): ClauseRow[] {
  const map = new Map<string, ClauseRow>();
  for (const d of dossiers) {
    for (const r of d.requirementResults) {
      const k = clauseKey(r);
      if (!map.has(k)) {
        map.set(k, { key: k, code: r.clauseCode.replace(/^Clause\s*/i, ''), title: r.title, category: r.category, mandatory: r.mandatory });
      }
    }
  }
  return Array.from(map.values());
}

export function resultFor(d: BidderEvaluationDossier, key: string): RequirementComplianceResult | undefined {
  return d.requirementResults.find((r) => clauseKey(r) === key);
}

export function shortValue(r: RequirementComplianceResult | undefined): string {
  if (!r) return 'Not evaluated';
  const v = r.verifiedValue || '';
  return v.length > 40 ? `${v.slice(0, 38)}…` : v || r.status;
}

export function clauseOutcomeCounts(dossiers: BidderEvaluationDossier[], key: string): OutcomeCounts {
  return countOutcomes(dossiers.map((d) => resultFor(d, key)?.status));
}

export function outcomeOf(r: RequirementComplianceResult | undefined): Outcome | null {
  return toOutcome(r?.status);
}
