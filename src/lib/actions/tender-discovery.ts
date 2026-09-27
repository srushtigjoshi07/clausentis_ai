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
import { registerSubmittedBidDossier } from '@/lib/compliance/repository';
import { sanitizeSubmittedDocuments } from '@/lib/tender-discovery/evidence-seal';
import { UdyamProvider } from '@/lib/providers/providers';
import type {
  BidderEvaluationDossier,
  ComplianceRuleType,
  ComplianceStatus,
  RiskLevel,
  CrossDocumentFinding,
} from '@/lib/compliance/types';
import type {
  BidderProfile,
  BidComplianceReport,
  BidSubmissionRecord,
  BidUploadedDocument,
  DiscoveredTender,
  TenderSearchParams,
  TenderSearchResult,
} from '@/types/tender-discovery';

// In-memory fallback store for prototype submissions, keyed by submission id.
// Each entry remembers its owner so one bidder never sees another's submissions.
const GLOBAL_SUBMISSION_STORE = new Map<string, { ownerUserId: string; record: BidSubmissionRecord }>();

/**
 * Runs the compliance engine on documents whose evidence the server can trust.
 * Documents with a missing/invalid evidence seal lose their extracted facts, and are flagged.
 */
function evaluateOnServer(
  tender: DiscoveredTender,
  bidderProfile: BidderProfile,
  documents: BidUploadedDocument[],
  version: number
): BidComplianceReport {
  const { documents: trusted, unverifiedFiles } = sanitizeSubmittedDocuments(documents);
  const report = runBidComplianceEvaluation(tender, bidderProfile, trusted, version);
  for (const fileName of unverifiedFiles) {
    report.criticalFindings.push({
      id: `crit-evidence-seal-${fileName}`,
      title: 'Evidence Integrity Check Failed',
      required: 'Facts extracted by the Clausentis server',
      evidence: `Extracted values for "${fileName}" were altered or not produced by the server and were discarded.`,
      source: fileName,
      status: 'HIGH_RISK',
      remediation: 'Re-upload the document so it can be re-processed.',
    });
  }
  return report;
}

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
  const report = evaluateOnServer(tender, bidderProfile, documents, version);

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
  documents: BidUploadedDocument[],
  version: number,
  options?: { allowUnresolvedSubmission?: boolean }
): Promise<{
  success: boolean;
  submission?: BidSubmissionRecord;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Please sign in to submit a bid.' };
    }

    const tender = await getDiscoveredTenderAction(tenderId);
    if (!tender) {
      return { success: false, error: 'Tender not found.' };
    }

    // Re-evaluate on the server. The browser's copy of the report is never trusted,
    // otherwise a bidder could submit an edited score to the authority.
    const report = evaluateOnServer(tender, bidderProfile, documents, version);

    const adapter = new ClausentisPrototypeSubmissionAdapter();

    // 1. Prepare Package
    const preparedPackage = await adapter.prepareSubmission(
      tender,
      bidderProfile,
      report
    );

    // 2. Validate Submission Gate
    const validation = await adapter.validateSubmission(preparedPackage, report, options);
    if (!validation.canSubmit) {
      return {
        success: false,
        error: `Submission blocked: ${validation.blockingReasons.join(' ')}`,
      };
    }

    // 3. Submit Bid
    const submissionRecord = await adapter.submitBid(preparedPackage);

    // Store in-memory
    GLOBAL_SUBMISSION_STORE.set(submissionRecord.submissionId, { ownerUserId: user.id, record: submissionRecord });

    // Register dossier into Shared State Store so Authority Portal reflects it live
    try {
      const nowFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const hasCriticalFailure = report.matrix.some((r) => r.status === 'FAIL' && r.riskLevel === 'CRITICAL');
      const hasHighMismatch = report.crossDocumentMismatches.some((m) => m.severity === 'HIGH');
      const calculatedRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' =
        hasCriticalFailure || report.mandatoryFailed >= 2 || (report.mandatoryFailed > 0 && hasHighMismatch)
          ? 'CRITICAL'
          : report.mandatoryFailed > 0 || hasHighMismatch || report.mandatoryMissing > 0
          ? 'HIGH'
          : report.warningsCount > 0
          ? 'MEDIUM'
          : 'LOW';

      const udyamNumber = bidderProfile.udyamNumber;
      // Reflect what the engine actually checked rather than asserting "ACTIVE" for every source.
      const statutoryRow = (id: string) => report.matrix.find((r) => r.id === id);
      const statutoryList: BidderEvaluationDossier['statutoryVerifications'] = (
        [
          ['req-leg-01', 'gstn', 'GST Registry (Sandbox)'],
          ['req-leg-02', 'pan', 'Income Tax PAN'],
          ['req-dec-01', 'debarment', 'Debarment Registry (Sandbox)'],
        ] as const
      ).flatMap(([rowId, providerId, providerName]) => {
        const row = statutoryRow(rowId);
        return row
          ? [{
              providerId,
              providerName,
              status: row.status,
              concordant: row.status === 'PASS',
              details: row.bidderEvidence,
            }]
          : [];
      });

      if (udyamNumber) {
        const udyamProvider = new UdyamProvider();
        const udyamRes = udyamProvider.verify({
          companyName: bidderProfile.companyName,
          pan: bidderProfile.pan,
          udyamNumber,
        });

        statutoryList.push({
          providerId: 'udyam',
          providerName: 'Ministry of MSME / Udyam Registry',
          status: udyamRes.governmentVerification?.status || (udyamRes.verified ? 'MATCH' : 'MISMATCH'),
          concordant: udyamRes.verified,
          details: udyamRes.findingMessage || `Udyam verification status: ${udyamRes.status}`,
        });

        if (udyamRes.governmentVerification && submissionRecord.auditTrail) {
          submissionRecord.auditTrail.push({
            timestamp: new Date().toISOString(),
            action: 'Statutory Registry Cross-Verification (Udyam)',
            actor: 'MSME Registry Cross-Verifier',
            details: `[${udyamRes.governmentVerification.verificationMode}] Udyam ${udyamRes.governmentVerification.identifierQueried}: ${udyamRes.governmentVerification.status}. ${udyamRes.governmentVerification.statusMessage}`,
          });
        }
      }

      const dossier: BidderEvaluationDossier = {
        bidId: submissionRecord.submissionId.toLowerCase(),
        submissionId: submissionRecord.submissionId,
        ownerUserId: user.id,
        tenderId: tender.id,
        tenderReference: tender.referenceNumber,
        tenderTitle: tender.title,
        bidderName: bidderProfile.companyName,
        shortName: bidderProfile.companyName.split(' ')[0] || 'Bidder',
        registrationNumber: bidderProfile.pan,
        gstin: bidderProfile.gstin,
        pan: bidderProfile.pan,
        udyamNumber: udyamNumber || 'Not registered',
        registeredAddress: bidderProfile.registeredAddress,
        contactPerson: bidderProfile.contactPerson,
        contactEmail: bidderProfile.contactEmail,
        bidValue: 'Not disclosed (financial cover sealed)',
        submittedAt: nowFormatted,
        status: report.status === 'READY_FOR_SUBMISSION' ? 'READY_FOR_REVIEW' : 'REQUIRES_ATTENTION',
        complianceScore: report.overallScore,
        riskLevel: calculatedRisk,
        riskReasons: report.criticalFindings.map((f) => f.title),
        mandatoryTotal: report.mandatoryTotal,
        mandatoryPassed: report.mandatoryPassed,
        failuresCount: report.mandatoryFailed,
        missingCount: report.mandatoryMissing,
        warningsCount: report.warningsCount,
        requirementResults: report.matrix.map((row) => ({
          requirementId: row.id,
          clauseCode: row.tenderClauseReference,
          title: row.requirementTitle,
          category: row.category,
          ruleType: (row.category === 'Financial' ? 'MINIMUM_VALUE' : 'DOCUMENT_REQUIRED') as ComplianceRuleType,
          mandatory: row.isMandatory ?? true,
          status: row.status as ComplianceStatus,
          expectedValue: row.requiredCriteria,
          verifiedValue: row.bidderEvidence,
          reason: row.failureReason || 'Requirement verified against submitted evidence.',
          riskFactor: (row.riskLevel || 'LOW') as RiskLevel,
        })),
        crossDocumentFindings: report.crossDocumentMismatches.map((m, idx) => ({
          id: `mismatch-${idx + 1}`,
          findingType: 'TURNOVER_MISMATCH' as CrossDocumentFinding['findingType'],
          title: `Cross-Document Discrepancy: ${m.field}`,
          severity: (m.severity || 'HIGH') as RiskLevel,
          primaryDocument: {
            name: m.documentA,
            page: 1,
            value: m.detectedDifference,
          },
          conflictingDocument: {
            name: m.documentB,
            page: 1,
            value: m.detectedDifference,
          },
          explanation: m.impactExplanation || m.detectedDifference,
          recommendedAction: 'Resolve discrepancy across contradictory documents.',
        })),
        statutoryVerifications: statutoryList,
        auditEvents: [
          {
            timestamp: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST',
            actor: bidderProfile.contactPerson || 'Vendor Signatory',
            role: 'Bidder Representative',
            action: 'Cryptographic Bid Submission',
            entity: submissionRecord.submissionId,
            details: `Bid package sealed with SHA-256 integrity hash: ${submissionRecord.sha256Checksum}. Compliance score: ${report.overallScore}%.`,
          }
        ],
        aiRecommendation: {
          recommendation:
            calculatedRisk === 'CRITICAL'
              ? 'NON-COMPLIANT'
              : report.status === 'READY_FOR_SUBMISSION' && report.warningsCount === 0
              ? 'COMPLIANT'
              : 'REQUIRES MANUAL REVIEW',
          confidence: 96,
          summary: `Automated qualification verification scored at ${report.overallScore}%. Mandatory criteria: ${report.mandatoryPassed}/${report.mandatoryTotal} passed.`,
          keyRiskFactors: report.criticalFindings.map((f) => f.title),
        },
      };

      registerSubmittedBidDossier(dossier);
    } catch (dossierErr) {
      console.warn('[TenderDiscovery] Failed to register submitted bid into authority repository:', dossierErr);
    }

    // Attempt Supabase persistence
    try {
      {
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

    try {
      revalidatePath('/authority/bids');
      revalidatePath('/authority/dashboard');
      revalidatePath('/tenders');
      revalidatePath('/dashboard');
    } catch {
      // Ignore cache revalidation errors outside request scope
    }
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Check in-memory store (owner only; RLS covers the database path)
  const cached = GLOBAL_SUBMISSION_STORE.get(submissionId);
  if (cached) {
    return cached.ownerUserId === user.id ? cached.record : null;
  }

  // Check Supabase
  try {
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

  // 2. Check in-memory session store (only this user's submissions)
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      for (const { ownerUserId, record } of GLOBAL_SUBMISSION_STORE.values()) {
        if (ownerUserId === user.id) submissions.push(record);
      }
    }
  } catch {
    // No session available
  }

  return submissions;
}

// ─────────────────────────────────────────────────────────────
// 6. Manage Bidder Profile
// ─────────────────────────────────────────────────────────────

function declaredCapability(meta: Record<string, unknown> | undefined): Pick<BidderProfile, 'annualTurnoverInCr' | 'relevantExperienceYears' | 'localContentPercent'> {
  const num = (v: unknown) => {
    const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  return {
    annualTurnoverInCr: num(meta?.declared_turnover_cr),
    relevantExperienceYears: num(meta?.declared_experience_years),
    localContentPercent: num(meta?.declared_local_content_pct),
  };
}

/**
 * The signed-in bidder's saved company profile, or null when they have not saved one.
 * Declared capability (turnover, experience, local content) is self-declared and only used
 * for eligibility pre-checks; the engine verifies figures from documents.
 */
export async function getSavedBidderProfileAction(): Promise<BidderProfile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('bidder_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!data) return null;
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
      ...declaredCapability(user.user_metadata),
    };
  } catch (err) {
    console.warn('[TenderDiscovery] Bidder profile query fallback:', err);
    return null;
  }
}

export async function getBidderProfileAction(): Promise<BidderProfile> {
  const saved = await getSavedBidderProfileAction();
  return saved ?? getDemoBidderProfile();
}

/** Saves the signed-in bidder's company profile (own row only; RLS enforces ownership). */
export async function saveBidderProfileAction(
  input: Omit<BidderProfile, 'entityType'> & { entityType?: BidderProfile['entityType'] }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Please sign in to save your profile.' };

  const { data: roleRow } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (roleRow?.role === 'tender_authority') {
    return { success: false, error: 'Company profiles are for bidder accounts.' };
  }

  const companyName = (input.companyName || '').trim();
  if (!companyName) return { success: false, error: 'Company legal name is required.' };
  const gstin = (input.gstin || '').trim().toUpperCase();
  if (gstin && !/^[0-9A-Z]{15}$/.test(gstin)) return { success: false, error: 'GSTIN must be 15 letters and digits.' };
  const pan = (input.pan || '').trim().toUpperCase();
  if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) return { success: false, error: 'PAN must look like ABCDE1234F.' };

  const row = {
    user_id: user.id,
    company_name: companyName,
    registration_number: (input.registrationNumber || '').trim() || null,
    gstin: gstin || null,
    pan: pan || null,
    udyam_number: (input.udyamNumber || '').trim() || null,
    entity_type: input.entityType || 'Private Limited',
    registered_address: (input.registeredAddress || '').trim() || null,
    contact_person: (input.contactPerson || '').trim() || null,
    contact_email: (input.contactEmail || user.email || '').trim() || null,
    contact_phone: (input.contactPhone || '').trim() || null,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from('bidder_profiles')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = existing?.id
    ? await supabase.from('bidder_profiles').update(row).eq('id', existing.id).eq('user_id', user.id)
    : await supabase.from('bidder_profiles').insert(row);
  if (error) return { success: false, error: error.message };

  // Declared capability is self-reported (never used for authorization), kept in user metadata.
  const clamp = (n: number | undefined, max: number) => (typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= max ? n : null);
  await supabase.auth.updateUser({
    data: {
      declared_turnover_cr: clamp(input.annualTurnoverInCr, 100000),
      declared_experience_years: clamp(input.relevantExperienceYears, 200),
      declared_local_content_pct: clamp(input.localContentPercent, 100),
    },
  });

  try {
    revalidatePath('/bidder', 'layout');
  } catch {
    // outside request scope
  }
  return { success: true };
}
