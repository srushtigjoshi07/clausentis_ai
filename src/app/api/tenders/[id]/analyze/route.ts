import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parsePdfDocument } from '@/lib/document/pdf-parser';
import { extractTenderIntelligence, mapProcurementCategoryToDb } from '@/lib/ai/extractor';
import {
  evaluateRequirementCompliance,
  detectCrossDocumentContradictions,
  calculateTransparentComplianceScore,
  ExtractedDocumentFields
} from '@/lib/ai/contradiction-engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes max execution for large RFPs

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tenderId } = await params;
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized access. Please log in.' }, { status: 401 });
  }

  // 2. Fetch tender record
  const { data: tender, error: tenderErr } = await supabase
    .from('tenders')
    .select('*')
    .eq('id', tenderId)
    .eq('user_id', user.id)
    .single();

  if (tenderErr || !tender) {
    return NextResponse.json({ error: 'Tender not found or unauthorized.' }, { status: 404 });
  }

  if (!tender.storage_path) {
    return NextResponse.json({ error: 'No storage file path associated with tender.' }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // --- STAGE 1: Reading Tender Document ---
        sendEvent('progress', {
          stage: 'reading',
          label: 'Reading tender document and extracting text layers...',
          progress: 15
        });

        await supabase
          .from('tenders')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', tenderId);

        const { data: fileData, error: downloadError } = await supabase.storage
          .from('tenders')
          .download(tender.storage_path);

        if (downloadError || !fileData) {
          throw new Error('Failed to retrieve tender document from secure storage.');
        }

        const arrayBuffer = await fileData.arrayBuffer();
        const parseResult = await parsePdfDocument(arrayBuffer);

        if (parseResult.isScanned) {
          const scannedMsg =
            'This tender appears to be a scanned or image-based document with no extractable text. OCR is required to extract its clauses.';
          await supabase
            .from('tenders')
            .update({
              status: 'failed',
              description: scannedMsg,
              updated_at: new Date().toISOString()
            })
            .eq('id', tenderId);

          sendEvent('error', {
            error: scannedMsg,
            isScanned: true
          });
          controller.close();
          return;
        }

        // --- STAGE 2: Extracting Clauses ---
        sendEvent('progress', {
          stage: 'extracting_clauses',
          label: `Extracting clauses from ${parseResult.totalPages} document pages...`,
          progress: 30,
          totalPages: parseResult.totalPages
        });

        // --- STAGE 3: Identifying Requirements via Groq AI ---
        sendEvent('progress', {
          stage: 'identifying_requirements',
          label: 'Extracting explicit compliance requirements and numerical criteria via Groq AI...',
          progress: 50
        });

        const { snapshot, requirements } = await extractTenderIntelligence(parseResult.pages);

        // --- STAGE 4: Classifying Requirements ---
        sendEvent('progress', {
          stage: 'classifying',
          label: `Classified ${requirements.length} requirements into procurement categories...`,
          progress: 65,
          requirementsCount: requirements.length
        });

        // --- STAGE 5: Fetching Bidder Documents & Evidence Matching ---
        sendEvent('progress', {
          stage: 'matching_evidence',
          label: 'Cross-referencing company vault documents against requirements...',
          progress: 75
        });

        const { data: userVaultDocs } = await supabase
          .from('bidder_documents')
          .select('*')
          .eq('user_id', user.id);

        // Map vault docs to ExtractedDocumentFields
        const mappedVaultDocs: ExtractedDocumentFields[] = (userVaultDocs || []).map((doc) => {
          const extData = (doc.extracted_data as Record<string, unknown>) || {};
          const docName = String(doc.original_filename || doc.name || 'Document');
          const docType = String(doc.document_type || 'other');

          return {
            documentId: String(doc.id),
            documentName: docName,
            documentType: docType,
            legalName: typeof extData.legalName === 'string' ? extData.legalName : undefined,
            gstin: typeof extData.gstin === 'string' ? extData.gstin : undefined,
            pan: typeof extData.pan === 'string' ? extData.pan : undefined,
            udyamNumber: typeof extData.udyamNumber === 'string' ? extData.udyamNumber : undefined,
            turnoverAmount: typeof extData.turnoverAmount === 'number' ? extData.turnoverAmount : undefined,
            turnoverUnit: typeof extData.turnoverUnit === 'string' ? extData.turnoverUnit : 'Crore',
            financialYear: typeof extData.financialYear === 'string' ? extData.financialYear : undefined,
            certificateName: typeof extData.certificateName === 'string' ? extData.certificateName : docName,
            certificateNumber: typeof extData.certificateNumber === 'string' ? extData.certificateNumber : undefined,
            issueDate: typeof extData.issueDate === 'string' ? extData.issueDate : undefined,
            expiryDate: typeof extData.expiryDate === 'string' ? extData.expiryDate : undefined,
            pageNumber: typeof extData.pageNumber === 'number' ? extData.pageNumber : 1,
            sourceExcerpt: typeof extData.sourceExcerpt === 'string' ? extData.sourceExcerpt : `Verified credential: ${docName}`,
            confidence: 0.95
          };
        });

        // --- STAGE 6: Contradictions & Date Validations ---
        sendEvent('progress', {
          stage: 'contradictions',
          label: 'Running cross-document consistency, date validity, and contradiction radar...',
          progress: 85
        });

        const tenderDeadline = snapshot?.submission_deadline || undefined;
        const contradictions = detectCrossDocumentContradictions(mappedVaultDocs, tenderDeadline);

        // Evaluate compliance for each requirement
        const evaluations = requirements.map((req) =>
          evaluateRequirementCompliance(
            {
              id: req.requirement_id || req.requirement_code || 'REQ-001',
              requirement_code: req.requirement_code,
              clause_reference: req.clause_reference,
              name: req.name,
              category: String(req.category),
              description: req.description,
              mandatory: req.mandatory,
              evidence_required: req.evidence_required,
              threshold_value: req.threshold_value,
              threshold_unit: req.threshold_unit,
              currency: req.currency,
              source_page: req.source_page,
              source_text: req.source_text,
              risk_level: req.risk_level
            },
            mappedVaultDocs,
            tenderDeadline
          )
        );

        // --- STAGE 7: Building Compliance Matrix & Saving ---
        sendEvent('progress', {
          stage: 'building_matrix',
          label: 'Persisting compliance matrix and generating transparent score...',
          progress: 92
        });

        // Clean previous results
        await supabase.from('tender_requirements').delete().eq('tender_id', tenderId);
        await supabase.from('compliance_results').delete().eq('tender_id', tenderId);

        let createdRequirements: Array<Record<string, unknown>> = [];

        if (requirements.length > 0) {
          const requirementRows = requirements.map((r, idx) => {
            const evalMatch = evaluations[idx];
            return {
              tender_id: tenderId,
              requirement_code: r.requirement_code || `REQ-${String(idx + 1).padStart(3, '0')}`,
              name: r.name,
              description: r.description,
              category: mapProcurementCategoryToDb(String(r.category)),
              mandatory: r.mandatory,
              threshold_value: r.threshold_value || null,
              threshold_unit: r.threshold_unit || null,
              currency: r.currency || null,
              required_count: r.required_count || null,
              time_period: r.time_period || null,
              deadline: r.deadline ? new Date(r.deadline).toISOString() : null,
              source_page: r.source_page || 1,
              source_text: r.source_text || '',
              confidence: r.confidence || 0.95
            };
          });

          const { data: insertedReqs, error: insertReqsErr } = await supabase
            .from('tender_requirements')
            .insert(requirementRows)
            .select();

          if (insertReqsErr) {
            console.error('Failed to insert tender requirements:', insertReqsErr);
            throw new Error('Database error while saving extracted requirements.');
          }

          createdRequirements = (insertedReqs as Array<Record<string, unknown>>) || [];
        }

        // Insert Compliance Results
        const complianceRows = createdRequirements.map((reqRow, idx) => {
          const evaluation = evaluations[idx];

          let dbStatus: 'pass' | 'review' | 'fail' | 'missing' = 'pass';
          switch (evaluation.matrixStatus) {
            case 'COMPLIANT':
              dbStatus = 'pass';
              break;
            case 'PARTIALLY COMPLIANT':
            case 'REQUIRES MANUAL REVIEW':
            case 'NOT VERIFIED':
              dbStatus = 'review';
              break;
            case 'NON-COMPLIANT':
              dbStatus = 'fail';
              break;
            case 'MISSING':
              dbStatus = 'missing';
              break;
          }

          const rawReq = requirements[idx];

          return {
            tender_id: tenderId,
            requirement_id: String(reqRow.id),
            bidder_document_id: evaluation.matchedDocumentId || null,
            status: dbStatus,
            explanation: evaluation.explanation.rationale || evaluation.explanation.expected,
            recommendation: evaluation.recommendedAction || evaluation.explanation.decision,
            confidence: evaluation.confidence || 0.95
          };
        });

        if (complianceRows.length > 0) {
          const { data: insertedCompliance, error: compErr } = await supabase
            .from('compliance_results')
            .insert(complianceRows)
            .select();

          if (!compErr && insertedCompliance) {
            // Create Evidence Items
            const evidenceRows = insertedCompliance.map((comp, idx) => {
              const reqRow = createdRequirements[idx];
              const evaluation = evaluations[idx];
              return {
                compliance_result_id: comp.id,
                document_id: comp.bidder_document_id || null,
                page_number: typeof reqRow.source_page === 'number' ? reqRow.source_page : 1,
                source_text: evaluation.sourceExcerpt || String(reqRow.source_text || ''),
                evidence_type: evaluation.category || 'general'
              };
            });

            if (evidenceRows.length > 0) {
              await supabase.from('evidence_items').insert(evidenceRows);
            }
          }
        }

        // Calculate transparent score
        const scoring = calculateTransparentComplianceScore(evaluations);
        const overallScore = scoring.score;

        let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
        if (contradictions.criticalCount > 0 || scoring.nonCompliantCount > 0 || overallScore < 50) {
          riskLevel = 'critical';
        } else if (overallScore < 70 || scoring.missingCount > 1) {
          riskLevel = 'high';
        } else if (overallScore < 85 || contradictions.warningCount > 0) {
          riskLevel = 'medium';
        } else {
          riskLevel = 'low';
        }

        const updatedTitle = snapshot?.title || tender.title;

        // Update Tender Record
        await supabase
          .from('tenders')
          .update({
            status: 'analyzed',
            title: updatedTitle,
            requirements_count: createdRequirements.length,
            compliance_score: overallScore,
            risk_level: riskLevel,
            passed_count: scoring.compliantCount,
            review_count: scoring.partiallyCompliantCount + scoring.manualReviewCount,
            failed_count: scoring.nonCompliantCount,
            missing_count: scoring.missingCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', tenderId);

        // Audit Event
        try {
          await supabase.from('audit_events').insert({
            user_id: user.id,
            tender_id: tenderId,
            event_type: 'AI Compliance Analysis Completed',
            description: `Extracted ${createdRequirements.length} requirements. Calculated Bid Readiness Score ${overallScore}/100 with risk level ${riskLevel}.`,
            metadata: {
              requirements_count: createdRequirements.length,
              readiness_score: overallScore,
              risk_level: riskLevel,
              scoring_breakdown: scoring,
              contradictions_summary: {
                critical: contradictions.criticalCount,
                warning: contradictions.warningCount
              }
            }
          });
        } catch (auditErr) {
          console.warn('Audit event creation failed:', auditErr);
        }

        // --- STAGE 8: Complete ---
        sendEvent('complete', {
          stage: 'complete',
          label: 'AI compliance analysis completed successfully!',
          progress: 100,
          requirementsCount: createdRequirements.length,
          readinessScore: overallScore,
          riskLevel,
          scoringBreakdown: scoring
        });

        controller.close();
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred during AI analysis.';
        console.error('Tender analysis error:', errorMsg);

        await supabase
          .from('tenders')
          .update({
            status: 'failed',
            description: errorMsg,
            updated_at: new Date().toISOString()
          })
          .eq('id', tenderId);

        sendEvent('error', {
          error: errorMsg
        });
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
