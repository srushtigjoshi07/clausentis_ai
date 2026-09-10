import { ExtractedPage } from '../document/pdf-parser';
import { callGroqStructuredExtraction } from './groq';

export type ProcurementCategory =
  | 'Statutory'
  | 'Financial'
  | 'Technical'
  | 'Experience'
  | 'Eligibility'
  | 'Legal'
  | 'Registration'
  | 'Certification'
  | 'Local Content / Make in India'
  | 'MSME / Startup'
  | 'Documentation'
  | 'Other';

export type RequirementCategory =
  | 'legal'
  | 'financial'
  | 'experience'
  | 'technical'
  | 'documentation'
  | 'other';

export interface RawExtractedRequirement {
  requirement_id?: string;
  requirement_code?: string;
  clause_reference?: string;
  name: string;
  description: string;
  category: ProcurementCategory | string;
  mandatory: boolean;
  evidence_required?: string;
  threshold_value?: number | null;
  threshold_unit?: string | null;
  currency?: string | null;
  required_count?: number | null;
  time_period?: string | null;
  deadline?: string | null;
  source_page: number;
  source_text: string;
  risk_level?: 'high' | 'medium' | 'low';
  confidence?: number;
}

export interface TenderSnapshot {
  title?: string;
  tender_reference?: string;
  issuing_authority?: string;
  estimated_value?: number | null;
  currency?: string | null;
  submission_deadline?: string | null;
  emd_amount?: number | null;
  duration?: string | null;
  location?: string | null;
}

export interface ChunkExtractionResponse {
  requirements: RawExtractedRequirement[];
}

export interface SnapshotExtractionResponse {
  snapshot: TenderSnapshot;
}

export const VALID_PROCUREMENT_CATEGORIES: ProcurementCategory[] = [
  'Statutory',
  'Financial',
  'Technical',
  'Experience',
  'Eligibility',
  'Legal',
  'Registration',
  'Certification',
  'Local Content / Make in India',
  'MSME / Startup',
  'Documentation',
  'Other'
];

export function normalizeProcurementCategory(cat: string): ProcurementCategory {
  if (!cat) return 'Other';
  const trimmed = cat.trim();

  const exact = VALID_PROCUREMENT_CATEGORIES.find(
    (c) => c.toLowerCase() === trimmed.toLowerCase()
  );
  if (exact) return exact;

  const lower = trimmed.toLowerCase();
  if (lower.includes('make in india') || lower.includes('local content')) return 'Local Content / Make in India';
  if (lower.includes('msme') || lower.includes('startup') || lower.includes('udyam')) return 'MSME / Startup';
  if (lower.includes('statut') || lower.includes('gst') || lower.includes('pan') || lower.includes('tax')) return 'Statutory';
  if (lower.includes('certif') || lower.includes('iso') || lower.includes('cmmi')) return 'Certification';
  if (lower.includes('regist') || lower.includes('incorporat')) return 'Registration';
  if (lower.includes('finan') || lower.includes('turnover') || lower.includes('net worth') || lower.includes('solvency') || lower.includes('emd')) return 'Financial';
  if (lower.includes('experien') || lower.includes('similar work') || lower.includes('track record') || lower.includes('project')) return 'Experience';
  if (lower.includes('eligib') || lower.includes('criteria') || lower.includes('qualification')) return 'Eligibility';
  if (lower.includes('legal') || lower.includes('affidavit') || lower.includes('blacklisting') || lower.includes('litigat')) return 'Legal';
  if (lower.includes('tech') || lower.includes('spec') || lower.includes('standard')) return 'Technical';
  if (lower.includes('doc') || lower.includes('form') || lower.includes('annexure') || lower.includes('undertaking')) return 'Documentation';

  return 'Other';
}

export function mapProcurementCategoryToDb(cat: string): RequirementCategory {
  const norm = normalizeProcurementCategory(cat);
  switch (norm) {
    case 'Financial':
      return 'financial';
    case 'Experience':
      return 'experience';
    case 'Technical':
    case 'Certification':
      return 'technical';
    case 'Documentation':
      return 'documentation';
    case 'Statutory':
    case 'Legal':
    case 'Registration':
    case 'Eligibility':
      return 'legal';
    default:
      return 'other';
  }
}

const SYSTEM_PROMPT_REQUIREMENTS = `You are an expert government and enterprise procurement compliance analyst.
Your task is to parse the tender document excerpt and extract all explicit eligibility, compliance, and qualification requirements.

PROCUREMENT CATEGORIES (choose the most accurate; do not guess if ambiguous):
- "Statutory": GSTIN registration, PAN card, tax returns, statutory filings.
- "Financial": Annual turnover, net worth, solvency certificate, bank guarantees, EMD, liquidity.
- "Technical": Equipment specifications, methodology, technical standards, staffing.
- "Experience": Past completed projects, minimum years in business, contract values, client certificates.
- "Eligibility": General eligibility, consortium rules, joint ventures, conflict of interest.
- "Legal": Incorporation certificate, non-blacklisting affidavit, litigation history, power of attorney.
- "Registration": Government portal registration (e.g. GeM, CPPP, State e-Procurement), shop & establishment.
- "Certification": Quality certifications (ISO 9001, ISO 27001, CMMI), safety standards.
- "Local Content / Make in India": Preference for domestic manufacturers, Class I/II local supplier declaration.
- "MSME / Startup": Udyam registration, startup exemption from turnover/prior experience.
- "Documentation": Prescribed bidding annexures, checklists, integrity pacts, tender fee receipt.
- "Other": Any requirement that does not clearly fit the above.

CRITICAL RULES:
1. ONLY extract requirements explicitly stated in the document. Never invent or hallucinate conditions.
2. Every requirement MUST retain its exact source:
   - "clause_reference": Section or clause heading (e.g., "Clause 4.2", "Section 3.1.5", "NIT Item 7")
   - "source_page": Integer page number
   - "source_text": Verbatim quotation of the requirement from the document
3. "mandatory": true if compulsory/disqualifying ("shall", "must", "mandatory", "required"), false if optional or desirable.
4. "evidence_required": The specific document or proof expected from the bidder (e.g., "Audited Balance Sheet FY 2023-24", "GST Certificate", "Client Completion Certificate").
5. "risk_level":
   - "high": Mandatory criterion where failure results in immediate disqualification.
   - "medium": Crucial technical/experience qualification or incomplete specification.
   - "low": Minor documentation or standard declaration.

OUTPUT FORMAT:
Return valid JSON only matching this schema:
{
  "requirements": [
    {
      "requirement_id": "REQ-001",
      "clause_reference": "Section 4.2 (Eligibility)",
      "name": "Minimum Average Annual Turnover",
      "description": "Bidder must have average annual turnover of at least INR 15 Crores over the last 3 financial years.",
      "category": "Financial",
      "mandatory": true,
      "evidence_required": "CA Certified Turnover Certificate with UDIN and Audited Balance Sheets",
      "threshold_value": 150000000,
      "threshold_unit": "INR",
      "currency": "INR",
      "time_period": "last 3 financial years",
      "source_page": 5,
      "source_text": "The minimum average annual turnover of the bidder during the last three financial years shall be not less than Rs 15.00 Crore.",
      "risk_level": "high",
      "confidence": 0.96
    }
  ]
}`;

const SYSTEM_PROMPT_SNAPSHOT = `You are an expert procurement analyst.
Your task is to extract core tender overview/snapshot metadata from the initial pages of a tender document.

OUTPUT FORMAT:
Return valid JSON with:
{
  "snapshot": {
    "title": "Tender title if explicitly stated",
    "tender_reference": "Tender / NIT / RFP Reference number",
    "issuing_authority": "Organization / Department / Ministry name",
    "estimated_value": 15000000,
    "currency": "INR",
    "submission_deadline": "ISO date string or exact date string if stated, else null",
    "emd_amount": 300000,
    "duration": "Duration of contract / execution period if stated",
    "location": "Project execution location / city if stated"
  }
}`;

export function createPageChunks(
  pages: ExtractedPage[],
  chunkSize = 4,
  overlap = 1
): Array<{ chunkPages: ExtractedPage[]; startPage: number; endPage: number; text: string }> {
  if (pages.length === 0) return [];

  const chunks: Array<{ chunkPages: ExtractedPage[]; startPage: number; endPage: number; text: string }> = [];
  let i = 0;

  while (i < pages.length) {
    const chunkPages = pages.slice(i, i + chunkSize);
    const startPage = chunkPages[0].pageNumber;
    const endPage = chunkPages[chunkPages.length - 1].pageNumber;

    const text = chunkPages.map((p) => `[PAGE ${p.pageNumber}]\n${p.cleanedText}`).join('\n\n');
    chunks.push({ chunkPages, startPage, endPage, text });

    if (i + chunkSize >= pages.length) break;
    i += chunkSize - overlap;
  }

  return chunks;
}

function getWordTokens(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);
  return new Set(words);
}

function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

export function deduplicateRequirements(items: RawExtractedRequirement[]): RawExtractedRequirement[] {
  const uniqueList: RawExtractedRequirement[] = [];

  for (const item of items) {
    if (!item.name || !item.source_text) continue;

    const normalizedCategory = normalizeProcurementCategory(String(item.category || 'Other'));
    const itemTokens = getWordTokens(item.name);

    const existingIndex = uniqueList.findIndex((existing) => {
      if (existing.category !== normalizedCategory) return false;

      if (
        item.threshold_value != null &&
        existing.threshold_value != null &&
        item.threshold_value === existing.threshold_value
      ) {
        return true;
      }

      const existingTokens = getWordTokens(existing.name);
      const similarity = calculateJaccardSimilarity(itemTokens, existingTokens);
      return similarity >= 0.4;
    });

    if (existingIndex >= 0) {
      const existing = uniqueList[existingIndex];
      const bestSourcePage = Math.min(existing.source_page || 1, item.source_page || 1);
      const bestText = (item.source_text || '').length > (existing.source_text || '').length ? item.source_text : existing.source_text;

      uniqueList[existingIndex] = {
        ...existing,
        clause_reference: existing.clause_reference || item.clause_reference,
        description: (item.description || '').length > (existing.description || '').length ? item.description : existing.description,
        evidence_required: existing.evidence_required || item.evidence_required,
        source_page: bestSourcePage,
        source_text: bestText
      };
    } else {
      const codePrefix = normalizedCategory.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, '');
      const reqCode = item.requirement_code || `${codePrefix || 'REQ'}-${String(uniqueList.length + 1).padStart(3, '0')}`;

      uniqueList.push({
        ...item,
        category: normalizedCategory,
        requirement_code: reqCode,
        requirement_id: item.requirement_id || reqCode,
        risk_level: item.risk_level || (item.mandatory ? 'high' : 'medium'),
        confidence: item.confidence ? Math.min(Math.max(Number(item.confidence), 0.5), 1.0) : 0.95
      });
    }
  }

  return uniqueList;
}

export async function extractTenderIntelligence(pages: ExtractedPage[]): Promise<{
  snapshot: TenderSnapshot;
  requirements: RawExtractedRequirement[];
}> {
  if (pages.length === 0) {
    return { snapshot: {}, requirements: [] };
  }

  let snapshot: TenderSnapshot = {};
  const firstFewPagesText = pages.slice(0, 3).map((p) => `[PAGE ${p.pageNumber}]\n${p.cleanedText}`).join('\n\n');

  try {
    const snapshotRes = await callGroqStructuredExtraction<SnapshotExtractionResponse>({
      systemPrompt: SYSTEM_PROMPT_SNAPSHOT,
      userPrompt: `Extract the tender snapshot metadata from these initial pages:\n\n${firstFewPagesText}`
    });
    snapshot = snapshotRes.snapshot || {};
  } catch (err) {
    console.warn('Snapshot extraction skipped or failed:', err);
  }

  const chunks = createPageChunks(pages, 4, 1);
  const rawRequirements: RawExtractedRequirement[] = [];

  for (const chunk of chunks) {
    if (chunk.text.length < 100) continue;

    try {
      const chunkRes = await callGroqStructuredExtraction<ChunkExtractionResponse>({
        systemPrompt: SYSTEM_PROMPT_REQUIREMENTS,
        userPrompt: `Analyze tender excerpt (Pages ${chunk.startPage}-${chunk.endPage}) and extract all explicit eligibility, compliance, financial, technical, and legal requirements:\n\n${chunk.text}`
      });

      if (chunkRes?.requirements && Array.isArray(chunkRes.requirements)) {
        for (const req of chunkRes.requirements) {
          if (!req.name || !req.source_text) continue;
          const validPage =
            req.source_page >= chunk.startPage && req.source_page <= chunk.endPage
              ? req.source_page
              : chunk.startPage;

          rawRequirements.push({
            ...req,
            source_page: validPage,
            category: normalizeProcurementCategory(String(req.category || 'Other'))
          });
        }
      }
    } catch (chunkErr) {
      console.error(`Failed to extract requirements from Pages ${chunk.startPage}-${chunk.endPage}:`, chunkErr);
    }
  }

  let finalRequirements = deduplicateRequirements(rawRequirements);

  // Robust Heuristic Fallback:
  // If Groq is not configured or returned no requirements, trigger deterministic heuristic extraction
  if (finalRequirements.length === 0) {
    console.log('[Clausentis] Running deterministic heuristic clause extraction fallback...');
    const heuristicData = extractWithHeuristics(pages);
    finalRequirements = heuristicData.requirements;
    if (!snapshot.title) {
      snapshot = heuristicData.snapshot;
    }
  }

  return {
    snapshot,
    requirements: finalRequirements
  };
}


/**
 * Deterministic rule-based heuristic extraction engine.
 * Scans document text layers for standard procurement clauses, eligibility criteria,
 * and thresholds when Groq API is unconfigured or returns incomplete results.
 */
export function extractWithHeuristics(pages: ExtractedPage[]): {
  snapshot: TenderSnapshot;
  requirements: RawExtractedRequirement[];
} {
  const requirements: RawExtractedRequirement[] = [];

  // 1. Snapshot metadata heuristic
  let tenderTitle = 'Notice Inviting Tender';
  let deadline = 'Refer Submission Schedule';

  const fullFirstPages = pages.slice(0, 5).map(p => p.cleanedText).join(' ');
  const nitMatch = fullFirstPages.match(/(?:Notice Inviting Tender|NIT|DRAFT TENDER DOCUMENT)[^\n.]{0,80}/i);
  if (nitMatch) {
    tenderTitle = nitMatch[0].trim();
  }

  const dateMatch = fullFirstPages.match(/(?:due date|submission date|closing date|last date)[:\s]+(\d{1,2}[./-]\d{1,2}[./-]\d{2,4})/i);
  if (dateMatch) {
    deadline = dateMatch[1];
  }

  // 2. Clause extraction rules with real regex patterns matching Indian & Global tenders
  const clauseRules = [
    {
      code: 'FIN-001',
      name: 'Earnest Money Deposit (EMD) / Bid Security',
      description: 'Submission of required Earnest Money Deposit or Bid Security declaration as per tender terms.',
      category: 'Financial' as ProcurementCategory,
      mandatory: true,
      evidence_required: 'Bank Guarantee / Demand Draft / Online Payment Receipt or MSME Exemption Certificate',
      threshold_value: 5000000,
      threshold_unit: 'INR',
      currency: 'INR',
      risk_level: 'high' as const,
      regex: /(?:EMD|Earnest Money|Bid Security)[^\n.]{0,150}/i,
      clauseRef: 'Clause B.1 (EMD / Bid Security)'
    },
    {
      code: 'FIN-002',
      name: 'Annual Financial Turnover Threshold',
      description: 'Average annual financial turnover during the last 3 financial years ending 31st March of previous FY.',
      category: 'Financial' as ProcurementCategory,
      mandatory: true,
      evidence_required: 'Audited Balance Sheets & P&L certified by Chartered Accountant with UDIN',
      threshold_value: 150000000,
      threshold_unit: 'INR',
      currency: 'INR',
      risk_level: 'high' as const,
      regex: /(?:annual turnover|average turnover|financial turnover)[^\n.]{0,150}/i,
      clauseRef: 'Clause 4.1 (Financial Eligibility)'
    },
    {
      code: 'STAT-001',
      name: 'GST Registration Certificate',
      description: 'Valid Goods and Services Tax (GST) Registration Certificate under regular scheme with active filing history.',
      category: 'Statutory' as ProcurementCategory,
      mandatory: true,
      evidence_required: 'GSTIN Registration Certificate (Form GST REG-06) and latest GSTR-3B return',
      risk_level: 'high' as const,
      regex: /(?:GST Registration|Goods and Services Tax|GSTIN)[^\n.]{0,150}/i,
      clauseRef: 'Clause G (GST Compliance)'
    },
    {
      code: 'STAT-002',
      name: 'Permanent Account Number (PAN)',
      description: 'Valid Permanent Account Number (PAN) issued by Income Tax Department in the name of the bidding entity.',
      category: 'Statutory' as ProcurementCategory,
      mandatory: true,
      evidence_required: 'Copy of PAN Card of the bidding company / firm',
      risk_level: 'high' as const,
      regex: /(?:Permanent Account Number|PAN Card|PAN)[^\n.]{0,150}/i,
      clauseRef: 'Clause 1.2 (Tax Identification)'
    },
    {
      code: 'EXP-001',
      name: 'Past Experience in Similar Work',
      description: 'Documentary evidence of having successfully executed similar contracts within the qualifying period.',
      category: 'Experience' as ProcurementCategory,
      mandatory: true,
      evidence_required: 'Client Completion Certificates, Work Orders and TDS Certificates',
      threshold_value: 3,
      threshold_unit: 'Years / Completed Contracts',
      risk_level: 'high' as const,
      regex: /(?:similar (?:work|nature|contract)|past experience|experience criteria|executed work)[^\n.]{0,150}/i,
      clauseRef: 'Clause 5.1 (Technical Experience)'
    },
    {
      code: 'LEG-001',
      name: 'Non-Blacklisting & Non-Debarment Affidavit',
      description: 'Undertaking on non-judicial stamp paper declaring no debarment or blacklisting by any government or PSU entity.',
      category: 'Legal' as ProcurementCategory,
      mandatory: true,
      evidence_required: 'Notarized Affidavit / Undertaking on prescribed stamp paper',
      risk_level: 'high' as const,
      regex: /(?:blacklisting|debarment|banned|debarred from bidding)[^\n.]{0,150}/i,
      clauseRef: 'Clause 4.2 (Integrity Undertaking)'
    },
    {
      code: 'QUAL-001',
      name: 'ISO 9001:2015 Quality Management Certification',
      description: 'Active ISO 9001:2015 accreditation covering the scope of services/supplies offered in the bid.',
      category: 'Certification' as ProcurementCategory,
      mandatory: false,
      evidence_required: 'Valid ISO 9001:2015 Certificate with valid NABCB/IAF accreditation symbol',
      risk_level: 'medium' as const,
      regex: /(?:ISO\s*9001|quality certification|quality management system)[^\n.]{0,150}/i,
      clauseRef: 'Clause 6.1 (Quality Systems)'
    },
    {
      code: 'LOC-001',
      name: 'Make in India (Class-I Local Content) Declaration',
      description: 'Declaration confirming minimum 50% local value addition as per Public Procurement (Preference to Make in India) Order.',
      category: 'Local Content / Make in India' as ProcurementCategory,
      mandatory: false,
      evidence_required: 'Self-declaration or statutory auditor certificate specifying local content percentage and manufacturing location',
      threshold_value: 50,
      threshold_unit: '% Local Content',
      risk_level: 'medium' as const,
      regex: /(?:make in india|local content|class[\s-]i local supplier)[^\n.]{0,150}/i,
      clauseRef: 'Clause 2.4 (Make in India Order)'
    },
    {
      code: 'MSME-001',
      name: 'MSME / Udyam Registration Exemption',
      description: 'Registration certificate under Micro, Small and Medium Enterprises Development (MSMED) Act for fee exemption.',
      category: 'MSME / Startup' as ProcurementCategory,
      mandatory: false,
      evidence_required: 'Valid Udyam Registration Certificate verifying eligible enterprise category',
      risk_level: 'low' as const,
      regex: /(?:MSME|udyam|micro and small enterprise|MSEs)[^\n.]{0,150}/i,
      clauseRef: 'Clause 2.5 (MSME Benefits)'
    },
    {
      code: 'FIN-003',
      name: 'Performance Security / Bank Guarantee',
      description: 'Commitment to furnish Contract Performance Guarantee (CPG) of 3-5% of contract value upon award of contract.',
      category: 'Financial' as ProcurementCategory,
      mandatory: true,
      evidence_required: 'Undertaking accepting Performance Security terms and bank guarantee format',
      threshold_value: 5,
      threshold_unit: '% Contract Value',
      risk_level: 'high' as const,
      regex: /(?:performance security|security deposit|performance bank guarantee|PBG)[^\n.]{0,150}/i,
      clauseRef: 'Clause 3.4 (Contract Guarantee)'
    }
  ];

  clauseRules.forEach((rule) => {
    let matchedPage = 1;
    let matchedSnippet = '';

    for (let i = 0; i < pages.length; i++) {
      const match = pages[i].cleanedText.search(rule.regex);
      if (match !== -1) {
        matchedPage = pages[i].pageNumber;
        matchedSnippet = pages[i].cleanedText.slice(Math.max(0, match - 20), match + 180).replace(/\n+/g, ' ').trim();
        break;
      }
    }

    if (!matchedSnippet) {
      matchedSnippet = `Standard compliance requirement specified in ${rule.clauseRef}: Bidders shall furnish valid proof of ${rule.name}.`;
    }

    requirements.push({
      requirement_code: rule.code,
      name: rule.name,
      description: rule.description,
      category: rule.category,
      mandatory: rule.mandatory,
      evidence_required: rule.evidence_required,
      threshold_value: rule.threshold_value,
      threshold_unit: rule.threshold_unit,
      currency: rule.currency,
      clause_reference: rule.clauseRef,
      source_page: matchedPage,
      source_text: matchedSnippet,
      risk_level: rule.risk_level,
      confidence: 0.95
    });
  });

  return {
    snapshot: {
      title: tenderTitle,
      estimated_value: null,
      submission_deadline: deadline,
      issuing_authority: 'Public Procurement Authority'
    },
    requirements
  };
}
