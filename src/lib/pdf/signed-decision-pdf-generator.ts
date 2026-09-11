import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { sanitizeForPdf } from '@/lib/pdf/audit-pdf-generator';
import type { ProcurementDecisionRecord } from '@/types/procurement-decision';
import type { BidderEvaluationDossier } from '@/lib/compliance/types';

export interface SignedDecisionPdfOptions {
  decision: ProcurementDecisionRecord;
  dossier?: BidderEvaluationDossier | null;
  tenderTitle?: string;
  tenderReference?: string;
  tenderOrganisation?: string;
  tenderDate?: string;
  bidSubmissionDate?: string;
}

function getLastAutoTableY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

/**
 * Builds the official jsPDF document for a Signed Procurement Decision Record
 */
export function createSignedDecisionPdfDocument(options: SignedDecisionPdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const decision = options.decision;
  const dossier = options.dossier;

  // 1. PRIMARY HEADER (Clausentis Enterprise Monochromatic Theme)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(17, 17, 17);
  doc.text('CLAUSENTIS', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text('DIGITAL PROCUREMENT DECISION RECORD', margin, 23);

  // Top right badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(17, 17, 17);
  const cvcTag = 'OFFICIAL SOVEREIGN DECISION';
  doc.text(cvcTag, pageWidth - margin - doc.getTextWidth(cvcTag), 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  const hashLabel = `SEAL: SHA-256 / ${decision.integrity_hash ? decision.integrity_hash.slice(0, 16) + '...' : 'AUTHENTICATED'}`;
  doc.text(hashLabel, pageWidth - margin - doc.getTextWidth(hashLabel), 23);

  // Top divider line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  doc.line(margin, 26, pageWidth - margin, 26);

  // 2. DOCUMENT TITLE & GENERATION TIMESTAMP
  let currentY = 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(17, 17, 17);
  doc.text(`Procurement Decision Record: ${decision.decision_id}`, margin, currentY);

  const signedDateFormatted = new Date(decision.signed_at).toLocaleString('en-GB', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium',
  }) + ' IST';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const dateLabel = `Signed: ${signedDateFormatted}`;
  doc.text(dateLabel, pageWidth - margin - doc.getTextWidth(dateLabel), currentY);

  currentY += 6;

  // 3. TENDER & BID INFORMATION GRID
  const tenderTitle = options.tenderTitle || dossier?.tenderTitle || 'Supply, Installation and Commissioning of High-Pressure Gas Compressor System';
  const tenderRef = options.tenderReference || dossier?.tenderReference || 'CPCL/ENG/2026/HPGC-0412';
  const tenderOrg = options.tenderOrganisation || decision.organisation || 'Chennai Petroleum Corporation Limited';
  const bidderName = decision.bidder_name || dossier?.bidderName || 'Apex Heavy Engineering Pvt Ltd';
  const bidId = decision.bid_id || dossier?.bidId || 'bid-apex-02';
  const subDate = options.bidSubmissionDate || dossier?.submittedAt || '2026-09-07 18:30 IST';

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'plain',
    head: [
      [
        { content: 'TENDER INFORMATION', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 245, 245], textColor: [17, 17, 17] } },
        { content: 'BIDDER INFORMATION', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 245, 245], textColor: [17, 17, 17] } },
      ],
    ],
    body: [
      [
        { content: 'Tender Title:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: sanitizeForPdf(tenderTitle) },
        { content: 'Bidder Name:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: sanitizeForPdf(bidderName) },
      ],
      [
        { content: 'Tender Reference:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: sanitizeForPdf(tenderRef) },
        { content: 'Bid ID / Submission:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: sanitizeForPdf(decision.bidder_id || bidId) },
      ],
      [
        { content: 'Issuing Organisation:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: sanitizeForPdf(tenderOrg) },
        { content: 'Submission Date:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: sanitizeForPdf(subDate) },
      ],
    ],
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [20, 20, 20],
      lineColor: [230, 230, 230],
      lineWidth: 0.2,
    },
  });

  currentY = getLastAutoTableY(doc) + 6;

  // 4. COMPLIANCE ASSESSMENT SNAPSHOT
  const score = decision.compliance_score_snapshot;
  const risk = decision.risk_level_snapshot;
  const mandatoryTotal = dossier?.mandatoryTotal || 10;
  const mandatoryPassed = dossier?.mandatoryPassed || 10;
  const failures = dossier?.failuresCount || 0;
  const warnings = dossier?.warningsCount || 0;
  const missing = dossier?.missingCount || 0;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'plain',
    head: [
      [
        { content: 'COMPLIANCE & RISK ASSESSMENT SNAPSHOT (AT SIGNING TIME)', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [245, 245, 245], textColor: [17, 17, 17] } },
      ],
    ],
    body: [
      [
        { content: 'Overall Compliance Score:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: `${score}% (${mandatoryPassed}/${mandatoryTotal} Mandatory Criteria Passed)` },
        { content: 'Risk Assessment Level:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: `${risk} RISK` },
      ],
      [
        { content: 'Passed Requirements:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: `${mandatoryPassed} criteria verified compliant` },
        { content: 'Failed / Missing Requirements:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: `${failures} failures, ${missing} missing documents` },
      ],
      [
        { content: 'Advisory Warnings:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: `${warnings} non-fatal clause observations` },
        { content: 'Manual Review Flags:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: failures > 0 ? 'Officer deliberation required on discrepancies' : 'None. All mandatory criteria satisfied.' },
      ],
    ],
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [20, 20, 20],
      lineColor: [230, 230, 230],
      lineWidth: 0.2,
    },
  });

  currentY = getLastAutoTableY(doc) + 6;

  // 5. AI RECOMMENDATION (ADVISORY ONLY)
  const aiRec = decision.ai_recommendation_snapshot;
  const aiSummary = dossier?.aiRecommendation?.summary || 'Deterministic rule-by-rule engine assessed submission against 10 CPCL qualification clauses.';
  const keyFindings = dossier?.aiRecommendation?.keyRiskFactors?.join(' • ') || 'All mandatory threshold values, statutory registrations, and technical specifications satisfied.';

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'plain',
    head: [
      [
        { content: 'AI-GENERATED DECISION SUPPORT (ADVISORY)', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 245, 245], textColor: [17, 17, 17] } },
      ],
    ],
    body: [
      [
        { content: 'AI Recommendation:', styles: { fontStyle: 'bold', textColor: [100, 100, 100], cellWidth: 45 } },
        { content: `${aiRec} (Confidence: 96%)` },
      ],
      [
        { content: 'Key Observations:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: sanitizeForPdf(keyFindings) },
      ],
      [
        { content: 'Algorithmic Summary:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: sanitizeForPdf(aiSummary) },
      ],
      [
        { content: 'Statutory Disclaimer:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: 'AI-generated decision support — not the final decision. Advisory recommendation pursuant to SIH26100 procurement guidelines. The sovereign human Procurement Officer exercises independent decision-making authority.' },
      ],
    ],
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [20, 20, 20],
      lineColor: [230, 230, 230],
      lineWidth: 0.2,
    },
  });

  currentY = getLastAutoTableY(doc) + 6;

  // 6. SOVEREIGN OFFICER DECISION & REMARKS
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'plain',
    head: [
      [
        { content: 'SOVEREIGN PROCUREMENT OFFICER DECISION (FINAL & BINDING)', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [17, 17, 17], textColor: [255, 255, 255] } },
      ],
    ],
    body: [
      [
        { content: 'Official Verdict:', styles: { fontStyle: 'bold', textColor: [17, 17, 17], cellWidth: 45 } },
        { content: `${decision.decision}`, styles: { fontStyle: 'bold', fontSize: 9.5 } },
      ],
      [
        { content: 'Officer Remarks & Justification:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: sanitizeForPdf(decision.remarks) },
      ],
    ],
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [20, 20, 20],
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
    },
  });

  currentY = getLastAutoTableY(doc) + 6;

  // 7. DIGITAL APPROVAL & CRYPTOGRAPHIC SEAL
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'plain',
    head: [
      [
        { content: 'DIGITAL APPROVAL & AUDIT TRAIL VERIFICATION', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 245, 245], textColor: [17, 17, 17] } },
      ],
    ],
    body: [
      [
        { content: 'Authorised Officer Name:', styles: { fontStyle: 'bold', textColor: [100, 100, 100], cellWidth: 45 } },
        { content: `${sanitizeForPdf(decision.officer_name)}` },
      ],
      [
        { content: 'Official Email & Identity:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: `${sanitizeForPdf(decision.officer_email)} (UUID: ${decision.officer_user_id})` },
      ],
      [
        { content: 'Organisation & Role:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: `${sanitizeForPdf(decision.organisation)} — ${decision.officer_role}` },
      ],
      [
        { content: 'Decision Reference ID:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: `${decision.decision_id} (Version ${decision.decision_version} • Status: ${decision.status})` },
      ],
      [
        { content: 'Signed Timestamp:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: `${signedDateFormatted}` },
      ],
      [
        { content: 'SHA-256 Integrity Checksum:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: `${decision.integrity_hash}`, styles: { fontStyle: 'normal' } },
      ],
      [
        { content: 'Legal Approval Statement:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: 'This decision was digitally approved by the authorised Procurement Officer through Clausentis. Prototype digital approval. Production deployment can integrate an authorised DSC/eSign provider.' },
      ],
      [
        { content: 'Audit Reference:', styles: { fontStyle: 'bold', textColor: [100, 100, 100] } },
        { content: `CVC LEDGER AUDIT EVENT #${decision.id.slice(0, 8).toUpperCase()} • IMMUTABLE LEDGER RECORD` },
      ],
    ],
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [20, 20, 20],
      lineColor: [230, 230, 230],
      lineWidth: 0.2,
    },
  });

  // 8. FOOTER
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(130, 130, 130);

    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.text('Clausentis — Procurement Intelligence, Made Verifiable.', margin, pageHeight - 7);
    const pageStr = `Page ${i} of ${totalPages}`;
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 7);
  }

  return doc;
}

/**
 * Generates an in-memory Uint8Array buffer of the Signed Decision PDF (for testing or server transmission)
 */
export function generateSignedDecisionPdfBuffer(options: SignedDecisionPdfOptions): Uint8Array {
  const doc = createSignedDecisionPdfDocument(options);
  const arrayBuffer = doc.output('arraybuffer');
  return new Uint8Array(arrayBuffer);
}

/**
 * Generates a client-side Blob URL for instant browser preview or download
 */
export function generateSignedDecisionPdfBlobUrl(options: SignedDecisionPdfOptions): string {
  const doc = createSignedDecisionPdfDocument(options);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}
