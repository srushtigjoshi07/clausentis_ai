/**
 * Status vocabulary for the v2 UI. Pure helpers (no React, no server-only imports)
 * so both server and client components can use them.
 */

export type Outcome = 'pass' | 'review' | 'fail' | 'missing';

export const OUTCOMES: Outcome[] = ['pass', 'review', 'fail', 'missing'];

export const OUTCOME_LABEL: Record<Outcome, string> = {
  pass: 'Pass',
  review: 'Review',
  fail: 'Fail',
  missing: 'Missing',
};

export const OUTCOME_FILL: Record<Exclude<Outcome, 'missing'>, string> = {
  pass: '#047857',
  review: '#F59E0B',
  fail: '#B91C1C',
};

export const MISSING_FILL = 'repeating-linear-gradient(45deg,#FFFFFF 0 3px,#94A3B8 3px 4px)';

export const OUTCOME_PILL: Record<Outcome, string> = {
  pass: 'pill-pass',
  review: 'pill-review',
  fail: 'pill-fail',
  missing: 'pill-fail',
};

/** Maps engine statuses (compliance + bid matrix) to the four display outcomes. */
export function toOutcome(status: string | undefined | null): Outcome | null {
  switch ((status || '').toUpperCase()) {
    case 'PASS':
      return 'pass';
    case 'FAIL':
      return 'fail';
    case 'MISSING':
      return 'missing';
    case 'WARNING':
    case 'MANUAL_REVIEW':
      return 'review';
    default:
      return null; // NOT_APPLICABLE or unknown: not counted
  }
}

export type OutcomeCounts = Record<Outcome, number>;

export function countOutcomes(statuses: Array<string | undefined | null>): OutcomeCounts {
  const counts: OutcomeCounts = { pass: 0, review: 0, fail: 0, missing: 0 };
  for (const s of statuses) {
    const o = toOutcome(s);
    if (o) counts[o] += 1;
  }
  return counts;
}

export function riskLabel(risk: string | undefined | null): string {
  const r = (risk || '').toUpperCase();
  if (!r) return 'Unknown';
  return r.charAt(0) + r.slice(1).toLowerCase();
}

export function riskPill(risk: string | undefined | null): string {
  switch ((risk || '').toUpperCase()) {
    case 'LOW':
      return 'pill-pass';
    case 'MEDIUM':
      return 'pill-review';
    case 'HIGH':
      return 'pill-fail';
    case 'CRITICAL':
      return 'pill-critical';
    default:
      return 'pill-neutral';
  }
}

export const RISK_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export function aiAdviceLabel(rec: string | undefined | null): string {
  switch ((rec || '').toUpperCase()) {
    case 'COMPLIANT':
      return 'Compliant';
    case 'NON-COMPLIANT':
      return 'Non-compliant';
    case 'REQUIRES MANUAL REVIEW':
      return 'Needs manual review';
    default:
      return rec || 'Not available';
  }
}

/** Officer decision codes (legacy + signed) to plain words. */
export function decisionLabel(decision: string | undefined | null): string {
  switch ((decision || '').toUpperCase()) {
    case 'APPROVED':
    case 'QUALIFIED':
      return 'Qualified';
    case 'REJECTED':
    case 'DISQUALIFIED':
      return 'Disqualified';
    case 'CLARIFICATION_REQUIRED':
    case 'REQUIRES CLARIFICATION':
      return 'Clarification sought';
    case 'MANUAL_REVIEW':
    case 'PENDING REVIEW':
      return 'Referred to committee';
    default:
      return decision || 'Awaiting decision';
  }
}

export function decisionPill(decision: string | undefined | null): string {
  switch ((decision || '').toUpperCase()) {
    case 'APPROVED':
    case 'QUALIFIED':
      return 'pill-pass';
    case 'REJECTED':
    case 'DISQUALIFIED':
      return 'pill-fail';
    case 'CLARIFICATION_REQUIRED':
    case 'REQUIRES CLARIFICATION':
    case 'MANUAL_REVIEW':
    case 'PENDING REVIEW':
      return 'pill-review';
    default:
      return 'pill-neutral';
  }
}

export function categoryClass(category: string | undefined | null): string {
  const c = (category || '').toLowerCase();
  if (c.startsWith('financ')) return 'cat-financial';
  if (c.startsWith('exper')) return 'cat-experience';
  if (c.startsWith('statut') || c.startsWith('legal & reg')) return 'cat-statutory';
  if (c.startsWith('techn')) return 'cat-technical';
  if (c.startsWith('legal') || c.startsWith('declar')) return 'cat-legal';
  if (c.startsWith('qual') || c.startsWith('cert')) return 'cat-quality';
  return 'cat-other';
}

/** First number in a string such as "₹14.50 Crore" or "≥ 10 Cr". */
export function firstNumber(text: string | number | undefined | null): number | null {
  if (typeof text === 'number') return Number.isFinite(text) ? text : null;
  if (!text) return null;
  const m = String(text).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

/** Parses an estimate like "₹14.50 Crore" / "₹29,00,000" into crore. */
export function toCrore(text: string | undefined | null): number | null {
  if (!text) return null;
  const s = String(text);
  const n = firstNumber(s);
  if (n === null) return null;
  if (/cr/i.test(s)) return n;
  if (/lakh|\bl\b/i.test(s)) return n / 100;
  // raw rupees
  return n >= 100000 ? n / 1e7 : n;
}

const MS_DAY = 86_400_000;

export function daysUntil(dateText: string, now: Date = new Date()): number | null {
  const d = new Date(dateText);
  if (Number.isNaN(d.getTime())) return null;
  const start = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const end = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((end - start) / MS_DAY);
}

export function formatDate(dateText: string | undefined | null, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }): string {
  if (!dateText) return '—';
  const d = new Date(dateText);
  if (Number.isNaN(d.getTime())) return String(dateText);
  return d.toLocaleDateString('en-GB', { ...opts, timeZone: 'Asia/Kolkata' });
}

export function relativeDays(days: number | null): string {
  if (days === null) return '';
  if (days < 0) return `closed ${Math.abs(days)} day${days === -1 ? '' : 's'} ago`;
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}
