/**
 * Centralized PDF Download & Naming Utility for CLAUSENTIS
 *
 * Ensures all client-side and server-side PDF exports:
 * 1. Use explicit MIME type: application/pdf
 * 2. Validate PDF %PDF magic byte signature
 * 3. Use standard naming: clausentis-{document-type}-{tender-or-bid-name}-{YYYY-MM-DD}.pdf
 * 4. Sanitize filenames to prevent invalid OS filesystem characters
 * 5. Safely defer URL.revokeObjectURL to avoid Chromium UUID fallback race condition
 */

/**
 * Sanitizes entity names and strings to be safe for OS filenames
 * - removes / \ : * ? " < > |
 * - collapses multiple whitespace into single space
 * - replaces spaces and underscores with hyphens
 * - converts to lowercase
 * - removes repeated hyphens and trims leading/trailing hyphens
 */
export function sanitizeFilenamePart(name?: string | null): string {
  if (!name || typeof name !== 'string') return 'record';
  const cleaned = name
    .replace(/[/\\:*?"<>|]/g, '-') // replace illegal filesystem characters with hyphens
    .replace(/[^\w\s-]/g, '') // remove non-alphanumeric except whitespace and hyphens
    .trim()
    .replace(/\s+/g, '-') // replace spaces with hyphens
    .replace(/_+/g, '-') // replace underscores with hyphens
    .replace(/-+/g, '-') // collapse repeated hyphens
    .replace(/^-+|-+$/g, '') // trim leading/trailing hyphens
    .toLowerCase();

  return cleaned || 'record';
}

/**
 * Centralized filename generator following standard Clausentis naming:
 * clausentis-{document-type}-{tender-or-bid-name}-{YYYY-MM-DD}.pdf
 *
 * Examples:
 * - clausentis-matched-requirements-apex-heavy-2026-09-12.pdf
 * - clausentis-audit-bid-apex-02-2026-09-12.pdf
 * - clausentis-compliance-report-apex-heavy-2026-09-12.pdf
 * - clausentis-signed-decision-apex-heavy-2026-09-12.pdf
 */
export function generatePdfFilename(
  documentType: string,
  entityName?: string | null,
  customDate?: string | Date
): string {
  const safeType = sanitizeFilenamePart(documentType);
  const safeEntity = sanitizeFilenamePart(entityName);

  let dateStr: string;
  if (customDate instanceof Date) {
    dateStr = customDate.toISOString().split('T')[0];
  } else if (typeof customDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(customDate)) {
    dateStr = customDate;
  } else {
    // Current date in YYYY-MM-DD format (IST or local)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
  }

  // Format: clausentis-{document-type}-{tender-or-bid-name}-{YYYY-MM-DD}.pdf
  return `clausentis-${safeType}-${safeEntity}-${dateStr}.pdf`;
}

/**
 * Validates that binary data begins with the PDF magic header "%PDF"
 */
export function isValidPdfBytes(buffer: ArrayBuffer | Uint8Array): boolean {
  if (!buffer || buffer.byteLength < 4) return false;
  const bytes = new Uint8Array(buffer instanceof ArrayBuffer ? buffer : buffer.buffer);
  // %PDF in ASCII is 0x25, 0x50, 0x44, 0x46
  return (
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46    // F
  );
}

/**
 * Centralized, reliable client-side PDF download helper.
 * 1. Guarantees { type: 'application/pdf' } on the Blob.
 * 2. Validates %PDF magic signature.
 * 3. Sets HTMLAnchorElement download filename with .pdf.
 * 4. Defers URL.revokeObjectURL(url) by 15 seconds to eliminate Chromium UUID race condition.
 */
export async function downloadPdfFromBytes(
  pdfBytes: ArrayBuffer | Uint8Array | Blob,
  filename: string
): Promise<{ success: boolean; filename: string; size: number; error?: string }> {
  try {
    let blob: Blob;
    let arrayBuffer: ArrayBuffer;

    if (pdfBytes instanceof Blob) {
      arrayBuffer = await pdfBytes.arrayBuffer();
      blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    } else {
      if (pdfBytes instanceof ArrayBuffer) {
        arrayBuffer = pdfBytes;
      } else {
        const copy = new Uint8Array(pdfBytes.byteLength);
        copy.set(pdfBytes);
        arrayBuffer = copy.buffer;
      }
      blob = new Blob([arrayBuffer], { type: 'application/pdf' });
    }

    // Sanity checks
    if (blob.size === 0) {
      throw new Error('Generated PDF is empty (0 bytes).');
    }

    if (!isValidPdfBytes(arrayBuffer)) {
      throw new Error('Generated file does not contain a valid %PDF header signature.');
    }

    // Ensure filename ends with .pdf
    const finalFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return { success: true, filename: finalFilename, size: blob.size };
    }

    // Create object URL with explicit application/pdf MIME type
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.style.position = 'fixed';
    link.style.left = '-9999px';
    link.href = blobUrl;
    link.setAttribute('download', finalFilename);
    link.download = finalFilename;
    link.target = '_self';
    // IMPORTANT: Do NOT set rel="noopener noreferrer" on blob download links in Chromium!
    // Chromium security sandbox will strip the download attribute if rel="noreferrer" is present.

    document.body.appendChild(link);

    // Trigger click event
    try {
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
    } catch {
      link.click();
    }

    // Defer DOM cleanup and URL revocation by 60 seconds
    // Immediate removal causes Chromium to drop the download attribute and save with the blob UUID
    setTimeout(() => {
      try {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
        URL.revokeObjectURL(blobUrl);
      } catch {
        // Safe ignore
      }
    }, 60000);

    return { success: true, filename: finalFilename, size: blob.size };
  } catch (err: unknown) {
    console.error('[PdfDownloadHelper] Download error:', err);
    return {
      success: false,
      filename,
      size: 0,
      error: (err as Error)?.message || 'Failed to download PDF.',
    };
  }
}

/**
 * Triggers server-backed PDF download via HTTP Content-Disposition headers.
 * Guaranteed to respect the filename in all Chromium and mobile browsers.
 */
export function triggerServerPdfDownload(apiUrl: string, filename: string): void {
  if (typeof window === 'undefined') return;
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = apiUrl;
  link.setAttribute('download', filename);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    if (link.parentNode) link.parentNode.removeChild(link);
  }, 10000);
}
