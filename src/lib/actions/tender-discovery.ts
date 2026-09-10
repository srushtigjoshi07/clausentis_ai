'use server';

/**
 * Clausentis Tender Discovery & Bid Submission Server Actions
 *
 * Server-side actions for:
 * 1. Searching active government tenders
 * 2. Retrieving tender details and document catalogs
 * 3. Executing the 8-stage bid compliance verification engine
 * 4. Storing and re-evaluating bidder submissions
 * 5. Persisting submission packages and recording immutable audit events
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getTenderSource } from '@/lib/tender-discovery/tender-source';
import {
  runBidComplianceEvaluation,
  getDemoBidderProfile,
} from '@/lib/tender-discovery/bid-compliance-verifier';
import {
  ClausentisPrototypeSubmissionAdapter,
} from '@/lib/tender-discovery/submission-adapter';
import type {
  BidderProfile,
  BidComplianceReport,
  BidSubmissionRecord,
  BidUploadedDocument,
  DiscoveredTender,
  TenderSearchParams,
  TenderSearchResult,
} from '@/types/tender-discovery';

// In-memory session store for prototype submissions
const GLOBAL_SUBMISSION_STORE = new Map<string, BidSubmissionRecord>();

// ─────────────────────────────────────────────────────────────
// 1. Search Active Tenders
// ─────────────────────────────────────────────────────────────

export async function searchActiveTendersAction(
  params: TenderSearchParams = {},
  mode: 'live' | 'imported' = 'imported'
): Promise<TenderSearchResult> {
  try {
    const source = getTenderSource(mode);
    return await source.searchTenders(params);
  } catch (error) {
    console.error('[TenderDiscovery] Search failed:', error);
    // Safe fallback to default imported source
    const fallbackSource = getTenderSource('imported');
    return await fallbackSource.searchTenders(params);
  }
}

// ─────────────────────────────────────────────────────────────
// 2. Get Tender Details by ID
// ─────────────────────────────────────────────────────────────

export async function getDiscoveredTenderAction(
  tenderId: string
): Promise<DiscoveredTender | null> {
  try {
    const source = getTenderSource('imported');
    return await source.getTenderDetails(tenderId);
  } catch (error) {
    console.error(`[TenderDiscovery] Failed to fetch tender ${tenderId}:`, error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// 3. Run Bid Compliance Verification
// ─────────────────────────────────────────────────────────────

export async function runBidVerificationAction(
  tenderId: string,
  bidderProfile: BidderProfile,
  documents: BidUploadedDocument[],
  version: number = 1
): Promise<BidComplianceReport> {
  const tender = await getDiscoveredTenderAction(tenderId);
  if (!tender) {
    throw new Error(`Tender ${tenderId} could not be located.`);
  }

  // Run verification engine
  const report = runBidComplianceEvaluation(
    tender,
    bidderProfile,
    documents,
    version
  );

  // Record audit log if authenticated
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from('audit_events').insert({
        user_id: user.id,
        event_type: `Bid Verification v${version}`,
        description: `Ran bid compliance verification for tender "${tender.title}". Score: ${report.overallScore}%. Mandatory: ${report.mandatoryPassed}/${report.mandatoryTotal} passed.`,
        metadata: {
          tender_id: tender.tenderId,
          score: report.overallScore,
          version,
          status: report.status,
          critical_failures: report.criticalFindings.length,
        },
      });
    }
  } catch (auditErr) {
    console.warn('[TenderDiscovery] Audit log non-fatal error:', auditErr);
  }

  return report;
}

// ─────────────────────────────────────────────────────────────
// 4. Submit Final Bid Package (Clausentis Prototype Adapter)
// ─────────────────────────────────────────────────────────────

export async function submitBidPackageAction(
  tenderId: string,
  bidderProfile: BidderProfile,
  report: BidComplianceReport
): Promise<{
  success: boolean;
  submission?: BidSubmissionRecord;
  error?: string;
}> {
  try {
    const tender = await getDiscoveredTenderAction(tenderId);
    if (!tender) {
      return { success: false, error: 'Tender not found.' };
    }

    const adapter = new ClausentisPrototypeSubmissionAdapter();

    // 1. Prepare Package
    const preparedPackage = await adapter.prepareSubmission(
      tender,
      bidderProfile,
      report
    );

    // 2. Validate Submission Gate
    const validation = await adapter.validateSubmission(preparedPackage, report);
    if (!validation.canSubmit) {
      return {
        success: false,
        error: `Submission blocked: ${validation.blockingReasons.join(' ')}`,
      };
    }

    // 3. Submit Bid
    const submissionRecord = await adapter.submitBid(preparedPackage);

    // Store in-memory
    GLOBAL_SUBMISSION_STORE.set(submissionRecord.submissionId, submissionRecord);

    // Attempt Supabase persistence
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Attempt insert to bid_submissions table
        try {
          await supabase
            .from('bid_submissions')
            .insert({
              submission_id: submissionRecord.submissionId,
              discovered_tender_id: submissionRecord.tenderId,
              tender_title: submissionRecord.tenderTitle,
              tender_reference: submissionRecord.tenderReference,
              issuing_organisation: submissionRecord.issuingOrganisation,
              user_id: user.id,
              bidder_profile: submissionRecord.bidderProfile,
              compliance_score: submissionRecord.complianceScore,
              verification_version: submissionRecord.verificationVersion,
              mandatory_passed: submissionRecord.mandatoryCompliancePassed,
              documents_manifest: submissionRecord.documentsManifest,
              matrix_snapshot: report.matrix,
              status: submissionRecord.status,
              sha256_checksum: submissionRecord.sha256Checksum,
              disclaimer: submissionRecord.disclaimer,
              audit_trail: submissionRecord.auditTrail,
            });
        } catch (subErr) {
          console.warn('[TenderDiscovery] Remote bid_submissions insert notice:', subErr);
        }

        // Audit Event
        try {
          await supabase
            .from('audit_events')
            .insert({
              user_id: user.id,
              event_type: 'Clausentis Bid Submission',
              description: `Submitted official bid package for tender ${tender.referenceNumber}. Submission ID: ${submissionRecord.submissionId}. Score: ${submissionRecord.complianceScore}%.`,
              metadata: {
                submission_id: submissionRecord.submissionId,
                checksum: submissionRecord.sha256Checksum,
                score: submissionRecord.complianceScore,
              },
            });
        } catch (auditErr) {
          console.warn('[TenderDiscovery] Audit write notice:', auditErr);
        }
      }
    } catch (err) {
      console.warn('[TenderDiscovery] Supabase write fallback:', err);
    }

    revalidatePath('/tenders');
    revalidatePath('/dashboard');
    return { success: true, submission: submissionRecord };
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : 'Submission processing failed';
    return { success: false, error: errorMsg };
  }
}

// ─────────────────────────────────────────────────────────────
// 5. Fetch Submission Receipt
// ─────────────────────────────────────────────────────────────

export async function getBidSubmissionReceiptAction(
  submissionId: string
): Promise<BidSubmissionRecord | null> {
  // Check in-memory store
  if (GLOBAL_SUBMISSION_STORE.has(submissionId)) {
    return GLOBAL_SUBMISSION_STORE.get(submissionId) || null;
  }

  // Check Supabase
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('bid_submissions')
      .select('*')
      .eq('submission_id', submissionId)
      .single();

    if (data) {
      return {
        id: String(data.id),
        submissionId: String(data.submission_id),
        tenderId: String(data.discovered_tender_id || ''),
        tenderTitle: String(data.tender_title || ''),
        tenderReference: String(data.tender_reference || ''),
        issuingOrganisation: String(data.issuing_organisation || ''),
        bidderProfile: data.bidder_profile as BidderProfile,
        complianceScore: Number(data.compliance_score || 0),
        verificationVersion: Number(data.verification_version || 1),
        mandatoryCompliancePassed: Boolean(data.mandatory_passed),
        documentsManifest: data.documents_manifest as BidSubmissionRecord['documentsManifest'],
        status: data.status as BidSubmissionRecord['status'],
        submittedAt: String(data.submitted_at || ''),
        sha256Checksum: String(data.sha256_checksum || ''),
        submissionType: 'Clausentis Prototype Verified Bid Package',
        disclaimer: String(data.disclaimer || ''),
        auditTrail: (data.audit_trail || []) as BidSubmissionRecord['auditTrail'],
      };
    }
  } catch (err) {
    console.warn('[TenderDiscovery] Failed to query receipt:', err);
  }

  return null;
}

export async function getMyBidSubmissionsAction(): Promise<BidSubmissionRecord[]> {
  const submissions: BidSubmissionRecord[] = [];

  // 1. Check Supabase
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('bid_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false });

      if (data && !error && data.length > 0) {
        return data.map((d) => ({
          id: String(d.id),
          submissionId: String(d.submission_id),
          tenderId: String(d.discovered_tender_id || ''),
          tenderTitle: String(d.tender_title || ''),
          tenderReference: String(d.tender_reference || ''),
          issuingOrganisation: String(d.issuing_organisation || ''),
          bidderProfile: d.bidder_profile as BidderProfile,
          complianceScore: Number(d.compliance_score || 0),
          verificationVersion: Number(d.verification_version || 1),
          mandatoryCompliancePassed: Boolean(d.mandatory_passed),
          documentsManifest: (d.documents_manifest || []) as BidSubmissionRecord['documentsManifest'],
          status: (d.status || 'SUBMITTED') as BidSubmissionRecord['status'],
          submittedAt: String(d.submitted_at || d.created_at || ''),
          sha256Checksum: String(d.sha256_checksum || ''),
          submissionType: 'Clausentis Prototype Verified Bid Package',
          disclaimer: String(d.disclaimer || ''),
          auditTrail: (d.audit_trail || []) as BidSubmissionRecord['auditTrail'],
        }));
      }
    }
  } catch (err) {
    console.warn('[TenderDiscovery] Supabase bid query fallback:', err);
  }

  // 2. Check in-memory session store
  for (const record of GLOBAL_SUBMISSION_STORE.values()) {
    submissions.push(record);
  }

  return submissions;
}

// ─────────────────────────────────────────────────────────────
// 6. Manage Bidder Profile
// ─────────────────────────────────────────────────────────────

export async function getBidderProfileAction(): Promise<BidderProfile> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from('bidder_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        return {
          companyName: String(data.company_name || ''),
          registrationNumber: String(data.registration_number || ''),
          gstin: String(data.gstin || ''),
          pan: String(data.pan || ''),
          udyamNumber: data.udyam_number ? String(data.udyam_number) : undefined,
          entityType: (data.entity_type as BidderProfile['entityType']) || 'Private Limited',
          registeredAddress: String(data.registered_address || ''),
          contactPerson: String(data.contact_person || ''),
          contactEmail: String(data.contact_email || user.email || ''),
          contactPhone: String(data.contact_phone || ''),
        };
      }
    }
  } catch (err) {
    console.warn('[TenderDiscovery] Bidder profile query fallback:', err);
  }

  return getDemoBidderProfile();
}
