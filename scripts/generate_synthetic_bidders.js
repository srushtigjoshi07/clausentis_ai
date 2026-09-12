/**
 * CLAUSENTIS SYNTHETIC BIDDER DOCUMENTS GENERATOR (REVISED LAYOUT ENGINE)
 *
 * Implements high-contrast, perfectly wrapped, page-boundary-safe PDF rendering
 * using jspdf-autotable for all tables across all 3 bidder packages:
 *
 * 1. Explicit high-contrast colors:
 *    - Header cells: Dark Navy ([15, 23, 42]) with White bold text ([255, 255, 255])
 *    - Data cells: White ([255, 255, 255]) with Charcoal Black text ([15, 23, 42])
 *    - Alternate rows: Soft Cool Gray ([248, 250, 252]) with Charcoal Black text
 *    - Key-Value labels: Light Slate ([241, 245, 249]) with Slate Navy bold text ([30, 41, 59])
 * 2. Automated text wrapping & dynamic row heights:
 *    - All table cells use overflow: 'linebreak'
 *    - Fixed column widths strictly bounded to printable width (180mm = 210mm - 30mm margins)
 *    - Long descriptions (e.g. Certified Scope of Supply) wrap cleanly inside cells
 * 3. Page boundary safety:
 *    - No text overflows outside cell or page boundaries
 *    - Multi-page documents paginate cleanly with repeated headers where needed
 * 4. Synthetic disclaimer:
 *    - Prominent banner on every page
 */

const { jsPDF } = require('jspdf');
const { applyPlugin } = require('jspdf-autotable');
const fs = require('fs');
const path = require('path');

// Initialize jspdf-autotable plugin
applyPlugin(jsPDF);

// Target directory paths
const BASE_DIR = path.resolve(__dirname, '..', 'bidders');
const DIR_B01 = path.join(BASE_DIR, 'bidder_01_compliant');
const DIR_B02 = path.join(BASE_DIR, 'bidder_02_non_compliant');
const DIR_B03 = path.join(BASE_DIR, 'bidder_03_contradictory');

[BASE_DIR, DIR_B01, DIR_B02, DIR_B03].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─────────────────────────────────────────────────────────────
// Shared PDF Helpers & Utilities
// ─────────────────────────────────────────────────────────────

function createDoc() {
  return new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
}

function applyHeadersAndFooters(doc, docTitle, docId) {
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Top synthetic disclaimer banner
    doc.setFillColor(153, 27, 27); // Deep Maroon
    doc.rect(0, 0, 210, 7.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('SYNTHETIC DOCUMENT — FOR CLAUSENTIS PROTOTYPE DEMONSTRATION ONLY', 105, 5, { align: 'center' });

    // Sub-banner
    doc.setFillColor(254, 242, 242);
    doc.rect(0, 7.5, 210, 4.5, 'F');
    doc.setTextColor(185, 28, 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.text('FICTIONAL TEST ARTIFACT • NOT AN OFFICIAL GOVERNMENT RECORD • SMART INDIA HACKATHON SIH26100', 105, 10.8, { align: 'center' });

    // Bottom footer divider
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(15, 286, 195, 286);

    // Bottom footer text
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.text(`CLAUSENTIS PROTOTYPE DOSSIER • ${docTitle} [Ref: ${docId}]`, 15, 290);
    doc.text(`Page ${p} of ${totalPages}`, 195, 290, { align: 'right' });
  }
}

function drawTitleBox(doc, y, title, subtitle, clauseRef) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  const maxTitleW = clauseRef ? 124 : 172;
  const titleLines = doc.splitTextToSize(title, maxTitleW);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  const subLines = subtitle ? doc.splitTextToSize(subtitle, maxTitleW) : [];

  const titleBlockH = titleLines.length * 4.2;
  const subBlockH = subLines.length ? subLines.length * 3.6 + 1.5 : 0;
  const boxHeight = Math.max(16, 5 + titleBlockH + subBlockH + 2);

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(15, y, 180, boxHeight, 1.5, 1.5, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(titleLines, 18, y + 5.5);

  if (subLines.length) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text(subLines, 18, y + 5.5 + titleBlockH);
  }

  if (clauseRef) {
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(144, y + 3.8, 48, 7.5, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(clauseRef, 168, y + 8.8, { align: 'center' });
  }

  return y + boxHeight + 4;
}

/**
 * Robust Multi-Column Table using jspdf-autotable with High-Contrast Colors
 */
function renderTable(doc, startY, head, body, columnStyles = {}, options = {}) {
  doc.autoTable({
    startY,
    margin: { left: 15, right: 15 },
    head,
    body,
    columnStyles,
    headStyles: {
      fillColor: [15, 23, 42],       // Very dark navy (#0F172A)
      textColor: [255, 255, 255],     // Pure white
      fontStyle: 'bold',
      fontSize: 7.8,
      cellPadding: 2.2,
      halign: 'left',
      lineWidth: 0.2,
      lineColor: [51, 65, 85]
    },
    bodyStyles: {
      fillColor: [255, 255, 255],     // Pure white
      textColor: [15, 23, 42],       // High-contrast charcoal black
      fontSize: 7.5,
      cellPadding: 2.2,
      lineWidth: 0.15,
      lineColor: [226, 232, 240]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],     // Light gray
      textColor: [15, 23, 42]        // High-contrast charcoal black
    },
    styles: {
      overflow: 'linebreak',
      font: 'helvetica',
      lineWidth: 0.15,
      lineColor: [203, 213, 225]
    },
    theme: 'grid',
    ...options
  });

  return doc.lastAutoTable.finalY + 4;
}

/**
 * Robust 2-Column Key-Value Information Table using jspdf-autotable
 * Solves overflow for long fields (e.g. Scope, Address, NIC codes)
 */
function renderKeyValueTable(doc, startY, items, options = {}) {
  const labelWidth = options.labelWidth || 56;
  const valueWidth = 180 - labelWidth;

  const body = items.map((it) => [it.label, String(it.value)]);

  doc.autoTable({
    startY,
    margin: { left: 15, right: 15 },
    body,
    columnStyles: {
      0: {
        cellWidth: labelWidth,
        fontStyle: 'bold',
        textColor: [30, 41, 59],       // Dark slate
        fillColor: [241, 245, 249],     // Light cool slate
        cellPadding: 2.2
      },
      1: {
        cellWidth: valueWidth,
        textColor: [15, 23, 42],       // Charcoal black
        fillColor: [255, 255, 255],     // Pure white
        cellPadding: 2.2
      }
    },
    styles: {
      overflow: 'linebreak',
      font: 'helvetica',
      fontSize: 7.5,
      lineWidth: 0.2,
      lineColor: [203, 213, 225]
    },
    theme: 'grid',
    didParseCell: function(data) {
      // Highlight specific values if marked
      if (data.column.index === 1 && items[data.row.index] && items[data.row.index].isHighlight) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [15, 23, 42];
      }
    },
    ...options
  });

  return doc.lastAutoTable.finalY + 4;
}

function drawSealBox(doc, x, y, width, height, data) {
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(71, 85, 105);
  doc.setLineWidth(0.4);
  doc.roundedRect(x, y, width, height, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(data.title || 'AUTHORIZED SIGNATORY & VERIFICATION SEAL', x + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);

  let textY = y + 9.5;
  if (data.name) {
    doc.text(`Name: ${data.name}`, x + 4, textY);
    textY += 3.8;
  }
  if (data.designation) {
    doc.text(`Designation: ${data.designation}`, x + 4, textY);
    textY += 3.8;
  }
  if (data.organization) {
    doc.text(`Entity: ${data.organization}`, x + 4, textY);
    textY += 3.8;
  }
  if (data.date) {
    doc.text(`Date & Time: ${data.date}`, x + 4, textY);
    textY += 3.8;
  }
  if (data.reference) {
    doc.text(`Ref / UDIN / Reg: ${data.reference}`, x + 4, textY);
  }

  // Stamp circle badge
  const badgeX = x + width - 16;
  const badgeY = y + height / 2;
  doc.setDrawColor(29, 78, 216);
  doc.setFillColor(239, 246, 255);
  doc.setLineWidth(0.5);
  doc.circle(badgeX, badgeY, 10, 'FD');
  doc.circle(badgeX, badgeY, 8.5, 'S');

  doc.setTextColor(29, 78, 216);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.8);
  doc.text(data.stampText1 || 'CLAUSENTIS', badgeX, badgeY - 2.8, { align: 'center' });
  doc.text(data.stampText2 || 'VERIFIED', badgeX, badgeY, { align: 'center' });
  doc.text(data.stampText3 || 'DIGITALLY', badgeX, badgeY + 3.2, { align: 'center' });
}

function saveDoc(doc, outputPath) {
  const buf = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(outputPath, buf);
  console.log(`[GENERATED] ${path.relative(BASE_DIR, outputPath)} (${buf.length} bytes)`);
}

// ─────────────────────────────────────────────────────────────
// 1. FINANCIAL STATEMENT (Audited Financials, req-cpcl-01)
// ─────────────────────────────────────────────────────────────

function generateFinancialStatement(bidder, outputPath) {
  const doc = createDoc();

  // Page 1: Auditor's Report & 3-Year Turnover
  let y = 18;

  // Auditor Letterhead
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(bidder.auditorFirm, 15, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text('Chartered Accountants • Peer Reviewed Firm', 15, y + 4.2);
  doc.text(`${bidder.auditorAddress} • Phone: +91 44 2498 1022 • Email: audit@${bidder.auditorDomain}`, 15, y + 8);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(15, y + 10.5, 195, y + 10.5);

  y = drawTitleBox(
    doc,
    y + 13,
    'INDEPENDENT STATUTORY AUDITOR CERTIFICATE & FINANCIAL AUDIT REPORT',
    'Issued pursuant to Tender Notice Ref: CPCL/ENG/2026/HPGC-0412 • Pre-Qualification Financial Criteria',
    'Clause 4.1'
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const p1 = `We have examined the audited financial statements, balance sheets, and books of account of M/s ${bidder.legalName} (CIN: ${bidder.cin}, PAN: ${bidder.pan}) having registered office at ${bidder.address} for the preceding three financial years (FY 2023-24, FY 2024-25, and FY 2025-26). Based on our statutory examination, the certified Average 3-Year Audited Annual Turnover from Operations is Rs. ${bidder.turnoverAvg.toFixed(2)} Crore and Net Worth is Rs. ${bidder.netWorthAvg.toFixed(2)} Crore (UDIN: ${bidder.udin}):`;
  const p1Lines = doc.splitTextToSize(p1, 180);
  doc.text(p1Lines, 15, y);
  y += p1Lines.length * 3.8 + 3;

  // 3-Year Turnover Table with explicit high contrast
  const tableHeaders = [['Financial Year', 'Audited Revenue from Operations (INR Cr)', 'Net Worth (INR Cr)', 'Audit Status / Report Date']];
  const tableRows = [
    ['FY 2023-24 (Audited)', `Rs. ${bidder.turnoverFY24.toFixed(2)} Crore`, `Rs. ${bidder.netWorthFY24.toFixed(2)} Crore`, 'Statutory Audit Completed / 28-Jun-2024'],
    ['FY 2024-25 (Audited)', `Rs. ${bidder.turnoverFY25.toFixed(2)} Crore`, `Rs. ${bidder.netWorthFY25.toFixed(2)} Crore`, 'Statutory Audit Completed / 22-Jun-2025'],
    ['FY 2025-26 (Audited)', `Rs. ${bidder.turnoverFY26.toFixed(2)} Crore`, `Rs. ${bidder.netWorthFY26.toFixed(2)} Crore`, 'Statutory Audit Completed / 30-May-2026'],
    ['Average 3-Year Audited Turnover', `Rs. ${bidder.turnoverAvg.toFixed(2)} Crore`, `Rs. ${bidder.netWorthAvg.toFixed(2)} Crore`, `UDIN: ${bidder.udin}`]
  ];
  y = renderTable(doc, y, tableHeaders, tableRows, {
    0: { cellWidth: 42, fontStyle: 'bold' },
    1: { cellWidth: 50, fontStyle: 'bold' },
    2: { cellWidth: 38 },
    3: { cellWidth: 50 }
  });

  // Key Findings & Compliance Note
  doc.setFillColor(bidder.isTurnoverPassing ? 240 : 254, bidder.isTurnoverPassing ? 253 : 242, bidder.isTurnoverPassing ? 244 : 242);
  doc.setDrawColor(bidder.isTurnoverPassing ? 34 : 220, bidder.isTurnoverPassing ? 197 : 38, bidder.isTurnoverPassing ? 94 : 38);
  doc.roundedRect(15, y, 180, 18, 1.5, 1.5, 'FD');

  doc.setTextColor(bidder.isTurnoverPassing ? 22 : 185, bidder.isTurnoverPassing ? 101 : 28, bidder.isTurnoverPassing ? 52 : 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.text(
    bidder.isTurnoverPassing
      ? 'STATUTORY COMPLIANCE CONFIRMATION: TURNOVER THRESHOLD SATISFIED'
      : 'STATUTORY AUDIT NOTICE: TURNOVER DEFICIT DETECTED BELOW TENDER MINIMUM',
    19,
    y + 5.2
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  const certText = bidder.isTurnoverPassing
    ? `The Average 3-Year Audited Annual Turnover of Rs. ${bidder.turnoverAvg.toFixed(2)} Crore satisfies and exceeds the mandatory tender threshold of Rs. 10.00 Crore specified in Clause 4.1. The Net Worth is positive at Rs. ${bidder.netWorthAvg.toFixed(2)} Crore.`
    : `The Average 3-Year Audited Annual Turnover of Rs. ${bidder.turnoverAvg.toFixed(2)} Crore fails to meet the mandatory tender threshold of Rs. 10.00 Crore (Deficit: -Rs. ${(10.0 - bidder.turnoverAvg).toFixed(2)} Crore). Net Worth stands at Rs. ${bidder.netWorthAvg.toFixed(2)} Crore.`;
  const certLines = doc.splitTextToSize(certText, 172);
  doc.text(certLines, 19, y + 9.8);
  y += 22;

  // Signatory box
  drawSealBox(doc, 15, y, 180, 30, {
    title: 'AUDITOR SIGNATURE & UDIN VERIFICATION',
    name: bidder.auditorPartner,
    designation: 'Partner, Chartered Accountants',
    organization: bidder.auditorFirm,
    date: '30-May-2026 • 16:45 IST',
    reference: `${bidder.udin} (ICAI Registered)`,
    stampText1: 'ICAI UDIN',
    stampText2: 'VERIFIED',
    stampText3: 'CA FIRM'
  });

  // Page 2: Balance Sheet Extract
  doc.addPage();
  y = 18;
  y = drawTitleBox(doc, y, 'AUDITED BALANCE SHEET EXTRACT (AS AT 31ST MARCH 2026)', `Entity: M/s ${bidder.legalName} • CIN: ${bidder.cin}`, 'Schedule 3');

  const bsHeaders = [['Particulars', 'Note', 'As at 31-Mar-2026 (INR Cr)', 'As at 31-Mar-2025 (INR Cr)']];
  const bsRows = [
    ['I. EQUITY AND LIABILITIES', '', '', ''],
    ['(1) Shareholders Funds', '', '', ''],
    ['    (a) Share Capital', '1', '2.50', '2.50'],
    ['    (b) Reserves and Surplus (Net Worth Basis)', '2', `${(bidder.netWorthAvg - 2.5).toFixed(2)}`, `${(bidder.netWorthFY25 - 2.5).toFixed(2)}`],
    ['(2) Non-Current Liabilities (Long-term borrowings)', '3', '3.10', '3.80'],
    ['(3) Current Liabilities (Trade payables & provisions)', '4', '4.20', '4.60'],
    ['TOTAL EQUITY AND LIABILITIES', '', `${(bidder.netWorthAvg + 7.3).toFixed(2)}`, `${(bidder.netWorthFY25 + 8.4).toFixed(2)}`],
    ['II. ASSETS', '', '', ''],
    ['(1) Non-Current Assets (Property, Plant & Equipment)', '5', '8.40', '8.90'],
    ['(2) Current Assets (Inventories, Trade Receivables, Cash)', '6', `${(bidder.netWorthAvg + 7.3 - 8.4).toFixed(2)}`, `${(bidder.netWorthFY25 + 8.4 - 8.9).toFixed(2)}`],
    ['TOTAL ASSETS', '', `${(bidder.netWorthAvg + 7.3).toFixed(2)}`, `${(bidder.netWorthFY25 + 8.4).toFixed(2)}`]
  ];
  y = renderTable(doc, y, bsHeaders, bsRows, {
    0: { cellWidth: 80, fontStyle: 'bold' },
    1: { cellWidth: 16 },
    2: { cellWidth: 42 },
    3: { cellWidth: 42 }
  });

  // Page 3: Profit & Loss Statement Extract
  doc.addPage();
  y = 18;
  y = drawTitleBox(doc, y, 'AUDITED STATEMENT OF PROFIT AND LOSS (FY 2025-26)', `Entity: M/s ${bidder.legalName} • Accompanying Statutory Notes`, 'Schedule 14');

  const plHeaders = [['Particulars', 'Note No.', 'FY 2025-26 (INR Cr)', 'FY 2024-25 (INR Cr)']];
  const plRows = [
    ['Revenue from operations (Turnover)', '14', `Rs. ${bidder.turnoverFY26.toFixed(2)} Cr`, `Rs. ${bidder.turnoverFY25.toFixed(2)} Cr`],
    ['Other income (Interest & scrap sales)', '15', 'Rs. 0.35 Cr', 'Rs. 0.28 Cr'],
    ['Total Income', '', `Rs. ${(bidder.turnoverFY26 + 0.35).toFixed(2)} Cr`, `Rs. ${(bidder.turnoverFY25 + 0.28).toFixed(2)} Cr`],
    ['Cost of materials consumed & components', '16', `Rs. ${(bidder.turnoverFY26 * 0.58).toFixed(2)} Cr`, `Rs. ${(bidder.turnoverFY25 * 0.59).toFixed(2)} Cr`],
    ['Employee benefits expense', '17', `Rs. ${(bidder.turnoverFY26 * 0.15).toFixed(2)} Cr`, `Rs. ${(bidder.turnoverFY25 * 0.16).toFixed(2)} Cr`],
    ['Depreciation and amortization expense', '18', 'Rs. 0.45 Cr', 'Rs. 0.42 Cr'],
    ['Other operating expenses', '19', 'Rs. 0.95 Cr', 'Rs. 0.88 Cr'],
    ['Total Expenses', '', `Rs. ${(bidder.turnoverFY26 * 0.73 + 1.4).toFixed(2)} Cr`, `Rs. ${(bidder.turnoverFY25 * 0.75 + 1.3).toFixed(2)} Cr`],
    ['Profit Before Tax (PBT)', '', `Rs. ${(bidder.turnoverFY26 * 0.27 - 1.05).toFixed(2)} Cr`, `Rs. ${(bidder.turnoverFY25 * 0.25 - 1.02).toFixed(2)} Cr`],
    ['Tax Expense (Current & Deferred)', '20', `Rs. ${((bidder.turnoverFY26 * 0.27 - 1.05) * 0.25).toFixed(2)} Cr`, `Rs. ${((bidder.turnoverFY25 * 0.25 - 1.02) * 0.25).toFixed(2)} Cr`],
    ['Profit for the Year (PAT)', '', `Rs. ${((bidder.turnoverFY26 * 0.27 - 1.05) * 0.75).toFixed(2)} Cr`, `Rs. ${((bidder.turnoverFY25 * 0.25 - 1.02) * 0.75).toFixed(2)} Cr`]
  ];
  y = renderTable(doc, y, plHeaders, plRows, {
    0: { cellWidth: 78, fontStyle: 'bold' },
    1: { cellWidth: 20 },
    2: { cellWidth: 41 },
    3: { cellWidth: 41 }
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text('Note 14 Extract: Revenue from operations represents audited revenue from contracts with customers recognized over time and at point in time pursuant to Ind AS 115. All inter-segment revenues have been eliminated.', 15, y + 2);

  applyHeadersAndFooters(doc, 'Audited Financial Statements (3-Year Turnover)', 'doc-cpcl-fin-01');
  saveDoc(doc, outputPath);
}

// ─────────────────────────────────────────────────────────────
// 2. EXPERIENCE CERTIFICATE (req-cpcl-02)
// ─────────────────────────────────────────────────────────────

function generateExperienceCertificate(bidder, outputPath) {
  const doc = createDoc();

  // Page 1: IOCL Completion Certificate
  let y = 18;

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('INDIAN OIL CORPORATION LIMITED (IOCL)', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text('Panipat Refinery & Petrochemical Complex • P.O. Panipat Refinery, Haryana 132140', 15, y + 4.2);
  doc.text('Ref No: IOCL/PR/ENG/COMP-140/CC-8821 • Date of Certificate: 14-Apr-2024', 15, y + 8);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(15, y + 10.5, 195, y + 10.5);

  y = drawTitleBox(
    doc,
    y + 13,
    'CLIENT WORK COMPLETION & PERFORMANCE CERTIFICATE',
    'High-Pressure Gas Compression System Turnkey Package (Discharge ≥ 120 bar(g))',
    'Clause 4.2'
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const p1 = `This is to certify that M/s ${bidder.legalName} has successfully executed, installed, and commissioned the High-Pressure Gas Compression Package at IOCL Panipat Refinery. The performance of the equipment and operational parameters are detailed below:`;
  const p1Lines = doc.splitTextToSize(p1, 180);
  doc.text(p1Lines, 15, y);
  y += p1Lines.length * 3.8 + 3;

  const expDetails = [
    { label: 'Contract / Work Order Number', value: bidder.expClient1Order, isHighlight: true },
    { label: 'Scope of Work', value: bidder.expClient1Scope },
    { label: 'Operating Discharge Pressure', value: bidder.expClient1Pressure, isHighlight: true },
    { label: 'Contract Value Executed', value: bidder.expClient1Value },
    { label: 'Date of Award / Commencement', value: bidder.expClient1Award },
    { label: 'Date of Successful Commissioning', value: bidder.expClient1Commissioning },
    { label: 'Operational Service Standing', value: bidder.expClient1Years, isHighlight: true },
    { label: 'Equipment Operating Availability', value: bidder.expClient1Availability }
  ];
  y = renderKeyValueTable(doc, y, expDetails, { labelWidth: 56 });

  drawSealBox(doc, 15, y + 2, 180, 28, {
    title: 'ISSUING AUTHORITY SIGNATURE',
    name: 'R. K. Bansal',
    designation: 'Chief General Manager (Projects & Maintenance)',
    organization: 'Indian Oil Corporation Limited, Panipat Refinery',
    date: '14-Apr-2024 • Verified Record',
    reference: 'IOCL-PR-ENG-8821',
    stampText1: 'IOCL',
    stampText2: 'OFFICIAL',
    stampText3: 'CERTIFIED'
  });

  // Page 2: Summary of Gas Compression Experience
  doc.addPage();
  y = 18;
  y = drawTitleBox(
    doc,
    y,
    'CONSOLIDATED TRACK RECORD & OPERATIONAL STANDING SCHEDULE',
    `Audit of High-Pressure Gas Compression Packages Executed by M/s ${bidder.legalName}`,
    'Clause 4.2 Summary'
  );

  const schedHeaders = [['Client / PSU', 'Project Scope Description', 'Discharge Rating', 'Completion Date', 'Standing']];
  const schedRows = bidder.expProjectsList;
  y = renderTable(doc, y, schedHeaders, schedRows, {
    0: { cellWidth: 38, fontStyle: 'bold' },
    1: { cellWidth: 62 },
    2: { cellWidth: 28 },
    3: { cellWidth: 26 },
    4: { cellWidth: 26, fontStyle: 'bold' }
  });

  // Summary callout
  doc.setFillColor(bidder.isExperiencePassing ? 240 : 254, bidder.isExperiencePassing ? 253 : 242, bidder.isExperiencePassing ? 244 : 242);
  doc.setDrawColor(bidder.isExperiencePassing ? 34 : 220, bidder.isExperiencePassing ? 197 : 38, bidder.isExperiencePassing ? 94 : 38);
  doc.roundedRect(15, y, 180, 18, 1.5, 1.5, 'FD');

  doc.setTextColor(bidder.isExperiencePassing ? 22 : 185, bidder.isExperiencePassing ? 101 : 28, bidder.isExperiencePassing ? 52 : 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.text(
    bidder.isExperiencePassing
      ? `VERIFIED OPERATIONAL EXPERIENCE: ${bidder.totalExpYears} CONSECUTIVE YEARS (SATISFIES CLAUSE 4.2)`
      : `DEFICIT OPERATIONAL EXPERIENCE: ${bidder.totalExpYears} YEARS (FAILS CLAUSE 4.2 MANDATORY 5.0 YEARS)`,
    19,
    y + 5.2
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  const expSummaryText = bidder.isExperiencePassing
    ? `The bidder has demonstrated ${bidder.totalExpYears} consecutive years of proven field operational experience in high-pressure gas compression packages operating at discharge pressure ≥ 120 bar(g). Meets and exceeds mandatory 5.0 years requirement.`
    : `The bidder demonstrates only ${bidder.totalExpYears} operational years, which is below the mandatory tender threshold of 5.0 years (Deficit: -${(5.0 - parseFloat(bidder.totalExpYears)).toFixed(1)} years). Furthermore, prior packages operated below 120 bar(g).`;
  const expSumLines = doc.splitTextToSize(expSummaryText, 172);
  doc.text(expSumLines, 19, y + 9.8);
  y += 22;

  drawSealBox(doc, 15, y, 180, 28, {
    title: 'TECHNICAL VERIFICATION & TRACK RECORD AUDIT SEAL',
    name: bidder.signatoryName,
    designation: bidder.signatoryRole,
    organization: bidder.legalName,
    date: '04-Sep-2026 • Verified Records',
    reference: `EXP-AUDIT-${bidder.totalExpYears}Y`,
    stampText1: 'TRACK RECORD',
    stampText2: `${bidder.totalExpYears} YRS`,
    stampText3: 'VERIFIED'
  });

  applyHeadersAndFooters(doc, 'Past Experience & Completion Certificates', 'doc-cpcl-exp-01');
  saveDoc(doc, outputPath);
}

// ─────────────────────────────────────────────────────────────
// 3. GST REGISTRATION CERTIFICATE (Form GST REG-06, req-cpcl-03)
// ─────────────────────────────────────────────────────────────

function generateGSTCertificate(bidder, outputPath) {
  const doc = createDoc();
  let y = 18;

  // Header: Government of India / State Tax
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GOVERNMENT OF INDIA / GOODS AND SERVICES TAX DEPARTMENT', 105, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('FORM GST REG-06 • [See Rule 10(1)] • REGISTRATION CERTIFICATE', 105, y + 4.2, { align: 'center' });

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(15, y + 7.5, 195, y + 7.5);

  y = drawTitleBox(
    doc,
    y + 10.5,
    'GOODS AND SERVICES TAX IDENTIFICATION NUMBER (GSTIN) REGISTRATION',
    'Statutory Registration under Section 25 of the Central Goods and Services Tax Act, 2017',
    'Clause 2.1'
  );

  const gstDetails = [
    { label: 'Registration Number (GSTIN)', value: bidder.gstin, isHighlight: true },
    { label: 'Legal Name of Entity', value: bidder.legalName, isHighlight: true },
    { label: 'Trade Name', value: bidder.tradeName || bidder.legalName },
    { label: 'Constitution of Business', value: bidder.constitution || 'Private Limited Company' },
    { label: 'Address of Principal Place of Business', value: bidder.address },
    { label: 'Date of Liability', value: bidder.gstLiabilityDate || '01/07/2017' },
    { label: 'Period of Validity', value: 'From 01/07/2017 To Continuing (Active Taxpayer)', isHighlight: true },
    { label: 'Type of Registration', value: 'Regular Taxpayer' },
    { label: 'Jurisdictional State / Center Ward', value: bidder.gstJurisdiction || 'Range-IV, Division-B, State Tax Directorate' }
  ];
  y = renderKeyValueTable(doc, y, gstDetails, { labelWidth: 58 });

  drawSealBox(doc, 15, y + 2, 180, 30, {
    title: 'DETAILS OF APPROVING AUTHORITY',
    name: 'S. Rajagopalan',
    designation: 'Assistant Commissioner of State Tax / Commercial Tax Officer',
    organization: 'Goods & Services Tax Directorate',
    date: 'Certified Active on Statutory Portal: 01-Sep-2026',
    reference: `GSTN-AUTH-${bidder.gstin}`,
    stampText1: 'GOVT OF INDIA',
    stampText2: 'GSTN ACTIVE',
    stampText3: 'REG-06'
  });

  applyHeadersAndFooters(doc, 'Form GST REG-06 Registration Certificate', 'doc-cpcl-gst-01');
  saveDoc(doc, outputPath);
}

// ─────────────────────────────────────────────────────────────
// 4. PAN VERIFICATION DOCUMENT (req-cpcl-04)
// ─────────────────────────────────────────────────────────────

function generatePANDocument(bidder, outputPath) {
  const doc = createDoc();
  let y = 18;

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('INCOME TAX DEPARTMENT • GOVERNMENT OF INDIA', 105, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('NSDL e-Governance Infrastructure Limited • Allotment of Permanent Account Number (PAN)', 105, y + 4.2, { align: 'center' });

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(15, y + 7.5, 195, y + 7.5);

  y = drawTitleBox(
    doc,
    y + 10.5,
    'PERMANENT ACCOUNT NUMBER (PAN) ALLOTMENT INTIMATION LETTER',
    'Issued under Section 139A of the Income Tax Act, 1961',
    'Clause 2.2'
  );

  const panDetails = [
    { label: 'Permanent Account Number (PAN)', value: bidder.pan, isHighlight: true },
    { label: 'Name of Entity / Assessee', value: bidder.legalName, isHighlight: true },
    { label: 'Date of Incorporation', value: bidder.incorporationDate || '14/08/2014' },
    { label: 'Category / Constitution', value: 'Company (Private Limited Entity)' },
    { label: 'Assessing Officer Ward / Circle', value: bidder.panWard || 'Circle 1(1), Corporate Taxation Division' },
    { label: 'Status on NSDL Database', value: 'Active and Validated (Aadhaar / MCA Linked)', isHighlight: true }
  ];
  y = renderKeyValueTable(doc, y, panDetails, { labelWidth: 58 });

  // PAN Card Visual Representation Box
  y += 2;
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.roundedRect(40, y, 130, 38, 2.5, 2.5, 'FD');

  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('INCOME TAX DEPARTMENT • GOVT. OF INDIA', 105, y + 5.5, { align: 'center' });

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.text(bidder.pan, 105, y + 14.5, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(bidder.legalName, 105, y + 21, { align: 'center' });
  doc.text(`Incorporation Date: ${bidder.incorporationDate || '14/08/2014'}`, 105, y + 26.5, { align: 'center' });

  doc.setFontSize(5.8);
  doc.setTextColor(100, 116, 139);
  doc.text('PERMANENT ACCOUNT NUMBER CARD • OFFICIAL IDENTIFIER', 105, y + 33, { align: 'center' });

  y += 42;

  drawSealBox(doc, 15, y, 180, 28, {
    title: 'STATUTORY RECORD VERIFICATION',
    name: 'NSDL Central Tax Processing Cell',
    designation: 'Authorized Signatory / Income Tax Portal Registrar',
    organization: 'Income Tax Department, Govt of India',
    date: 'Verified on IT Portal: 02-Sep-2026',
    reference: `PAN-NSDL-${bidder.pan}`,
    stampText1: 'INCOME TAX',
    stampText2: 'PAN VALID',
    stampText3: 'GOVT INDIA'
  });

  applyHeadersAndFooters(doc, 'Permanent Account Number (PAN) Card Document', 'doc-cpcl-pan-01');
  saveDoc(doc, outputPath);
}

// ─────────────────────────────────────────────────────────────
// 5. UDYAM MSME CERTIFICATE (req-cpcl-05)
// ─────────────────────────────────────────────────────────────

function generateUdyamCertificate(bidder, outputPath) {
  const doc = createDoc();
  let y = 18;

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('MINISTRY OF MICRO, SMALL & MEDIUM ENTERPRISES', 105, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Government of India • Udyam Registration Portal • udyamregistration.gov.in', 105, y + 4.2, { align: 'center' });

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(15, y + 7.5, 195, y + 7.5);

  y = drawTitleBox(
    doc,
    y + 10.5,
    'UDYAM REGISTRATION CERTIFICATE (EMD EXEMPTION PROOF)',
    'Issued under the Micro, Small and Medium Enterprises Development Act, 2006',
    'Clause 7.1'
  );

  const udyamDetails = [
    { label: 'Udyam Registration Number', value: bidder.udyamNumber, isHighlight: true },
    { label: 'Name of Enterprise', value: bidder.udyamEnterpriseName || bidder.legalName, isHighlight: true },
    { label: 'Type of Enterprise', value: bidder.udyamType || 'Medium Enterprise', isHighlight: true },
    { label: 'Major Activity', value: 'Manufacturing (Industrial Gas Compressors & Skid Systems)' },
    { label: 'National Industry Classification (NIC 2-Digit)', value: '28 - Manufacture of machinery and equipment n.e.c.' },
    { label: 'National Industry Classification (NIC 5-Digit)', value: '28122 - Manufacture of compressors for gases', isHighlight: true },
    { label: 'Registered Enterprise Plant Location', value: bidder.address },
    { label: 'Date of Incorporation / Registration', value: bidder.udyamDate || '24/09/2020' },
    { label: 'Public Procurement Exemption Status', value: 'Eligible for Tender Fee and EMD (Rs. 29,00,000) Exemption under MSE Policy 2012', isHighlight: true }
  ];
  y = renderKeyValueTable(doc, y, udyamDetails, { labelWidth: 58 });

  drawSealBox(doc, 15, y + 2, 180, 28, {
    title: 'UDYAM VERIFICATION & STATUTORY EXEMPTION SEAL',
    name: 'Director of MSME Development & Facilitation Office',
    designation: 'General Manager, District Industries Centre',
    organization: 'Ministry of MSME, Government of India',
    date: 'Verified Active on Udyam Portal: 01-Sep-2026',
    reference: bidder.udyamNumber,
    stampText1: 'MSME UDYAM',
    stampText2: 'EMD EXEMPT',
    stampText3: 'VALIDATED'
  });

  applyHeadersAndFooters(doc, 'Udyam MSME Registration Certificate', 'doc-cpcl-udyam-01');
  saveDoc(doc, outputPath);
}

// ─────────────────────────────────────────────────────────────
// 6. OEM AUTHORIZATION FORM (MAF, req-cpcl-06)
// ─────────────────────────────────────────────────────────────

function generateOEMAuthorization(bidder, outputPath) {
  const doc = createDoc();
  let y = 18;

  // OEM Letterhead
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(bidder.oemIssuerName, 15, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text(`${bidder.oemIssuerSub} • Works: ${bidder.oemIssuerWorks}`, 15, y + 4.2);
  doc.text('Global High-Pressure Compression Systems Manufacturer • ISO 9001 / API 618 Certified', 15, y + 8);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(15, y + 10.5, 195, y + 10.5);

  y = drawTitleBox(
    doc,
    y + 13,
    'MANUFACTURER AUTHORIZATION FORM (MAF) — DIRECT OEM COMMITMENT',
    'Tender Ref: CPCL/ENG/2026/HPGC-0412 • High-Pressure Gas Compressor Manali Refinery',
    'Clause 5.1'
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  const maLines = doc.splitTextToSize(bidder.oemBodyText, 180);
  doc.text(maLines, 15, y);
  y += maLines.length * 3.8 + 3;

  const oemParams = [
    { label: 'Authorized Bidding Entity', value: bidder.oemAuthorizedParty || bidder.legalName, isHighlight: true },
    { label: 'Authorized Equipment Model', value: bidder.oemEquipmentModel, isHighlight: true },
    { label: 'Manufacturer Legal Status', value: bidder.oemManufacturerStatus, isHighlight: true },
    { label: 'Design & Engineering Standard', value: bidder.oemStandard },
    { label: 'Spare Parts Commitment Period', value: bidder.oemSparesPeriod, isHighlight: true },
    { label: 'Warranty & Factory Backing', value: bidder.oemWarrantyBacking },
    { label: 'Safety Integrity Level (SIL)', value: bidder.oemSafetySIL, isHighlight: true }
  ];
  y = renderKeyValueTable(doc, y, oemParams, { labelWidth: 56 });

  drawSealBox(doc, 15, y + 2, 180, 30, {
    title: 'OEM AUTHORIZED SIGNATORY & CORPORATE SEAL',
    name: bidder.oemSignatoryName,
    designation: bidder.oemSignatoryTitle,
    organization: bidder.oemIssuerName,
    date: '02-Sep-2026 • Munich / Pune Headquarters',
    reference: `OEM-AUTH-CPCL-${bidder.oemEquipmentModel.replace(/[^a-zA-Z0-9]/g, '')}`,
    stampText1: 'OEM DIRECT',
    stampText2: 'CERTIFIED',
    stampText3: 'GENUINE'
  });

  applyHeadersAndFooters(doc, 'Direct OEM Manufacturer Authorization (MAF)', 'doc-cpcl-oem-01');
  saveDoc(doc, outputPath);
}

// ─────────────────────────────────────────────────────────────
// 7. MAKE IN INDIA LOCAL CONTENT DECLARATION (req-cpcl-07)
// ─────────────────────────────────────────────────────────────

function generateLocalContentDeclaration(bidder, outputPath) {
  const doc = createDoc();
  let y = 18;

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(bidder.legalName, 15, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text(`${bidder.address} • CIN: ${bidder.cin}`, 15, y + 4.2);
  doc.text('STATUTORY DECLARATION UNDER PUBLIC PROCUREMENT (PREFERENCE TO MAKE IN INDIA) ORDER', 15, y + 8);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(15, y + 10.5, 195, y + 10.5);

  y = drawTitleBox(
    doc,
    y + 13,
    'MAKE IN INDIA (MII) LOCAL CONTENT STATUTORY SELF-DECLARATION',
    'Issued pursuant to DPIIT Public Procurement Order P-45021/2/2017-PP (BE-II)',
    'Clause 6.3'
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const p1 = `We, M/s ${bidder.legalName}, in connection with CPCL Tender No. CPCL/ENG/2026/HPGC-0412 for Supply, Installation and Commissioning of High-Pressure Gas Compressor System at Manali Refinery, hereby solemnly declare and certify the percentage of domestic local value addition as follows:`;
  const p1Lines = doc.splitTextToSize(p1, 180);
  doc.text(p1Lines, 15, y);
  y += p1Lines.length * 3.8 + 3;

  const miiTableHeaders = [['Cost Element Description', 'Domestic Value (INR Cr)', 'Imported Value (INR Cr)', 'Local Contribution %']];
  const miiTableRows = bidder.miiBreakdownRows;
  y = renderTable(doc, y, miiTableHeaders, miiTableRows, {
    0: { cellWidth: 64, fontStyle: 'bold' },
    1: { cellWidth: 38 },
    2: { cellWidth: 38 },
    3: { cellWidth: 40, fontStyle: 'bold' }
  });

  // Summary box
  doc.setFillColor(bidder.isMiiPassing ? 240 : 254, bidder.isMiiPassing ? 253 : 242, bidder.isMiiPassing ? 244 : 242);
  doc.setDrawColor(bidder.isMiiPassing ? 34 : 220, bidder.isMiiPassing ? 197 : 38, bidder.isMiiPassing ? 94 : 38);
  doc.roundedRect(15, y, 180, 17, 1.5, 1.5, 'FD');

  doc.setTextColor(bidder.isMiiPassing ? 22 : 185, bidder.isMiiPassing ? 101 : 28, bidder.isMiiPassing ? 52 : 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.text(
    bidder.isMiiPassing
      ? `DECLARED LOCAL CONTENT: ${bidder.localContentPercent.toFixed(1)}% (CLASS-I LOCAL SUPPLIER ≥ 50.0%)`
      : `DECLARED LOCAL CONTENT: ${bidder.localContentPercent.toFixed(1)}% (NON-COMPLIANT / FAILS MANDATORY 50.0% THRESHOLD)`,
    19,
    y + 5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  const miiSummaryText = bidder.isMiiPassing
    ? `The domestic local value addition of ${bidder.localContentPercent.toFixed(1)}% qualifies the bidder as a Class-I Local Supplier pursuant to Clause 6.3 of the tender. Local manufacturing and integration facility is located at ${bidder.address}.`
    : `The declared domestic local value addition of ${bidder.localContentPercent.toFixed(1)}% is below the mandatory 50.0% minimum threshold for Class-I Local Supplier (Deficit: -${(50.0 - bidder.localContentPercent).toFixed(1)}%). Disqualification under DPIIT MII guidelines.`;
  const miiSumLines = doc.splitTextToSize(miiSummaryText, 172);
  doc.text(miiSumLines, 19, y + 9.5);
  y += 21;

  drawSealBox(doc, 15, y, 180, 28, {
    title: 'STATUTORY LOCAL CONTENT DECLARATION SIGNATURE',
    name: bidder.signatoryName,
    designation: bidder.signatoryRole,
    organization: bidder.legalName,
    date: '04-Sep-2026 • Corporate Seal Affixed',
    reference: `MII-DECL-${bidder.localContentPercent.toFixed(0)}PCT`,
    stampText1: 'MAKE IN INDIA',
    stampText2: `${bidder.localContentPercent.toFixed(0)}% LOCAL`,
    stampText3: 'VERIFIED'
  });

  applyHeadersAndFooters(doc, 'Make in India Local Content Declaration', 'doc-cpcl-mii-01');
  saveDoc(doc, outputPath);
}

// ─────────────────────────────────────────────────────────────
// 8. NON-BLACKLISTING & INTEGRITY AFFIDAVIT (req-cpcl-08)
// ─────────────────────────────────────────────────────────────

function generateNonDebarmentDeclaration(bidder, outputPath) {
  const doc = createDoc();
  let y = 18;

  // Stamp Paper Header Graphic
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.6);
  doc.roundedRect(15, y, 180, 18, 2, 2, 'FD');

  doc.setTextColor(180, 83, 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`NON-JUDICIAL STAMP PAPER • ${bidder.stampState || 'GOVERNMENT OF TAMIL NADU'}`, 105, y + 5.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.text(`Stamp Duty Paid: Rs. 100.00 • E-Stamp Certificate No: IN-TN20268910481 • Date: 03-Sep-2026`, 105, y + 10.5, { align: 'center' });
  doc.text('ISSUED TO: ' + bidder.legalName, 105, y + 15, { align: 'center' });

  y = drawTitleBox(
    doc,
    y + 22,
    'ANNEXURE-B: SWORN AFFIDAVIT OF NON-BLACKLISTING & DEBARMENT',
    'Solemn Affirmation Before the Notary Public under Oath',
    'Clause 3.4'
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  const affidavitBody = `I, ${bidder.signatoryName}, aged about 48 years, residing at Chennai, do hereby solemnly affirm and state on oath as under:\n\n` +
    `1. That I am the ${bidder.signatoryRole} of M/s ${bidder.legalName}, having its registered office at ${bidder.address}, and I am duly authorized to depose and execute this affidavit on behalf of the company.\n\n` +
    `2. That M/s ${bidder.legalName}, its directors, partners, and key managerial personnel have NOT been blacklisted, debarred, suspended, or put on Holiday List by Chennai Petroleum Corporation Limited (CPCL), Central Vigilance Commission (CVC), Government e-Marketplace (GeM), Ministry of Petroleum & Natural Gas, or any other Central/State Government Ministry, Department, or Public Sector Undertaking (PSU) as on the date of bid submission.\n\n` +
    `3. That no criminal proceedings, CBI investigations, insolvency petitions under IBC 2016, or corporate debarment orders are pending or in force against our company or its promoters.\n\n` +
    `4. That we solemnly undertake to abide by the Integrity Pact and all anti-corruption provisions stipulated in Clause 3.4 of Tender Ref: CPCL/ENG/2026/HPGC-0412.`;

  const affLines = doc.splitTextToSize(affidavitBody, 180);
  doc.text(affLines, 15, y);
  y += affLines.length * 3.8 + 4;

  drawSealBox(doc, 15, y, 85, 32, {
    title: 'DEPONENT SIGNATURE',
    name: bidder.signatoryName,
    designation: bidder.signatoryRole,
    organization: bidder.legalName,
    date: '03-Sep-2026',
    reference: 'Affidavit Verified under Oath',
    stampText1: 'DEPONENT',
    stampText2: 'SWORN',
    stampText3: 'SIGNED'
  });

  drawSealBox(doc, 110, y, 85, 32, {
    title: 'NOTARY PUBLIC ATTESTATION',
    name: 'Advocate M. Natarajan',
    designation: 'Notary Public (Govt of Tamil Nadu)',
    organization: 'High Court Chambers, Chennai',
    date: '03-Sep-2026 • Notarial Entry 892/2026',
    reference: 'Reg No: G.O. Ms 412/Law',
    stampText1: 'NOTARY',
    stampText2: 'ATTESTED',
    stampText3: 'SEALED'
  });

  applyHeadersAndFooters(doc, 'Non-Blacklisting & Integrity Affidavit (Annexure-B)', 'doc-cpcl-aff-01');
  saveDoc(doc, outputPath);
}

// ─────────────────────────────────────────────────────────────
// 9. ISO 9001:2015 QUALITY CERTIFICATE (req-cpcl-09)
// ─────────────────────────────────────────────────────────────

function generateISOQualityCertificate(bidder, outputPath) {
  const doc = createDoc();
  let y = 18;

  // Registrar Letterhead
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('TUV RHEINLAND CERTIFICATION SERVICES', 105, y, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text('Accredited by IAF (International Accreditation Forum) & NABCB / DAkkS', 105, y + 4.2, { align: 'center' });

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(15, y + 7.5, 195, y + 7.5);

  y = drawTitleBox(
    doc,
    y + 10.5,
    'CERTIFICATE OF REGISTRATION: ISO 9001:2015 QUALITY MANAGEMENT SYSTEM',
    'Verification of Quality Assurance System for Design & Manufacture of Pressure Systems',
    'Clause 8.2'
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('This is to certify that the Quality Management System of the organization:', 15, y);
  y += 3.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(bidder.legalName, 15, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text(`Works: ${bidder.address}`, 15, y + 7.5);
  y += 11;

  // Key-Value Table with automatic text wrapping for "Certified Scope of Supply"
  const isoDetails = [
    { label: 'Quality Standard', value: 'ISO 9001:2015 (Quality Management Systems)', isHighlight: true },
    { label: 'Certified Scope of Supply', value: 'Design, engineering, manufacture, assembly, factory testing, installation, and commissioning of high-pressure reciprocating gas compression packages and skid-mounted process systems' },
    { label: 'Certificate Registration Number', value: bidder.isoCertNumber, isHighlight: true },
    { label: 'Initial Registration Date', value: bidder.isoIssueDate },
    { label: 'Current Cycle Validity Date', value: bidder.isoExpiryDate, isHighlight: true },
    { label: 'Accreditation Body', value: 'IAF MLA / DAkkS Accreditation No. D-ZM-16031-01' }
  ];
  y = renderKeyValueTable(doc, y, isoDetails, { labelWidth: 56 });

  // Status Note
  doc.setFillColor(bidder.isIsoValid ? 240 : 254, bidder.isIsoValid ? 253 : 242, bidder.isIsoValid ? 244 : 242);
  doc.setDrawColor(bidder.isIsoValid ? 34 : 220, bidder.isIsoValid ? 197 : 38, bidder.isIsoValid ? 94 : 38);
  doc.roundedRect(15, y, 180, 16, 1.5, 1.5, 'FD');

  doc.setTextColor(bidder.isIsoValid ? 22 : 185, bidder.isIsoValid ? 101 : 28, bidder.isIsoValid ? 52 : 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.text(
    bidder.isIsoValid
      ? `CERTIFICATE STATUS: ACTIVE & VALID THROUGH ${bidder.isoExpiryDate} (SATISFIES CLAUSE 8.2)`
      : `CERTIFICATE STATUS: EXPIRED ON ${bidder.isoExpiryDate} (FAILS TENDER CLOSING DATE 28-SEP-2026)`,
    19,
    y + 5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  const isoNote = bidder.isIsoValid
    ? `The ISO 9001:2015 certificate remains in full legal force and covers the complete tender execution and delivery window past 28-Sep-2026.`
    : `WARNING: The ISO 9001:2015 certificate expired on ${bidder.isoExpiryDate}, prior to the tender bid submission deadline of 28-Sep-2026. Non-conformance under Clause 8.2.`;
  doc.text(doc.splitTextToSize(isoNote, 172), 19, y + 9.5);
  y += 20;

  drawSealBox(doc, 15, y, 180, 28, {
    title: 'REGISTRAR AUTHORIZED SIGNATORY & ACCREDITATION SEAL',
    name: 'Dr. Klaus Weimann',
    designation: 'Head of Quality Certifications, TUV Certification Body',
    organization: 'TUV Rheinland Cert GmbH',
    date: `Certified per Surveillance Audit: ${bidder.isoIssueDate}`,
    reference: bidder.isoCertNumber,
    stampText1: 'ISO 9001',
    stampText2: bidder.isIsoValid ? 'VALID' : 'EXPIRED',
    stampText3: 'TUV ACCRED'
  });

  applyHeadersAndFooters(doc, 'ISO 9001:2015 Quality System Certificate', 'doc-cpcl-iso-01');
  saveDoc(doc, outputPath);
}

// ─────────────────────────────────────────────────────────────
// 10. TECHNICAL COMPLIANCE DATASHEET (API 618, req-cpcl-10)
// ─────────────────────────────────────────────────────────────

function generateTechnicalComplianceDatasheet(bidder, outputPath) {
  const doc = createDoc();

  // Page 1: API 618 Process & Compressor Parameters
  let y = 18;

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(bidder.techHeaderEntity || bidder.legalName, 15, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text('ENGINEERING TECHNICAL DATASHEET & COMPLIANCE MATRIX • TENDER REF: CPCL/ENG/2026/HPGC-0412', 15, y + 4.2);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(15, y + 7.5, 195, y + 7.5);

  y = drawTitleBox(
    doc,
    y + 10.5,
    'API 618 5TH EDITION RECIPROCATING GAS COMPRESSOR DATASHEET',
    'Design Specification: Manali Refinery High-Pressure Gas Compression System',
    'Clause 5.4'
  );

  const techHeaders = [['Engineering Parameter', 'Tender Specified Mandatory Value', 'Bidder Offered Value', 'Compliance Status']];
  const techRows = bidder.techSpecsRows;
  y = renderTable(doc, y, techHeaders, techRows, {
    0: { cellWidth: 50, fontStyle: 'bold' },
    1: { cellWidth: 50 },
    2: { cellWidth: 52 },
    3: { cellWidth: 28, fontStyle: 'bold' }
  });

  // Page 2: Safety & Auxiliary System Architecture
  doc.addPage();
  y = 18;
  y = drawTitleBox(
    doc,
    y,
    'SAFETY INTEGRITY (SIL-3) & AUXILIARY SYSTEM ENGINEERING SCHEDULE',
    'Emergency Shutdown System (ESD), Dry Gas Seals & API 614 Lubrication',
    'Clause 5.4 Schedule B'
  );

  const auxHeaders = [['Subsystem / Module', 'Engineering Design Standard', 'Offered Specification', 'Safety Compliance']];
  const auxRows = bidder.techAuxRows;
  y = renderTable(doc, y, auxHeaders, auxRows, {
    0: { cellWidth: 44, fontStyle: 'bold' },
    1: { cellWidth: 46 },
    2: { cellWidth: 58 },
    3: { cellWidth: 32, fontStyle: 'bold' }
  });

  drawSealBox(doc, 15, y + 2, 180, 28, {
    title: 'CHIEF TECHNICAL OFFICER VERIFICATION & ENGINEERING STAMP',
    name: bidder.techChiefEngineer || 'P. Ramaswamy',
    designation: 'Chief Engineer (Turbomachinery & Process Systems)',
    organization: bidder.techHeaderEntity || bidder.legalName,
    date: '04-Sep-2026 • Verified Engineering Drawings Attached',
    reference: 'TECH-API618-CONF-0412',
    stampText1: 'API 618',
    stampText2: bidder.isTechCompliant ? 'COMPLIANT' : 'DEVIATION',
    stampText3: 'ENG SEAL'
  });

  applyHeadersAndFooters(doc, 'API 618 Technical Compliance Datasheet', 'doc-cpcl-tech-01');
  saveDoc(doc, outputPath);
}

// ─────────────────────────────────────────────────────────────
// EXTRA: BIDDER 03 CONFLICTING SUBMISSION FORM
// ─────────────────────────────────────────────────────────────

function generateBidSubmissionDeclarationForm(bidder, outputPath) {
  const doc = createDoc();
  let y = 18;

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(bidder.legalName, 15, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text(`Tender Submission Portal • Proposal ID: CL-2026-77F814D2 • Tender: CPCL/ENG/2026/HPGC-0412`, 15, y + 4.2);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(15, y + 7.5, 195, y + 7.5);

  y = drawTitleBox(
    doc,
    y + 10.5,
    'FORMAL BID SUBMISSION & BIDDER QUALIFICATION DECLARATION',
    'Official Bidding Dossier Submission Form signed by Authorized Signatory',
    'General Submission'
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const intro = `To: The Chief General Manager (Contracts), Chennai Petroleum Corporation Limited.\nWe, M/s ${bidder.legalName}, hereby submit our commercial and technical proposal for Tender CPCL/ENG/2026/HPGC-0412 and solemnly declare our qualification credentials below:`;
  const inLines = doc.splitTextToSize(intro, 180);
  doc.text(inLines, 15, y);
  y += inLines.length * 3.8 + 3;

  const declGrid = [
    { label: 'Bidding Legal Entity Name', value: bidder.legalName, isHighlight: true },
    { label: 'Commercial Price Bid Value', value: 'Rs. 14.40 Crore (Fourteen Crore Forty Lakhs Only)' },
    { label: 'Declared 3-Year Average Annual Turnover', value: 'Rs. 16.50 Crore (Declared in Bid Form)', isHighlight: true },
    { label: 'Declared Relevant Operational Experience', value: '7.5 Years in Gas Compression', isHighlight: true },
    { label: 'Declared Permanent Account Number (PAN)', value: bidder.pan },
    { label: 'Declared GST Identification Number (GSTIN)', value: bidder.gstin },
    { label: 'Declared Make in India Local Content', value: '65.0% Class-I Local Content' },
    { label: 'Bid Validity Commitment', value: '180 Days from Bid Submission Deadline' }
  ];
  y = renderKeyValueTable(doc, y, declGrid, { labelWidth: 58 });

  // Prominent discrepancy note for demonstration
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(220, 38, 38);
  doc.roundedRect(15, y, 180, 16, 1.5, 1.5, 'FD');

  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('INTENTIONAL CONTRADICTION BENCHMARK POINT FOR CLAUSENTIS ENGINE:', 19, y + 4.8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.text('Section 4 of this form claims Average Annual Turnover of Rs. 16.50 Crore and 7.5 Years experience.', 19, y + 8.8);
  doc.text('This directly conflicts with Financial_Statement.pdf (Audited Rs. 11.20 Cr) and Experience_Certificate.pdf (4.1 Years).', 19, y + 12.5);
  y += 20;

  drawSealBox(doc, 15, y, 180, 26, {
    title: 'AUTHORIZED BIDDER SIGNATORY',
    name: bidder.signatoryName,
    designation: bidder.signatoryRole,
    organization: bidder.legalName,
    date: '08-Sep-2026 • Sealed Bid Submission Vault',
    reference: 'PROPOSAL-CL-2026-77F814D2',
    stampText1: 'BIDDER VAULT',
    stampText2: 'SUBMITTED',
    stampText3: 'SEALED'
  });

  applyHeadersAndFooters(doc, 'Bid Submission Qualification Form', 'doc-cpcl-form-01');
  saveDoc(doc, outputPath);
}

// ─────────────────────────────────────────────────────────────
// EXTRA: BIDDER 03 CONFLICTING COST AUDITOR BREAKDOWN
// ─────────────────────────────────────────────────────────────

function generateCostAuditorBreakdown(bidder, outputPath) {
  const doc = createDoc();
  let y = 18;

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('M/S H. N. SHAH & ASSOCIATES', 15, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text('Practicing Cost Accountants • ICMAI Membership No: 18492 • Firm Reg No: 004129', 15, y + 4.2);
  doc.text('Commercial Tax & Statutory Local Content Audit Cell • Vadodara, Gujarat', 15, y + 8);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(15, y + 10.5, 195, y + 10.5);

  y = drawTitleBox(
    doc,
    y + 13,
    'STATUTORY COST AUDITOR CERTIFICATE ON DOMESTIC VALUE ADDITION',
    'Independent Audit of Domestic Content pursuant to DPIIT Public Procurement Order',
    'MII Verification'
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const body = `We have conducted a statutory cost audit of the bill of materials, manufacturing cost ledger, imported component invoices, and direct labor records of M/s ${bidder.legalName} for the High-Pressure Gas Compressor Package proposed under CPCL Tender CPCL/ENG/2026/HPGC-0412. Our audit calculation establishes the actual domestic value addition as follows:`;
  const bLines = doc.splitTextToSize(body, 180);
  doc.text(bLines, 15, y);
  y += bLines.length * 3.8 + 3;

  const costHeaders = [['Component / Cost Element', 'Total Cost (INR Cr)', 'Imported Element (INR Cr)', 'Domestic Value (INR Cr)']];
  const costRows = [
    ['Compressor Bare Block & Cylinders', 'Rs. 4.80 Cr', 'Rs. 3.60 Cr (Imported Castings)', 'Rs. 1.20 Cr'],
    ['1,850 kW Motor Drive Package', 'Rs. 3.20 Cr', 'Rs. 1.80 Cr (Imported Stator)', 'Rs. 1.40 Cr'],
    ['SIL-3 ESD Safety Logic & PLC Control', 'Rs. 2.10 Cr', 'Rs. 1.50 Cr (Imported Processor)', 'Rs. 0.60 Cr'],
    ['Structural Skid & Mechanical Assembly', 'Rs. 1.90 Cr', 'Rs. 0.20 Cr', 'Rs. 1.70 Cr'],
    ['Engineering, Testing & Commissioning', 'Rs. 2.40 Cr', 'Rs. 0.60 Cr', 'Rs. 1.80 Cr'],
    ['TOTAL PRODUCTION & SUPPLY COST', 'Rs. 14.40 Cr', 'Rs. 7.70 Cr', 'Rs. 6.70 Cr (Domestic)']
  ];
  y = renderTable(doc, y, costHeaders, costRows, {
    0: { cellWidth: 64, fontStyle: 'bold' },
    1: { cellWidth: 38 },
    2: { cellWidth: 40 },
    3: { cellWidth: 38, fontStyle: 'bold' }
  });

  // Discrepancy Callout
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(220, 38, 38);
  doc.roundedRect(15, y, 180, 17, 1.5, 1.5, 'FD');

  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.text('AUDITED LOCAL CONTENT CALCULATION: 46.5% DOMESTIC VALUE ADDITION', 19, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  const confText = 'Formula: (Rs. 6.70 Cr Domestic Value / Rs. 14.40 Cr Total Value) * 100 = 46.5% Local Content.\n' +
    'CONTRADICTION FLAG: The bidder self-declaration claims 65.0%, but the statutory cost audit computes only 46.5%, which is below the mandatory 50.0% threshold!';
  doc.text(doc.splitTextToSize(confText, 172), 19, y + 9.5);
  y += 21;

  drawSealBox(doc, 15, y, 180, 28, {
    title: 'STATUTORY COST AUDITOR CERTIFICATION',
    name: 'H. N. Shah',
    designation: 'Fellow Cost Accountant (FCMA)',
    organization: 'M/s H. N. Shah & Associates, Cost Accountants',
    date: '06-Sep-2026 • Vadodara',
    reference: 'UDIN-COST-261849200412',
    stampText1: 'COST AUDIT',
    stampText2: '46.5% MII',
    stampText3: 'VERIFIED'
  });

  applyHeadersAndFooters(doc, 'Cost Auditor Local Content Verification', 'doc-cpcl-cost-01');
  saveDoc(doc, outputPath);
}

// ─────────────────────────────────────────────────────────────
// Master Dataset for the 3 Canonical Bidders
// ─────────────────────────────────────────────────────────────

const BIDDER_01 = {
  id: 'bidder_01_compliant',
  legalName: 'Apex Heavy Engineering Pvt Ltd',
  tradeName: 'Apex Heavy Engineering',
  constitution: 'Private Limited Company',
  cin: 'U28910TN2014PTC099418',
  gstin: '33AABCA1234F1Z8',
  pan: 'AABCA1234F',
  incorporationDate: '14/08/2014',
  address: 'Plot 41-B, Ambattur Industrial Estate, Chennai, Tamil Nadu 600058',
  signatoryName: 'K. Srinivasan',
  signatoryRole: 'Director (Commercial & Contracts)',
  stampState: 'GOVERNMENT OF TAMIL NADU',

  // Financials (Pass: Rs. 14.80 Cr avg > Rs. 10.00 Cr)
  isTurnoverPassing: true,
  turnoverFY24: 13.80,
  turnoverFY25: 14.60,
  turnoverFY26: 16.00,
  turnoverAvg: 14.80,
  netWorthFY24: 7.20,
  netWorthFY25: 7.90,
  netWorthFY26: 8.50,
  netWorthAvg: 8.50,
  udin: '26098192AAAA0192',
  auditorFirm: 'M/s S. Ramanathan & Co.',
  auditorPartner: 'S. Ramanathan, FCA (M. No. 098192)',
  auditorAddress: 'New No. 18, Cathedral Garden Road, Nungambakkam, Chennai 600034',
  auditorDomain: 'sramanathanca.com',

  // Experience (Pass: 8.0 years > 5.0 years)
  isExperiencePassing: true,
  totalExpYears: '8.0',
  expClient1Order: 'IOCL/PR/2020/COMP-140/PO-4109',
  expClient1Scope: 'Supply, Testing and Commissioning of 140 bar(g) Reciprocating Gas Compressor Package',
  expClient1Pressure: '140.0 bar(g) Operating Discharge Pressure (API 618 Standard)',
  expClient1Value: 'Rs. 11.50 Crore',
  expClient1Award: '15-Jan-2020',
  expClient1Commissioning: '22-Mar-2021 (Continuous service)',
  expClient1Years: '5.5 Consecutive Years Operational Standing at Panipat Refinery',
  expClient1Availability: '99.4% Availability Factor (Trouble-free service)',
  expProjectsList: [
    ['IOCL Panipat Refinery', '140 bar(g) Skid-mounted Gas Compressor Package', '140 bar(g)', 'Mar 2021', '5.5 Years'],
    ['BPCL Kochi Refinery', '130 bar(g) Hydrogen Gas Booster Compressor', '130 bar(g)', 'Jan 2023', '3.6 Years'],
    ['GAIL Vijaipur Plant', '125 bar(g) Fuel Gas Compression Package', '125 bar(g)', 'Nov 2024', '1.8 Years'],
    ['Total Operational Standing', 'Cumulative uninterrupted refinery field standing', '≥ 120 bar(g)', '2021-2026', '8.0 Years']
  ],

  // Udyam MSME (Pass)
  udyamNumber: 'UDYAM-TN-02-0049182',
  udyamEnterpriseName: 'Apex Heavy Engineering Pvt Ltd',
  udyamType: 'Medium Enterprise (Manufacturing)',
  udyamDate: '24/09/2020',

  // OEM Authorization (Pass)
  oemIssuerName: 'Bauer Gas Systems GmbH / Bauer India Compression Pvt Ltd',
  oemIssuerSub: 'Original Equipment Manufacturer of Heavy Reciprocating Gas Compressors',
  oemIssuerWorks: 'Talegaon Industrial Park, Pune 410507 / Munich, Germany',
  oemAuthorizedParty: 'Apex Heavy Engineering Pvt Ltd',
  oemEquipmentModel: 'Model GC-1200 Heavy-Duty Reciprocating System',
  oemManufacturerStatus: 'Direct OEM Certified Manufacturer (100% Backing)',
  oemStandard: 'API 618 5th Edition Reciprocating Compressor Standards',
  oemSparesPeriod: '10-Year Genuine Spare Parts Guaranteed Availability',
  oemWarrantyBacking: '24 Months Operational / 36 Months Dispatch Full Warranty',
  oemSafetySIL: 'SIL-3 Certified Fail-Safe Emergency Shutdown System',
  oemSignatoryName: 'Dipl.-Ing. Markus Weber',
  oemSignatoryTitle: 'Vice President (Global Heavy Compression Systems)',
  oemBodyText: 'We, Bauer Gas Systems GmbH, having our primary engineering works in Munich, Germany and manufacturing facilities at Pune, India, who are established and reputable manufacturers of API 618 High-Pressure Gas Compressors, do hereby authorize M/s Apex Heavy Engineering Pvt Ltd to submit a bid, negotiate and conclude the contract with CPCL for Tender CPCL/ENG/2026/HPGC-0412. We guarantee direct OEM technical backing, genuine spare parts for 10 years, and SIL-3 safety instrumentation.',

  // Make in India (Pass: 68.0% > 50.0%)
  isMiiPassing: true,
  localContentPercent: 68.0,
  miiBreakdownRows: [
    ['Domestic Skid Fabrication & Piping', 'Rs. 2.80 Cr', 'Rs. 0.30 Cr', '90.3% Local'],
    ['Compressor Cylinders & Interstage Vessels', 'Rs. 3.40 Cr', 'Rs. 1.10 Cr', '75.5% Local'],
    ['Electric Motor Drive Package (1,850 kW)', 'Rs. 2.10 Cr', 'Rs. 0.90 Cr', '70.0% Local'],
    ['Control System & SIL-3 Instrumentation', 'Rs. 1.10 Cr', 'Rs. 0.80 Cr', '57.9% Local'],
    ['Engineering, Testing & Commissioning', 'Rs. 1.80 Cr', 'Rs. 0.20 Cr', '90.0% Local'],
    ['Total Project Value Addition (Class-I)', 'Rs. 11.20 Cr', 'Rs. 3.30 Cr', '68.0% Local Content']
  ],

  // ISO 9001 (Pass: Valid till 30-Nov-2027 > 28-Sep-2026)
  isIsoValid: true,
  isoCertNumber: 'ISO-9001-2024-AHE-9921',
  isoIssueDate: '01-Dec-2024',
  isoExpiryDate: '30-Nov-2027',

  // Technical Datasheet (Pass: 120 bar(g), SIL-3)
  isTechCompliant: true,
  techSpecsRows: [
    ['Compressor Type & Configuration', 'API 618 Balanced-Opposed Reciprocating', 'API 618 5th Ed 2-Stage Balanced Opposed', 'COMPLIANT'],
    ['Operating Discharge Pressure', 'Minimum 120.0 bar(g) continuous', '120.0 bar(g) rated (140.0 bar(g) MAWP)', 'COMPLIANT'],
    ['Suction Operating Pressure', '18.5 bar(g) nominal refinery gas feed', '18.5 bar(g) sweet natural gas mix', 'COMPLIANT'],
    ['Driver Motor Rating & Classification', 'Minimum 1,800 kW, Flameproof Ex d IIB+H2', '1,850 kW, 6.6 kV, Ex d IIB+H2 T4', 'COMPLIANT'],
    ['Dry Gas Seal Barrier Arrangement', 'Dual pressurized nitrogen buffer seal', 'Dual pressurized nitrogen barrier (API 682)', 'COMPLIANT'],
    ['Vibration Monitoring System', 'Eddy current proximity probes per API 670', 'API 670 Bently Nevada Proximitor Probes', 'COMPLIANT']
  ],
  techAuxRows: [
    ['Emergency Shutdown System (ESD)', 'IEC 61508 / 61511 Standards', 'SIL-3 Certified 2oo3 Triple Modular Redundant PLC', 'FULL CONFORMANCE'],
    ['Forced-feed Lube Oil System', 'API 614 Standard Package', 'Dual 100% pumps, duplex filters, SS coolers', 'FULL CONFORMANCE'],
    ['Pulsation Suppression Dampeners', 'API 618 Design Approach 3', 'Suction & discharge pulsation bottles per DA-3', 'FULL CONFORMANCE'],
    ['Skid Structural Engineering', 'Rigid structural baseplate', 'Heavy duty structural steel with drip lip', 'FULL CONFORMANCE']
  ]
};

const BIDDER_02 = {
  id: 'bidder_02_non_compliant',
  legalName: 'Vanguard Compression Systems Ltd',
  tradeName: 'Vanguard Compression',
  constitution: 'Public Limited Company',
  cin: 'L27100DL2015PLC029841',
  gstin: '07AABCV5678K1Z3',
  pan: 'AABCV5678K',
  incorporationDate: '22/03/2015',
  address: 'Plot 88, Okhla Industrial Area Phase-III, New Delhi 110020',
  signatoryName: 'Rajesh Malhotra',
  signatoryRole: 'General Manager (Business Development)',
  stampState: 'GOVERNMENT OF NCT OF DELHI',

  // Financials (FAIL: Rs. 7.85 Cr avg < Rs. 10.00 Cr)
  isTurnoverPassing: false,
  turnoverFY24: 7.20,
  turnoverFY25: 7.90,
  turnoverFY26: 8.45,
  turnoverAvg: 7.85,
  netWorthFY24: 2.80,
  netWorthFY25: 3.00,
  netWorthFY26: 3.20,
  netWorthAvg: 3.20,
  udin: '26074129BB0819',
  auditorFirm: 'M/s V. K. Gupta & Associates',
  auditorPartner: 'V. K. Gupta, FCA (M. No. 074129)',
  auditorAddress: '402, Prakashdeep Building, Tolstoy Marg, New Delhi 110001',
  auditorDomain: 'vkguptaca.com',

  // Experience (FAIL: 3.2 years < 5.0 years, and low discharge 75 bar(g))
  isExperiencePassing: false,
  totalExpYears: '3.2',
  expClient1Order: 'NRL/ENG/2023/BLW-081/PO-109',
  expClient1Scope: 'Supply and Commissioning of Low-Pressure Gas Blower Package',
  expClient1Pressure: '75.0 bar(g) Operating Pressure (Below required 120 bar(g))',
  expClient1Value: 'Rs. 4.20 Crore',
  expClient1Award: '10-Jun-2023',
  expClient1Commissioning: '15-Aug-2024',
  expClient1Years: '2.1 Years Standing at Numaligarh Refinery',
  expClient1Availability: '94.2% Availability Factor (Frequent tripping recorded)',
  expProjectsList: [
    ['Numaligarh Refinery Ltd', 'Low-pressure Gas Blower Package', '75 bar(g)', 'Aug 2024', '2.1 Years'],
    ['MRPL Mangalore', 'Air Separation Booster Blower', '45 bar(g)', 'Feb 2025', '1.1 Years'],
    ['Total Operational Standing', 'Cumulative operational experience in low-pressure units', '< 120 bar(g)', '2023-2026', '3.2 Years']
  ],

  // Udyam MSME (Valid)
  udyamNumber: 'UDYAM-DL-01-0078129',
  udyamEnterpriseName: 'Vanguard Compression Systems Ltd',
  udyamType: 'Medium Enterprise',
  udyamDate: '15/11/2020',

  // OEM Authorization (FAIL: Issued by third-party distributor XYZ Pumps & Valves Corp)
  oemIssuerName: 'XYZ Pumps & Valves Trading Corp',
  oemIssuerSub: 'Authorized Commercial Reseller & Industrial Equipment Stockist',
  oemIssuerWorks: 'Nehru Place Commercial Center, New Delhi 110019',
  oemAuthorizedParty: 'Vanguard Compression Systems Ltd',
  oemEquipmentModel: 'Model CP-800 Commercial Duty Blower / Pump',
  oemManufacturerStatus: 'Third-Party Reseller (NOT AN ORIGINAL EQUIPMENT MANUFACTURER)',
  oemStandard: 'Commercial Industrial Standard (Non-API 618)',
  oemSparesPeriod: 'Standard 2-Year Spares Support (Fails mandatory 10-Year requirement)',
  oemWarrantyBacking: '12 Months Limited Reseller Warranty',
  oemSafetySIL: 'Non-SIL Standard Relay Logic',
  oemSignatoryName: 'P. K. Verma',
  oemSignatoryTitle: 'Managing Partner (Sales & Distribution)',
  oemBodyText: 'We, XYZ Pumps & Valves Trading Corp, being authorized stockists and resellers, hereby authorize M/s Vanguard Compression Systems Ltd to quote our equipment for CPCL Tender CPCL/ENG/2026/HPGC-0412. (NOTE: This authorization is issued by a generic trading company rather than the reciprocating compressor OEM, failing Clause 5.1).',

  // Make in India (FAIL: 38.0% < 50.0%)
  isMiiPassing: false,
  localContentPercent: 38.0,
  miiBreakdownRows: [
    ['Domestic Base Frame Assembly', 'Rs. 1.10 Cr', 'Rs. 0.40 Cr', '73.3% Local'],
    ['Imported Compressor Block & Valves', 'Rs. 0.90 Cr', 'Rs. 4.20 Cr', '17.6% Local'],
    ['Imported Drive Motor & Electronics', 'Rs. 0.80 Cr', 'Rs. 2.10 Cr', '27.6% Local'],
    ['Local Wiring & Painting', 'Rs. 0.90 Cr', 'Rs. 0.10 Cr', '90.0% Local'],
    ['Commissioning & Transport Support', 'Rs. 1.10 Cr', 'Rs. 0.20 Cr', '84.6% Local'],
    ['Total Value Addition (Non-Local Class-II)', 'Rs. 4.80 Cr', 'Rs. 7.00 Cr', '38.0% Local Content']
  ],

  // ISO 9001 (FAIL: Expired on 15-Apr-2026 before tender closing 28-Sep-2026)
  isIsoValid: false,
  isoCertNumber: 'ISO-9001-2023-VCS-4410',
  isoIssueDate: '16-Apr-2023',
  isoExpiryDate: '15-Apr-2026',

  // Technical Datasheet (FAIL: 90 bar(g) < 120 bar(g), Non-SIL)
  isTechCompliant: false,
  techSpecsRows: [
    ['Compressor Type & Configuration', 'API 618 Balanced-Opposed Reciprocating', 'Standard Industrial Commercial Compressor', 'NON-COMPLIANT'],
    ['Operating Discharge Pressure', 'Minimum 120.0 bar(g) continuous', '90.0 bar(g) Maximum Discharge (Deficit)', 'FAIL - DEFICIT'],
    ['Suction Operating Pressure', '18.5 bar(g) nominal refinery gas feed', '18.5 bar(g) rating', 'COMPLIANT'],
    ['Driver Motor Rating & Classification', 'Minimum 1,800 kW, Flameproof Ex d IIB+H2', '1,400 kW, Non-Flameproof Enclosure', 'NON-COMPLIANT'],
    ['Dry Gas Seal Barrier Arrangement', 'Dual pressurized nitrogen buffer seal', 'Single Mechanical Wet Seal System', 'NON-COMPLIANT'],
    ['Vibration Monitoring System', 'Eddy current proximity probes per API 670', 'Standard Piezoelectric Accelerometers', 'NON-COMPLIANT']
  ],
  techAuxRows: [
    ['Emergency Shutdown System (ESD)', 'IEC 61508 / 61511 SIL-3 Certification', 'Standard Relay Control Logic (Non-SIL)', 'FAILED REQUIREMENT'],
    ['Lube Oil System', 'API 614 Package Standards', 'Single pump commercial lubrication pack', 'NON-CONFORMANCE'],
    ['Pulsation Suppression Dampeners', 'API 618 Design Approach 3', 'Standard surge volume vessels', 'DEVIATION RECORDED'],
    ['Skid Structural Engineering', 'Heavy duty structural steel baseplate', 'Lightweight channel frame', 'DEVIATION RECORDED']
  ]
};

const BIDDER_03 = {
  id: 'bidder_03_contradictory',
  legalName: 'Trident Energy Equipment Pvt Ltd',
  tradeName: 'Trident Energy Equipment',
  constitution: 'Private Limited Company',
  cin: 'U28100GJ2016PTC089124',
  gstin: '24AAACT1111M1Z6', // Note GSTIN digits 3-12 are AAACT1111M
  pan: 'AAACT9999M', // Intentionally conflicts with GSTIN digits AAACT1111M!
  incorporationDate: '10/05/2016',
  address: 'Survey No. 412, Makarpura GIDC Industrial Estate, Vadodara, Gujarat 390010',
  signatoryName: 'Sanjay M. Patel',
  signatoryRole: 'Managing Director',
  stampState: 'GOVERNMENT OF GUJARAT',

  // Conflicting Name in Udyam
  udyamEnterpriseName: 'Trident Heavy Engineering Works', // Conflict: Proprietary/Firm name vs Pvt Ltd!
  udyamNumber: 'UDYAM-GJ-03-0012984',
  udyamType: 'Small Enterprise',
  udyamDate: '18/08/2020',

  // Conflicting Name in Tech Datasheet
  techHeaderEntity: 'Trident Compressor Technologies Ltd', // Third conflicting name!

  // Financials (Audited: Rs. 11.20 Cr avg vs Declared in Bid Form: Rs. 16.50 Cr!)
  isTurnoverPassing: true,
  turnoverFY24: 10.80,
  turnoverFY25: 11.10,
  turnoverFY26: 11.70,
  turnoverAvg: 11.20, // Balance sheet says Rs. 11.20 Cr, but Bid Submission Form claims Rs. 16.50 Cr!
  netWorthFY24: 4.80,
  netWorthFY25: 5.20,
  netWorthFY26: 5.60,
  netWorthAvg: 5.60,
  udin: '26048192CC0412',
  auditorFirm: 'M/s K. C. Mehta & Co.',
  auditorPartner: 'K. C. Mehta, FCA (M. No. 048192)',
  auditorAddress: 'Meghdhanush, Race Course Circle, Vadodara 390007',
  auditorDomain: 'kcmehtaca.com',

  // Experience (Certificate says 4.1 years vs Bid Form claims 7.5 years!)
  isExperiencePassing: true,
  totalExpYears: '4.1', // Completion cert confirms 4.1 years standing
  expClient1Order: 'ONGC/HZR/2022/COMP-120/PO-881',
  expClient1Scope: 'Supply and Commissioning of 120 bar(g) Gas Compressor Package at Hazira Plant',
  expClient1Pressure: '120.0 bar(g) Operating Discharge Pressure',
  expClient1Value: 'Rs. 12.10 Crore',
  expClient1Award: '12-Jul-2021',
  expClient1Commissioning: '28-Aug-2023 (4.1 Years standing from initial award)',
  expClient1Years: '4.1 Consecutive Years Standing at ONGC Hazira Plant',
  expClient1Availability: '98.5% Availability Factor',
  expProjectsList: [
    ['ONGC Hazira Gas Processing', '120 bar(g) Gas Compressor Skid Package', '120 bar(g)', 'Aug 2023', '4.1 Years'],
    ['Total Operational Standing', 'Standing verified from actual completion certificate', '≥ 120 bar(g)', '2023-2026', '4.1 Years (Claimed 7.5 Yrs)']
  ],

  // OEM Authorization (Model GC-1000 vs required GC-1200)
  oemIssuerName: 'Siemens Energy / Dresser-Rand Compression',
  oemIssuerSub: 'Industrial Turbomachinery & Reciprocating Compressor Systems',
  oemIssuerWorks: 'Naroda Industrial Estate, Ahmedabad 382330',
  oemAuthorizedParty: 'Trident Energy Equipment Pvt Ltd',
  oemEquipmentModel: 'Model GC-1000 Reciprocating Unit (Discrepancy with required GC-1200)',
  oemManufacturerStatus: 'OEM Channel Partner (Pending Renewal Agreement)',
  oemStandard: 'API 618 5th Edition Standards',
  oemSparesPeriod: '5-Year Spares Commitment (Subject to Channel Partner renewal)',
  oemWarrantyBacking: '18 Months Operational Warranty',
  oemSafetySIL: 'SIL-3 Instrumentation Provision',
  oemSignatoryName: 'H. S. Mehta',
  oemSignatoryTitle: 'General Manager (Channel Partners & Licensing)',
  oemBodyText: 'We, Siemens Energy / Dresser-Rand, authorize M/s Trident Energy Equipment Pvt Ltd to bid our Model GC-1000 system for CPCL Tender CPCL/ENG/2026/HPGC-0412. Note: Channel partnership agreement is currently under annual renewal negotiation.',

  // Make in India (Self-declaration claims 65.0% vs Cost Auditor certificate computes 46.5%!)
  isMiiPassing: true,
  localContentPercent: 65.0, // Self-declaration claims 65.0%
  miiBreakdownRows: [
    ['Structural Skid Fabrication (Domestic)', 'Rs. 3.10 Cr', 'Rs. 0.50 Cr', '86.1% Local'],
    ['Compressor Core & Cylinders', 'Rs. 3.40 Cr', 'Rs. 1.80 Cr', '65.4% Local'],
    ['Drive Motor & Auxiliaries', 'Rs. 2.10 Cr', 'Rs. 1.10 Cr', '65.6% Local'],
    ['Instrumentation & Electrical Panel', 'Rs. 1.40 Cr', 'Rs. 1.10 Cr', '56.0% Local'],
    ['Domestic Testing & Commissioning', 'Rs. 1.60 Cr', 'Rs. 0.30 Cr', '84.2% Local'],
    ['Total Self-Declared Local Content (Class-I)', 'Rs. 11.60 Cr', 'Rs. 4.80 Cr', '65.0% (Audited: 46.5%)']
  ],

  // ISO 9001 (Valid till 15-Oct-2026 - Impending Expiry warning!)
  isIsoValid: true,
  isoCertNumber: 'ISO-9001-2023-TEE-8192',
  isoIssueDate: '16-Oct-2023',
  isoExpiryDate: '15-Oct-2026', // Valid at submission (28-Sep-2026), but expires 17 days later!

  // Technical Datasheet
  isTechCompliant: true,
  techSpecsRows: [
    ['Compressor Type & Configuration', 'API 618 Balanced-Opposed Reciprocating', 'API 618 5th Ed 2-Crank Balanced Opposed', 'COMPLIANT'],
    ['Operating Discharge Pressure', 'Minimum 120.0 bar(g) continuous', '120.0 bar(g) rated discharge', 'COMPLIANT'],
    ['Suction Operating Pressure', '18.5 bar(g) nominal refinery gas feed', '18.5 bar(g) suction rating', 'COMPLIANT'],
    ['Driver Motor Rating & Classification', 'Minimum 1,800 kW, Flameproof Ex d IIB+H2', '1,850 kW, 6.6 kV, Ex d IIB+H2 T4', 'COMPLIANT'],
    ['Dry Gas Seal Barrier Arrangement', 'Dual pressurized nitrogen buffer seal', 'Dual nitrogen buffer barrier seal', 'COMPLIANT'],
    ['Vibration Monitoring System', 'Eddy current proximity probes per API 670', 'API 670 Vibration & Rod Drop Probes', 'COMPLIANT']
  ],
  techAuxRows: [
    ['Emergency Shutdown System (ESD)', 'IEC 61508 / 61511 SIL-3 Certification', 'SIL-3 Certified PLC logic package', 'CONCORDANT'],
    ['Lube Oil System', 'API 614 Package Standards', 'Forced-feed dual pump lubrication system', 'CONCORDANT'],
    ['Pulsation Suppression Dampeners', 'API 618 Design Approach 3', 'Acoustic pulsation bottles per API 618 DA-3', 'CONCORDANT'],
    ['Skid Structural Baseplate', 'Rigid structural baseplate', 'Heavy duty structural steel skid frame', 'CONCORDANT']
  ]
};

// ─────────────────────────────────────────────────────────────
// Execution Runner
// ─────────────────────────────────────────────────────────────

console.log('===============================================================');
console.log('CLAUSENTIS SYNTHETIC BIDDER PACKAGES GENERATOR (V2 ENGINE)');
console.log('Generating high-contrast, auto-wrapped, boundary-safe PDFs');
console.log('===============================================================\n');

// 1. Generate Bidder 01 (Compliant) — 10 documents
console.log('--- Generating Bidder 01 (Compliant): Apex Heavy Engineering ---');
generateFinancialStatement(BIDDER_01, path.join(DIR_B01, 'Financial_Statement.pdf'));
generateExperienceCertificate(BIDDER_01, path.join(DIR_B01, 'Experience_Certificate.pdf'));
generateGSTCertificate(BIDDER_01, path.join(DIR_B01, 'GST_Certificate.pdf'));
generatePANDocument(BIDDER_01, path.join(DIR_B01, 'PAN_Document.pdf'));
generateUdyamCertificate(BIDDER_01, path.join(DIR_B01, 'Udyam_Certificate.pdf'));
generateOEMAuthorization(BIDDER_01, path.join(DIR_B01, 'OEM_Authorization.pdf'));
generateLocalContentDeclaration(BIDDER_01, path.join(DIR_B01, 'Local_Content_Declaration.pdf'));
generateNonDebarmentDeclaration(BIDDER_01, path.join(DIR_B01, 'Non_Debarment_Declaration.pdf'));
generateISOQualityCertificate(BIDDER_01, path.join(DIR_B01, 'ISO_Quality_Certificate.pdf'));
generateTechnicalComplianceDatasheet(BIDDER_01, path.join(DIR_B01, 'Technical_Compliance_Datasheet.pdf'));

// 2. Generate Bidder 02 (Non-Compliant) — 9 documents (Non_Debarment_Declaration is intentionally MISSING)
console.log('\n--- Generating Bidder 02 (Non-Compliant): Vanguard Compression Systems ---');
generateFinancialStatement(BIDDER_02, path.join(DIR_B02, 'Financial_Statement.pdf'));
generateExperienceCertificate(BIDDER_02, path.join(DIR_B02, 'Experience_Certificate.pdf'));
generateGSTCertificate(BIDDER_02, path.join(DIR_B02, 'GST_Certificate.pdf'));
generatePANDocument(BIDDER_02, path.join(DIR_B02, 'PAN_Document.pdf'));
generateUdyamCertificate(BIDDER_02, path.join(DIR_B02, 'Udyam_Certificate.pdf'));
generateOEMAuthorization(BIDDER_02, path.join(DIR_B02, 'OEM_Authorization.pdf'));
generateLocalContentDeclaration(BIDDER_02, path.join(DIR_B02, 'Local_Content_Declaration.pdf'));
// Note: Non_Debarment_Declaration.pdf is intentionally OMITTED to create the MISSING mandatory requirement condition!
generateISOQualityCertificate(BIDDER_02, path.join(DIR_B02, 'ISO_Quality_Certificate.pdf'));
generateTechnicalComplianceDatasheet(BIDDER_02, path.join(DIR_B02, 'Technical_Compliance_Datasheet.pdf'));

// 3. Generate Bidder 03 (Contradictory) — 12 documents (including 2 explicit conflicting documents)
console.log('\n--- Generating Bidder 03 (Contradictory): Trident Energy Equipment ---');
generateFinancialStatement(BIDDER_03, path.join(DIR_B03, 'Financial_Statement.pdf'));
generateBidSubmissionDeclarationForm(BIDDER_03, path.join(DIR_B03, 'Bid_Submission_Declaration_Form.pdf'));
generateExperienceCertificate(BIDDER_03, path.join(DIR_B03, 'Experience_Certificate.pdf'));
generateGSTCertificate(BIDDER_03, path.join(DIR_B03, 'GST_Certificate.pdf'));
generatePANDocument(BIDDER_03, path.join(DIR_B03, 'PAN_Document.pdf'));
generateUdyamCertificate(BIDDER_03, path.join(DIR_B03, 'Udyam_Certificate.pdf'));
generateOEMAuthorization(BIDDER_03, path.join(DIR_B03, 'OEM_Authorization.pdf'));
generateLocalContentDeclaration(BIDDER_03, path.join(DIR_B03, 'Local_Content_Declaration.pdf'));
generateCostAuditorBreakdown(BIDDER_03, path.join(DIR_B03, 'Cost_Auditor_Local_Content_Breakdown.pdf'));
generateNonDebarmentDeclaration(BIDDER_03, path.join(DIR_B03, 'Non_Debarment_Declaration.pdf'));
generateISOQualityCertificate(BIDDER_03, path.join(DIR_B03, 'ISO_Quality_Certificate.pdf'));
generateTechnicalComplianceDatasheet(BIDDER_03, path.join(DIR_B03, 'Technical_Compliance_Datasheet.pdf'));

console.log('\n===============================================================');
console.log('ALL SYNTHETIC BIDDER PACKAGES SUCCESSFULLY REGENERATED IN: bidders/');
console.log('Total PDF files: 31 documents across 3 bidder scenarios.');
console.log('===============================================================\n');
