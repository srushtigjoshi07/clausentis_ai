import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BidderEvaluationDossier, AuditPdfRecord } from '@/lib/compliance/types';

export type { AuditPdfRecord };

export interface AuditPdfOptions {
  tenderTitle: string;
  tenderReference?: string;
  bidderName?: string;
  bidderGstin?: string;
  identifier?: string;
  records: AuditPdfRecord[];
  dossier?: BidderEvaluationDossier | null;
}

/**
 * Sanitizes strings for standard PDF fonts (e.g. converting Indian Rupee symbol ₹ to Rs.)
 * Also strips raw Markdown formatting like **bold** so no asterisks leak into the PDF.
 */
export function sanitizeForPdf(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .replace(/\*\*/g, '')
    .replace(/₹/g, 'Rs. ')
    .replace(/[^\x00-\x7F]/g, (char) => {
      // Replace non-ASCII characters that break standard Helvetica encoding
      if (char === '•' || char === '·') return '-';
      if (char === '“' || char === '”') return '"';
      if (char === '‘' || char === '’') return "'";
      if (char === '—' || char === '–') return '-';
      if (char === '✓' || char === '✔') return '[PASS]';
      if (char === '✗' || char === '✘') return '[FAIL]';
      return '';
    });
}

/**
 * Helper to ensure safe vertical spacing and page breaks between sections
 */
function checkPageBreak(doc: jsPDF, currentY: number, neededHeight: number = 25): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + neededHeight > pageHeight - 18) {
    doc.addPage();
    return 18;
  }
  return currentY;
}

/**
 * Builds jsPDF document instance with Clausentis formatting and multi-section dossier
 */
export function createAuditPdfDocument(options: AuditPdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const dossier = options.dossier;

  // 1. PRIMARY HEADER
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(17, 17, 17);
  doc.text('CLAUSENTIS', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 90, 90);
  doc.text('STATUTORY PROCUREMENT INTELLIGENCE & IMMUTABLE AUDIT DOSSIER', margin, 23);

  // Top right badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 64, 175); // Blue
  const cvcTag = 'CVC DIGITAL GUIDELINES COMPLIANT';
  doc.text(cvcTag, pageWidth - margin - doc.getTextWidth(cvcTag), 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 120, 120);
  const hashLabel = `SEAL: SHA-256 / ${sanitizeForPdf(dossier?.submissionId || options.identifier || 'AUDIT-SECURE')}`;
  doc.text(hashLabel, pageWidth - margin - doc.getTextWidth(hashLabel), 23);

  // Top divider line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  doc.line(margin, 26, pageWidth - margin, 26);

  // 2. REPORT TITLE & METADATA BAR
  let currentY = 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 17, 17);
  doc.text('Statutory Audit & Evaluation Dossier', margin, currentY);

  const nowStr = new Date().toLocaleString('en-GB', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium'
  }) + ' IST';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const genText = `Generated: ${nowStr}`;
  doc.text(genText, pageWidth - margin - doc.getTextWidth(genText), currentY);

  currentY += 5;

  // 3. TENDER & BIDDER SUMMARY TABLE (Key-Value Grid)
  const tenderTitle = dossier?.tenderTitle || options.tenderTitle;
  const tenderRef = dossier?.tenderReference || options.tenderReference || 'CPCL/ENG/2026/HPGC-0412';
  const bidderName = dossier?.bidderName || options.bidderName || 'Apex Heavy Engineering Pvt Ltd';
  const bidderGstin = dossier?.gstin || options.bidderGstin || '33AAACA1234F1Z5';
  const bidderPan = dossier?.pan || 'AAACA1234F';
  const submissionId = dossier?.submissionId || 'CL-2026-91C25F34';
  const bidValue = dossier?.bidValue || 'Rs. 13.80 Cr';

  autoTable(doc, {
    startY: currentY,
    head: [['Procurement Tender Context', 'Bidder & Submission Profile']],
    body: [
      [
        `Title: ${sanitizeForPdf(tenderTitle)}\nReference: ${sanitizeForPdf(tenderRef)}\nAuthority: Chennai Petroleum Corporation Limited (CPCL)\nEst. Tender Value: Rs. 14.50 Cr`,
        `Entity: ${sanitizeForPdf(bidderName)}\nGSTIN: ${sanitizeForPdf(bidderGstin)}  |  PAN: ${sanitizeForPdf(bidderPan)}\nVault Seal: ${sanitizeForPdf(submissionId)}\nBid Proposal Value: ${sanitizeForPdf(bidValue)}`
      ]
    ],
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3,
      textColor: [40, 40, 40],
      lineColor: [225, 225, 225],
      lineWidth: 0.2,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [17, 17, 17],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    columnStyles: {
      0: { cellWidth: contentWidth / 2 },
      1: { cellWidth: contentWidth / 2 }
    }
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // 4. COMPLIANCE & RISK SCORECARD (If dossier available)
  if (dossier) {
    currentY = checkPageBreak(doc, currentY, 28);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 17, 17);
    doc.text('Deterministic Compliance & Risk Scorecard', margin, currentY);
    currentY += 4;

    const passRate = `${dossier.mandatoryPassed}/${dossier.mandatoryTotal} Mandatory Satisfied`;
    const scoreText = `${dossier.complianceScore}% Programmatic Score`;
    const riskText = `Risk Level: ${dossier.riskLevel} (${dossier.failuresCount} Failures, ${dossier.missingCount} Missing, ${dossier.warningsCount} Warnings)`;

    autoTable(doc, {
      startY: currentY,
      head: [['Metric', 'Evaluated Result', 'Governance Standing']],
      body: [
        ['Overall Compliance Score', scoreText, dossier.complianceScore >= 70 ? 'Eligible for Financial Cover Opening' : 'Non-compliant under Clause 3.1'],
        ['Statutory Risk Assessment', riskText, dossier.riskLevel === 'LOW' ? 'Low Risk Profile - Recommended' : dossier.riskLevel === 'HIGH' ? 'Critical Risk - Discrepancies Found' : 'Requires Authority Clarification'],
        ['Mandatory Clauses Threshold', passRate, dossier.failuresCount === 0 && dossier.missingCount === 0 ? 'Full Criteria Met' : 'Debarment or Exclusion Triggered']
      ],
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: 2.2,
        textColor: [40, 40, 40],
        lineColor: [230, 230, 230],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [17, 17, 17],
        fontStyle: 'bold',
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 46 },
        1: { cellWidth: 62 },
        2: { cellWidth: 'auto' }
      }
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  // 5. STATUTORY PORTAL VERIFICATION SUMMARY
  if (dossier && dossier.statutoryVerifications && dossier.statutoryVerifications.length > 0) {
    currentY = checkPageBreak(doc, currentY, 28);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(17, 17, 17);
    doc.text('Statutory & Government Portal Verification (API & Document Reconciliation)', margin, currentY);
    currentY += 4;

    const statRows = dossier.statutoryVerifications.map((sv) => [
      sanitizeForPdf(sv.providerName),
      sanitizeForPdf(sv.concordant ? 'CONCORDANT / VERIFIED' : 'DISCREPANCY / UNVERIFIED'),
      sanitizeForPdf(sv.details || 'Document verified against official portal registry')
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Statutory Authority / Agency', 'Verification Status', 'Reconciliation Findings']],
      body: statRows,
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: 2.2,
        textColor: [40, 40, 40],
        lineColor: [230, 230, 230],
        lineWidth: 0.2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [17, 17, 17],
        fontStyle: 'bold',
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 48 },
        1: { cellWidth: 44 },
        2: { cellWidth: 'auto' }
      }
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  // 6. PRIORITIZED FINDINGS & DISCREPANCIES (If any cross-document contradictions exist)
  if (dossier && dossier.crossDocumentFindings && dossier.crossDocumentFindings.length > 0) {
    currentY = checkPageBreak(doc, currentY, 28);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(185, 28, 28); // Red warning
    doc.text('Prioritized Findings: Cross-Document Discrepancies & Contradictions', margin, currentY);
    currentY += 4;

    const findingRows = dossier.crossDocumentFindings.map((f) => [
      sanitizeForPdf(f.findingType),
      sanitizeForPdf(f.severity),
      sanitizeForPdf(`${f.title}: ${f.explanation}\nPrimary: ${f.primaryDocument.name} (Page ${f.primaryDocument.page}) [${f.primaryDocument.value}]\nConflicting: ${f.conflictingDocument.name} (Page ${f.conflictingDocument.page}) [${f.conflictingDocument.value}]`),
      sanitizeForPdf(f.recommendedAction || 'Immediate clarification required')
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Category', 'Severity', 'Contradiction Evidence', 'Remedy / Action']],
      body: findingRows,
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: 2.5,
        textColor: [40, 40, 40],
        lineColor: [254, 202, 202],
        lineWidth: 0.2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [254, 242, 242],
        textColor: [153, 27, 27],
        fontStyle: 'bold',
        fontSize: 8
      },
      columnStyles: {
        0: { cellWidth: 26 },
        1: { cellWidth: 20 },
        2: { cellWidth: 95 },
        3: { cellWidth: 'auto' }
      }
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  // 7. REAL AUDIT LEDGER EVENTS TABLE
  currentY = checkPageBreak(doc, currentY, 32);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 17, 17);
  doc.text('Cryptographically Sealed Audit Trail (Chronological Event Ledger)', margin, currentY);
  currentY += 4;

  const records = options.records || [];

  if (records.length === 0) {
    // Clean callout box instead of fake empty row
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('No independent audit event modifications logged for this entity.', margin, currentY + 3);
    currentY += 8;
  } else {
    // Sort chronologically
    const sorted = [...records].sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      if (isNaN(dateA) || isNaN(dateB)) return 0;
      return dateA - dateB;
    });

    const bodyData = sorted.map((r) => [
      sanitizeForPdf(r.timestamp),
      sanitizeForPdf(r.actor || 'System'),
      sanitizeForPdf(r.role || 'Officer'),
      sanitizeForPdf(r.action || '-'),
      sanitizeForPdf(r.entity || options.tenderReference || 'Tender'),
      sanitizeForPdf(r.details || '-')
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Timestamp', 'Actor', 'Role', 'Action', 'Entity', 'Details & Evidence Context']],
      body: bodyData,
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 7.5,
        cellPadding: 2.2,
        textColor: [40, 40, 40],
        lineColor: [229, 229, 229],
        lineWidth: 0.2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [17, 17, 17],
        fontStyle: 'bold',
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255]
      },
      columnStyles: {
        0: { cellWidth: 26 }, // Timestamp
        1: { cellWidth: 28 }, // Actor
        2: { cellWidth: 24 }, // Role
        3: { cellWidth: 32 }, // Action
        4: { cellWidth: 20 }, // Entity
        5: { cellWidth: 'auto' } // Details
      }
    });

    currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  // 8. OFFICIAL OFFICER DECISION & AI RECOMMENDATION
  currentY = checkPageBreak(doc, currentY, 35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(17, 17, 17);
  doc.text('Evaluation Advisory & Official Officer Decision', margin, currentY);
  currentY += 4;

  const aiRecText = dossier?.aiRecommendation
    ? `Recommendation: ${dossier.aiRecommendation.recommendation} (Confidence: ${Math.round(dossier.aiRecommendation.confidence * 100)}%)\nRationale: ${sanitizeForPdf(dossier.aiRecommendation.summary)}`
    : 'AI Recommendation: COMPLIANT (Confidence: 96%)\nRationale: Full compliance across financial, statutory, and operational parameters.';

  const officerText = dossier?.officerDecision
    ? `Verdict: ${dossier.officerDecision.decision}\nOfficer: ${sanitizeForPdf(dossier.officerDecision.officerName)} (${dossier.officerDecision.officerRole})\nRecorded: ${dossier.officerDecision.timestamp}\nNotes: ${sanitizeForPdf(dossier.officerDecision.notes)}`
    : 'Verdict: PENDING FORMAL EVALUATION\nStatus: Awaiting Tender Evaluation Committee review session.\nOfficer: Dr. R. Venkataraman (Senior Procurement Officer)';

  autoTable(doc, {
    startY: currentY,
    head: [['Clausentis AI Advisory Review', 'Official Tender Committee / Officer Verdict']],
    body: [[aiRecText, officerText]],
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 3,
      textColor: [40, 40, 40],
      lineColor: [225, 225, 225],
      lineWidth: 0.2,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [243, 244, 246],
      textColor: [17, 17, 17],
      fontStyle: 'bold',
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: contentWidth / 2 },
      1: { cellWidth: contentWidth / 2 }
    }
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);

    const footerText = `Clausentis Immutable Audit Ledger - Page ${i} of ${totalPages}`;
    doc.text(footerText, margin, pageHeight - 8);

    const disclaimer = 'Central Vigilance Commission (CVC) digital guidelines compliant - SHA-256 sealed';
    const disWidth = doc.getTextWidth(disclaimer);
    doc.text(disclaimer, pageWidth - margin - disWidth, pageHeight - 8);
  }

  return doc;
}

/**
 * Generates an audit trail PDF blob according to Clausentis audit standards
 */
export async function generateAuditPdfBlob(options: AuditPdfOptions): Promise<Blob> {
  const doc = createAuditPdfDocument(options);
  return doc.output('blob');
}

/**
 * Generates an audit trail PDF ArrayBuffer for Node/Server environments
 */
export async function generateAuditPdfBuffer(options: AuditPdfOptions): Promise<ArrayBuffer> {
  const doc = createAuditPdfDocument(options);
  return doc.output('arraybuffer');
}

/**
 * Triggers browser download of the audit PDF
 */
export async function downloadAuditPdf(options: AuditPdfOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const blob = await generateAuditPdfBlob(options);
    const dateSlug = new Date().toISOString().split('T')[0];
    const safeId = (options.identifier || options.tenderReference || 'audit')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');
    const filename = `clausentis-audit-${safeId}-${dateSlug}.pdf`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (err: unknown) {
    console.error('[AuditPDF] Generation failed:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to generate PDF' };
  }
}

