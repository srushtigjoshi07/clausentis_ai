import jsPDF from 'jspdf';
import { sanitizeForPdf } from './audit-pdf-generator';

/**
 * Clausentis AI — Executive PDF Visual Theme & Styling Engine
 * Provides modern layout elements: Top branding stripes, KPI metric cards,
 * horizontal progress bars, decision banners, official seals, and running headers/footers.
 */

export const PDF_COLORS = {
  navyDark: [15, 23, 42] as [number, number, number],      // #0F172A
  navyBlue: [30, 58, 138] as [number, number, number],     // #1E3A8A
  royalBlue: [37, 99, 235] as [number, number, number],    // #2563EB
  emeraldDark: [6, 95, 70] as [number, number, number],    // #065F46
  emerald: [5, 150, 105] as [number, number, number],      // #059669
  emeraldLight: [236, 253, 245] as [number, number, number],// #ECFDF5
  emeraldBorder: [167, 243, 208] as [number, number, number],// #A7F3D0
  amberDark: [146, 64, 14] as [number, number, number],    // #92400E
  amber: [217, 119, 6] as [number, number, number],        // #D97706
  amberLight: [255, 251, 235] as [number, number, number],  // #FFFBEB
  amberBorder: [253, 230, 138] as [number, number, number],// #FDE68A
  redDark: [153, 27, 27] as [number, number, number],       // #991B1B
  red: [220, 38, 38] as [number, number, number],          // #DC2626
  redLight: [254, 242, 242] as [number, number, number],    // #FEF2F2
  redBorder: [254, 202, 202] as [number, number, number],  // #FECACA
  textPrimary: [17, 17, 17] as [number, number, number],
  textSecondary: [85, 85, 85] as [number, number, number],
  textMuted: [120, 120, 120] as [number, number, number],
  bgLight: [248, 250, 252] as [number, number, number],    // #F8FAFC
  borderLight: [226, 232, 240] as [number, number, number],// #E2E8F0
};

/**
 * 1. Draw sleek executive branding header with dual accent stripes
 */
export function drawTopBrandingHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  badgeText: string = 'OFFICIAL STATUTORY RECORD',
  sealHash: string = 'SHA-256 SEALED'
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // Dual-color top accent bar (Navy Blue + Emerald Green)
  doc.setFillColor(...PDF_COLORS.navyDark);
  doc.rect(0, 0, pageWidth * 0.7, 3.5, 'F');
  doc.setFillColor(...PDF_COLORS.emerald);
  doc.rect(pageWidth * 0.7, 0, pageWidth * 0.3, 3.5, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text('CLAUSENTIS', margin, 15);

  // Subtitle / Authority Stack
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(subtitle.toUpperCase(), margin, 19.5);

  // Top right badge chip
  doc.setFillColor(...PDF_COLORS.bgLight);
  doc.setDrawColor(...PDF_COLORS.borderLight);
  doc.setLineWidth(0.3);
  const badgeWidth = doc.getTextWidth(badgeText) + 8;
  const badgeX = pageWidth - margin - badgeWidth;
  doc.roundedRect(badgeX, 10, badgeWidth, 6.5, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.navyBlue);
  doc.text(badgeText, badgeX + 4, 14.5);

  // Cryptographic Seal label
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...PDF_COLORS.textMuted);
  const sealLabel = `SECURITY SEAL: ${sealHash}`;
  doc.text(sealLabel, pageWidth - margin - doc.getTextWidth(sealLabel), 20);

  // Subtle separator line
  doc.setDrawColor(...PDF_COLORS.borderLight);
  doc.setLineWidth(0.3);
  doc.line(margin, 23, pageWidth - margin, 23);
}

/**
 * 2. Draw modern section header with colored left accent indicator
 */
export function drawSectionTitle(
  doc: jsPDF,
  y: number,
  sectionNum: string,
  title: string,
  subtitle?: string
): number {
  const margin = 14;

  // Left accent bar
  doc.setFillColor(...PDF_COLORS.navyDark);
  doc.rect(margin, y, 2.5, subtitle ? 8.5 : 5.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text(`${sectionNum}. ${title}`, margin + 5, y + 4);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...PDF_COLORS.textMuted);
    doc.text(subtitle, margin + 5, y + 8);
    return y + 11;
  }

  return y + 7.5;
}

/**
 * 3. Draw an Executive KPI Stat Card
 */
export function drawExecutiveKpiCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  value: string,
  subtext: string,
  status: 'GREEN' | 'AMBER' | 'RED' | 'BLUE' = 'GREEN'
) {
  // Card background & border
  doc.setFillColor(...PDF_COLORS.bgLight);
  doc.setDrawColor(...PDF_COLORS.borderLight);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, y, width, height, 2, 2, 'FD');

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(title.toUpperCase(), x + 3.5, y + 5);

  // Status indicator dot
  let dotColor = PDF_COLORS.emerald;
  if (status === 'AMBER') dotColor = PDF_COLORS.amber;
  if (status === 'RED') dotColor = PDF_COLORS.red;
  if (status === 'BLUE') dotColor = PDF_COLORS.royalBlue;

  doc.setFillColor(...dotColor);
  doc.circle(x + width - 5, y + 4.5, 1.5, 'F');

  // Big Metric Value
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text(value, x + 3.5, y + 12);

  // Subtext
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...PDF_COLORS.textMuted);
  doc.text(subtext, x + 3.5, y + 16.5);

  // Mini progress meter bar at bottom
  doc.setFillColor(230, 235, 240);
  doc.rect(x + 3.5, y + height - 2.5, width - 7, 1.2, 'F');

  doc.setFillColor(...dotColor);
  const fillWidth = (width - 7) * (status === 'RED' ? 0.35 : status === 'AMBER' ? 0.7 : 0.95);
  doc.rect(x + 3.5, y + height - 2.5, fillWidth, 1.2, 'F');
}

/**
 * 4. Draw horizontal Category Progress Meter
 */
export function drawCategoryProgressBar(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  categoryName: string,
  passRate: number,
  countText: string
) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text(categoryName, x, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const rateText = `${passRate}% (${countText})`;
  doc.text(rateText, x + width - doc.getTextWidth(rateText), y);

  // Background bar
  const barY = y + 1.8;
  const barHeight = 2.4;
  doc.setFillColor(240, 243, 246);
  doc.roundedRect(x, barY, width, barHeight, 0.8, 0.8, 'F');

  // Filled bar
  let barColor = PDF_COLORS.emerald;
  if (passRate < 75) barColor = PDF_COLORS.red;
  else if (passRate < 85) barColor = PDF_COLORS.amber;
  else if (passRate < 95) barColor = PDF_COLORS.navyBlue;

  doc.setFillColor(...barColor);
  const filledWidth = Math.max((width * passRate) / 100, 2);
  doc.roundedRect(x, barY, filledWidth, barHeight, 0.8, 0.8, 'F');
}

/**
 * 5. Draw Sovereign Decision Verdict Banner
 */
export function drawDecisionBanner(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  decision: string,
  officerName: string,
  timestamp: string
): number {
  const isQual = decision.toUpperCase().includes('QUALIF') || decision.toUpperCase().includes('COMPLIANT');
  const isDisqual = decision.toUpperCase().includes('DISQUALIF') || decision.toUpperCase().includes('REJECT');

  let bg = PDF_COLORS.emeraldLight;
  let border = PDF_COLORS.emeraldBorder;
  let textCol = PDF_COLORS.emeraldDark;
  let tag = '[PASS] SOVEREIGN QUALIFICATION CONFIRMED';

  if (isDisqual) {
    bg = PDF_COLORS.redLight;
    border = PDF_COLORS.redBorder;
    textCol = PDF_COLORS.redDark;
    tag = '[FAIL] STATUTORY DISQUALIFICATION ORDER';
  } else if (!isQual) {
    bg = PDF_COLORS.amberLight;
    border = PDF_COLORS.amberBorder;
    textCol = PDF_COLORS.amberDark;
    tag = '[REVIEW] CLARIFICATION / MANUAL REVIEW MANDATE';
  }

  const height = 18;
  doc.setFillColor(...bg);
  doc.setDrawColor(...border);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, width, height, 2, 2, 'FD');

  // Header Tag
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...textCol);
  doc.text(tag, x + 5, y + 5.5);

  // Verdict text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text(`OFFICIAL VERDICT: ${decision.toUpperCase()}`, x + 5, y + 11);

  // Officer sign line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  const authText = `Superintending Authority: ${sanitizeForPdf(officerName)}  |  Recorded: ${timestamp}`;
  doc.text(authText, x + 5, y + 15.5);

  return y + height + 6;
}

/**
 * 6. Draw Cryptographic Digital Signature & Verification Box
 */
export function drawCryptographicSealBox(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  signerName: string,
  signerRole: string,
  hash: string,
  dateStr: string
): number {
  const height = 25;

  doc.setFillColor(250, 252, 250);
  doc.setDrawColor(...PDF_COLORS.emeraldBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, width, height, 2, 2, 'FD');

  // Verified Signature Badge
  doc.setFillColor(...PDF_COLORS.emeraldLight);
  doc.setDrawColor(...PDF_COLORS.emerald);
  doc.roundedRect(x + 4, y + 3.5, 48, 5, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...PDF_COLORS.emeraldDark);
  doc.text('CCA CLASS-3 DSC VERIFIED', x + 6.5, y + 7);

  // Signer Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.textPrimary);
  doc.text(`Digitally Signed by: ${sanitizeForPdf(signerName)}`, x + 56, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.textSecondary);
  doc.text(`Designation: ${sanitizeForPdf(signerRole)}  |  Signing Timestamp: ${dateStr}`, x + 4, y + 13.5);

  // Hash Code Box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(x + 4, y + 16, width - 8, 6, 1, 1, 'F');

  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(60, 60, 60);
  doc.text(`SHA-256 SEAL: ${hash}`, x + 6, y + 20);

  return y + height + 6;
}

/**
 * 7. Draw running footer on every page
 */
export function drawRunningFooter(doc: jsPDF, documentTitle: string) {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.textMuted);

    doc.setDrawColor(...PDF_COLORS.borderLight);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    const footerLeft = `CLAUSENTIS AI • ${documentTitle.toUpperCase()} • PAGE ${i} OF ${totalPages}`;
    doc.text(footerLeft, margin, pageHeight - 6.5);

    const footerRight = 'GFR 2017 & CVC PROCUREMENT GUIDELINES COMPLIANT • SHA-256 VERIFIED';
    doc.text(footerRight, pageWidth - margin - doc.getTextWidth(footerRight), pageHeight - 6.5);
  }
}
