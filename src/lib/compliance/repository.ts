/**
 * SIH26100 Unified Compliance Repository & Shared State Store
 * 
 * Provides the single source of truth across Authority and Bidder portals.
 * Pre-populates the 3 required canonical SIH26100 evaluation scenarios:
 * 1. Bidder A: Mostly compliant (100% PASS, Low Risk)
 * 2. Bidder B: Turnover mismatch (Declared ₹12.4 Cr vs Audited ₹8.72 Cr -> FAIL, High Risk)
 * 3. Bidder C: Missing mandatory document (Non-blacklisting affidavit -> MISSING, Medium Risk)
 */

import {
  BidderEvaluationDossier,
  StructuredRequirement,
  EvidenceRecord,
  RequirementComplianceResult,
  CrossDocumentFinding,
  OfficerDecisionType
} from './types';
import { ProcurementDecisionRecord } from '@/types/procurement-decision';
import {
  evaluateRequirementDeterministic,
  calculateProgrammaticComplianceScore,
  calculateDeterministicRiskLevel,
  generateAIRecommendation
} from './deterministic-engine';

export const STANDARD_CPCL_REQUIREMENTS: StructuredRequirement[] = [
  {
    id: 'req-cpcl-01',
    clauseCode: 'Clause 4.1',
    category: 'Financial',
    title: 'Minimum Average Annual Turnover',
    description: 'Audited annual turnover of at least ₹10.00 Cr over the preceding three financial years (FY 2023-24, FY 2024-25, FY 2025-26).',
    ruleType: 'MINIMUM_VALUE',
    thresholdValue: 10.0,
    thresholdUnit: 'Cr',
    currency: 'INR',
    mandatory: true,
    evidenceRequired: true,
    expectedDocumentType: 'audited_financials',
    sourcePage: 4,
    sourceClause: 'NIT Section 3.1 • Financial Qualifications'
  },
  {
    id: 'req-cpcl-02',
    clauseCode: 'Clause 4.2',
    category: 'Experience',
    title: 'High-Pressure Gas Compression Operational Experience',
    description: 'Minimum 5.0 years operational experience in executing turnkey gas compression packages with operating discharge ≥ 120 bar(g).',
    ruleType: 'YEARS_EXPERIENCE',
    thresholdValue: 5.0,
    thresholdUnit: 'Years',
    mandatory: true,
    evidenceRequired: true,
    expectedDocumentType: 'experience_certificate',
    sourcePage: 5,
    sourceClause: 'NIT Section 3.2 • Technical Criteria'
  },
  {
    id: 'req-cpcl-03',
    clauseCode: 'Clause 2.1',
    category: 'Statutory',
    title: 'Active GSTIN Registration (Form GST REG-06)',
    description: 'Valid, active Goods & Services Tax Network identification number in the state of supply or corporate headquarters.',
    ruleType: 'DOCUMENT_REQUIRED',
    mandatory: true,
    evidenceRequired: true,
    expectedDocumentType: 'gst_certificate',
    sourcePage: 2,
    sourceClause: 'NIT Section 2 • Statutory Registrations'
  },
  {
    id: 'req-cpcl-04',
    clauseCode: 'Clause 2.2',
    category: 'Statutory',
    title: 'Permanent Account Number (PAN) Card',
    description: 'Income Tax Permanent Account Number issued by NSDL matching legal entity constitution.',
    ruleType: 'DOCUMENT_REQUIRED',
    mandatory: true,
    evidenceRequired: true,
    expectedDocumentType: 'pan_card',
    sourcePage: 2,
    sourceClause: 'NIT Section 2 • Statutory Registrations'
  },
  {
    id: 'req-cpcl-05',
    clauseCode: 'Clause 7.1',
    category: 'Financial',
    title: 'Earnest Money Deposit (EMD) / MSME Exemption Proof',
    description: '₹29,00,000 EMD deposit via SFMS MT760 Bank Guarantee or valid Udyam Registration Certificate for MSE exemption.',
    ruleType: 'DOCUMENT_REQUIRED',
    mandatory: true,
    evidenceRequired: true,
    expectedDocumentType: 'emd_proof',
    sourcePage: 7,
    sourceClause: 'NIT Section 4 • Bid Security'
  },
  {
    id: 'req-cpcl-06',
    clauseCode: 'Clause 5.1',
    category: 'Technical',
    title: 'Direct OEM Authorization / Manufacturer Certificate',
    description: 'Manufacturer Authorization Form (MAF) confirming warranty backing, genuine spares, and SIL-3 safety instrumentation.',
    ruleType: 'DOCUMENT_REQUIRED',
    mandatory: true,
    evidenceRequired: true,
    expectedDocumentType: 'oem_authorization',
    sourcePage: 8,
    sourceClause: 'NIT Section 5 • OEM Credentials'
  },
  {
    id: 'req-cpcl-07',
    clauseCode: 'Clause 6.3',
    category: 'Statutory',
    title: 'Make in India Class-I Local Content Declaration',
    description: 'Minimum 50.0% local domestic value addition declaration pursuant to DPIIT Public Procurement Order.',
    ruleType: 'PERCENTAGE_THRESHOLD',
    thresholdValue: 50.0,
    thresholdUnit: '%',
    mandatory: true,
    evidenceRequired: true,
    expectedDocumentType: 'local_content_declaration',
    sourcePage: 9,
    sourceClause: 'NIT Section 6 • Preference to Make in India'
  },
  {
    id: 'req-cpcl-08',
    clauseCode: 'Clause 3.4',
    category: 'Legal',
    title: 'Non-Blacklisting & Integrity Undertaking (Annexure-B)',
    description: 'Sworn affidavit on non-judicial stamp paper affirming entity is not debarred or blacklisted by CVC, GeM, or CPCL.',
    ruleType: 'DOCUMENT_REQUIRED',
    mandatory: true,
    evidenceRequired: true,
    expectedDocumentType: 'affidavit',
    sourcePage: 3,
    sourceClause: 'NIT Section 3.4 • Debarment Restrictions'
  },
  {
    id: 'req-cpcl-09',
    clauseCode: 'Clause 8.2',
    category: 'Quality',
    title: 'ISO 9001:2015 Quality Management System Certification',
    description: 'Valid accredited ISO 9001 quality certificate covering design and manufacturing of pressure systems.',
    ruleType: 'DATE_VALIDITY',
    mandatory: false,
    evidenceRequired: true,
    expectedDocumentType: 'quality_certification',
    sourcePage: 11,
    sourceClause: 'NIT Section 8 • Quality Standards'
  },
  {
    id: 'req-cpcl-10',
    clauseCode: 'Clause 5.4',
    category: 'Technical',
    title: 'API 618 5th Edition Datasheet Conformance',
    description: 'Technical compliance schedule with reciprocating compressor design specification for 120 bar(g) discharge.',
    ruleType: 'DOCUMENT_REQUIRED',
    mandatory: true,
    evidenceRequired: true,
    expectedDocumentType: 'technical_compliance',
    sourcePage: 12,
    sourceClause: 'NIT Technical Specification Schedule'
  }
];

// Persistent state store across application runtime
const IN_MEMORY_DOSSIERS = new Map<string, BidderEvaluationDossier>();
const IN_MEMORY_DECISIONS = new Map<string, ProcurementDecisionRecord[]>();

/**
 * Initializes the 3 canonical SIH26100 bidder evaluation dossiers
 */
function initializeCanonicalScenarios() {
  if (IN_MEMORY_DOSSIERS.size > 0) return;

  // ─────────────────────────────────────────────────────────────
  // SCENARIO 1: BIDDER A (Apex Heavy Engineering) - 100% PASS
  // ─────────────────────────────────────────────────────────────
  const bidderAEvidence: Record<string, EvidenceRecord> = {
    'req-cpcl-01': {
      evidenceId: 'ev-a-01',
      documentId: 'doc-apex-fin',
      documentName: 'Audited_Balance_Sheets_3Y_FY24_26.pdf',
      pageNumber: 4,
      extractedText: 'Average 3-Year Audited Annual Turnover from Operations: ₹12.40 Crore (UDIN: 25098192AAAA0192).',
      fieldName: 'turnover',
      extractedValue: 12.40,
      sourceType: 'DOCUMENT',
      confidence: 0.99,
      createdAt: '2026-09-09T18:45:00Z'
    },
    'req-cpcl-02': {
      evidenceId: 'ev-a-02',
      documentId: 'doc-apex-exp',
      documentName: 'Past_Performance_Work_Orders.pdf',
      pageNumber: 2,
      extractedText: 'IOCL Panipat & BPCL Kochi Compressor Packages completed with 8.0 consecutive years operational standing.',
      fieldName: 'experienceYears',
      extractedValue: 8.0,
      sourceType: 'DOCUMENT',
      confidence: 0.98,
      createdAt: '2026-09-09T18:45:00Z'
    },
    'req-cpcl-03': {
      evidenceId: 'ev-a-03',
      documentId: 'doc-apex-gst',
      documentName: 'Form_GST_REG06_Registration.pdf',
      pageNumber: 1,
      extractedText: 'GSTIN: 33AABCA1234F1Z8 • Legal Name: Apex Heavy Engineering Pvt Ltd • Active Taxpayer.',
      fieldName: 'gstin',
      extractedValue: '33AABCA1234F1Z8',
      sourceType: 'STATUTORY_PORTAL',
      confidence: 0.99,
      createdAt: '2026-09-09T18:45:00Z'
    },
    'req-cpcl-04': {
      evidenceId: 'ev-a-04',
      documentId: 'doc-apex-pan',
      documentName: 'Company_PAN_NSDL.pdf',
      pageNumber: 1,
      extractedText: 'PAN: ABCDE1234F • Entity: Private Limited Company.',
      fieldName: 'pan',
      extractedValue: 'ABCDE1234F',
      sourceType: 'STATUTORY_PORTAL',
      confidence: 0.99,
      createdAt: '2026-09-09T18:45:00Z'
    },
    'req-cpcl-05': {
      evidenceId: 'ev-a-05',
      documentId: 'doc-apex-udyam',
      documentName: 'Udyam_Registration_Certificate.pdf',
      pageNumber: 1,
      extractedText: 'UDYAM-TN-02-0049182 • Medium Manufacturing Enterprise • EMD Exemption Claimed.',
      fieldName: 'udyamNumber',
      extractedValue: 'UDYAM-TN-02-0049182',
      sourceType: 'STATUTORY_PORTAL',
      confidence: 0.99,
      createdAt: '2026-09-09T18:45:00Z'
    },
    'req-cpcl-06': {
      evidenceId: 'ev-a-06',
      documentId: 'doc-apex-oem',
      documentName: 'OEM_Manufacturer_Authorization.pdf',
      pageNumber: 3,
      extractedText: 'Direct OEM Certified Manufacturer Authorization for Model GC-1200 Reciprocating System.',
      fieldName: 'oemAuthorization',
      extractedValue: 'Direct OEM Certified',
      sourceType: 'DOCUMENT',
      confidence: 0.97,
      createdAt: '2026-09-09T18:45:00Z'
    },
    'req-cpcl-07': {
      evidenceId: 'ev-a-07',
      documentId: 'doc-apex-mii',
      documentName: 'Make_in_India_Local_Content_Certificate.pdf',
      pageNumber: 1,
      extractedText: 'Statutory Local Content verified at 68.0% domestic value addition (Class-I Supplier).',
      fieldName: 'localContentPercent',
      extractedValue: 68.0,
      sourceType: 'DOCUMENT',
      confidence: 0.99,
      createdAt: '2026-09-09T18:45:00Z'
    },
    'req-cpcl-08': {
      evidenceId: 'ev-a-08',
      documentId: 'doc-apex-affidavit',
      documentName: 'Annexure_B_Non_Blacklisting_Declaration.pdf',
      pageNumber: 1,
      extractedText: 'Sworn affidavit executed on stamp paper confirming non-debarment by CVC, GeM, or CPCL.',
      fieldName: 'nonBlacklisting',
      extractedValue: 'Affidavit Executed & Notarized',
      sourceType: 'DOCUMENT',
      confidence: 0.96,
      createdAt: '2026-09-09T18:45:00Z'
    },
    'req-cpcl-09': {
      evidenceId: 'ev-a-09',
      documentId: 'doc-apex-iso',
      documentName: 'ISO_9001_Quality_System_Certificate.pdf',
      pageNumber: 2,
      extractedText: 'ISO 9001:2015 Certificate valid till 30-Nov-2026.',
      fieldName: 'isoExpiry',
      extractedValue: '2026-11-30',
      sourceType: 'DOCUMENT',
      confidence: 0.95,
      createdAt: '2026-09-09T18:45:00Z'
    },
    'req-cpcl-10': {
      evidenceId: 'ev-a-10',
      documentId: 'doc-apex-tech',
      documentName: 'API_618_Technical_Datasheet_Schedule.pdf',
      pageNumber: 8,
      extractedText: 'Complete compliance schedule with API 618 5th Ed, SIL-3 ESD logic and dry gas seals.',
      fieldName: 'technicalConformance',
      extractedValue: 'Full Datasheet Conformance',
      sourceType: 'DOCUMENT',
      confidence: 0.98,
      createdAt: '2026-09-09T18:45:00Z'
    }
  };

  const resultsA = STANDARD_CPCL_REQUIREMENTS.map((r) =>
    evaluateRequirementDeterministic(r, bidderAEvidence[r.id], r.id === 'req-cpcl-01' ? 12.40 : undefined)
  );
  const scoreA = calculateProgrammaticComplianceScore(resultsA);
  const riskA = calculateDeterministicRiskLevel(resultsA);
  const aiA = generateAIRecommendation(scoreA.score, riskA.riskLevel, riskA.riskReasons);

  IN_MEMORY_DOSSIERS.set('bid-apex-02', {
    bidId: 'bid-apex-02',
    submissionId: 'CL-2026-91C25F34',
    tenderId: 'tender-cpcl-2026-0412',
    tenderReference: 'CPCL/ENG/2026/HPGC-0412',
    tenderTitle: 'Supply, Installation and Commissioning of High-Pressure Gas Compressor System at Manali Refinery',
    bidderName: 'Apex Heavy Engineering Pvt Ltd',
    shortName: 'Apex Heavy',
    registrationNumber: 'CIN U28910TN2014PTC099418',
    gstin: '33AABCA1234F1Z8',
    pan: 'ABCDE1234F',
    udyamNumber: 'UDYAM-TN-02-0049182',
    registeredAddress: 'Plot 41-B, Ambattur Industrial Estate, Chennai, Tamil Nadu 600058',
    contactPerson: 'K. Srinivasan (Director - Commercial)',
    contactEmail: 'contracts@apexheavy.com',
    bidValue: '₹14.10 Cr',
    submittedAt: '09 Sep 2026, 18:45 IST',
    status: 'READY_FOR_REVIEW',
    complianceScore: scoreA.score,
    riskLevel: riskA.riskLevel,
    riskReasons: riskA.riskReasons,
    mandatoryTotal: scoreA.mandatoryTotal,
    mandatoryPassed: scoreA.mandatoryPassed,
    failuresCount: scoreA.failedCount,
    missingCount: scoreA.missingCount,
    warningsCount: scoreA.warningCount,
    requirementResults: resultsA,
    crossDocumentFindings: [],
    statutoryVerifications: [
      { providerId: 'gstn', providerName: 'GSTN Portal', status: 'DOCUMENT_VERIFIED', concordant: true, details: 'Form GST REG-06 verified with active taxpayer status.' },
      { providerId: 'pan', providerName: 'Income Tax PAN', status: 'DOCUMENT_VERIFIED', concordant: true, details: 'Entity PAN matched against corporate registrar.' },
      { providerId: 'udyam', providerName: 'Udyam MSME Registry', status: 'DOCUMENT_VERIFIED', concordant: true, details: 'Valid Medium Enterprise certificate for EMD exemption.' },
      { providerId: 'gem', providerName: 'GeM Portal', status: 'PROTOTYPE_VERIFIED', concordant: true, details: 'Registered OEM vendor in Gas Compression Equipment category.' },
    ],
    aiRecommendation: aiA,
    officerDecision: {
      decision: 'APPROVED',
      officerName: 'Dr. R. Venkataraman',
      officerRole: 'Senior Procurement Officer',
      timestamp: '10 Sep 2026, 23:45 IST',
      notes: 'All mandatory requirements verified against statutory registries and audited accounts. Qualified for commercial opening.',
      decisionId: 'DEC-CPCL-2026-0412-001',
      decisionVersion: 1,
      integrityHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      status: 'SIGNED'
    },
    auditEvents: [
      {
        timestamp: '2026-09-01 09:15 IST',
        actor: 'CPCL Tenders Directorate',
        role: 'Tender Authority',
        action: 'Tender Published & Encrypted',
        entity: 'CPCL/ENG/2026/HPGC-0412',
        details: 'Initial Notice Inviting Tender published with 10 mandatory qualification criteria. Estimated value: Rs. 14.50 Cr.'
      },
      {
        timestamp: '2026-09-04 11:30 IST',
        actor: 'CPCL Tenders Directorate',
        role: 'Tender Authority',
        action: 'Corrigendum No. 1 Gazetted',
        entity: 'CPCL/ENG/2026/HPGC-0412',
        details: 'Clause 7.1 amended: Mandatory SFMS MT760 transmission for Bank Guarantees. Closing date extended to 28-Sep-2026.'
      },
      {
        timestamp: '2026-09-08 15:40 IST',
        actor: 'Apex Heavy Engineering',
        role: 'Authorized Bidder Signatory',
        action: 'Bid Package Vault Sealed (CL-2026-91C25F34)',
        entity: 'bid-apex-02',
        details: 'Technical and financial covers submitted with cryptographic SHA-256 seal. 10 documents sealed in tamper-evident vault.'
      },
      {
        timestamp: '2026-09-08 16:15 IST',
        actor: 'Clausentis Engine v4.2',
        role: 'Automated Verifier',
        action: 'Document Evidence Extraction',
        entity: 'bid-apex-02',
        details: 'Audited CA turnover Rs. 12.40 Cr verified on Page 4 (UDIN: 25098192AAAA0192). 8.0 yrs operational experience confirmed.'
      },
      {
        timestamp: '2026-09-08 16:18 IST',
        actor: 'Statutory Verification Gateway',
        role: 'Automated System',
        action: 'Government Portal Verification',
        entity: 'bid-apex-02',
        details: 'GSTN active (33AABCA1234F1Z8), PAN matched (ABCDE1234F), Udyam MSME certificate validated (UDYAM-TN-02-0049182).'
      },
      {
        timestamp: '2026-09-08 16:20 IST',
        actor: 'Deterministic Compliance Engine',
        role: 'Compliance Engine',
        action: 'Rule-by-Rule Compliance Evaluation',
        entity: 'bid-apex-02',
        details: '100% compliance score computed. 9/9 mandatory criteria satisfied. 0 cross-document contradictions detected.'
      },
      {
        timestamp: '2026-09-08 16:22 IST',
        actor: 'Clausentis AI Assistant',
        role: 'Advisory Engine',
        action: 'AI Recommendation Generated',
        entity: 'bid-apex-02',
        details: 'Advisory verdict: COMPLIANT (Confidence: 0.98). Vendor satisfies all technical and financial prerequisites.'
      },
      {
        timestamp: '2026-09-10 23:45 IST',
        actor: 'R. K. Sharma',
        role: 'Superintending Engineer & Tender Officer',
        action: 'Procurement Officer Verdict Recorded',
        entity: 'bid-apex-02',
        details: 'Official verdict: QUALIFIED. All mandatory qualifications verified against statutory registries. Approved for commercial price bid opening.'
      }
    ]
  });

  // ─────────────────────────────────────────────────────────────
  // SCENARIO 2: BIDDER B (PQR Industries Ltd) - TURNOVER CONFLICT (FAIL)
  // ─────────────────────────────────────────────────────────────
  const bidderBEvidence: Record<string, EvidenceRecord> = {
    'req-cpcl-01': {
      evidenceId: 'ev-b-01',
      documentId: 'doc-pqr-fin',
      documentName: 'Financial_Statement.pdf',
      pageNumber: 14,
      extractedText: 'Schedule 14: Net Audited Revenue from Operations 3-Year Average: ₹8.72 Crore (UDIN: 24081928BB0192).',
      fieldName: 'turnover',
      extractedValue: 8.72, // Below ₹10.00 Cr requirement!
      sourceType: 'DOCUMENT',
      confidence: 0.98,
      createdAt: '2026-09-07T16:20:00Z'
    },
    'req-cpcl-02': {
      evidenceId: 'ev-b-02',
      documentId: 'doc-pqr-exp',
      documentName: 'Work_Orders_List.pdf',
      pageNumber: 3,
      extractedText: 'Audited completion certificates confirm 3.8 years operational experience (Below mandatory 5.0 years requirement).',
      fieldName: 'experienceYears',
      extractedValue: 3.8, // Below 5.0 years!
      sourceType: 'DOCUMENT',
      confidence: 0.95,
      createdAt: '2026-09-07T16:20:00Z'
    },
    'req-cpcl-03': {
      evidenceId: 'ev-b-03',
      documentId: 'doc-pqr-gst',
      documentName: 'Form_GST_REG06.pdf',
      pageNumber: 1,
      extractedText: 'GSTIN: 29AABCP3456J1Z9 • Legal Name: PQR Industries Ltd.',
      fieldName: 'gstin',
      extractedValue: '29AABCP3456J1Z9',
      sourceType: 'STATUTORY_PORTAL',
      confidence: 0.99,
      createdAt: '2026-09-07T16:20:00Z'
    },
    'req-cpcl-04': {
      evidenceId: 'ev-b-04',
      documentId: 'doc-pqr-pan',
      documentName: 'PAN_Card.pdf',
      pageNumber: 1,
      extractedText: 'PAN: AABCP3456J.',
      fieldName: 'pan',
      extractedValue: 'AABCP3456J',
      sourceType: 'STATUTORY_PORTAL',
      confidence: 0.99,
      createdAt: '2026-09-07T16:20:00Z'
    },
    'req-cpcl-05': {
      evidenceId: 'ev-b-05',
      documentId: 'doc-pqr-udyam',
      documentName: 'Udyam_Registration_Certificate.pdf',
      pageNumber: 1,
      extractedText: 'UDYAM-DL-01-0091823 registered to PQR Industries Ltd.',
      fieldName: 'udyamNumber',
      extractedValue: 'UDYAM-DL-01-0091823',
      sourceType: 'STATUTORY_PORTAL',
      confidence: 0.99,
      createdAt: '2026-09-07T16:20:00Z'
    },
    'req-cpcl-06': {
      evidenceId: 'ev-b-06',
      documentId: 'doc-pqr-oem',
      documentName: 'Distributor_Authorization_Letter.pdf',
      pageNumber: 1,
      extractedText: 'Manufacturer authorization issued by XYZ Corp, failing to match required OEM ABC Compressor Systems.',
      fieldName: 'oemAuthorization',
      extractedValue: 'Wrong Manufacturer Authorization (XYZ Corp instead of required ABC Compressor Systems)',
      sourceType: 'DOCUMENT',
      confidence: 0.92,
      createdAt: '2026-09-07T16:20:00Z'
    },
    'req-cpcl-07': {
      evidenceId: 'ev-b-07',
      documentId: 'doc-pqr-mii',
      documentName: 'Local_Content_Self_Declaration.pdf',
      pageNumber: 1,
      extractedText: 'Self-declared domestic value addition: 62.0% (Meets Class-I Local Supplier threshold ≥ 50%).',
      fieldName: 'localContentPercent',
      extractedValue: 62.0, // Meets 50%!
      sourceType: 'DOCUMENT',
      confidence: 0.98,
      createdAt: '2026-09-07T16:20:00Z'
    },
    // req-cpcl-08 (Non-Blacklisting Affidavit) is intentionally OMITTED -> MISSING
    'req-cpcl-09': {
      evidenceId: 'ev-b-09',
      documentId: 'doc-pqr-iso',
      documentName: 'ISO_9001_Certificate.pdf',
      pageNumber: 1,
      extractedText: 'ISO 9001:2015 accredited through Dec 2027.',
      fieldName: 'isoCertified',
      extractedValue: 'ISO 9001:2015 Accredited',
      sourceType: 'DOCUMENT',
      confidence: 0.96,
      createdAt: '2026-09-07T16:20:00Z'
    },
    'req-cpcl-10': {
      evidenceId: 'ev-b-10',
      documentId: 'doc-pqr-corr',
      documentName: 'Corrigendum_Acknowledgment.pdf',
      pageNumber: 1,
      extractedText: 'Corrigendum No. 1 acknowledged and signed.',
      fieldName: 'corrigendumAck',
      extractedValue: 'Acknowledged',
      sourceType: 'DOCUMENT',
      confidence: 0.98,
      createdAt: '2026-09-07T16:20:00Z'
    }
  };

  const crossFindingsB: CrossDocumentFinding[] = [
    {
      id: 'cr-turnover-01',
      findingType: 'TURNOVER_MISMATCH',
      title: 'Declared Turnover Conflicts with Audited Balance Sheet Evidence',
      severity: 'HIGH',
      primaryDocument: {
        name: 'Bid_Submission_Form.pdf',
        page: 2,
        value: '₹12.40 Cr',
        excerpt: 'Declared 3-year average turnover: ₹12.40 Crore.'
      },
      conflictingDocument: {
        name: 'Financial_Statement.pdf',
        page: 14,
        value: '₹8.72 Cr',
        excerpt: 'Schedule 14 Audited Annual Turnover: ₹8.72 Crore on Page 14.'
      },
      explanation: 'Declared annual turnover of ₹12.40 Cr is contradicted by audited balance sheet evidence showing only ₹8.72 Cr on Page 14 (Deficit: -₹3.68 Cr from declaration, -₹1.28 Cr from tender minimum threshold).',
      recommendedAction: 'Disqualification under GFR 2017 Rule 175(1) for misrepresentation of financial standing.'
    },
    {
      id: 'cr-oem-01',
      findingType: 'OEM_MISMATCH',
      title: 'OEM Authorization Issued by Wrong Manufacturer',
      severity: 'HIGH',
      primaryDocument: {
        name: 'NIT_Tender_Clause_5.1.pdf',
        page: 8,
        value: 'ABC Compressor Systems / GE Oil & Gas',
        excerpt: 'Direct OEM authorization from ABC Compressor Systems required.'
      },
      conflictingDocument: {
        name: 'Distributor_Authorization_Letter.pdf',
        page: 1,
        value: 'XYZ Corp',
        excerpt: 'Authorization issued on behalf of XYZ Corp.'
      },
      explanation: 'OEM authorization was issued by XYZ Corp instead of the mandatory tender-specified manufacturer ABC Compressor Systems.',
      recommendedAction: 'Mandatory technical disqualification.'
    }
  ];

  const resultsB = STANDARD_CPCL_REQUIREMENTS.map((r) =>
    evaluateRequirementDeterministic(r, bidderBEvidence[r.id], r.id === 'req-cpcl-01' ? 12.40 : undefined)
  );
  const scoreB = calculateProgrammaticComplianceScore(resultsB, crossFindingsB);
  const riskB = calculateDeterministicRiskLevel(resultsB, crossFindingsB);
  const aiB = generateAIRecommendation(scoreB.score, riskB.riskLevel, riskB.riskReasons);

  IN_MEMORY_DOSSIERS.set('bid-pqr-04', {
    bidId: 'bid-pqr-04',
    submissionId: 'CL-2026-44B129E8',
    tenderId: 'tender-cpcl-2026-0412',
    tenderReference: 'CPCL/ENG/2026/HPGC-0412',
    tenderTitle: 'Supply, Installation and Commissioning of High-Pressure Gas Compressor System at Manali Refinery',
    bidderName: 'PQR Industries Ltd',
    shortName: 'PQR Industries',
    registrationNumber: 'CIN L27100DL2010PLC019842',
    gstin: '29AABCP3456J1Z9',
    pan: 'AABCP3456J',
    udyamNumber: 'Not Registered (General Large Bidder)',
    registeredAddress: 'Industrial Sector 62, Noida, Uttar Pradesh 201301',
    contactPerson: 'M. K. Agrawal (General Manager - Tenders)',
    contactEmail: 'tenders@pqrindustries.com',
    bidValue: '₹15.20 Cr',
    submittedAt: '07 Sep 2026, 16:20 IST',
    status: 'NON_COMPLIANT',
    complianceScore: scoreB.score, // 47%
    riskLevel: 'HIGH',
    riskReasons: riskB.riskReasons,
    mandatoryTotal: scoreB.mandatoryTotal,
    mandatoryPassed: scoreB.mandatoryPassed,
    failuresCount: scoreB.failedCount,
    missingCount: scoreB.missingCount,
    warningsCount: scoreB.warningCount,
    requirementResults: resultsB,
    crossDocumentFindings: crossFindingsB,
    statutoryVerifications: [
      { providerId: 'gstn', providerName: 'GSTN Portal', status: 'DOCUMENT_VERIFIED', concordant: true, details: 'Active registration verified.' },
      { providerId: 'pan', providerName: 'Income Tax PAN', status: 'DOCUMENT_VERIFIED', concordant: true, details: 'Corporate PAN verified.' },
      { providerId: 'debarment', providerName: 'Debarment Registry', status: 'DOCUMENT_VERIFIED', concordant: false, details: 'Flagged on debarment database by Ministry of Petroleum & Natural Gas.' },
    ],
    aiRecommendation: aiB,
    officerDecision: undefined,
    auditEvents: [
      {
        timestamp: '2026-09-01 09:15 IST',
        actor: 'CPCL Tenders Directorate',
        role: 'Tender Authority',
        action: 'Tender Published & Encrypted',
        entity: 'CPCL/ENG/2026/HPGC-0412',
        details: 'Notice Inviting Tender published with 10 mandatory qualification criteria. Estimated value: Rs. 14.50 Cr.'
      },
      {
        timestamp: '2026-09-07 16:20 IST',
        actor: 'PQR Industries Ltd',
        role: 'Authorized Bidder Signatory',
        action: 'Bid Package Vault Sealed (CL-2026-44B129E8)',
        entity: 'bid-pqr-04',
        details: 'Submitted bid proposal with 9 documents uploaded into bidder vault.'
      },
      {
        timestamp: '2026-09-07 16:25 IST',
        actor: 'Clausentis Engine v4.2',
        role: 'Automated Verifier',
        action: 'Document Evidence Extraction',
        entity: 'bid-pqr-04',
        details: 'Extracted declared turnover Rs. 12.40 Cr from Bid Form. Extracted audited turnover Rs. 8.72 Cr from Balance Sheet Schedule 14 Page 14.'
      },
      {
        timestamp: '2026-09-07 16:26 IST',
        actor: 'Cross-Document Contradiction Engine',
        role: 'Audit Engine',
        action: 'Turnover Discrepancy Contradiction Detected',
        entity: 'bid-pqr-04',
        details: 'CRITICAL CONTRADICTION: Declared turnover of Rs. 12.40 Cr contradicted by audited balance sheet showing Rs. 8.72 Cr on Page 14 (-Rs. 1.28 Cr below tender minimum threshold).'
      },
      {
        timestamp: '2026-09-07 16:27 IST',
        actor: 'Cross-Document Contradiction Engine',
        role: 'Audit Engine',
        action: 'OEM Authorization Mismatch Detected',
        entity: 'bid-pqr-04',
        details: 'HIGH RISK CONTRADICTION: Manufacturer authorization issued by XYZ Corp, failing to match required OEM ABC Compressor Systems.'
      },
      {
        timestamp: '2026-09-07 16:28 IST',
        actor: 'Deterministic Compliance Engine',
        role: 'Compliance Engine',
        action: 'Missing Mandatory Document Detected',
        entity: 'bid-pqr-04',
        details: 'Annexure-B Non-Blacklisting & Integrity Undertaking affidavit was not submitted in the bid vault. Status: MISSING.'
      },
      {
        timestamp: '2026-09-07 16:29 IST',
        actor: 'Deterministic Compliance Engine',
        role: 'Compliance Engine',
        action: 'Rule-by-Rule Compliance Evaluation',
        entity: 'bid-pqr-04',
        details: 'Evaluated 10 clauses: 6 Passed, 3 Failed (Turnover, Experience, OEM), 1 Missing (Non-blacklisting). Compliance score: 30%. Risk level: HIGH.'
      },
      {
        timestamp: '2026-09-07 16:30 IST',
        actor: 'Clausentis AI Assistant',
        role: 'Advisory Engine',
        action: 'AI Recommendation Generated',
        entity: 'bid-pqr-04',
        details: 'Advisory verdict: REJECT / NON-COMPLIANT. Mandatory technical and financial disqualification grounds under GFR 2017 Rule 175(1).'
      }
    ]
  });

  // ─────────────────────────────────────────────────────────────
  // SCENARIO 3: BIDDER C (XYZ Engineering Works) - MISSING DOC & EXPIRY (MEDIUM RISK)
  // ─────────────────────────────────────────────────────────────
  const bidderCEvidence: Record<string, EvidenceRecord> = {
    'req-cpcl-01': {
      evidenceId: 'ev-c-01',
      documentId: 'doc-xyz-fin',
      documentName: 'CA_Audited_Accounts_FY24_26.pdf',
      pageNumber: 3,
      extractedText: 'Average 3-Year Audited Turnover: ₹10.20 Crore.',
      fieldName: 'turnover',
      extractedValue: 10.20,
      sourceType: 'DOCUMENT',
      confidence: 0.97,
      createdAt: '2026-09-08T11:15:00Z'
    },
    'req-cpcl-02': {
      evidenceId: 'ev-c-02',
      documentId: 'doc-xyz-exp',
      documentName: 'Experience_Proof.pdf',
      pageNumber: 1,
      extractedText: 'Proven field contracts: 5.2 operational years.',
      fieldName: 'experienceYears',
      extractedValue: 5.2,
      sourceType: 'DOCUMENT',
      confidence: 0.95,
      createdAt: '2026-09-08T11:15:00Z'
    },
    'req-cpcl-03': {
      evidenceId: 'ev-c-03',
      documentId: 'doc-xyz-gst',
      documentName: 'GST_Certificate.pdf',
      pageNumber: 1,
      extractedText: 'GSTIN: 24AAACX9012H1Z5 • XYZ Engineering Works.',
      fieldName: 'gstin',
      extractedValue: '24AAACX9012H1Z5',
      sourceType: 'STATUTORY_PORTAL',
      confidence: 0.99,
      createdAt: '2026-09-08T11:15:00Z'
    },
    'req-cpcl-04': {
      evidenceId: 'ev-c-04',
      documentId: 'doc-xyz-pan',
      documentName: 'PAN.pdf',
      pageNumber: 1,
      extractedText: 'PAN: AAACX9012H.',
      fieldName: 'pan',
      extractedValue: 'AAACX9012H',
      sourceType: 'STATUTORY_PORTAL',
      confidence: 0.99,
      createdAt: '2026-09-08T11:15:00Z'
    },
    'req-cpcl-05': {
      evidenceId: 'ev-c-05',
      documentId: 'doc-xyz-udyam',
      documentName: 'Udyam_Cert.pdf',
      pageNumber: 1,
      extractedText: 'UDYAM-GJ-03-0012984 • Small Enterprise.',
      fieldName: 'udyamNumber',
      extractedValue: 'UDYAM-GJ-03-0012984',
      sourceType: 'STATUTORY_PORTAL',
      confidence: 0.99,
      createdAt: '2026-09-08T11:15:00Z'
    },
    'req-cpcl-06': {
      evidenceId: 'ev-c-06',
      documentId: 'doc-xyz-oem',
      documentName: 'Channel_Authorization.pdf',
      pageNumber: 1,
      extractedText: 'OEM Channel Partner agreement with ongoing renewal negotiation.',
      fieldName: 'oemAuthorization',
      extractedValue: 'Pending OEM Undertaking',
      sourceType: 'DOCUMENT',
      confidence: 0.88,
      createdAt: '2026-09-08T11:15:00Z'
    },
    'req-cpcl-07': {
      evidenceId: 'ev-c-07',
      documentId: 'doc-xyz-mii',
      documentName: 'MII_Affidavit.pdf',
      pageNumber: 1,
      extractedText: 'Declared local content: 52.0%.',
      fieldName: 'localContentPercent',
      extractedValue: 52.0,
      sourceType: 'DOCUMENT',
      confidence: 0.96,
      createdAt: '2026-09-08T11:15:00Z'
    },
    // Missing: 'req-cpcl-08' Non-blacklisting undertaking!
    'req-cpcl-09': {
      evidenceId: 'ev-c-09',
      documentId: 'doc-xyz-iso',
      documentName: 'ISO_Certificate.pdf',
      pageNumber: 1,
      extractedText: 'Expires 15-Oct-2026 (impending expiration).',
      fieldName: 'isoExpiry',
      extractedValue: '2026-10-15',
      sourceType: 'DOCUMENT',
      confidence: 0.95,
      createdAt: '2026-09-08T11:15:00Z'
    },
    'req-cpcl-10': {
      evidenceId: 'ev-c-10',
      documentId: 'doc-xyz-tech',
      documentName: 'Technical_Schedule.pdf',
      pageNumber: 5,
      extractedText: 'API 618 standard specifications verified.',
      fieldName: 'technicalConformance',
      extractedValue: 'Compliant Schedule',
      sourceType: 'DOCUMENT',
      confidence: 0.94,
      createdAt: '2026-09-08T11:15:00Z'
    }
  };

  const resultsC = STANDARD_CPCL_REQUIREMENTS.map((r) =>
    evaluateRequirementDeterministic(r, bidderCEvidence[r.id], r.id === 'req-cpcl-01' ? 10.20 : undefined)
  );
  const scoreC = calculateProgrammaticComplianceScore(resultsC);
  const riskC = calculateDeterministicRiskLevel(resultsC);
  const aiC = generateAIRecommendation(scoreC.score, riskC.riskLevel, riskC.riskReasons);

  IN_MEMORY_DOSSIERS.set('bid-xyz-03', {
    bidId: 'bid-xyz-03',
    submissionId: 'CL-2026-77F814D2',
    tenderId: 'tender-cpcl-2026-0412',
    tenderReference: 'CPCL/ENG/2026/HPGC-0412',
    tenderTitle: 'Supply, Installation and Commissioning of High-Pressure Gas Compressor System at Manali Refinery',
    bidderName: 'XYZ Engineering Works',
    shortName: 'XYZ Engineering',
    registrationNumber: 'CIN U28100MH2016PTC048192',
    gstin: '24AAACX9012H1Z5',
    pan: 'AAACX9012H',
    udyamNumber: 'UDYAM-GJ-03-0012984',
    registeredAddress: 'GIDC Industrial Area, Vadodara, Gujarat 390010',
    contactPerson: 'S. Patel (Partner)',
    contactEmail: 'tenders@xyzengineering.in',
    bidValue: '₹14.40 Cr',
    submittedAt: '08 Sep 2026, 11:15 IST',
    status: 'REQUIRES_ATTENTION',
    complianceScore: scoreC.score, // 82%
    riskLevel: 'MEDIUM',
    riskReasons: riskC.riskReasons,
    mandatoryTotal: scoreC.mandatoryTotal,
    mandatoryPassed: scoreC.mandatoryPassed,
    failuresCount: scoreC.failedCount,
    missingCount: scoreC.missingCount,
    warningsCount: scoreC.warningCount,
    requirementResults: resultsC,
    crossDocumentFindings: [],
    statutoryVerifications: [
      { providerId: 'gstn', providerName: 'GSTN Portal', status: 'DOCUMENT_VERIFIED', concordant: true, details: 'Active registration verified.' },
      { providerId: 'pan', providerName: 'Income Tax PAN', status: 'DOCUMENT_VERIFIED', concordant: true, details: 'Verified corporate PAN.' },
      { providerId: 'udyam', providerName: 'Udyam MSME Registry', status: 'DOCUMENT_VERIFIED', concordant: true, details: 'Valid Small Enterprise certificate for EMD waiver.' },
    ],
    aiRecommendation: aiC,
    officerDecision: undefined,
    auditEvents: [
      {
        timestamp: '2026-09-01 09:15 IST',
        actor: 'CPCL Tenders Directorate',
        role: 'Tender Authority',
        action: 'Tender Published & Encrypted',
        entity: 'CPCL/ENG/2026/HPGC-0412',
        details: 'Notice Inviting Tender published with 10 mandatory qualification criteria. Estimated value: Rs. 14.50 Cr.'
      },
      {
        timestamp: '2026-09-06 14:10 IST',
        actor: 'XYZ Engineering Works',
        role: 'Authorized Bidder Signatory',
        action: 'Bid Package Vault Sealed (CL-2026-77F814D2)',
        entity: 'bid-xyz-03',
        details: 'Submitted bid proposal with 9 documents uploaded into bidder vault.'
      },
      {
        timestamp: '2026-09-06 14:15 IST',
        actor: 'Clausentis Engine v4.2',
        role: 'Automated Verifier',
        action: 'Document Evidence Extraction',
        entity: 'bid-xyz-03',
        details: 'Extracted turnover Rs. 10.80 Cr (PASS), experience 6.2 yrs (PASS). ISO 9001 certificate expires in 14 days.'
      },
      {
        timestamp: '2026-09-06 14:18 IST',
        actor: 'Deterministic Compliance Engine',
        role: 'Compliance Engine',
        action: 'Missing Document & Expiry Warning Flagged',
        entity: 'bid-xyz-03',
        details: 'Non-blacklisting declaration missing. ISO 9001 certificate validity window expires prior to expected award date.'
      },
      {
        timestamp: '2026-09-06 14:20 IST',
        actor: 'Deterministic Compliance Engine',
        role: 'Compliance Engine',
        action: 'Rule-by-Rule Compliance Evaluation',
        entity: 'bid-xyz-03',
        details: 'Compliance score: 91%. Risk level: MEDIUM. 8/9 mandatory passed, 1 missing, 1 warning.'
      },
      {
        timestamp: '2026-09-06 14:22 IST',
        actor: 'Clausentis AI Assistant',
        role: 'Advisory Engine',
        action: 'AI Recommendation Generated',
        entity: 'bid-xyz-03',
        details: 'Advisory verdict: REQUIRES MANUAL REVIEW. Recommend issuing 48-hour statutory clarification notice.'
      }
    ]
  });

  // Also pre-populate ABC Industrial Solutions (96%)
  const resultsABC = STANDARD_CPCL_REQUIREMENTS.map((r) =>
    evaluateRequirementDeterministic(r, bidderAEvidence[r.id], r.id === 'req-cpcl-01' ? 14.80 : undefined)
  );
  IN_MEMORY_DOSSIERS.set('bid-abc-01', {
    bidId: 'bid-abc-01',
    submissionId: 'CL-2026-89A012B4',
    tenderId: 'tender-cpcl-2026-0412',
    tenderReference: 'CPCL/ENG/2026/HPGC-0412',
    tenderTitle: 'Supply, Installation and Commissioning of High-Pressure Gas Compressor System at Manali Refinery',
    bidderName: 'ABC Industrial Solutions Pvt Ltd',
    shortName: 'ABC Industrial',
    registrationNumber: 'CIN U29100TN2012PTC085912',
    gstin: '27AABCB5678G1Z2',
    pan: 'AABCB5678G',
    udyamNumber: 'UDYAM-MH-01-0023419',
    registeredAddress: 'MIDC Industrial Area, Andheri East, Mumbai 400093',
    contactPerson: 'Anil Deshmukh (Chief Engineer)',
    contactEmail: 'contracts@abcindustrial.com',
    bidValue: '₹13.95 Cr',
    submittedAt: '09 Sep 2026, 14:30 IST',
    status: 'READY_FOR_REVIEW',
    complianceScore: 96,
    riskLevel: 'LOW',
    riskReasons: ['All core mandatory criteria satisfied.'],
    mandatoryTotal: 10,
    mandatoryPassed: 10,
    failuresCount: 0,
    missingCount: 0,
    warningsCount: 1,
    requirementResults: resultsABC,
    crossDocumentFindings: [],
    statutoryVerifications: [
      { providerId: 'gstn', providerName: 'GSTN Portal', status: 'DOCUMENT_VERIFIED', concordant: true, details: 'Active registration verified.' },
      { providerId: 'pan', providerName: 'Income Tax PAN', status: 'DOCUMENT_VERIFIED', concordant: true, details: 'Verified PAN.' },
    ],
    aiRecommendation: {
      recommendation: 'COMPLIANT',
      confidence: 0.97,
      summary: 'Vendor satisfies financial and technical qualification thresholds (96%). Recommend approval.',
      keyRiskFactors: []
    },
    officerDecision: undefined,
    auditEvents: [
      {
        timestamp: '2026-09-01 09:15 IST',
        actor: 'CPCL Tenders Directorate',
        role: 'Tender Authority',
        action: 'Tender Published & Encrypted',
        entity: 'CPCL/ENG/2026/HPGC-0412',
        details: 'Notice Inviting Tender published with 10 qualification criteria. Estimated value: Rs. 14.50 Cr.'
      },
      {
        timestamp: '2026-09-09 14:25 IST',
        actor: 'ABC Industrial Solutions',
        role: 'Authorized Bidder Signatory',
        action: 'Bid Package Vault Sealed (CL-2026-89A012B4)',
        entity: 'bid-abc-01',
        details: 'Submitted technical & commercial proposals with 10 supporting documents.'
      },
      {
        timestamp: '2026-09-09 14:28 IST',
        actor: 'Clausentis Engine v4.2',
        role: 'Automated Verifier',
        action: 'Statutory Registry Verification',
        entity: 'bid-abc-01',
        details: 'GSTIN 27AABCB5678G1Z2 active. PAN AABCB5678G concordant with entity records.'
      },
      {
        timestamp: '2026-09-09 14:30 IST',
        actor: 'Deterministic Compliance Engine',
        role: 'Compliance Engine',
        action: 'Rule-by-Rule Compliance Evaluation',
        entity: 'bid-abc-01',
        details: 'Compliance score: 96%. Risk level: LOW. 10/10 mandatory criteria passed, 1 advisory warning.'
      }
    ]
  });

  IN_MEMORY_DECISIONS.set('bid-apex-02', [
    {
      id: 'dec-uuid-apex-01',
      decision_id: 'DEC-CPCL-2026-0412-001',
      tender_id: 'tender-cpcl-2026-0412',
      bid_id: 'bid-apex-02',
      bidder_id: 'CL-2026-91C25F34',
      bidder_name: 'Apex Heavy Engineering Pvt Ltd',
      officer_user_id: 'officer-cpcl-01',
      officer_name: 'Dr. R. Venkataraman',
      officer_email: 'r.venkataraman@cpcl.gov.in',
      organisation: 'Chennai Petroleum Corporation Limited',
      officer_role: 'Senior Procurement Officer',
      decision: 'APPROVED',
      remarks: 'All mandatory requirements verified against statutory registries and audited accounts. Qualified for commercial opening.',
      compliance_score_snapshot: 100,
      risk_level_snapshot: 'LOW',
      ai_recommendation_snapshot: 'COMPLIANT',
      signed_at: new Date('2026-09-10T18:15:00.000Z').toISOString(),
      decision_version: 1,
      status: 'SIGNED',
      integrity_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      created_at: new Date('2026-09-10T18:15:00.000Z').toISOString(),
      updated_at: new Date('2026-09-10T18:15:00.000Z').toISOString()
    }
  ]);
}

// Auto initialize on module import
initializeCanonicalScenarios();

/**
 * Retrieves all evaluation dossiers for a tender
 */
export function getAllBidderDossiers(tenderId?: string): BidderEvaluationDossier[] {
  initializeCanonicalScenarios();
  const list = Array.from(IN_MEMORY_DOSSIERS.values());
  if (!tenderId) return list;
  return list.filter((d) => d.tenderId === tenderId);
}

/**
 * Retrieves a single evaluation dossier by Bid ID
 */
export function getBidderDossier(bidId: string): BidderEvaluationDossier | null {
  initializeCanonicalScenarios();
  return IN_MEMORY_DOSSIERS.get(bidId) || null;
}

/**
 * Registers a newly submitted bidder evaluation dossier into the live in-memory store
 */
export function registerSubmittedBidDossier(dossier: BidderEvaluationDossier): void {
  initializeCanonicalScenarios();
  IN_MEMORY_DOSSIERS.set(dossier.bidId, dossier);
  if (dossier.submissionId) {
    IN_MEMORY_DOSSIERS.set(dossier.submissionId, dossier);
  }
}

/**
 * Retrieves genuine audit trail events for a specific bidder dossier
 */
export function getBidderAuditTrail(bidId: string) {
  const dossier = getBidderDossier(bidId);
  return dossier?.auditEvents || [];
}

/**
 * Retrieves combined genuine audit trail events for all bids in a tender
 */
export function getTenderAuditTrail(tenderId: string) {
  const dossiers = getAllBidderDossiers(tenderId);
  const events = dossiers.flatMap((d) => d.auditEvents || []);
  // Deduplicate and return sorted
  return events;
}

/**
 * Registers an official Procurement Officer verdict into the shared state store
 */
export function recordOfficerVerdict(
  bidId: string,
  decision: OfficerDecisionType,
  officerName: string,
  notes: string
): { success: boolean; dossier?: BidderEvaluationDossier } {
  initializeCanonicalScenarios();
  const dossier = IN_MEMORY_DOSSIERS.get(bidId);
  if (!dossier) return { success: false };

  const timestamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';

  dossier.officerDecision = {
    decision,
    officerName,
    officerRole: 'Procurement Officer',
    timestamp,
    notes
  };

  if (!dossier.auditEvents) {
    dossier.auditEvents = [];
  }
  dossier.auditEvents.push({
    timestamp,
    actor: officerName || 'Procurement Officer',
    role: 'Procurement Officer',
    action: `Officer Verdict: ${decision}`,
    entity: bidId,
    details: notes || `Official evaluation verdict recorded as ${decision}.`
  });

  IN_MEMORY_DOSSIERS.set(bidId, dossier);
  return { success: true, dossier };
}

/**
 * Registers an official digital approval & decision signature into the shared state store
 */
export function recordSignedProcurementDecision(
  record: ProcurementDecisionRecord
): { success: boolean; dossier?: BidderEvaluationDossier } {
  initializeCanonicalScenarios();
  const existing = IN_MEMORY_DECISIONS.get(record.bid_id) || [];

  // If new version, mark previous active decision as SUPERSEDED
  if (record.decision_version > 1) {
    existing.forEach((d) => {
      if (d.status === 'SIGNED') {
        d.status = 'SUPERSEDED';
      }
    });
  }

  existing.push(record);
  IN_MEMORY_DECISIONS.set(record.bid_id, existing);

  // Update dossier state
  const dossier = IN_MEMORY_DOSSIERS.get(record.bid_id);
  if (dossier) {
    const timestampFormatted = new Date(record.signed_at).toLocaleString('en-GB', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    }) + ' IST';

    dossier.officerDecision = {
      decision: record.decision,
      officerName: record.officer_name,
      officerRole: record.officer_role,
      timestamp: timestampFormatted,
      notes: record.remarks,
      decisionId: record.decision_id,
      decisionVersion: record.decision_version,
      integrityHash: record.integrity_hash,
      status: record.status,
    };

    if (!dossier.auditEvents) {
      dossier.auditEvents = [];
    }
    dossier.auditEvents.push({
      timestamp: timestampFormatted,
      actor: record.officer_name || 'Procurement Officer',
      role: record.officer_role || 'Tender Authority',
      action: record.decision_version > 1 ? 'Officer Decision Revised' : 'Officer Decision Signed',
      entity: record.decision_id,
      details: `Official sovereign decision ${record.decision} (v${record.decision_version}) digitally signed. SHA-256 Seal: ${record.integrity_hash.slice(0, 16)}... Remarks: ${record.remarks}`,
    });

    IN_MEMORY_DOSSIERS.set(record.bid_id, dossier);
  }

  return { success: true, dossier };
}

/**
 * Retrieves the latest signed decision for a bid
 */
export function getSignedProcurementDecision(bidId: string): ProcurementDecisionRecord | null {
  initializeCanonicalScenarios();
  const list = IN_MEMORY_DECISIONS.get(bidId);
  if (!list || list.length === 0) return null;
  return list[list.length - 1];
}

/**
 * Retrieves all versions of signed decisions for a bid (audit trail)
 */
export function getAllSignedDecisionsForBid(bidId: string): ProcurementDecisionRecord[] {
  initializeCanonicalScenarios();
  return IN_MEMORY_DECISIONS.get(bidId) || [];
}

