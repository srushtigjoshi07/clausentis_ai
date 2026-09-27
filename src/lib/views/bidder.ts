/**
 * Server-side read models for the bidder portal. Import only from server components.
 */
import { getLatestProcurementDecision } from '@/lib/actions/decisions';
import { getMyBidSubmissionsAction } from '@/lib/actions/tender-discovery';
import type { BidderProfile, BidSubmissionRecord, DiscoveredTender } from '@/types/tender-discovery';

export interface Eligibility {
  turnover: { need: number; you: number | null; ok: boolean | null };
  experience: { need: number; you: number | null; ok: boolean | null };
  /** 'qualify' when every declared figure meets the minimum, 'short' if any falls short, 'unknown' if figures are missing. */
  status: 'qualify' | 'short' | 'unknown';
  shortBy: string[];
}

export function eligibilityFor(tender: DiscoveredTender, profile: BidderProfile | null): Eligibility {
  const tYou = profile?.annualTurnoverInCr ?? null;
  const eYou = profile?.relevantExperienceYears ?? null;
  const tOk = tYou === null ? null : tYou >= tender.minimumTurnoverRequired;
  const eOk = eYou === null ? null : eYou >= tender.minimumExperienceYears;
  const shortBy: string[] = [];
  if (tOk === false) shortBy.push(`turnover ₹${(tender.minimumTurnoverRequired - (tYou ?? 0)).toFixed(2)} Cr short`);
  if (eOk === false) shortBy.push(`experience ${(tender.minimumExperienceYears - (eYou ?? 0)).toFixed(1).replace(/\.0$/, '')} yrs short`);
  const status = tOk === false || eOk === false ? 'short' : tOk === null || eOk === null ? 'unknown' : 'qualify';
  return {
    turnover: { need: tender.minimumTurnoverRequired, you: tYou, ok: tOk },
    experience: { need: tender.minimumExperienceYears, you: eYou, ok: eOk },
    status,
    shortBy,
  };
}

export interface SubmissionView {
  record: BidSubmissionRecord;
  bidId: string;
  decision: { code: string; signedAt: string } | null;
}

/** The bidder's own submissions with any signed decision (bidder view: officer notes redacted). */
export async function listMySubmissions(): Promise<SubmissionView[]> {
  const records = await getMyBidSubmissionsAction();
  return Promise.all(
    records.map(async (record) => {
      const bidId = record.submissionId.toLowerCase();
      let decision: SubmissionView['decision'] = null;
      try {
        const res = await getLatestProcurementDecision(bidId);
        if (res.decision && res.decision.status !== 'SUPERSEDED') {
          decision = { code: res.decision.decision, signedAt: res.decision.signed_at };
        }
      } catch {
        decision = null;
      }
      return { record, bidId, decision };
    })
  );
}

/** Bid document types (uploader) mapped to vault categories (document vault). */
export const BID_DOC_TO_VAULT: Record<string, string[]> = {
  audited_financials: ['financial_statement'],
  experience_certificate: ['experience_certificate'],
  gst_certificate: ['tax_document'],
  pan_card: ['tax_document'],
  udyam_certificate: ['tax_document', 'udyam_certificate'],
  emd_proof: ['tax_document', 'udyam_certificate'],
  non_blacklisting_declaration: ['affidavit'],
  local_content_declaration: ['affidavit'],
  technical_compliance: ['quality_certification', 'technical'],
  oem_authorization: ['oem_authorization'],
};

export const BID_DOCS_NEEDED: Array<{ type: string; label: string }> = [
  { type: 'audited_financials', label: 'Audited financial statements' },
  { type: 'experience_certificate', label: 'Experience / completion certificates' },
  { type: 'gst_certificate', label: 'GST registration (REG-06)' },
  { type: 'pan_card', label: 'PAN card' },
  { type: 'udyam_certificate', label: 'Udyam certificate (EMD exemption)' },
  { type: 'oem_authorization', label: 'OEM manufacturer authorization' },
  { type: 'local_content_declaration', label: 'Local content declaration' },
  { type: 'non_blacklisting_declaration', label: 'Non-blacklisting affidavit (Annexure-B)' },
  { type: 'technical_compliance', label: 'Technical datasheet & deviation statement' },
];
