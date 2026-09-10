import { extractText } from 'unpdf';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
  cleanedText: string;
  isTableDense?: boolean;
}

export interface DocumentParseResult {
  totalPages: number;
  pages: ExtractedPage[];
  fullText: string;
  isScanned: boolean;
  totalCharacters: number;
}

/**
 * Normalizes and cleans raw extracted PDF text while preserving line structure and quotes
 */
export function cleanPageText(rawText: string): { cleanedText: string; isTableDense: boolean } {
  if (!rawText) return { cleanedText: '', isTableDense: false };

  // Detect table-like structures (presence of multiple pipes, tabs, or tabular spacing)
  const pipeCount = (rawText.match(/\|/g) || []).length;
  const tabCount = (rawText.match(/\t/g) || []).length;
  const isTableDense = pipeCount > 5 || tabCount > 10;

  // Clean excessive blank lines, carriage returns, and control characters
  let text = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Remove repeated header/footer artifacts like page numbering footprints
  text = text.replace(/^Page \d+ of \d+$/gim, '');
  text = text.replace(/^-- \d+ --$/gim, '');

  // Normalize multi-spaces but preserve single newlines
  text = text
    .split('\n')
    .map(line => line.replace(/[^\S\r\n]+/g, ' ').trim())
    .filter((line, idx, arr) => {
      // Avoid excessive consecutive empty lines
      if (!line && idx > 0 && !arr[idx - 1]) return false;
      return true;
    })
    .join('\n');

  return { cleanedText: text.trim(), isTableDense };
}

/**
 * Extracts page-by-page text from a PDF Buffer with scanned-document detection
 */
export async function parsePdfDocument(pdfBuffer: Uint8Array | ArrayBuffer): Promise<DocumentParseResult> {
  try {
    // extractText with mergePages: false returns string[] for each page
    const { totalPages, text } = await extractText(pdfBuffer, { mergePages: false });
    
    const rawPages: string[] = Array.isArray(text) ? text : [text];
    const pages: ExtractedPage[] = [];
    let totalCharacters = 0;

    for (let i = 0; i < rawPages.length; i++) {
      const raw = rawPages[i] || '';
      const { cleanedText, isTableDense } = cleanPageText(raw);
      totalCharacters += cleanedText.length;
      
      pages.push({
        pageNumber: i + 1,
        text: raw,
        cleanedText,
        isTableDense
      });
    }

    // Scanned detection threshold: average characters per page < 40
    const avgCharsPerPage = totalPages > 0 ? totalCharacters / totalPages : 0;
    const isScanned = totalCharacters < 50 || avgCharsPerPage < 40;

    const fullText = pages.map(p => `--- PAGE ${p.pageNumber} ---\n${p.cleanedText}`).join('\n\n');

    return {
      totalPages,
      pages,
      fullText,
      isScanned,
      totalCharacters
    };
  } catch (error) {
    console.error('Error parsing PDF document:', error);
    throw new Error('Failed to parse PDF document. Ensure the file is a valid non-corrupted PDF.');
  }
}
