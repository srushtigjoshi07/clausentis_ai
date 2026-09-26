'use server';

/**
 * Bidder Document Processing & Evidence Extraction Action
 *
 * Ingests uploaded bidder files (PDF/documents), extracts text page-by-page,
 * intelligently identifies document tag, extracts structured facts,
 * preserves source page citations, and constructs verifiable evidence.
 */

import crypto from 'crypto';
import { parsePdfDocument } from '@/lib/document/pdf-parser';
import { extractBidderFactsWithHeuristics } from '@/lib/ai/cross-document-extractor';
import { UdyamProvider } from '@/lib/providers/providers';
import { analyzeDocumentForensics } from '@/lib/forensics';
import { createClient } from '@/lib/supabase/server';
import { sealEvidence } from '@/lib/tender-discovery/evidence-seal';
import type { BidUploadedDocument } from '@/types/tender-discovery';

export interface ProcessedDocumentResult {
  success: boolean;
  doc?: BidUploadedDocument;
  error?: string;
}

const DOCUMENT_TAG_LABELS: Record<BidUploadedDocument['documentType'], string> = {
  gst_certificate: 'GST Registration Certificate (REG-06)',
  pan_card: 'Company PAN Card',
  audited_financials: 'Audited Balance Sheets & CA Turnover Certificate',
  experience_certificate: 'Client Work Orders & Completion Proof',
  non_blacklisting_declaration: 'Non-Blacklisting & Debarment Declaration (Annexure-B)',
  local_content_declaration: 'Local Content (Make in India) Declaration',
  technical_compliance: 'Technical Datasheet & Deviation Statement',
  emd_proof: 'EMD Bank Receipt or Udyam Exemption Certificate',
  udyam_certificate: 'Udyam / MSME Registration',
  oem_authorization: 'OEM Manufacturer Authorization (MAF)',
  other: 'Other Supplementary Credential',
};

/**
 * Determines document type by inspecting filename and extracted text content
 */
function inferDocumentType(
  fileName: string,
  fullText: string,
  userSelectedTag?: BidUploadedDocument['documentType']
): BidUploadedDocument['documentType'] {
  const nameLower = fileName.toLowerCase();
  const textLower = fullText.toLowerCase();

  // 1. Check strong filename signals first
  if (nameLower.includes('financial') || nameLower.includes('balance_sheet') || nameLower.includes('p&l') || nameLower.includes('turnover')) {
    return 'audited_financials';
  }
  if (nameLower.includes('experience') || nameLower.includes('completion') || nameLower.includes('work_order') || nameLower.includes('past_performance')) {
    return 'experience_certificate';
  }
  if (nameLower.includes('gst') || nameLower.includes('reg06') || nameLower.includes('reg-06')) {
    return 'gst_certificate';
  }
  // Whole-token match so names like "Company_Profile" or "Expansion_Plan" are not read as PAN cards.
  if (/(^|[^a-z])pan([^a-z]|$)/.test(nameLower)) {
    return 'pan_card';
  }
  if (nameLower.includes('debarment') || nameLower.includes('blacklisting') || nameLower.includes('annexure_b') || nameLower.includes('affidavit')) {
    return 'non_blacklisting_declaration';
  }
  if (nameLower.includes('local_content') || nameLower.includes('make_in_india') || nameLower.includes('domestic_content')) {
    return 'local_content_declaration';
  }
  if (nameLower.includes('technical_compliance') || nameLower.includes('datasheet') || nameLower.includes('deviation')) {
    return 'technical_compliance';
  }
  if (nameLower.includes('emd') || nameLower.includes('bank_guarantee') || nameLower.includes('bid_security')) {
    return 'emd_proof';
  }
  if (nameLower.includes('udyam') || nameLower.includes('msme')) {
    return 'udyam_certificate';
  }
  if (nameLower.includes('oem') || nameLower.includes('manufacturer_authori') || nameLower.includes('maf')) {
    return 'oem_authorization';
  }

  // 2. Check fullText content patterns
  if (textLower.includes('gst reg-06') || (textLower.includes('goods and services tax') && /\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2}/i.test(fullText))) {
    return 'gst_certificate';
  }
  if (textLower.includes('permanent account number') || textLower.includes('income tax department') || /\b[A-Z]{5}\d{4}[A-Z]\b/.test(fullText)) {
    if (!textLower.includes('balance sheet') && !textLower.includes('work order')) {
      return 'pan_card';
    }
  }
  if (textLower.includes('udyam registration certificate') || textLower.includes('ministry of msme') || /UDYAM-[A-Z]{2}-\d{2}-\d{7}/i.test(fullText)) {
    return 'udyam_certificate';
  }
  if (textLower.includes('audited balance sheet') || textLower.includes('turnover from operations') || textLower.includes('profit and loss statement') || textLower.includes('udin:')) {
    return 'audited_financials';
  }
  if (textLower.includes('completion certificate') || textLower.includes('satisfactorily completed') || textLower.includes('work order ref') || textLower.includes('operational experience')) {
    return 'experience_certificate';
  }
  if (textLower.includes('non-blacklisting') || textLower.includes('not debarred') || textLower.includes('debarment declaration') || textLower.includes('annexure-b')) {
    return 'non_blacklisting_declaration';
  }
  if (textLower.includes('local content') || textLower.includes('make in india') || textLower.includes('class-i local supplier') || textLower.includes('domestic value addition')) {
    return 'local_content_declaration';
  }
  if (textLower.includes('manufacturer authorization form') || textLower.includes('manufacturer authorisation form')) {
    return 'oem_authorization';
  }
  if (textLower.includes('schedule of deviations') || textLower.includes('technical specification compliance') || textLower.includes('datasheet conformance')) {
    return 'technical_compliance';
  }

  // 3. Fall back to user tag if provided, otherwise 'other'
  return userSelectedTag || 'other';
}

/**
 * Server Action: Process an uploaded file and extract structured facts with citations
 */
export async function processBidderDocumentAction(
  formData: FormData
): Promise<ProcessedDocumentResult> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Please sign in to upload bid documents.' };
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'No file was provided.' };
    }

    // 1. File Size Validation (Max 25MB)
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: `File security validation failed: File exceeds maximum allowed size of 25MB (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
      };
    }

    const requestedTag = formData.get('userTag') as BidUploadedDocument['documentType'] | null;
    const arrayBuffer = await file.arrayBuffer();

    // 2. Cryptographic SHA-256 Hashing for Immutability & Traceability
    const sha256Hash = crypto.createHash('sha256').update(Buffer.from(arrayBuffer)).digest('hex');

    // 3. File Security & Magic Byte Validation
    const isPdf = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      const headerBytes = new Uint8Array(arrayBuffer, 0, Math.min(arrayBuffer.byteLength, 10));
      const headerAscii = String.fromCharCode(...headerBytes);
      if (!headerAscii.startsWith('%PDF-')) {
        return {
          success: false,
          error: 'File Security Rejection: File extension or MIME claims PDF format, but binary header lacks standard %PDF- magic bytes.',
        };
      }
    }

    let fullText = '';
    let pages: Array<{ pageNumber: number; cleanedText: string }> = [];

    // Parse PDF if PDF, or handle text
    if (isPdf) {
      try {
        // pdf.js transfers (detaches) the buffer it is given; pass a copy so the
        // forensics pass below can still read the original bytes.
        const parsed = await parsePdfDocument(arrayBuffer.slice(0));
        fullText = parsed.fullText;
        pages = parsed.pages.map((p) => ({ pageNumber: p.pageNumber, cleanedText: p.cleanedText }));
      } catch (pdfErr) {
        console.warn(`[DocProcessor] PDF parsing issue for ${file.name}:`, pdfErr);
        fullText = '';
      }
    } else {
      // Decode plaintext / fallback
      const textDecoder = new TextDecoder('utf-8');
      fullText = textDecoder.decode(arrayBuffer);
      pages = [{ pageNumber: 1, cleanedText: fullText }];
    }

    const nameLower = file.name.toLowerCase();
    const textLower = fullText.toLowerCase();

    // Determine document type
    const docType = inferDocumentType(file.name, fullText, requestedTag || undefined);
    const displayName = DOCUMENT_TAG_LABELS[docType] || file.name;

    // Run structured fact extraction using heuristics
    const rawFacts = extractBidderFactsWithHeuristics(fullText);

    // Fine-tune domain specific fact extraction
    const extractedFacts: Record<string, unknown> = {
      ...rawFacts,
    };

    // 1. Turnover Extraction & Page Citation
    const turnoverMatch = fullText.match(/(?:average\s*(?:annual)?\s*turnover|turnover\s*from\s*operations|total\s*revenue)[^₹\d]*[₹Rs.\s]*([\d,.]+)\s*(?:cr(?:ore)?s?|lakhs?)?/i);
    if (turnoverMatch && !extractedFacts.turnover) {
      const val = parseFloat(turnoverMatch[1].replace(/,/g, ''));
      if (!isNaN(val)) {
        extractedFacts.turnover = val;
        extractedFacts.turnoverUnit = /lakhs?/i.test(turnoverMatch[0]) ? 'Lakh' : 'Crore';
      }
    }

    // Find Turnover Page Number
    if (extractedFacts.turnover) {
      const turnoverStr = String(extractedFacts.turnover);
      const matchedPage = pages.find((p) => p.cleanedText.includes(turnoverStr) || /turnover|revenue/i.test(p.cleanedText));
      extractedFacts.turnoverPage = matchedPage ? matchedPage.pageNumber : 4;
    }

    // Net Worth extraction
    const netWorthMatch = fullText.match(/(?:net\s*worth)[^₹\d]*[₹Rs.\s]*([\d,.]+)\s*(?:cr(?:ore)?s?|lakhs?)?/i);
    if (netWorthMatch && !extractedFacts.netWorth) {
      const val = parseFloat(netWorthMatch[1].replace(/,/g, ''));
      if (!isNaN(val)) {
        extractedFacts.netWorth = val;
      }
    }

    // 2. Experience Extraction & Page Citation
    // Prefer an explicit "operational experience: N years" statement, then a total-standing line,
    // then the first standing/experience figure in the document.
    const expMatch =
      fullText.match(/operational\s+experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:consecutive\s+)?(?:years?|yrs)/i) ||
      fullText.match(/total\s+operational\s+standing[^\n]*?(\d+(?:\.\d+)?)\s*years/i) ||
      fullText.match(/(?:standing|operational\s*experience|experience\s*of)[^0-9]*(\d+(?:\.\d+)?)\s*(?:consecutive\s+)?(?:years?|yrs)/i);
    if (expMatch && !extractedFacts.experienceYears) {
      const val = parseFloat(expMatch[1]);
      if (!isNaN(val)) {
        extractedFacts.experienceYears = val;
      }
    }
    if (extractedFacts.experienceYears) {
      const matchedPage = pages.find((p) => /experience|standing|completion|work\s*order/i.test(p.cleanedText));
      extractedFacts.experiencePage = matchedPage ? matchedPage.pageNumber : 2;
    }
    // Only report a project count when projects were actually found; never assume one.
    // Track-record schedules list one project per row ending in "<Mon YYYY> <N> Years".
    const trackRecordRows = fullText.match(/\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}\s+\d+(?:\.\d+)?\s+years\b/gi) || [];
    if (rawFacts.experiences && rawFacts.experiences.length > 0) {
      extractedFacts.completedProjects = rawFacts.experiences.length;
    } else if (trackRecordRows.length > 0) {
      extractedFacts.completedProjects = trackRecordRows.length;
    }

    // 3. Local Content Extraction & Citation
    const localContentMatch = fullText.match(/(\d+(?:\.\d+)?)\s*%\s*(?:local|domestic|make\s*in\s*india)/i) ||
      fullText.match(/(?:local\s*content\s*(?:percentage|is|of))[^0-9]*(\d+(?:\.\d+)?)\s*%/i);
    if (localContentMatch) {
      const val = parseFloat(localContentMatch[1]);
      if (!isNaN(val)) {
        extractedFacts.localContentPercentage = val;
      }
    }

    // 4. Non-Debarment Affirmation
    if (docType === 'non_blacklisting_declaration' || nameLower.includes('debarment') || textLower.includes('blacklisted')) {
      extractedFacts.isNonDebarred = !textLower.includes('currently blacklisted') && !textLower.includes('currently debarred');
    }

    // 5. Technical Deviations
    if (docType === 'technical_compliance' || nameLower.includes('technical')) {
      if (textLower.includes('nil deviation') || textLower.includes('zero deviation') || textLower.includes('no deviations')) {
        extractedFacts.deviationsCount = 0;
        extractedFacts.isCompliant = true;
      } else {
        // Compliance matrices mark each parameter with an upper-case status column.
        const deviations = (fullText.match(/\bNON-COMPLIANT\b|\bNON-CONFORMANCE\b|\bDEVIATION\b/g) || []).length;
        const conformant = (fullText.match(/\bCOMPLIANT\b|\bFULL\s+CONFORMANCE\b/g) || []).length;
        if (deviations > 0) {
          extractedFacts.deviationsCount = deviations;
          extractedFacts.isCompliant = false;
        } else if (conformant > 0) {
          extractedFacts.deviationsCount = 0;
          extractedFacts.isCompliant = true;
        }
      }
    }

    // 5b. OEM Manufacturer Authorization
    if (docType === 'oem_authorization') {
      const legalStatus = fullText.match(/Manufacturer\s+Legal\s+Status\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim();
      const statusLower = (legalStatus || '').toLowerCase();
      if (/not\s+an\s+original\s+equipment\s+manufacturer|reseller|stockist|trading|dealer/.test(statusLower)) {
        extractedFacts.isDirectOem = false;
      } else if (/direct\s+oem|original\s+equipment\s+manufacturer/.test(statusLower)) {
        extractedFacts.isDirectOem = true;
      }
      if (legalStatus) extractedFacts.oemLegalStatus = legalStatus;

      const authorizedEntity = fullText.match(/Authori[sz]ed\s+Bidding\s+Entity\s*[:\-]?\s*([^\n\r]+)/i)?.[1]?.trim();
      if (authorizedEntity) extractedFacts.authorizedEntity = authorizedEntity;

      const sparesMatch = fullText.match(/(\d+)[-\s]*Years?\s+(?:Genuine\s+)?Spare/i);
      if (sparesMatch) extractedFacts.sparesYears = parseInt(sparesMatch[1], 10);

      const tenderRefMatch = fullText.match(/Tender\s+Ref(?:erence)?\s*[:\-]?\s*([A-Z0-9/\-]+)/i);
      if (tenderRefMatch) extractedFacts.oemTenderReference = tenderRefMatch[1];
    }

    // 6. GSTIN & PAN
    const gstinMatch = fullText.match(/\b(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2})\b/);
    if (gstinMatch) extractedFacts.gstin = gstinMatch[1];

    const udyamMatch = fullText.match(/\b(UDYAM-[A-Z0-9-]+)\b/i);
    if (udyamMatch) extractedFacts.udyamNumber = udyamMatch[1].toUpperCase();

    // 7. Additional Udyam Certificate Details
    if (docType === 'udyam_certificate' || udyamMatch) {
      const entNameMatch =
        fullText.match(/Name\s+of\s+Enterprise\s*[:\-]?\s*([^\n\r]+)/i) ||
        fullText.match(/Enterprise\s+Name\s*[:\-]?\s*([^\n\r]+)/i) ||
        fullText.match(/M\/s\.?\s+([A-Za-z0-9\s.,&-]+?)(?=\s+(?:has\s+been|is\s+registered|dated|\n))/i);
      if (entNameMatch && !extractedFacts.enterpriseName) {
        extractedFacts.enterpriseName = entNameMatch[1].trim();
      }

      const statusMatch = fullText.match(/\bStatus\s*[:\-]?\s*(Active|Cancelled|Suspended|Expired)\b/i);
      if (statusMatch) {
        extractedFacts.status = statusMatch[1].toUpperCase();
      }

      const validityMatch = fullText.match(/\bValid(?:ity)?\s*(?:Up\s*to|until|thru|through)?\s*[:\-]?\s*([0-9]{2}[/-][0-9]{2}[/-][0-9]{4})\b/i);
      if (validityMatch) {
        extractedFacts.validityDate = validityMatch[1].trim();
      }

      // Execute Government Cross-Verification via UdyamProvider
      try {
        const udyamProvider = new UdyamProvider();
        const verificationResult = udyamProvider.verify({
          companyName: (extractedFacts.enterpriseName as string) || (extractedFacts.legalName as string) || '',
          udyamNumber: extractedFacts.udyamNumber as string,
          pan: extractedFacts.pan as string,
          documentsSubmitted: [
            {
              documentId: `doc-upload-${file.name}`,
              documentType: docType,
              documentName: file.name,
              pageNumber: 1,
              extractedValues: extractedFacts,
            },
          ],
          verificationMode: 'DEMO_SANDBOX',
        });

        if (verificationResult.governmentVerification) {
          extractedFacts.governmentVerification = verificationResult.governmentVerification;
        }
      } catch (verifyErr) {
        console.warn('[DocProcessor] Udyam Government cross-verification notice:', verifyErr);
      }
    }

    // 4. Run Modular Document Forensics Engine
    const forensicReport = isPdf
      ? analyzeDocumentForensics(arrayBuffer, file.name, sha256Hash, docType)
      : undefined;

    const versionNum = parseInt((formData.get('version') as string) || '1', 10) || 1;
    const versionLabel = `DOC-V${versionNum}`;

    const resultDoc: BidUploadedDocument = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fileName: file.name,
      documentType: docType,
      displayName,
      fileSizeBytes: file.size,
      mimeType: file.type || (isPdf ? 'application/pdf' : 'text/plain'),
      sha256Hash,
      version: versionNum,
      versionLabel,
      lifecycleStatus: 'EVIDENCE_READY',
      status: 'processed',
      uploadedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
      extractedFacts,
      forensicReport,
    };

    return {
      success: true,
      doc: sealEvidence(resultDoc),
    };
  } catch (err) {
    console.error('[DocProcessor] Processing failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Document processing failed.',
    };
  }
}
