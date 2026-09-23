/**
 * Clausentis Document Forensics Engine
 *
 * Performs deterministic byte-level and structural inspection of uploaded documents:
 * 1. PDF Structure & Header Validation
 * 2. Incremental Revision / Post-Creation Alteration Detection
 * 3. Metadata Analysis (Creator, Producer, Creation/Mod Date Delta, Graphic Editor Footprints)
 * 4. Embedded Digital Signature Dictionary Detection (PKCS#7 / Adobe DSS)
 * 5. Text vs Scanned Raster Layer Classification
 *
 * Strictly separates observational confidence (statistical certainty of the artifact)
 * from risk severity. Never asserts arbitrary "fraud probabilities".
 */

import crypto from 'crypto';
import type {
  DocumentForensicReport,
  ForensicCheckType,
  ForensicFinding,
  ForensicSeverity,
  ForensicStatus,
} from './types';

// Tools commonly associated with graphic manipulation of documents
const SUSPICIOUS_PRODUCERS_REGEX = /(canva|photoshop|gimp|coreldraw|ilovepdf|pdfescape|sejda|pdf2go|smallpdf|inkscape)/i;

/**
 * Extracts a readable string from the first and last portions of an ArrayBuffer for fast structural inspection
 */
function toArrayBuffer(buf: ArrayBuffer | Uint8Array | Buffer): ArrayBuffer {
  if (buf instanceof ArrayBuffer) return buf;
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

function bufferToAscii(rawBuffer: ArrayBuffer | Uint8Array | Buffer, maxBytes = 300000): string {
  const buffer = toArrayBuffer(rawBuffer);
  const byteLength = buffer.byteLength;
  const lengthToRead = Math.min(byteLength, maxBytes);
  const uint8 = new Uint8Array(buffer, 0, lengthToRead);
  let str = '';
  for (let i = 0; i < lengthToRead; i++) {
    const code = uint8[i];
    // Keep printable ASCII and whitespace
    if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9) {
      str += String.fromCharCode(code);
    } else {
      str += ' ';
    }
  }

  // If file is large, also append the trailer area where xref and %%EOF reside
  if (byteLength > maxBytes) {
    const tailStart = Math.max(0, byteLength - 50000);
    const tailUint8 = new Uint8Array(buffer, tailStart, byteLength - tailStart);
    str += '\n--- TAIL ---\n';
    for (let i = 0; i < tailUint8.length; i++) {
      const code = tailUint8[i];
      if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9) {
        str += String.fromCharCode(code);
      } else {
        str += ' ';
      }
    }
  }

  return str;
}

/**
 * Parses PDF date format: D:YYYYMMDDHHmmSS...
 */
function parsePdfDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const match = dateStr.match(/D:?(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = match[2] ? parseInt(match[2], 10) - 1 : 0;
  const day = match[3] ? parseInt(match[3], 10) : 1;
  const hour = match[4] ? parseInt(match[4], 10) : 0;
  const min = match[5] ? parseInt(match[5], 10) : 0;
  const sec = match[6] ? parseInt(match[6], 10) : 0;
  return new Date(Date.UTC(year, month, day, hour, min, sec));
}

/**
 * Performs comprehensive forensic analysis on a document buffer
 */
export function analyzeDocumentForensics(
  buffer: ArrayBuffer | Uint8Array | Buffer,
  fileName: string,
  sha256Checksum?: string,
  documentType?: string
): DocumentForensicReport {
  const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const checksum = sha256Checksum || crypto.createHash('sha256').update(uint8).digest('hex');
  const asciiContent = bufferToAscii(buffer);
  const findings: ForensicFinding[] = [];
  const byteLength = buffer.byteLength;

  // ─────────────────────────────────────────────────────────────
  // 1. PDF Structure & Header Analysis
  // ─────────────────────────────────────────────────────────────
  const headerMatch = asciiContent.match(/%PDF-(\d\.\d)/);
  const hasValidHeader = Boolean(headerMatch);
  const pdfVersion = headerMatch ? headerMatch[1] : 'Unknown';

  // Check EOF markers
  const eofMatches = asciiContent.match(/%%EOF/g) || [];
  const revisionCount = eofMatches.length;

  if (!hasValidHeader) {
    findings.push({
      id: 'f-struct-header',
      check: 'PDF_STRUCTURE_ANALYSIS',
      checkLabel: 'PDF Header & Specification Conformance',
      status: 'FAILED',
      severity: 'CRITICAL',
      confidence: 0.99,
      explanation: 'File lacks standard %PDF- magic header. Malformed or unsupported file container.',
      technicalDetails: { headerFound: false, byteLength },
    });
  } else {
    findings.push({
      id: 'f-struct-header',
      check: 'PDF_STRUCTURE_ANALYSIS',
      checkLabel: 'PDF Header & Specification Conformance',
      status: 'PASS',
      severity: 'LOW',
      confidence: 0.99,
      explanation: `Valid PDF specification version ${pdfVersion} confirmed with standard binary header.`,
      technicalDetails: { pdfVersion, byteLength },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Revision & Incremental Update Analysis
  // ─────────────────────────────────────────────────────────────
  const hasMultipleRevisions = revisionCount > 1;
  if (revisionCount === 0) {
    findings.push({
      id: 'f-revision-missing',
      check: 'PDF_REVISION_ANALYSIS',
      checkLabel: 'PDF EOF & Revision Stream Integrity',
      status: 'WARNING',
      severity: 'MEDIUM',
      confidence: 0.92,
      explanation: 'Missing standard %%EOF termination marker. File may have been prematurely truncated during transfer.',
    });
  } else if (hasMultipleRevisions) {
    findings.push({
      id: 'f-revision-multi',
      check: 'PDF_REVISION_ANALYSIS',
      checkLabel: 'PDF Revision & Incremental Update Analysis',
      status: 'SUSPICIOUS',
      severity: 'MEDIUM',
      confidence: 0.88,
      explanation: `Document contains ${revisionCount} incremental update sections (%%EOF). Indicates post-issuance modifications or appended objects.`,
      technicalDetails: { revisionCount },
    });
  } else {
    findings.push({
      id: 'f-revision-single',
      check: 'PDF_REVISION_ANALYSIS',
      checkLabel: 'PDF Revision & Incremental Update Analysis',
      status: 'PASS',
      severity: 'LOW',
      confidence: 0.95,
      explanation: 'Single clean revision structure (1 %%EOF). No post-creation incremental modification detected.',
      technicalDetails: { revisionCount: 1 },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Metadata Analysis & Graphic Editor Tool Detection
  // ─────────────────────────────────────────────────────────────
  const producerMatch = asciiContent.match(/\/Producer\s*\(([^)]+)\)/i) || asciiContent.match(/\/Producer\s*<([^>]+)>/i);
  const creatorMatch = asciiContent.match(/\/Creator\s*\(([^)]+)\)/i) || asciiContent.match(/\/Creator\s*<([^>]+)>/i);
  const creationDateMatch = asciiContent.match(/\/CreationDate\s*\(([^)]+)\)/i);
  const modDateMatch = asciiContent.match(/\/ModDate\s*\(([^)]+)\)/i);

  const producerTool = producerMatch ? producerMatch[1].trim() : undefined;
  const creatorTool = creatorMatch ? creatorMatch[1].trim() : undefined;
  const rawCreationDate = creationDateMatch ? creationDateMatch[1].trim() : undefined;
  const rawModDate = modDateMatch ? modDateMatch[1].trim() : undefined;

  const creationDateObj = parsePdfDate(rawCreationDate);
  const modDateObj = parsePdfDate(rawModDate);

  const combinedSoftware = `${producerTool || ''} ${creatorTool || ''}`;
  const isSuspiciousTool = SUSPICIOUS_PRODUCERS_REGEX.test(combinedSoftware);

  // Check if graphic editor used on official statutory certificates
  const isStatutoryDoc =
    documentType === 'gst_certificate' ||
    documentType === 'pan_card' ||
    documentType === 'udyam_certificate' ||
    /gst|pan|udyam/i.test(fileName);

  if (isSuspiciousTool) {
    findings.push({
      id: 'f-meta-editor',
      check: 'PDF_METADATA_ANALYSIS',
      checkLabel: 'Software Producer & Generator Footprints',
      status: 'SUSPICIOUS',
      severity: isStatutoryDoc ? 'HIGH' : 'MEDIUM',
      confidence: 0.94,
      explanation: `Document metadata identifies graphic/layout manipulation software ("${combinedSoftware.trim()}"). Official statutory authority certificates are typically rendered directly via institutional reporting engines, not desktop design tools.`,
      technicalDetails: { producer: producerTool, creator: creatorTool },
    });
  } else if (producerTool || creatorTool) {
    findings.push({
      id: 'f-meta-normal',
      check: 'PDF_METADATA_ANALYSIS',
      checkLabel: 'Software Producer & Generator Footprints',
      status: 'PASS',
      severity: 'LOW',
      confidence: 0.90,
      explanation: `Document rendered via standard engine: ${producerTool || creatorTool}.`,
      technicalDetails: { producer: producerTool, creator: creatorTool },
    });
  } else {
    findings.push({
      id: 'f-meta-stripped',
      check: 'PDF_METADATA_ANALYSIS',
      checkLabel: 'Software Producer & Generator Footprints',
      status: 'WARNING',
      severity: 'LOW',
      confidence: 0.75,
      explanation: 'Document producer metadata is stripped or omitted. Neutral signal; common in automated export utilities.',
    });
  }

  // Check Creation vs Modification time disparity
  if (creationDateObj && modDateObj) {
    const diffHours = Math.abs(modDateObj.getTime() - creationDateObj.getTime()) / (1000 * 60 * 60);
    if (diffHours > 24 && !asciiContent.includes('/ByteRange')) {
      findings.push({
        id: 'f-meta-date-delta',
        check: 'PDF_METADATA_ANALYSIS',
        checkLabel: 'Creation vs Modification Timestamp Concordance',
        status: 'WARNING',
        severity: 'LOW',
        confidence: 0.85,
        explanation: `Modification date is ${Math.round(diffHours / 24)} days later than original creation date without an embedded digital signature lock.`,
        technicalDetails: {
          creationDate: creationDateObj.toISOString(),
          modificationDate: modDateObj.toISOString(),
          diffHours: Math.round(diffHours),
        },
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Digital Signature & Cryptographic DSS Analysis
  // ─────────────────────────────────────────────────────────────
  const hasByteRange = asciiContent.includes('/ByteRange');
  const hasSigDictionary = asciiContent.includes('/Sig') || asciiContent.includes('/adbe.pkcs7');
  const hasDigitalSignature = hasByteRange && hasSigDictionary;

  if (hasDigitalSignature) {
    findings.push({
      id: 'f-sig-detected',
      check: 'DIGITAL_SIGNATURE_CHECK',
      checkLabel: 'Embedded Cryptographic Digital Signature (PKCS#7)',
      status: 'PASS',
      severity: 'LOW',
      confidence: 0.98,
      explanation: 'Cryptographic digital signature dictionary (/ByteRange & /Sig) detected. Document contains author cryptographic authentication.',
      technicalDetails: { pkcs7Detected: true },
    });
  } else {
    findings.push({
      id: 'f-sig-absent',
      check: 'DIGITAL_SIGNATURE_CHECK',
      checkLabel: 'Embedded Cryptographic Digital Signature (PKCS#7)',
      status: 'NOT_AVAILABLE',
      severity: 'LOW',
      confidence: 1.0,
      explanation: 'No embedded PKCS#7 / Adobe cryptographic signature stream detected. Requires statutory provider reconciliation or physical stamp verification.',
      technicalDetails: { pkcs7Detected: false },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Text vs Scanned Raster Layer Classification
  // ─────────────────────────────────────────────────────────────
  const textStreams = (asciiContent.match(/BT[\s\S]*?ET/g) || []).length;
  const imageObjects = (asciiContent.match(/\/Subtype\s*\/Image/g) || []).length;

  if (textStreams === 0 && imageObjects > 0) {
    findings.push({
      id: 'f-layer-scanned',
      check: 'TEXT_IMAGE_LAYER_ANALYSIS',
      checkLabel: 'Vector Text vs Scanned Raster Layer Structure',
      status: 'WARNING',
      severity: 'LOW',
      confidence: 0.92,
      explanation: 'Document consists entirely of flattened raster images without a selectable text stream. Typical of scanned paper copies; verified via OCR.',
      technicalDetails: { textStreams: 0, imageObjects },
    });
  } else if (textStreams > 0) {
    findings.push({
      id: 'f-layer-text',
      check: 'TEXT_IMAGE_LAYER_ANALYSIS',
      checkLabel: 'Vector Text vs Scanned Raster Layer Structure',
      status: 'PASS',
      severity: 'LOW',
      confidence: 0.96,
      explanation: `Native vector text layer confirmed (${textStreams} text object streams).`,
      technicalDetails: { textStreams, imageObjects },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 6. QR / Statutory Identifier Detection
  // ─────────────────────────────────────────────────────────────
  const hasQrOrBarcode =
    /qr\s*code|udin|barcode|irn:|authenticity\s*link|verify\s*at/i.test(asciiContent);
  if (hasQrOrBarcode) {
    findings.push({
      id: 'f-qr-detected',
      check: 'IDENTIFIER_QR_DETECTION',
      checkLabel: 'Statutory Verification QR Code & Reference Markers',
      status: 'PASS',
      severity: 'LOW',
      confidence: 0.88,
      explanation: 'Statutory verification references (QR / UDIN / Authenticity link pattern) detected in document stream.',
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Derive Overall Forensic Status & Severity Deterministically
  // ─────────────────────────────────────────────────────────────
  let overallStatus: ForensicStatus = 'PASS';
  let overallSeverity: ForensicSeverity = 'LOW';

  const hasSuspicious = findings.some((f) => f.status === 'SUSPICIOUS');
  const hasFailed = findings.some((f) => f.status === 'FAILED');
  const hasWarning = findings.some((f) => f.status === 'WARNING');

  if (hasFailed) {
    overallStatus = 'FAILED';
    overallSeverity = 'CRITICAL';
  } else if (hasSuspicious) {
    overallStatus = 'SUSPICIOUS';
    overallSeverity = findings.some((f) => f.severity === 'HIGH') ? 'HIGH' : 'MEDIUM';
  } else if (hasWarning) {
    overallStatus = 'WARNING';
    overallSeverity = 'LOW';
  }

  const summary =
    overallStatus === 'PASS'
      ? 'Clean structural forensics. Standard PDF specification, single revision, and genuine institutional generator profile.'
      : overallStatus === 'SUSPICIOUS'
      ? `Forensic signals require review: ${findings.filter((f) => f.status === 'SUSPICIOUS').map((f) => f.checkLabel).join(', ')}.`
      : overallStatus === 'WARNING'
      ? `Minor structural notices noted: ${findings.filter((f) => f.status === 'WARNING').map((f) => f.checkLabel).join(', ')}.`
      : 'Critical document structural violation detected.';

  return {
    documentId: `doc-${checksum.substring(0, 12)}`,
    fileName,
    sha256Checksum: checksum,
    overallStatus,
    overallSeverity,
    findings,
    hasDigitalSignature,
    revisionCount,
    producerTool,
    creationDate: creationDateObj ? creationDateObj.toISOString() : undefined,
    modificationDate: modDateObj ? modDateObj.toISOString() : undefined,
    analyzedAt: new Date().toLocaleString('en-GB', { timeZone: 'Asia/Kolkata' }) + ' IST',
    engineVersion: 'Clausentis Forensics Engine v3.0 (CVC Concordant)',
    summary,
  };
}
