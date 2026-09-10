'use server';

/**
 * Cross-Document Intelligence Server Actions
 *
 * Server-side actions for:
 * 1. Extracting structured facts from individual bidder documents
 * 2. Running cross-document comparison analysis across all bidder docs
 * 3. Persisting and retrieving findings
 */

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { parsePdfDocument } from '@/lib/document/pdf-parser';
import { extractBidderFactsWithAI, extractBidderFactsWithHeuristics } from '@/lib/ai/cross-document-extractor';
import { runCrossDocumentComparison, type DocumentWithFacts } from '@/lib/ai/cross-document-comparison';
import type {
  CrossDocumentFinding,
  CrossDocumentSummary,
  CrossDocumentFindingRow,
  ExtractedBidderFacts,
} from '@/types/cross-document';

// ────────────────────────────────────────────────
// Extract Facts from a Single Bidder Document
// ────────────────────────────────────────────────

export async function extractBidderDocumentFacts(documentId: string): Promise<{
  success: boolean;
  facts?: ExtractedBidderFacts;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Fetch document record
  const { data: doc, error: fetchErr } = await supabase
    .from('bidder_documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', user.id)
    .single();

  if (fetchErr || !doc) {
    return { success: false, error: 'Document not found or access denied.' };
  }

  const storagePath = doc.storage_path || doc.file_path;
  if (!storagePath) {
    return { success: false, error: 'Document has no storage file path.' };
  }

  try {
    // Download the PDF
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('bidder-documents')
      .download(storagePath);

    if (downloadError || !fileData) {
      return { success: false, error: 'Failed to download document from storage.' };
    }

    // Parse PDF
    const arrayBuffer = await fileData.arrayBuffer();
    const parseResult = await parsePdfDocument(arrayBuffer);

    if (parseResult.isScanned || parseResult.totalCharacters < 50) {
      // Fall back to heuristic with whatever text we have
      const facts = extractBidderFactsWithHeuristics(parseResult.fullText);

      // Save extracted data
      await supabase
        .from('bidder_documents')
        .update({
          extracted_data: facts,
          status: 'processed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      return { success: true, facts };
    }

    // Extract with AI (primary) or heuristics (fallback)
    const docName = doc.original_filename || doc.name || 'Document';
    const facts = await extractBidderFactsWithAI(parseResult.fullText, docName);

    // Save extracted data
    await supabase
      .from('bidder_documents')
      .update({
        extracted_data: facts,
        status: 'processed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    return { success: true, facts };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown extraction error';
    console.error(`[CrossDoc] Extraction failed for doc ${documentId}:`, errorMsg);

    // Mark as failed but don't crash
    await supabase
      .from('bidder_documents')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    return { success: false, error: errorMsg };
  }
}

// ────────────────────────────────────────────────
// Run Full Cross-Document Analysis for a Tender
// ────────────────────────────────────────────────

export async function runCrossDocumentAnalysis(tenderId: string): Promise<{
  success: boolean;
  summary?: CrossDocumentSummary;
  error?: string;
}> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Verify tender belongs to user
  const { data: tender, error: tenderErr } = await supabase
    .from('tenders')
    .select('id, title, submission_deadline')
    .eq('id', tenderId)
    .eq('user_id', user.id)
    .single();

  if (tenderErr || !tender) {
    return { success: false, error: 'Tender not found or access denied.' };
  }

  try {
    // Fetch all bidder documents for this user
    const { data: bidderDocs, error: docsErr } = await supabase
      .from('bidder_documents')
      .select('*')
      .eq('user_id', user.id);

    if (docsErr) {
      return { success: false, error: 'Failed to fetch bidder documents.' };
    }

    if (!bidderDocs || bidderDocs.length < 2) {
      // Need at least 2 documents for cross-document comparison
      const emptySummary: CrossDocumentSummary = {
        identity: { total_checks: 0, consistent_checks: 0, percentage: 100 },
        registration: { total_checks: 0, consistent_checks: 0, percentage: 100 },
        financial: { total_checks: 0, consistent_checks: 0, percentage: 100 },
        experience: { total_checks: 0, consistent_checks: 0, percentage: 100 },
        certification: { total_checks: 0, consistent_checks: 0, percentage: 100 },
        overall_issues_count: 0,
        high_count: 0,
        medium_count: 0,
        low_count: 0,
        findings: [],
        analyzed_at: new Date().toISOString(),
        document_count: bidderDocs?.length || 0,
      };

      await supabase
        .from('tenders')
        .update({ cross_document_summary: emptySummary })
        .eq('id', tenderId);

      return {
        success: true,
        summary: emptySummary,
      };
    }

    // Extract facts from each document that hasn't been processed yet
    const documentsWithFacts: DocumentWithFacts[] = [];

    for (const doc of bidderDocs) {
      const existingData = doc.extracted_data as Record<string, unknown> | null;

      // Check if we already have extracted facts
      const hasExtractedFacts = existingData &&
        typeof existingData === 'object' &&
        (existingData.legalName || existingData.pan || existingData.gstin ||
         existingData.turnover || existingData.certifications);

      let facts: ExtractedBidderFacts;

      if (hasExtractedFacts) {
        // Reuse existing extracted data — don't re-send to Groq
        facts = existingData as ExtractedBidderFacts;
      } else {
        // Extract facts for this document
        const result = await extractBidderDocumentFacts(doc.id);
        if (result.success && result.facts) {
          facts = result.facts;
        } else {
          // Skip this document but log the issue
          console.warn(`[CrossDoc] Skipping doc "${doc.original_filename || doc.name}": ${result.error}`);
          continue;
        }
      }

      documentsWithFacts.push({
        documentId: String(doc.id),
        documentName: String(doc.original_filename || doc.name || 'Document'),
        documentType: String(doc.document_type || 'other'),
        facts,
      });
    }

    if (documentsWithFacts.length < 2) {
      // After extraction, still don't have enough docs with facts
      const minSummary: CrossDocumentSummary = {
        identity: { total_checks: 0, consistent_checks: 0, percentage: 100 },
        registration: { total_checks: 0, consistent_checks: 0, percentage: 100 },
        financial: { total_checks: 0, consistent_checks: 0, percentage: 100 },
        experience: { total_checks: 0, consistent_checks: 0, percentage: 100 },
        certification: { total_checks: 0, consistent_checks: 0, percentage: 100 },
        overall_issues_count: 0,
        high_count: 0,
        medium_count: 0,
        low_count: 0,
        findings: [],
        analyzed_at: new Date().toISOString(),
        document_count: documentsWithFacts.length,
      };

      await supabase
        .from('tenders')
        .update({ cross_document_summary: minSummary })
        .eq('id', tenderId);

      return { success: true, summary: minSummary };
    }

    // Run comparison engine
    const bidDeadline = tender.submission_deadline || undefined;
    const summary = runCrossDocumentComparison(documentsWithFacts, bidDeadline);

    // Delete old findings for this tender
    await supabase
      .from('cross_document_findings')
      .delete()
      .eq('tender_id', tenderId);

    // Persist new findings
    if (summary.findings.length > 0) {
      const findingRows = summary.findings.map((f: CrossDocumentFinding) => ({
        tender_id: tenderId,
        fact_type: f.fact_type,
        fact_label: f.fact_label,
        documents: f.documents,
        result: f.result,
        severity: f.severity,
        severity_reason: f.severity_reason,
        explanation: f.explanation,
        recommended_action: f.recommended_action,
        comparison_method: f.comparison_method,
      }));

      const { error: insertErr } = await supabase
        .from('cross_document_findings')
        .insert(findingRows);

      if (insertErr) {
        console.error('[CrossDoc] Failed to insert findings:', insertErr);
        // Non-fatal: summary still saved on tender
      }
    }

    // Save summary on tender record (without the full findings array to save space)
    const summaryForTender = {
      ...summary,
      findings: undefined, // Findings are in the separate table
    };

    await supabase
      .from('tenders')
      .update({
        cross_document_summary: summaryForTender,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenderId);

    // Audit event
    try {
      await supabase.from('audit_events').insert({
        user_id: user.id,
        tender_id: tenderId,
        event_type: 'Cross-Document Analysis',
        description: `Analyzed ${documentsWithFacts.length} documents. Found ${summary.overall_issues_count} issues (${summary.high_count} high, ${summary.medium_count} medium, ${summary.low_count} low).`,
        metadata: {
          document_count: documentsWithFacts.length,
          issues_count: summary.overall_issues_count,
          high_count: summary.high_count,
          medium_count: summary.medium_count,
          low_count: summary.low_count,
        },
      });
    } catch (err) {
      console.warn('[CrossDoc] Audit event failed:', err);
    }

    revalidatePath(`/tenders/${tenderId}`);
    return { success: true, summary };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Cross-document analysis failed';
    console.error('[CrossDoc] Analysis failed:', errorMsg);
    return { success: false, error: errorMsg };
  }
}

// ────────────────────────────────────────────────
// Fetch Persisted Findings
// ────────────────────────────────────────────────

export async function getCrossDocumentFindings(tenderId: string): Promise<CrossDocumentFindingRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Verify tender ownership
  const { data: tender } = await supabase
    .from('tenders')
    .select('id')
    .eq('id', tenderId)
    .eq('user_id', user.id)
    .single();

  if (!tender) return [];

  const { data: findings, error } = await supabase
    .from('cross_document_findings')
    .select('*')
    .eq('tender_id', tenderId)
    .order('severity', { ascending: true }) // HIGH first
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[CrossDoc] Error fetching findings:', error);
    return [];
  }

  return (findings || []).map(f => ({
    id: String(f.id),
    tender_id: String(f.tender_id),
    fact_type: String(f.fact_type),
    fact_label: String(f.fact_label),
    documents: (f.documents || []) as CrossDocumentFindingRow['documents'],
    result: String(f.result),
    severity: String(f.severity),
    severity_reason: f.severity_reason ? String(f.severity_reason) : undefined,
    explanation: f.explanation ? String(f.explanation) : undefined,
    recommended_action: f.recommended_action ? String(f.recommended_action) : undefined,
    comparison_method: String(f.comparison_method || 'deterministic'),
    created_at: String(f.created_at),
  }));
}

// ────────────────────────────────────────────────
// Fetch Summary from Tender Record
// ────────────────────────────────────────────────

export async function getCrossDocumentSummary(tenderId: string): Promise<CrossDocumentSummary | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: tender } = await supabase
    .from('tenders')
    .select('cross_document_summary')
    .eq('id', tenderId)
    .eq('user_id', user.id)
    .single();

  if (!tender?.cross_document_summary) return null;

  return tender.cross_document_summary as CrossDocumentSummary;
}
