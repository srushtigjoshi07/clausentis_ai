/**
 * Cross-Document Fact Extractor
 *
 * Extracts structured bidder facts (identity, registration, financial,
 * experience, certifications) from individual bidder documents using:
 * 1. Groq AI structured extraction (primary)
 * 2. Deterministic regex fallback (when Groq unavailable or fails)
 *
 * Reuses the existing callGroqStructuredExtraction() from groq.ts.
 */

import { callGroqStructuredExtraction } from './groq';
import type { ExtractedBidderFacts } from '@/types/cross-document';

// ────────────────────────────────────────────────
// System Prompt for Bidder Document Fact Extraction
// ────────────────────────────────────────────────

const SYSTEM_PROMPT_BIDDER_FACTS = `You are a procurement document analyst specializing in Indian government and enterprise tender submissions.
Your task is to extract structured factual information from a bidder's credential/supporting document.

EXTRACT ONLY information that is EXPLICITLY present in the document text. Do NOT invent or assume any values.

EXTRACTION CATEGORIES:

1. IDENTITY
   - legalName: Full registered legal entity name
   - tradeName: Trading name / brand name (if different from legal name)
   - pan: Permanent Account Number (format: XXXXX9999X)
   - gstin: GST Identification Number (format: 99XXXXX9999X9Z9)
   - cin: Corporate Identification Number
   - registeredAddress: Registered office address
   - authorizedSignatory: Name of authorized signatory / director

2. REGISTRATION
   - registrationNumber: Any registration number (Udyam, Shop & Establishment, etc.)
   - registrationAuthority: Issuing authority name
   - registrationIssueDate: Date of issuance (as written in document)
   - registrationExpiryDate: Expiry date (as written in document)

3. FINANCIAL
   - turnover: Annual turnover/revenue amount (numeric value only)
   - turnoverUnit: Unit ("Crore", "Lakh", "INR")
   - netWorth: Net worth amount (numeric)
   - financialYear: Financial year mentioned (e.g., "2023-24")
   - bankName: Bank name if mentioned

4. EXPERIENCE (array of projects)
   - clientName: Client/organization name
   - projectName: Project/contract description
   - contractValue: Contract value (numeric)
   - projectDate: Start/award date
   - completionDate: Completion date

5. CERTIFICATIONS (array of certificates)
   - certificateName: Name of certification (e.g., "ISO 9001:2015")
   - certificateNumber: Certificate number
   - issuingAuthority: Certifying body
   - issueDate: Date of issue
   - expiryDate: Expiry/validity date

OUTPUT FORMAT:
Return valid JSON matching this schema:
{
  "facts": {
    "legalName": "string or null",
    "tradeName": "string or null",
    "pan": "string or null",
    "gstin": "string or null",
    "cin": "string or null",
    "registeredAddress": "string or null",
    "authorizedSignatory": "string or null",
    "registrationNumber": "string or null",
    "registrationAuthority": "string or null",
    "registrationIssueDate": "string or null",
    "registrationExpiryDate": "string or null",
    "turnover": null or numeric,
    "turnoverUnit": "string or null",
    "netWorth": null or numeric,
    "financialYear": "string or null",
    "bankName": "string or null",
    "experiences": [],
    "certifications": []
  }
}

CRITICAL RULES:
- Return null for any field not explicitly found in the document.
- Do NOT hallucinate values.
- Preserve exact values as written (dates, numbers, names) - do NOT reformat them.
- For financial values, extract the numeric part only (e.g., 12.4 not "₹12.4 Crore").
- Turnover unit should be specified separately.`;

interface GroqBidderFactsResponse {
  facts: {
    legalName?: string | null;
    tradeName?: string | null;
    pan?: string | null;
    gstin?: string | null;
    cin?: string | null;
    registeredAddress?: string | null;
    authorizedSignatory?: string | null;
    registrationNumber?: string | null;
    registrationAuthority?: string | null;
    registrationIssueDate?: string | null;
    registrationExpiryDate?: string | null;
    turnover?: number | null;
    turnoverUnit?: string | null;
    netWorth?: number | null;
    financialYear?: string | null;
    bankName?: string | null;
    experiences?: Array<{
      clientName?: string;
      projectName?: string;
      contractValue?: number;
      projectDate?: string;
      completionDate?: string;
    }>;
    certifications?: Array<{
      certificateName?: string;
      certificateNumber?: string;
      issuingAuthority?: string;
      issueDate?: string;
      expiryDate?: string;
    }>;
  };
}

// ────────────────────────────────────────────────
// AI Extraction (Primary)
// ────────────────────────────────────────────────

export async function extractBidderFactsWithAI(
  documentText: string,
  documentName: string
): Promise<ExtractedBidderFacts> {
  // Truncate to avoid token limits (keep first ~8000 chars)
  const truncated = documentText.length > 8000
    ? documentText.substring(0, 8000) + '\n\n[Document truncated for extraction]'
    : documentText;

  try {
    const response = await callGroqStructuredExtraction<GroqBidderFactsResponse>({
      systemPrompt: SYSTEM_PROMPT_BIDDER_FACTS,
      userPrompt: `Extract all structured facts from this bidder document "${documentName}":\n\n${truncated}`,
      temperature: 0.05,
    });

    const facts = response.facts || {};
    return sanitizeExtractedFacts(facts);
  } catch (error) {
    console.warn(`[CrossDoc] AI extraction failed for "${documentName}":`, error);
    // Fall through to heuristic extraction
    return extractBidderFactsWithHeuristics(documentText);
  }
}

// ────────────────────────────────────────────────
// Heuristic Extraction (Fallback)
// ────────────────────────────────────────────────

// Regex patterns for Indian procurement documents
const PAN_REGEX = /\b([A-Z]{5}\d{4}[A-Z])\b/;
const GSTIN_REGEX = /\b(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2})\b/;
const CIN_REGEX = /\b([UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6})\b/;
const UDYAM_REGEX = /\b(UDYAM-[A-Z]{2}-\d{2}-\d{7})\b/i;
const TURNOVER_REGEX = /(?:turnover|revenue|income from operations)[^₹\d]*[₹Rs.\s]*([\d,.]+)\s*(?:cr(?:ore)?s?|lakhs?)?/i;
const NET_WORTH_REGEX = /(?:net\s*worth)[^₹\d]*[₹Rs.\s]*([\d,.]+)\s*(?:cr(?:ore)?s?|lakhs?)?/i;
const FY_REGEX = /(?:FY|financial year|F\.Y\.)\s*(\d{4}[-\/]\d{2,4})/i;
const ISO_CERT_REGEX = /ISO\s*(\d{4,5}(?::\d{4})?)/i;
const CERT_NUMBER_REGEX = /(?:certificate\s*(?:no|number|#)[.:\s]*)([\w\-\/]+)/i;
const EXPIRY_REGEX = /(?:valid\s*(?:up\s*to|until|till|through)|expiry\s*(?:date)?|expires?\s*(?:on)?)[:\s]*([\d\/\-.\s\w]+?)(?:\.|$|\n)/i;
const ISSUE_DATE_REGEX = /(?:date\s*of\s*issue|issued?\s*(?:on|date)?)[:\s]*([\d\/\-.\s\w]+?)(?:\.|$|\n)/i;

export function extractBidderFactsWithHeuristics(text: string): ExtractedBidderFacts {
  const facts: ExtractedBidderFacts = {};

  // PAN
  const panMatch = text.match(PAN_REGEX);
  if (panMatch) facts.pan = panMatch[1];

  // GSTIN
  const gstinMatch = text.match(GSTIN_REGEX);
  if (gstinMatch) facts.gstin = gstinMatch[1];

  // CIN
  const cinMatch = text.match(CIN_REGEX);
  if (cinMatch) facts.cin = cinMatch[1];

  // Registration (Udyam)
  const udyamMatch = text.match(UDYAM_REGEX);
  if (udyamMatch) {
    facts.registrationNumber = udyamMatch[1].toUpperCase();
    facts.registrationAuthority = 'Ministry of MSME';
  }

  // Turnover
  const turnoverMatch = text.match(TURNOVER_REGEX);
  if (turnoverMatch) {
    const value = parseFloat(turnoverMatch[1].replace(/,/g, ''));
    if (!isNaN(value)) {
      facts.turnover = value;
      facts.turnoverUnit = /lakhs?/i.test(turnoverMatch[0]) ? 'Lakh' : 'Crore';
    }
  }

  // Net Worth
  const netWorthMatch = text.match(NET_WORTH_REGEX);
  if (netWorthMatch) {
    const value = parseFloat(netWorthMatch[1].replace(/,/g, ''));
    if (!isNaN(value)) facts.netWorth = value;
  }

  // Financial Year
  const fyMatch = text.match(FY_REGEX);
  if (fyMatch) facts.financialYear = fyMatch[1];

  // ISO Certification
  const isoMatch = text.match(ISO_CERT_REGEX);
  if (isoMatch) {
    const certNumber = text.match(CERT_NUMBER_REGEX);
    const expiryMatch = text.match(EXPIRY_REGEX);
    const issueMatch = text.match(ISSUE_DATE_REGEX);

    facts.certifications = [{
      certificateName: `ISO ${isoMatch[1]}`,
      certificateNumber: certNumber ? certNumber[1].trim() : undefined,
      expiryDate: expiryMatch ? expiryMatch[1].trim() : undefined,
      issueDate: issueMatch ? issueMatch[1].trim() : undefined,
    }];
  }

  // Try to extract entity name from first few lines
  const firstLines = text.split('\n').slice(0, 15).join(' ');
  // Look for "M/s" or "Name:" pattern
  const nameMatch = firstLines.match(
    /(?:M\/s\.?\s+|Name\s*[:]\s*|Company\s*(?:Name)?\s*[:]\s*|Firm\s*(?:Name)?\s*[:]\s*)([\w\s.&,\-()]+?)(?:\n|,\s*(?:having|a\s)|$)/i
  );
  if (nameMatch) {
    facts.legalName = nameMatch[1].trim();
  }

  return facts;
}

// ────────────────────────────────────────────────
// Sanitize AI output (strip nulls, validate types)
// ────────────────────────────────────────────────

function sanitizeExtractedFacts(raw: Record<string, unknown>): ExtractedBidderFacts {
  const facts: ExtractedBidderFacts = {};

  const str = (val: unknown): string | undefined => {
    if (typeof val === 'string' && val.trim().length > 0 && val.toLowerCase() !== 'null') {
      return val.trim();
    }
    return undefined;
  };

  const num = (val: unknown): number | undefined => {
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(/,/g, ''));
      if (!isNaN(parsed)) return parsed;
    }
    return undefined;
  };

  facts.legalName = str(raw.legalName);
  facts.tradeName = str(raw.tradeName);
  facts.pan = str(raw.pan);
  facts.gstin = str(raw.gstin);
  facts.cin = str(raw.cin);
  facts.registeredAddress = str(raw.registeredAddress);
  facts.authorizedSignatory = str(raw.authorizedSignatory);
  facts.registrationNumber = str(raw.registrationNumber);
  facts.registrationAuthority = str(raw.registrationAuthority);
  facts.registrationIssueDate = str(raw.registrationIssueDate);
  facts.registrationExpiryDate = str(raw.registrationExpiryDate);
  facts.turnover = num(raw.turnover);
  facts.turnoverUnit = str(raw.turnoverUnit);
  facts.netWorth = num(raw.netWorth);
  facts.financialYear = str(raw.financialYear);
  facts.bankName = str(raw.bankName);

  // Experiences
  if (Array.isArray(raw.experiences)) {
    facts.experiences = raw.experiences
      .filter((e): e is Record<string, unknown> => e !== null && typeof e === 'object')
      .map((e) => ({
        clientName: str(e.clientName),
        projectName: str(e.projectName),
        contractValue: num(e.contractValue),
        projectDate: str(e.projectDate),
        completionDate: str(e.completionDate),
      }))
      .filter((e) => e.clientName || e.projectName);
  }

  // Certifications
  if (Array.isArray(raw.certifications)) {
    facts.certifications = raw.certifications
      .filter((c): c is Record<string, unknown> => c !== null && typeof c === 'object')
      .map((c) => ({
        certificateName: str(c.certificateName),
        certificateNumber: str(c.certificateNumber),
        issuingAuthority: str(c.issuingAuthority),
        issueDate: str(c.issueDate),
        expiryDate: str(c.expiryDate),
      }))
      .filter((c) => c.certificateName || c.certificateNumber);
  }

  return facts;
}
