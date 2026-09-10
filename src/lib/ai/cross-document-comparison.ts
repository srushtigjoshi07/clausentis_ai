/**
 * Cross-Document Comparison Engine
 *
 * Compares structured facts extracted from multiple bidder documents
 * to detect inconsistencies, validate dates, and verify numerical consistency.
 *
 * Uses deterministic comparison wherever possible (PAN, GSTIN, dates, numbers).
 * Uses normalization + similarity for entity names and addresses.
 * Falls back to AI semantic comparison only for genuinely ambiguous cases.
 *
 * Every finding includes full traceability: original values, normalized values,
 * comparison method, severity reasoning, and recommended action.
 */

import type {
  ExtractedBidderFacts,
  CrossDocumentFinding,
  CrossDocumentSummary,
  CrossDocumentCategoryScore,
  CrossDocFactType,
  CrossDocResult,
  CrossDocSeverity,
  CrossDocDocumentEvidence,
} from '@/types/cross-document';

import {
  normalizeEntityName,
  calculateEntitySimilarity,
  normalizePAN,
  normalizeGSTIN,
  normalizeCIN,
  normalizeAmount,
  normalizeDate,
  normalizeAddress,
  normalizeRegistrationNumber,
} from './cross-document-normalizer';

// ────────────────────────────────────────────────
// Document with extracted facts
// ────────────────────────────────────────────────

export interface DocumentWithFacts {
  documentId: string;
  documentName: string;
  documentType: string;
  facts: ExtractedBidderFacts;
}

// ────────────────────────────────────────────────
// Main Comparison Engine
// ────────────────────────────────────────────────

let findingCounter = 0;

function nextFindingId(): string {
  findingCounter++;
  return `cdf-${Date.now()}-${findingCounter}`;
}

export function runCrossDocumentComparison(
  documents: DocumentWithFacts[],
  bidDeadline?: string
): CrossDocumentSummary {
  findingCounter = 0;
  const findings: CrossDocumentFinding[] = [];

  if (documents.length < 2) {
    return createEmptySummary(documents.length);
  }

  // Category check counters
  const categoryChecks: Record<CrossDocFactType, { total: number; consistent: number }> = {
    identity: { total: 0, consistent: 0 },
    registration: { total: 0, consistent: 0 },
    financial: { total: 0, consistent: 0 },
    experience: { total: 0, consistent: 0 },
    certification: { total: 0, consistent: 0 },
    date: { total: 0, consistent: 0 },
  };

  // ──── IDENTITY CHECKS ────
  compareStringField(documents, 'legalName', 'Legal Entity Name', 'identity', 'normalization', findings, categoryChecks, (v) => normalizeEntityName(v), true);
  compareExactField(documents, 'pan', 'Permanent Account Number (PAN)', 'identity', findings, categoryChecks, (v) => normalizePAN(v));
  compareExactField(documents, 'gstin', 'GST Identification Number', 'identity', findings, categoryChecks, (v) => normalizeGSTIN(v));
  compareExactField(documents, 'cin', 'Corporate Identification Number', 'identity', findings, categoryChecks, (v) => normalizeCIN(v));
  compareStringField(documents, 'registeredAddress', 'Registered Address', 'identity', 'normalization', findings, categoryChecks, (v) => normalizeAddress(v), false);
  compareStringField(documents, 'authorizedSignatory', 'Authorized Signatory', 'identity', 'normalization', findings, categoryChecks, (v) => normalizeEntityName(v), false);

  // ──── REGISTRATION CHECKS ────
  compareExactField(documents, 'registrationNumber', 'Registration Number', 'registration', findings, categoryChecks, (v) => normalizeRegistrationNumber(v));
  compareDateField(documents, 'registrationExpiryDate', 'Registration Expiry Date', 'registration', findings, categoryChecks, bidDeadline);

  // ──── FINANCIAL CHECKS ────
  compareFinancialField(documents, findings, categoryChecks);

  // ──── EXPERIENCE CHECKS ────
  compareExperienceFields(documents, findings, categoryChecks);

  // ──── CERTIFICATION CHECKS ────
  compareCertificationFields(documents, findings, categoryChecks, bidDeadline);

  // Calculate summary scores
  const summary: CrossDocumentSummary = {
    identity: calcCategoryScore(categoryChecks.identity),
    registration: calcCategoryScore(categoryChecks.registration),
    financial: calcCategoryScore(categoryChecks.financial),
    experience: calcCategoryScore(categoryChecks.experience),
    certification: calcCategoryScore(categoryChecks.certification),
    overall_issues_count: findings.filter(f => f.result !== 'MATCH').length,
    high_count: findings.filter(f => f.severity === 'HIGH').length,
    medium_count: findings.filter(f => f.severity === 'MEDIUM').length,
    low_count: findings.filter(f => f.severity === 'LOW').length,
    findings,
    analyzed_at: new Date().toISOString(),
    document_count: documents.length,
  };

  return summary;
}

// ────────────────────────────────────────────────
// Comparison Functions
// ────────────────────────────────────────────────

/**
 * Compare exact identifier fields (PAN, GSTIN, CIN) deterministically.
 */
function compareExactField(
  documents: DocumentWithFacts[],
  field: keyof ExtractedBidderFacts,
  label: string,
  factType: CrossDocFactType,
  findings: CrossDocumentFinding[],
  checks: Record<CrossDocFactType, { total: number; consistent: number }>,
  normalizeFn: (v: string) => { original: string; normalized: string }
): void {
  const docsWithField = documents.filter(d => {
    const val = d.facts[field];
    return typeof val === 'string' && val.trim().length > 0;
  });

  if (docsWithField.length < 2) {
    if (docsWithField.length === 1) {
      checks[factType].total++;
      checks[factType].consistent++; // Only one doc has it — no contradiction
    }
    return;
  }

  checks[factType].total++;

  const firstVal = String(docsWithField[0].facts[field]);
  const firstNorm = normalizeFn(firstVal);

  const allDocEvidence: CrossDocDocumentEvidence[] = docsWithField.map(d => {
    const val = String(d.facts[field]);
    const norm = normalizeFn(val);
    return {
      document_id: d.documentId,
      document_name: d.documentName,
      original_value: norm.original,
      normalized_value: norm.normalized,
    };
  });

  const allMatch = allDocEvidence.every(e => e.normalized_value === firstNorm.normalized);

  if (allMatch) {
    checks[factType].consistent++;
    findings.push({
      id: nextFindingId(),
      fact_type: factType,
      fact_label: label,
      documents: allDocEvidence,
      result: 'MATCH',
      severity: 'LOW',
      severity_reason: `All ${docsWithField.length} documents contain the same ${label}.`,
      explanation: `Consistent ${label} "${firstNorm.original}" found across all documents.`,
      recommended_action: 'No action required.',
      comparison_method: 'deterministic',
    });
  } else {
    const severity: CrossDocSeverity = (field === 'pan' || field === 'gstin') ? 'HIGH' : 'MEDIUM';
    const severityReason = severity === 'HIGH'
      ? `Critical identity mismatch: different ${label} values indicate different legal entities. This is a statutory verification failure.`
      : `${label} inconsistency detected across documents. Manual verification recommended.`;

    findings.push({
      id: nextFindingId(),
      fact_type: factType,
      fact_label: label,
      documents: allDocEvidence,
      result: 'CONFIRMED_MISMATCH',
      severity,
      severity_reason: severityReason,
      explanation: `Conflicting ${label} values detected: ${allDocEvidence.map(e => `"${e.original_value}" (${e.document_name})`).join(' vs ')}.`,
      recommended_action: severity === 'HIGH'
        ? 'Ensure all uploaded certificates belong to the same bidding legal entity. Verify with statutory records.'
        : 'Verify the correct value with the bidder and cross-check against statutory records.',
      comparison_method: 'deterministic',
    });
  }
}

/**
 * Compare string fields with normalization and fuzzy matching.
 */
function compareStringField(
  documents: DocumentWithFacts[],
  field: keyof ExtractedBidderFacts,
  label: string,
  factType: CrossDocFactType,
  compMethod: 'normalization' | 'ai_semantic',
  findings: CrossDocumentFinding[],
  checks: Record<CrossDocFactType, { total: number; consistent: number }>,
  normalizeFn: (v: string) => { original: string; normalized: string },
  isHighPriority: boolean
): void {
  const docsWithField = documents.filter(d => {
    const val = d.facts[field];
    return typeof val === 'string' && val.trim().length > 0;
  });

  if (docsWithField.length < 2) {
    if (docsWithField.length === 1) {
      checks[factType].total++;
      checks[factType].consistent++;
    }
    return;
  }

  checks[factType].total++;

  const allDocEvidence: CrossDocDocumentEvidence[] = docsWithField.map(d => {
    const val = String(d.facts[field]);
    const norm = normalizeFn(val);
    return {
      document_id: d.documentId,
      document_name: d.documentName,
      original_value: norm.original,
      normalized_value: norm.normalized,
    };
  });

  // Check if all normalized values are identical
  const firstNorm = allDocEvidence[0].normalized_value;
  const allExactMatch = allDocEvidence.every(e => e.normalized_value === firstNorm);

  if (allExactMatch) {
    checks[factType].consistent++;
    findings.push({
      id: nextFindingId(),
      fact_type: factType,
      fact_label: label,
      documents: allDocEvidence,
      result: 'MATCH',
      severity: 'LOW',
      severity_reason: `All documents contain equivalent ${label} values after normalization.`,
      explanation: `Consistent ${label} found across all documents (minor formatting differences normalized).`,
      recommended_action: 'No action required.',
      comparison_method: compMethod,
    });
    return;
  }

  // Check similarity between pairs
  const similarities: number[] = [];
  for (let i = 1; i < allDocEvidence.length; i++) {
    const sim = calculateEntitySimilarity(
      allDocEvidence[0].normalized_value,
      allDocEvidence[i].normalized_value
    );
    similarities.push(sim);
  }

  const minSimilarity = Math.min(...similarities);
  const avgSimilarity = similarities.reduce((a, b) => a + b, 0) / similarities.length;

  if (minSimilarity >= 0.8) {
    // High similarity — likely formatting variation
    checks[factType].consistent++;
    findings.push({
      id: nextFindingId(),
      fact_type: factType,
      fact_label: label,
      documents: allDocEvidence,
      result: 'PARTIAL_MATCH',
      severity: 'LOW',
      severity_reason: `${label} values are highly similar (${(avgSimilarity * 100).toFixed(0)}% match) — likely formatting variations of the same entity.`,
      explanation: `Minor variations in ${label}: ${allDocEvidence.map(e => `"${e.original_value}"`).join(', ')}. These appear to be formatting differences.`,
      recommended_action: 'Low risk. Verify if variations are acceptable abbreviations of the same entity.',
      comparison_method: compMethod,
    });
  } else if (minSimilarity >= 0.5) {
    // Moderate similarity — potential mismatch
    findings.push({
      id: nextFindingId(),
      fact_type: factType,
      fact_label: label,
      documents: allDocEvidence,
      result: 'POTENTIAL_MISMATCH',
      severity: isHighPriority ? 'MEDIUM' : 'LOW',
      severity_reason: `${label} values show moderate similarity (${(avgSimilarity * 100).toFixed(0)}% match). This may indicate entity name variations or a genuine discrepancy.`,
      explanation: `Potential inconsistency in ${label}: ${allDocEvidence.map(e => `"${e.original_value}" (${e.document_name})`).join(' vs ')}.`,
      recommended_action: 'Manual verification required. Confirm whether these refer to the same entity.',
      comparison_method: compMethod,
    });
  } else {
    // Low similarity — likely mismatch
    findings.push({
      id: nextFindingId(),
      fact_type: factType,
      fact_label: label,
      documents: allDocEvidence,
      result: 'CONFIRMED_MISMATCH',
      severity: isHighPriority ? 'HIGH' : 'MEDIUM',
      severity_reason: isHighPriority
        ? `Critical: ${label} values are significantly different (${(avgSimilarity * 100).toFixed(0)}% match), suggesting documents may belong to different entities.`
        : `${label} values differ significantly across documents.`,
      explanation: `Conflicting ${label}: ${allDocEvidence.map(e => `"${e.original_value}" (${e.document_name})`).join(' vs ')}.`,
      recommended_action: isHighPriority
        ? 'Verify entity identity. Request Board Resolution or name-change documentation from bidder.'
        : 'Verify the correct value with the bidder.',
      comparison_method: compMethod,
    });
  }
}

/**
 * Compare financial fields (turnover, net worth) deterministically.
 */
function compareFinancialField(
  documents: DocumentWithFacts[],
  findings: CrossDocumentFinding[],
  checks: Record<CrossDocFactType, { total: number; consistent: number }>
): void {
  // Group by financial year
  const fyMap = new Map<string, DocumentWithFacts[]>();
  for (const doc of documents) {
    if (doc.facts.turnover != null && doc.facts.turnover > 0) {
      const fy = doc.facts.financialYear || 'Latest FY';
      if (!fyMap.has(fy)) fyMap.set(fy, []);
      fyMap.get(fy)!.push(doc);
    }
  }

  for (const [fy, docsInFy] of fyMap) {
    if (docsInFy.length < 2) {
      checks.financial.total++;
      checks.financial.consistent++;
      continue;
    }

    checks.financial.total++;

    const allDocEvidence: CrossDocDocumentEvidence[] = docsInFy.map(d => {
      const amountNorm = normalizeAmount(String(d.facts.turnover));
      return {
        document_id: d.documentId,
        document_name: d.documentName,
        original_value: `₹${d.facts.turnover} ${d.facts.turnoverUnit || 'Cr'} (${fy})`,
        normalized_value: amountNorm.normalized,
      };
    });

    const baseValue = parseFloat(allDocEvidence[0].normalized_value);
    const allMatch = allDocEvidence.every(e => {
      const val = parseFloat(e.normalized_value);
      return Math.abs(val - baseValue) <= 0.5; // ₹0.5 Cr tolerance
    });

    if (allMatch) {
      checks.financial.consistent++;
      findings.push({
        id: nextFindingId(),
        fact_type: 'financial',
        fact_label: `Turnover (${fy})`,
        documents: allDocEvidence,
        result: 'MATCH',
        severity: 'LOW',
        severity_reason: 'Turnover values are consistent across all documents.',
        explanation: `Consistent turnover of ₹${docsInFy[0].facts.turnover} Cr for ${fy} across all documents.`,
        recommended_action: 'No action required.',
        comparison_method: 'deterministic',
      });
    } else {
      findings.push({
        id: nextFindingId(),
        fact_type: 'financial',
        fact_label: `Turnover (${fy})`,
        documents: allDocEvidence,
        result: 'CONFIRMED_MISMATCH',
        severity: 'HIGH',
        severity_reason: 'Financial value mismatch: different turnover figures for the same financial year. Auditors require 100% concordance between CA certificates and audited statements.',
        explanation: `Conflicting turnover values for ${fy}: ${allDocEvidence.map(e => `${e.original_value} (${e.document_name})`).join(' vs ')}.`,
        recommended_action: 'Reconcile figures with statutory Form 3CA/3CD. Submit final UDIN-verified audit statement.',
        comparison_method: 'deterministic',
      });
    }
  }

  // Net worth comparison
  const netWorthDocs = documents.filter(d => d.facts.netWorth != null && d.facts.netWorth > 0);
  if (netWorthDocs.length >= 2) {
    checks.financial.total++;

    const allDocEvidence: CrossDocDocumentEvidence[] = netWorthDocs.map(d => ({
      document_id: d.documentId,
      document_name: d.documentName,
      original_value: `₹${d.facts.netWorth} Cr`,
      normalized_value: String(d.facts.netWorth),
    }));

    const baseNW = netWorthDocs[0].facts.netWorth!;
    const allMatch = netWorthDocs.every(d => Math.abs(d.facts.netWorth! - baseNW) <= 0.5);

    if (allMatch) {
      checks.financial.consistent++;
      findings.push({
        id: nextFindingId(),
        fact_type: 'financial',
        fact_label: 'Net Worth',
        documents: allDocEvidence,
        result: 'MATCH',
        severity: 'LOW',
        severity_reason: 'Net worth values are consistent.',
        explanation: `Consistent net worth of ₹${baseNW} Cr across documents.`,
        recommended_action: 'No action required.',
        comparison_method: 'deterministic',
      });
    } else {
      findings.push({
        id: nextFindingId(),
        fact_type: 'financial',
        fact_label: 'Net Worth',
        documents: allDocEvidence,
        result: 'CONFIRMED_MISMATCH',
        severity: 'HIGH',
        severity_reason: 'Net worth mismatch across documents is a critical financial integrity issue.',
        explanation: `Conflicting net worth values: ${allDocEvidence.map(e => `${e.original_value} (${e.document_name})`).join(' vs ')}.`,
        recommended_action: 'Request reconciled net worth statement certified by statutory auditor.',
        comparison_method: 'deterministic',
      });
    }
  }
}

/**
 * Compare experience/project fields.
 */
function compareExperienceFields(
  documents: DocumentWithFacts[],
  findings: CrossDocumentFinding[],
  checks: Record<CrossDocFactType, { total: number; consistent: number }>
): void {
  const allExperiences: Array<{
    doc: DocumentWithFacts;
    exp: NonNullable<ExtractedBidderFacts['experiences']>[number];
  }> = [];

  for (const doc of documents) {
    if (doc.facts.experiences) {
      for (const exp of doc.facts.experiences) {
        allExperiences.push({ doc, exp });
      }
    }
  }

  if (allExperiences.length < 2) {
    if (allExperiences.length === 1) {
      checks.experience.total++;
      checks.experience.consistent++;
    }
    return;
  }

  // Group by similar project name
  const processed = new Set<number>();
  for (let i = 0; i < allExperiences.length; i++) {
    if (processed.has(i)) continue;

    const group = [allExperiences[i]];
    processed.add(i);

    for (let j = i + 1; j < allExperiences.length; j++) {
      if (processed.has(j)) continue;

      const nameA = normalizeEntityName(allExperiences[i].exp.projectName || '').normalized;
      const nameB = normalizeEntityName(allExperiences[j].exp.projectName || '').normalized;
      const sim = calculateEntitySimilarity(nameA, nameB);

      if (sim >= 0.5) {
        group.push(allExperiences[j]);
        processed.add(j);
      }
    }

    if (group.length >= 2) {
      checks.experience.total++;

      // Compare contract values within group
      const withValues = group.filter(g => g.exp.contractValue != null);
      if (withValues.length >= 2) {
        const baseVal = withValues[0].exp.contractValue!;
        const allMatch = withValues.every(g => Math.abs(g.exp.contractValue! - baseVal) <= 0.5);

        const evidence: CrossDocDocumentEvidence[] = group.map(g => ({
          document_id: g.doc.documentId,
          document_name: g.doc.documentName,
          original_value: `${g.exp.projectName || 'Project'}: ₹${g.exp.contractValue ?? 'N/A'} Cr`,
          normalized_value: String(g.exp.contractValue ?? ''),
        }));

        if (allMatch) {
          checks.experience.consistent++;
          findings.push({
            id: nextFindingId(),
            fact_type: 'experience',
            fact_label: `Project: ${group[0].exp.projectName || 'Similar Work'}`,
            documents: evidence,
            result: 'MATCH',
            severity: 'LOW',
            severity_reason: 'Same project referenced with consistent contract values.',
            explanation: `Project "${group[0].exp.projectName}" consistently valued at ₹${baseVal} Cr.`,
            recommended_action: 'No action required.',
            comparison_method: 'deterministic',
          });
        } else {
          findings.push({
            id: nextFindingId(),
            fact_type: 'experience',
            fact_label: `Project: ${group[0].exp.projectName || 'Similar Work'}`,
            documents: evidence,
            result: 'POTENTIAL_MISMATCH',
            severity: 'MEDIUM',
            severity_reason: 'Same project appears with different contract values across documents.',
            explanation: `Project "${group[0].exp.projectName}" has different contract values: ${evidence.map(e => e.original_value).join(' vs ')}.`,
            recommended_action: 'Verify actual contract value with client completion certificate.',
            comparison_method: 'normalization',
          });
        }
      } else {
        checks.experience.consistent++;
      }
    }
  }

  // If no groups were formed, count individual experience entries as consistent
  if (checks.experience.total === 0 && allExperiences.length > 0) {
    checks.experience.total = 1;
    checks.experience.consistent = 1;
  }
}

/**
 * Compare certification fields and validate expiry dates.
 */
function compareCertificationFields(
  documents: DocumentWithFacts[],
  findings: CrossDocumentFinding[],
  checks: Record<CrossDocFactType, { total: number; consistent: number }>,
  bidDeadline?: string
): void {
  const allCerts: Array<{
    doc: DocumentWithFacts;
    cert: NonNullable<ExtractedBidderFacts['certifications']>[number];
  }> = [];

  for (const doc of documents) {
    if (doc.facts.certifications) {
      for (const cert of doc.facts.certifications) {
        allCerts.push({ doc, cert });
      }
    }
  }

  // Check certificate expiry against bid deadline
  const refDate = bidDeadline ? new Date(bidDeadline) : new Date();

  for (const { doc, cert } of allCerts) {
    if (cert.expiryDate) {
      checks.certification.total++;

      const dateNorm = normalizeDate(cert.expiryDate);
      const expiryParsed = new Date(dateNorm.normalized);

      if (!isNaN(expiryParsed.getTime())) {
        const isValid = expiryParsed.getTime() >= refDate.getTime();

        const evidence: CrossDocDocumentEvidence = {
          document_id: doc.documentId,
          document_name: doc.documentName,
          original_value: `${cert.certificateName || 'Certificate'}: Expires ${cert.expiryDate}`,
          normalized_value: dateNorm.normalized,
        };

        if (isValid) {
          checks.certification.consistent++;
          findings.push({
            id: nextFindingId(),
            fact_type: 'date',
            fact_label: `${cert.certificateName || 'Certificate'} Validity`,
            documents: [evidence],
            result: 'MATCH',
            severity: 'LOW',
            severity_reason: 'Certificate is valid as of the tender submission deadline.',
            explanation: `"${cert.certificateName}" expires on ${cert.expiryDate}, which is after the submission deadline (${refDate.toISOString().split('T')[0]}). Certificate is valid.`,
            recommended_action: 'No action required.',
            comparison_method: 'deterministic',
          });
        } else {
          findings.push({
            id: nextFindingId(),
            fact_type: 'date',
            fact_label: `${cert.certificateName || 'Certificate'} Validity`,
            documents: [evidence],
            result: 'CONFIRMED_MISMATCH',
            severity: 'HIGH',
            severity_reason: 'Expired certificate: validity ended before the tender submission deadline. This is a mandatory compliance violation.',
            explanation: `"${cert.certificateName}" expired on ${cert.expiryDate}, which is BEFORE the submission deadline (${refDate.toISOString().split('T')[0]}).`,
            recommended_action: 'Upload active renewal certificate or official renewal receipt before bid submission.',
            comparison_method: 'deterministic',
          });
        }
      } else {
        // Cannot parse date
        findings.push({
          id: nextFindingId(),
          fact_type: 'date',
          fact_label: `${cert.certificateName || 'Certificate'} Validity`,
          documents: [{
            document_id: doc.documentId,
            document_name: doc.documentName,
            original_value: `Expiry: ${cert.expiryDate}`,
            normalized_value: dateNorm.normalized,
          }],
          result: 'REQUIRES_MANUAL_REVIEW',
          severity: 'MEDIUM',
          severity_reason: 'Unable to parse the certificate expiry date format for automated validation.',
          explanation: `Cannot automatically validate expiry date "${cert.expiryDate}" for "${cert.certificateName}". Manual review required.`,
          recommended_action: 'Manually verify the certificate expiry date against the tender submission deadline.',
          comparison_method: 'deterministic',
        });
      }
    }
  }

  // Compare certificate numbers across docs with same cert name
  const certsByName = new Map<string, typeof allCerts>();
  for (const entry of allCerts) {
    const name = (entry.cert.certificateName || '').toLowerCase().trim();
    if (!name) continue;
    if (!certsByName.has(name)) certsByName.set(name, []);
    certsByName.get(name)!.push(entry);
  }

  for (const [certName, entries] of certsByName) {
    if (entries.length >= 2) {
      const withNumbers = entries.filter(e => e.cert.certificateNumber);
      if (withNumbers.length >= 2) {
        checks.certification.total++;
        const firstNum = withNumbers[0].cert.certificateNumber!.replace(/[\s\-]/g, '').toUpperCase();
        const allMatch = withNumbers.every(e =>
          e.cert.certificateNumber!.replace(/[\s\-]/g, '').toUpperCase() === firstNum
        );

        const evidence: CrossDocDocumentEvidence[] = withNumbers.map(e => ({
          document_id: e.doc.documentId,
          document_name: e.doc.documentName,
          original_value: `${e.cert.certificateName}: ${e.cert.certificateNumber}`,
          normalized_value: e.cert.certificateNumber!.replace(/[\s\-]/g, '').toUpperCase(),
        }));

        if (allMatch) {
          checks.certification.consistent++;
          findings.push({
            id: nextFindingId(),
            fact_type: 'certification',
            fact_label: `${certName} Certificate Number`,
            documents: evidence,
            result: 'MATCH',
            severity: 'LOW',
            severity_reason: 'Same certificate number across all documents referencing this certification.',
            explanation: `Consistent certificate number for "${certName}".`,
            recommended_action: 'No action required.',
            comparison_method: 'deterministic',
          });
        } else {
          findings.push({
            id: nextFindingId(),
            fact_type: 'certification',
            fact_label: `${certName} Certificate Number`,
            documents: evidence,
            result: 'POTENTIAL_MISMATCH',
            severity: 'MEDIUM',
            severity_reason: 'Different certificate numbers found for the same certification type. May indicate a renewed or different certificate.',
            explanation: `Different certificate numbers for "${certName}": ${evidence.map(e => `"${e.original_value}" (${e.document_name})`).join(' vs ')}.`,
            recommended_action: 'Verify that the correct and current certificate is being referenced.',
            comparison_method: 'deterministic',
          });
        }
      }
    }
  }

  // If no certification checks were made, ensure at least 1 consistent
  if (checks.certification.total === 0 && allCerts.length > 0) {
    checks.certification.total = 1;
    checks.certification.consistent = 1;
  }
}

/**
 * Compare a date field across documents for consistency.
 */
function compareDateField(
  documents: DocumentWithFacts[],
  field: keyof ExtractedBidderFacts,
  label: string,
  factType: CrossDocFactType,
  findings: CrossDocumentFinding[],
  checks: Record<CrossDocFactType, { total: number; consistent: number }>,
  bidDeadline?: string
): void {
  const docsWithField = documents.filter(d => {
    const val = d.facts[field];
    return typeof val === 'string' && val.trim().length > 0;
  });

  if (docsWithField.length < 1) return;

  // Check validity against bid deadline
  if (docsWithField.length >= 1 && bidDeadline && label.toLowerCase().includes('expiry')) {
    const refDate = new Date(bidDeadline);

    for (const doc of docsWithField) {
      const val = String(doc.facts[field]);
      const dateNorm = normalizeDate(val);
      const parsed = new Date(dateNorm.normalized);

      if (!isNaN(parsed.getTime())) {
        checks[factType].total++;
        const isValid = parsed.getTime() >= refDate.getTime();

        if (isValid) {
          checks[factType].consistent++;
        } else {
          findings.push({
            id: nextFindingId(),
            fact_type: 'date',
            fact_label: label,
            documents: [{
              document_id: doc.documentId,
              document_name: doc.documentName,
              original_value: dateNorm.original,
              normalized_value: dateNorm.normalized,
            }],
            result: 'CONFIRMED_MISMATCH',
            severity: 'HIGH',
            severity_reason: `${label} is before the tender submission deadline (${refDate.toISOString().split('T')[0]}). Registration may have expired.`,
            explanation: `${label} is ${dateNorm.original}, which is BEFORE the submission deadline.`,
            recommended_action: 'Renew registration before bid submission.',
            comparison_method: 'deterministic',
          });
        }
      }
    }
  }

  // Cross-doc date consistency
  if (docsWithField.length >= 2) {
    checks[factType].total++;

    const allDocEvidence: CrossDocDocumentEvidence[] = docsWithField.map(d => {
      const val = String(d.facts[field]);
      const norm = normalizeDate(val);
      return {
        document_id: d.documentId,
        document_name: d.documentName,
        original_value: norm.original,
        normalized_value: norm.normalized,
      };
    });

    const firstNorm = allDocEvidence[0].normalized_value;
    const allMatch = allDocEvidence.every(e => e.normalized_value === firstNorm);

    if (allMatch) {
      checks[factType].consistent++;
    } else {
      findings.push({
        id: nextFindingId(),
        fact_type: 'date',
        fact_label: label,
        documents: allDocEvidence,
        result: 'POTENTIAL_MISMATCH',
        severity: 'MEDIUM',
        severity_reason: `Different ${label} values across documents. May indicate format differences or genuinely conflicting dates.`,
        explanation: `Inconsistent ${label}: ${allDocEvidence.map(e => `"${e.original_value}" (${e.document_name})`).join(' vs ')}.`,
        recommended_action: 'Verify the correct date with the issuing authority.',
        comparison_method: 'deterministic',
      });
    }
  }
}

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

function calcCategoryScore(category: { total: number; consistent: number }): CrossDocumentCategoryScore {
  if (category.total === 0) {
    return { total_checks: 0, consistent_checks: 0, percentage: 100 };
  }
  return {
    total_checks: category.total,
    consistent_checks: category.consistent,
    percentage: Math.round((category.consistent / category.total) * 100),
  };
}

function createEmptySummary(docCount: number): CrossDocumentSummary {
  const emptyScore: CrossDocumentCategoryScore = { total_checks: 0, consistent_checks: 0, percentage: 100 };
  return {
    identity: { ...emptyScore },
    registration: { ...emptyScore },
    financial: { ...emptyScore },
    experience: { ...emptyScore },
    certification: { ...emptyScore },
    overall_issues_count: 0,
    high_count: 0,
    medium_count: 0,
    low_count: 0,
    findings: [],
    analyzed_at: new Date().toISOString(),
    document_count: docCount,
  };
}
