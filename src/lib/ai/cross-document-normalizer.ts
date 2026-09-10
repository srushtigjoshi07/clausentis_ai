/**
 * Cross-Document Normalizer
 *
 * Normalizes values before comparison, preserving the original extracted value.
 * Every function returns { original, normalized } for full traceability in the UI.
 */

import type { NormalizedValue } from '@/types/cross-document';

// ────────────────────────────────────────────────
// Entity Name Normalization
// ────────────────────────────────────────────────

const LEGAL_SUFFIX_MAP: Record<string, string> = {
  'pvt': '', 'pvt.': '', 'private': '', 'priv': '',
  'ltd': '', 'ltd.': '', 'limited': '', 'lmtd': '',
  'llp': '', 'l.l.p.': '', 'l.l.p': '',
  'inc': '', 'inc.': '', 'incorporated': '',
  'corp': '', 'corp.': '', 'corporation': '',
  'co': '', 'co.': '', 'company': '',
  'enterprises': '', 'enterprise': '',
  'technologies': '', 'tech': '',
  'solutions': '', 'soln': '',
  'services': '', 'service': '',
  'industries': '', 'industry': '',
  'infra': '', 'infrastructure': '',
  'associates': '', 'assoc': '',
  'consultants': '', 'consultant': '',
  'engineers': '', 'engineering': '',
  '&': 'and',
};

export function normalizeEntityName(value: string): NormalizedValue {
  const original = value.trim();
  if (!original) return { original, normalized: '' };

  let normalized = original.toLowerCase();

  // Replace legal suffixes
  for (const [suffix, replacement] of Object.entries(LEGAL_SUFFIX_MAP)) {
    // Match as whole word (surrounded by boundaries or punctuation)
    const regex = new RegExp(`\\b${suffix.replace(/\./g, '\\.')}\\b`, 'gi');
    normalized = normalized.replace(regex, replacement);
  }

  // Normalize whitespace, punctuation, special chars
  normalized = normalized
    .replace(/[.,\-()[\]{}'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { original, normalized };
}

/**
 * Calculate similarity between two normalized entity names.
 * Returns 0-1 score. Uses token-based Jaccard + character containment.
 */
export function calculateEntitySimilarity(nameA: string, nameB: string): number {
  if (!nameA || !nameB) return 0;

  const a = nameA.toLowerCase().trim();
  const b = nameB.toLowerCase().trim();

  if (a === b) return 1.0;

  // Check containment
  if (a.includes(b) || b.includes(a)) return 0.9;

  // Token-based Jaccard
  const tokensA = new Set(a.split(/\s+/).filter(t => t.length > 1));
  const tokensB = new Set(b.split(/\s+/).filter(t => t.length > 1));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 ? intersection / union : 0;
}

// ────────────────────────────────────────────────
// PAN Normalization
// ────────────────────────────────────────────────

export function normalizePAN(value: string): NormalizedValue {
  const original = value.trim();
  if (!original) return { original, normalized: '' };

  // Remove spaces, hyphens, dots
  const normalized = original
    .replace(/[\s\-.]/g, '')
    .toUpperCase();

  return { original, normalized };
}

// ────────────────────────────────────────────────
// GSTIN Normalization
// ────────────────────────────────────────────────

export function normalizeGSTIN(value: string): NormalizedValue {
  const original = value.trim();
  if (!original) return { original, normalized: '' };

  const normalized = original
    .replace(/[\s\-.]/g, '')
    .toUpperCase();

  return { original, normalized };
}

// ────────────────────────────────────────────────
// CIN Normalization
// ────────────────────────────────────────────────

export function normalizeCIN(value: string): NormalizedValue {
  const original = value.trim();
  if (!original) return { original, normalized: '' };

  const normalized = original
    .replace(/[\s\-.]/g, '')
    .toUpperCase();

  return { original, normalized };
}

// ────────────────────────────────────────────────
// Amount Normalization
// ────────────────────────────────────────────────

/**
 * Normalizes currency amounts to a canonical numeric value in Crores.
 * Handles: ₹, Rs, Rs., INR, commas, Cr/Crore, L/Lakh
 */
export function normalizeAmount(value: string | number): NormalizedValue {
  if (typeof value === 'number') {
    return { original: String(value), normalized: String(value) };
  }

  const original = value.trim();
  if (!original) return { original, normalized: '' };

  // Strip currency symbols and whitespace
  let cleaned = original
    .replace(/[₹$]/g, '')
    .replace(/\brs\.?\b/gi, '')
    .replace(/\binr\b/gi, '')
    .replace(/,/g, '')
    .trim();

  // Detect unit multiplier
  let multiplier = 1;
  if (/\bcr(?:ore)?s?\b/i.test(cleaned)) {
    multiplier = 1;
    cleaned = cleaned.replace(/\bcr(?:ore)?s?\b/gi, '').trim();
  } else if (/\blakhs?\b|\blacs?\b/i.test(cleaned)) {
    multiplier = 0.01; // Convert lakh to crore
    cleaned = cleaned.replace(/\blakhs?\b|\blacs?\b/gi, '').trim();
  } else if (/\bcrores?\b/i.test(cleaned)) {
    multiplier = 1;
    cleaned = cleaned.replace(/\bcrores?\b/gi, '').trim();
  }

  const numericValue = parseFloat(cleaned);
  if (isNaN(numericValue)) {
    return { original, normalized: original };
  }

  const normalizedValue = numericValue * multiplier;
  return { original, normalized: String(normalizedValue) };
}

// ────────────────────────────────────────────────
// Date Normalization
// ────────────────────────────────────────────────

const MONTH_MAP: Record<string, string> = {
  'jan': '01', 'january': '01',
  'feb': '02', 'february': '02',
  'mar': '03', 'march': '03',
  'apr': '04', 'april': '04',
  'may': '05',
  'jun': '06', 'june': '06',
  'jul': '07', 'july': '07',
  'aug': '08', 'august': '08',
  'sep': '09', 'september': '09', 'sept': '09',
  'oct': '10', 'october': '10',
  'nov': '11', 'november': '11',
  'dec': '12', 'december': '12',
};

/**
 * Normalizes dates to YYYY-MM-DD format.
 * Handles: DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY (if unambiguous), YYYY-MM-DD, "01 Jan 2025", ISO strings
 */
export function normalizeDate(value: string): NormalizedValue {
  const original = value.trim();
  if (!original) return { original, normalized: '' };

  // Already ISO date
  if (/^\d{4}-\d{2}-\d{2}/.test(original)) {
    const normalized = original.substring(0, 10);
    return { original, normalized };
  }

  // DD/MM/YYYY or DD-MM-YYYY (Indian format - day first)
  const ddmmyyyy = original.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    // Assume DD/MM/YYYY (Indian standard)
    const normalized = `${year}-${month}-${day}`;
    return { original, normalized };
  }

  // DD/MM/YY
  const ddmmyy = original.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2})$/);
  if (ddmmyy) {
    const day = ddmmyy[1].padStart(2, '0');
    const month = ddmmyy[2].padStart(2, '0');
    const yearShort = parseInt(ddmmyy[3]);
    const year = yearShort > 50 ? `19${ddmmyy[3]}` : `20${ddmmyy[3]}`;
    const normalized = `${year}-${month}-${day}`;
    return { original, normalized };
  }

  // "01 Jan 2025" / "January 1, 2025" / "1st January 2025"
  const namedMonth = original.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)\s+(\d{4})/i
  );
  if (namedMonth) {
    const day = namedMonth[1].padStart(2, '0');
    const monthStr = namedMonth[2].toLowerCase();
    const month = MONTH_MAP[monthStr];
    const year = namedMonth[3];
    if (month) {
      return { original, normalized: `${year}-${month}-${day}` };
    }
  }

  // "Jan 01, 2025"
  const monthFirst = original.match(
    /(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i
  );
  if (monthFirst) {
    const monthStr = monthFirst[1].toLowerCase();
    const month = MONTH_MAP[monthStr];
    const day = monthFirst[2].padStart(2, '0');
    const year = monthFirst[3];
    if (month) {
      return { original, normalized: `${year}-${month}-${day}` };
    }
  }

  // Try native Date parse as last resort
  const parsed = new Date(original);
  if (!isNaN(parsed.getTime())) {
    const normalized = parsed.toISOString().substring(0, 10);
    return { original, normalized };
  }

  // Cannot normalize - return as-is
  return { original, normalized: original };
}

// ────────────────────────────────────────────────
// Address Normalization
// ────────────────────────────────────────────────

export function normalizeAddress(value: string): NormalizedValue {
  const original = value.trim();
  if (!original) return { original, normalized: '' };

  let normalized = original.toLowerCase();

  // Expand common abbreviations
  const abbreviations: Record<string, string> = {
    'rd': 'road', 'rd.': 'road',
    'st': 'street', 'st.': 'street',
    'ave': 'avenue', 'ave.': 'avenue',
    'blvd': 'boulevard',
    'nr': 'near', 'nr.': 'near',
    'opp': 'opposite', 'opp.': 'opposite',
    'dist': 'district', 'dist.': 'district',
    'no': 'number', 'no.': 'number',
  };

  for (const [abbr, full] of Object.entries(abbreviations)) {
    const regex = new RegExp(`\\b${abbr.replace(/\./g, '\\.')}\\b`, 'gi');
    normalized = normalized.replace(regex, full);
  }

  // Remove punctuation, normalize whitespace
  normalized = normalized
    .replace(/[.,\-#()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return { original, normalized };
}

// ────────────────────────────────────────────────
// Registration Number Normalization
// ────────────────────────────────────────────────

export function normalizeRegistrationNumber(value: string): NormalizedValue {
  const original = value.trim();
  if (!original) return { original, normalized: '' };

  const normalized = original
    .replace(/[\s\-.\/]/g, '')
    .toUpperCase();

  return { original, normalized };
}
