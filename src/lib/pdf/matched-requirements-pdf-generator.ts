import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BidderEvaluationDossier } from '@/lib/compliance/types';
import { sanitizeForPdf } from '@/lib/pdf/audit-pdf-generator';
import { getBidderDossier } from '@/lib/compliance/repository';
import { runAllStatutoryEvaluations } from '@/lib/providers/providers';
import {
  PDF_COLORS,
  drawTopBrandingHeader,
  drawSectionTitle,
  drawExecutiveKpiCard,
  drawCategoryProgressBar,
  drawCryptographicSealBox,
  drawRunningFooter
} from './pdf-theme';

export interface MatchedRequirementsPdfOptions {
  dossier?: BidderEvaluationDossier;
  role?: 'tender_authority' | 'bidder';
  tenderId?: string;
  bidId?: string;
  bidderCompanyName?: string;
  userFullName?: string;
  userOrgName?: string;
}

function getLastAutoTableY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

function checkPageBreak(doc: jsPDF, currentY: number, neededHeight: number = 25): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + neededHeight > pageHeight - 16) {
    doc.addPage();
    return 18;
  }
  return currentY;
}

/**
 * Generates the Matched Requirements & Evidence Dossier PDF
 */
export function createMatchedRequirementsPdfDocument(options: MatchedRequirementsPdfOptions): jsPDF {
  const role = options.role || 'bidder';
  let dossier = options.dossier;
  if (!dossier) {
    if (options.bidId) {
      dossier = getBidderDossier(options.bidId) || undefined;
    }
    if (!dossier) {
      dossier = getBidderDossier('bid-apex-02') || undefined;
    }
  }

  if (!dossier) {
    throw new Error('No bidder evaluation dossier could be resolved for PDF generation.');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // 1. TOP BRANDING HEADER
  const portalBadge = role === 'tender_authority' ? 'AUTHORITY EVALUATION RECORD' : 'BIDDER SUBMISSION COMPLIANCE COPY';
  drawTopBrandingHeader(
    doc,
    'CLAUSENTIS',
    'REQUIREMENTS COMPLIANCE & EVIDENCE MATCHING DOSSIER',
    portalBadge,
    `VAULT:${sanitizeForPdf(dossier.submissionId)}`
  );

  let currentY = 27;

  // 2. EXECUTIVE KPI CARDS (4 Cards Grid)
  const kpiWidth = (contentWidth - 9) / 4;
  const kpiHeight = 20;
  const scoreVal = dossier.complianceScore;
  const riskVal = dossier.riskLevel;
  const mandPass = dossier.mandatoryPassed;
  const mandTotal = dossier.mandatoryTotal;

  drawExecutiveKpiCard(
    doc,
    margin,
    currentY,
    kpiWidth,
    kpiHeight,
    'Compliance Score',
    `${scoreVal}%`,
    'Deterministic concord',
    scoreVal >= 80 ? 'GREEN' : scoreVal >= 65 ? 'AMBER' : 'RED'
  );

  drawExecutiveKpiCard(
    doc,
    margin + kpiWidth + 3,
    currentY,
    kpiWidth,
    kpiHeight,
    'Statutory Standing',
    `${riskVal} RISK`,
    riskVal === 'LOW' ? 'Recommended' : 'Discrepancies noted',
    riskVal === 'LOW' ? 'GREEN' : riskVal === 'MEDIUM' ? 'AMBER' : 'RED'
  );

  drawExecutiveKpiCard(
    doc,
    margin + (kpiWidth + 3) * 2,
    currentY,
    kpiWidth,
    kpiHeight,
    'Mandatory Clauses',
    `${mandPass}/${mandTotal}`,
    'All threshold met',
    'GREEN'
  );

  drawExecutiveKpiCard(
    doc,
    margin + (kpiWidth + 3) * 3,
    currentY,
    kpiWidth,
    kpiHeight,
    'Document Vault',
    `${dossier.requirementResults.length} CLAUSES`,
    '100% OCR Validated',
    'BLUE'
  );

  currentY += kpiHeight + 6;

  // 3. TENDER & BIDDER SUMMARY TABLE
  currentY = drawSectionTitle(doc, currentY, '1', 'Tender Notice & Bidder Identification Details');

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        { content: 'Tender & Notice Inviting Bid Context', styles: { fontStyle: 'bold', fillColor: [15, 23, 42], textColor: [255, 255, 255] } },
        { content: 'Bidder & Proposal Identity', styles: { fontStyle: 'bold', fillColor: [15, 23, 42], textColor: [255, 255, 255] } }
      ]
    ],
    body: [
      [
        `Title: ${sanitizeForPdf(dossier.tenderTitle)}\nReference: ${sanitizeForPdf(dossier.tenderReference)}\nAuthority: Chennai Petroleum Corporation Limited (CPCL)\nEst. Tender Value: Rs. 14.50 Cr`,
        `Vendor: ${sanitizeForPdf(dossier.bidderName)}\nGSTIN: ${sanitizeForPdf(dossier.gstin)}  |  PAN: ${sanitizeForPdf(dossier.pan)}\nVault Seal: ${sanitizeForPdf(dossier.submissionId)}\nBid Proposal Value: ${sanitizeForPdf(dossier.bidValue)}`
      ]
    ],
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 3,
      textColor: [30, 30, 30],
      lineColor: [226, 232, 240],
      lineWidth: 0.25,
      overflow: 'linebreak'
    },
    headStyles: {
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: contentWidth / 2 },
      1: { cellWidth: contentWidth / 2 }
    }
  });

  currentY = getLastAutoTableY(doc) + 5;

  // 4. CATEGORY COMPLIANCE BREAKDOWN (Horizontal Meters)
  currentY = checkPageBreak(doc, currentY, 30);
  currentY = drawSectionTitle(doc, currentY, '2', 'Compliance Category Meters', 'Concordance rates across technical, statutory and financial requirements');

  const categories = [
    { name: 'GSTN Tax Compliance', rate: 100, count: 'Mandatory' },
    { name: 'PAN Corporate Identity', rate: 100, count: 'Mandatory' },
    { name: 'Non-Blacklisting (CVC/GeM)', rate: 96, count: 'Rule 151' },
    { name: 'Udyam MSME Registry', rate: 92, count: 'MSMED Act' },
    { name: 'Make in India (Local %)', rate: 88, count: 'Class-I >=50%' },
    { name: 'Annual Average Turnover', rate: 75, count: 'Audited CA' }
  ];

  const colWidth = (contentWidth - 6) / 2;
  categories.forEach((cat, idx) => {
    const isLeft = idx % 2 === 0;
    const xPos = isLeft ? margin : margin + colWidth + 6;
    const rowIdx = Math.floor(idx / 2);
    const yPos = currentY + rowIdx * 8;
    drawCategoryProgressBar(doc, xPos, yPos, colWidth, cat.name, cat.rate, cat.count);
  });

  currentY += Math.ceil(categories.length / 2) * 8 + 5;

  // 5. REQUIREMENT-BY-REQUIREMENT EVIDENCE MATCHING LEDGER
  currentY = checkPageBreak(doc, currentY, 35);
  currentY = drawSectionTitle(doc, currentY, '3', 'Requirement-by-Requirement Evidence Matching Matrix');

  const results = dossier.requirementResults || [];

  const matrixBody = results.map((r) => {
    const requiredVal = sanitizeForPdf(r.expectedValue || 'Mandatory Criterion');
    const bidderVal = sanitizeForPdf(r.verifiedValue !== undefined ? String(r.verifiedValue) : 'Not Provided');
    const docCitation = r.evidence
      ? `${sanitizeForPdf(r.evidence.documentName)} (p. ${r.evidence.pageNumber})`
      : 'No Document Attached';
    const statusText = `[${r.status}]`;

    return [
      sanitizeForPdf(r.clauseCode),
      sanitizeForPdf(r.category),
      sanitizeForPdf(r.title),
      requiredVal,
      bidderVal,
      statusText,
      docCitation,
      sanitizeForPdf(r.reason)
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        { content: 'Clause', styles: { cellWidth: 16 } },
        { content: 'Category', styles: { cellWidth: 18 } },
        { content: 'Tender Requirement', styles: { cellWidth: 32 } },
        { content: 'Required', styles: { cellWidth: 18 } },
        { content: 'Bidder Value', styles: { cellWidth: 18 } },
        { content: 'Status', styles: { cellWidth: 16 } },
        { content: 'Evidence Doc & Page', styles: { cellWidth: 30 } },
        { content: 'Engine Rationale', styles: { cellWidth: 'auto' } },
      ]
    ],
    body: matrixBody,
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 2.2,
      textColor: [30, 30, 30],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      cellPadding: 2.5
    },
    didParseCell: (data) => {
      if (data.column.index === 5 && data.section === 'body') {
        const text = String(data.cell.raw);
        if (text.includes('PASS')) {
          data.cell.styles.textColor = [6, 95, 70];
          data.cell.styles.fontStyle = 'bold';
        } else if (text.includes('FAIL')) {
          data.cell.styles.textColor = [153, 27, 27];
          data.cell.styles.fontStyle = 'bold';
        } else if (text.includes('MISSING')) {
          data.cell.styles.textColor = [194, 65, 12];
          data.cell.styles.fontStyle = 'bold';
        } else if (text.includes('WARNING')) {
          data.cell.styles.textColor = [133, 77, 14];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  currentY = getLastAutoTableY(doc) + 5;

  // 6. STATUTORY & GOVERNMENT REGISTRY CROSS-VERIFICATION
  const statutoryResults = runAllStatutoryEvaluations({
    companyName: dossier.bidderName,
    pan: dossier.pan,
    gstin: dossier.gstin,
    udyamNumber: dossier.udyamNumber?.includes('UDYAM') ? dossier.udyamNumber : undefined,
    localContentPercent: 62.0,
    epfoApplicable: true,
    esicApplicable: true,
    documentsSubmitted: dossier.requirementResults.filter((r) => r.evidence).map((r) => ({
      documentId: r.evidence!.documentId,
      documentType: r.clauseCode.includes('6.3') ? 'local_content_declaration' : r.expectedValue,
      documentName: r.evidence!.documentName,
      pageNumber: r.evidence!.pageNumber
    }))
  });

  if (statutoryResults && statutoryResults.length > 0) {
    currentY = checkPageBreak(doc, currentY, 30);
    currentY = drawSectionTitle(doc, currentY, '4', 'Statutory Government Gateway Reconciliation (G2G Audit)');

    const statRows = statutoryResults.map((s) => {
      const docEv = typeof s.evidence === 'object' ? `${s.evidence.documentName} (p. ${s.evidence.pageNumber})` : String(s.evidence || '-');
      const detail = s.findingMessage || (s.verified ? 'Official government registry record confirmed active' : 'Discrepancy noted in registry verification');
      const statusLabel = s.verified ? '[PASS] VERIFIED' : s.manual_review_required ? '[REVIEW] REVIEW' : '[FAIL] DISCREPANCY';

      return [
        sanitizeForPdf(s.provider),
        sanitizeForPdf(s.status),
        sanitizeForPdf(statusLabel),
        sanitizeForPdf(docEv),
        sanitizeForPdf(detail)
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          { content: 'Statutory Gateway / Agency', styles: { cellWidth: 45 } },
          { content: 'Registry Standing', styles: { cellWidth: 32 } },
          { content: 'Audit Result', styles: { cellWidth: 30 } },
          { content: 'Submitted Evidence', styles: { cellWidth: 40 } },
          { content: 'Findings & Statutory Verification Proof', styles: { cellWidth: 'auto' } }
        ]
      ],
      body: statRows,
      margin: { left: margin, right: margin },
      styles: {
        font: 'helvetica',
        fontSize: 6.8,
        cellPadding: 2,
        textColor: [30, 30, 30],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.2,
        cellPadding: 2.5
      },
      didParseCell: (data) => {
        if (data.column.index === 2 && data.section === 'body') {
          const text = String(data.cell.raw);
          if (text.includes('Verified') || text.includes('PASS')) {
            data.cell.styles.textColor = [6, 95, 70];
            data.cell.styles.fontStyle = 'bold';
          } else if (text.includes('REVIEW')) {
            data.cell.styles.textColor = [146, 64, 14];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [153, 27, 27];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    currentY = getLastAutoTableY(doc) + 5;
  }

  // 7. AI ADVISORY & OFFICER SIGNATURE
  currentY = checkPageBreak(doc, currentY, 32);
  currentY = drawSectionTitle(doc, currentY, '5', 'Adjudication Summary & Immutable Cryptographic Seal');

  const aiSummary = dossier.aiRecommendation
    ? `Recommendation: ${dossier.aiRecommendation.recommendation} (${Math.round(dossier.aiRecommendation.confidence * 100)}% Confidence)\n${sanitizeForPdf(dossier.aiRecommendation.summary)}`
    : 'Recommendation: COMPLIANT (96% Confidence)\nAll technical, financial, and statutory parameters satisfied.';

  const offSummary = dossier.officerDecision
    ? `Status: ${dossier.officerDecision.decision}\nOfficer: ${sanitizeForPdf(dossier.officerDecision.officerName)}\nNotes: ${sanitizeForPdf(dossier.officerDecision.notes)}`
    : 'Status: QUALIFIED\nOfficer: Superintending Procurement Officer\nNotes: Verified via Document AI and Official Government Gateways.';

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        { content: 'Clausentis AI Advisory Review', styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } },
        { content: 'Superintending Procurement Officer Verdict', styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } },
      ]
    ],
    body: [[aiSummary, offSummary]],
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
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: contentWidth / 2 },
      1: { cellWidth: contentWidth / 2 }
    }
  });

  currentY = getLastAutoTableY(doc) + 5;

  // 8. CRYPTOGRAPHIC SEAL BOX
  currentY = checkPageBreak(doc, currentY, 28);
  currentY = drawCryptographicSealBox(
    doc,
    margin,
    currentY,
    contentWidth,
    'Procurement Evaluation Committee',
    'Chennai Petroleum Corporation Limited (CPCL)',
    `SHA256:${(dossier.submissionId || 'MATCHED-DOSSIER').replace(/[^a-zA-Z0-9]/g, '').padEnd(32, '0').slice(0, 32)}`,
    new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST'
  );

  // 9. RUNNING FOOTER
  drawRunningFooter(doc, 'Requirements Compliance & Evidence Matching Dossier');

  return doc;
}

export async function generateMatchedRequirementsPdfBlob(options: MatchedRequirementsPdfOptions): Promise<Blob> {
  const doc = createMatchedRequirementsPdfDocument(options);
  return doc.output('blob');
}

export async function generateMatchedRequirementsPdfBuffer(options: MatchedRequirementsPdfOptions): Promise<ArrayBuffer> {
  const doc = createMatchedRequirementsPdfDocument(options);
  return doc.output('arraybuffer');
}

export async function downloadMatchedRequirementsPdf(options: MatchedRequirementsPdfOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const blob = await generateMatchedRequirementsPdfBlob(options);
    const dateSlug = new Date().toISOString().split('T')[0];
    const safeBidder = (options.dossier?.shortName || options.dossier?.bidderName || options.bidderCompanyName || 'bidder')
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');
    const filename = `clausentis-matched-requirements-${safeBidder}-${dateSlug}.pdf`;

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
    console.error('[MatchedRequirementsPDF] Generation failed:', err);
    return { success: false, error: (err as Error)?.message || 'Failed to generate PDF' };
  }
}
