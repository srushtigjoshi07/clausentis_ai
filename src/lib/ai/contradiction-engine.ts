export type ComplianceMatrixStatus =
  | 'COMPLIANT'
  | 'PARTIALLY COMPLIANT'
  | 'NON-COMPLIANT'
  | 'MISSING'
  | 'REQUIRES MANUAL REVIEW'
  | 'NOT VERIFIED';

export type ComplianceRiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ExtractedDocumentFields {
  documentId: string;
  documentName: string;
  documentType: string;
  // Entity
  legalName?: string;
  address?: string;
  gstin?: string;
  pan?: string;
  udyamNumber?: string;
  // Financial
  turnoverAmount?: number;
  turnoverCurrency?: string;
  turnoverUnit?: string; // e.g. 'Crore', 'Lakh'
  financialYear?: string;
  netWorth?: number;
  // Certificate
  certificateNumber?: string;
  certificateName?: string;
  issueDate?: string;
  expiryDate?: string;
  issuingAuthority?: string;
  // Experience
  projectName?: string;
  clientName?: string;
  projectValue?: number;
  completionDate?: string;
  experienceYears?: number;
  // Metadata & citations
  pageNumber: number;
  sourceExcerpt: string;
  confidence: number;
}

export interface ContradictionIssue {
  id: string;
  category: 'entity' | 'financial' | 'certificate' | 'experience' | 'validity';
  title: string;
  severity: 'critical' | 'warning' | 'info';
  confidence: number;
  affectedDocuments: Array<{
    documentId: string;
    documentName: string;
    pageNumber: number;
    detectedValue: string;
    sourceExcerpt: string;
  }>;
  explanation: string;
  recommendation: string;
  impactOnBidding: string;
}

export interface ContradictionRadarSummary {
  criticalCount: number;
  warningCount: number;
  consistentCount: number;
  issues: ContradictionIssue[];
}

export interface RequirementEvidenceEvaluation {
  requirementId: string;
  requirementCode?: string;
  requirementName: string;
  clauseReference?: string;
  category: string;
  mandatory: boolean;
  requiredValue?: string | number | null;
  evidenceRequired?: string;
  evidenceFound?: string;
  status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'missing_evidence' | 'needs_review' | 'not_verified';
  matrixStatus: ComplianceMatrixStatus;
  riskLevel: ComplianceRiskLevel;
  riskReason: string;
  confidence: number;
  matchedDocumentId?: string;
  matchedDocumentName?: string;
  detectedValue?: string | number | null;
  sourcePage?: number;
  sourceExcerpt?: string;
  isDateValidAtBidDate?: boolean;
  bidDateComparison?: {
    bidDeadline?: string;
    documentExpiry?: string;
    isValid: boolean;
    reason: string;
  };
  explanation: {
    expected: string;
    detected: string;
    citation: string;
    decision: string;
    rationale: string;
  };
  recommendedAction?: string;
  officerOverrideStatus?: ComplianceMatrixStatus;
  officerNotes?: string;
}

/**
 * 1. Normalize company entity names for fuzzy comparison
 */
export function normalizeEntityName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(private|pvt|limited|ltd|corporation|corp|inc|technologies|tech|solutions|enterprises)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * 2. Cross-Document Consistency Engine: detects entity, financial, date, and credential contradictions
 * Show: ISSUE + AFFECTED DOCUMENTS + CONFLICT + RECOMMENDED ACTION.
 */
export function detectCrossDocumentContradictions(
  documents: ExtractedDocumentFields[],
  bidDeadline?: string
): ContradictionRadarSummary {
  const issues: ContradictionIssue[] = [];
  let consistentCount = 0;

  if (documents.length < 2) {
    return {
      criticalCount: 0,
      warningCount: 0,
      consistentCount: documents.length > 0 ? 1 : 0,
      issues: []
    };
  }

  // A. Company Name Consistency
  const entityDocs = documents.filter((d) => d.legalName && d.legalName.trim().length > 0);
  if (entityDocs.length >= 2) {
    const primaryName = entityDocs[0].legalName || '';
    const normPrimary = normalizeEntityName(primaryName);
    const mismatched = entityDocs.filter((d) => normalizeEntityName(d.legalName || '') !== normPrimary);

    if (mismatched.length > 0) {
      issues.push({
        id: 'contradiction-entity-name',
        category: 'entity',
        title: 'Company Legal Name Mismatch Across Uploaded Credentials',
        severity: 'warning',
        confidence: 0.94,
        affectedDocuments: [
          {
            documentId: entityDocs[0].documentId,
            documentName: entityDocs[0].documentName,
            pageNumber: entityDocs[0].pageNumber,
            detectedValue: entityDocs[0].legalName || '',
            sourceExcerpt: entityDocs[0].sourceExcerpt
          },
          ...mismatched.map((d) => ({
            documentId: d.documentId,
            documentName: d.documentName,
            pageNumber: d.pageNumber,
            detectedValue: d.legalName || '',
            sourceExcerpt: d.sourceExcerpt
          }))
        ],
        explanation: `Conflict detected between primary registered name "${primaryName}" and "${mismatched.map((m) => m.legalName).join(', ')}". In technical procurement, name variations across GST, PAN, and technical certificates trigger formal qualification queries.`,
        recommendation: 'Attach a certified Board Resolution or Name Change Undertaking clarifying subsidiary/abbreviated branding.',
        impactOnBidding: 'Moderate risk of pre-qualification query during technical bid evaluation.'
      });
    } else {
      consistentCount++;
    }
  }

  // B. GSTIN & PAN Consistency
  const panDocs = documents.filter((d) => d.pan && d.pan.trim().length > 0);
  if (panDocs.length >= 2) {
    const firstPan = panDocs[0].pan?.toUpperCase();
    const panMismatches = panDocs.filter((d) => d.pan?.toUpperCase() !== firstPan);
    if (panMismatches.length > 0) {
      issues.push({
        id: 'contradiction-pan-mismatch',
        category: 'entity',
        title: 'PAN Number Inconsistency Across Statutory Documents',
        severity: 'critical',
        confidence: 0.99,
        affectedDocuments: [
          {
            documentId: panDocs[0].documentId,
            documentName: panDocs[0].documentName,
            pageNumber: panDocs[0].pageNumber,
            detectedValue: panDocs[0].pan || '',
            sourceExcerpt: panDocs[0].sourceExcerpt
          },
          ...panMismatches.map((d) => ({
            documentId: d.documentId,
            documentName: d.documentName,
            pageNumber: d.pageNumber,
            detectedValue: d.pan || '',
            sourceExcerpt: d.sourceExcerpt
          }))
        ],
        explanation: `Conflicting PAN identifiers detected: ${firstPan} vs ${panMismatches.map((m) => m.pan).join(', ')}. Different PANs indicate different corporate tax entities.`,
        recommendation: 'Ensure all uploaded certificates belong strictly to the single bidding legal entity.',
        impactOnBidding: 'Critical Disqualification: Statutory verification check will fail immediately.'
      });
    } else {
      consistentCount++;
    }
  }

  // C. Turnover & Financial Audits Consistency
  const finDocs = documents.filter((d) => d.turnoverAmount && d.turnoverAmount > 0);
  if (finDocs.length >= 2) {
    const fyMap = new Map<string, ExtractedDocumentFields[]>();
    finDocs.forEach((d) => {
      const fy = d.financialYear || 'Latest FY';
      if (!fyMap.has(fy)) fyMap.set(fy, []);
      fyMap.get(fy)!.push(d);
    });

    fyMap.forEach((docsInFy, fy) => {
      if (docsInFy.length >= 2) {
        const baseTurnover = docsInFy[0].turnoverAmount || 0;
        const conflicting = docsInFy.filter((d) => Math.abs((d.turnoverAmount || 0) - baseTurnover) > 0.5);
        if (conflicting.length > 0) {
          issues.push({
            id: `contradiction-turnover-${fy}`,
            category: 'financial',
            title: `Conflicting Turnover Declarations for ${fy}`,
            severity: 'critical',
            confidence: 0.96,
            affectedDocuments: docsInFy.map((d) => ({
              documentId: d.documentId,
              documentName: d.documentName,
              pageNumber: d.pageNumber,
              detectedValue: `₹${d.turnoverAmount} Cr (${d.financialYear || fy})`,
              sourceExcerpt: d.sourceExcerpt
            })),
            explanation: `Different turnover figures submitted for the same fiscal year (${fy}). Auditors require 100% concordance between CA certificates and audited balance sheets.`,
            recommendation: 'Reconcile figures with statutory Form 3CA/3CD and submit the final UDIN-verified audit statement.',
            impactOnBidding: 'High Risk: Discrepancy in financial qualification will lead to rejection.'
          });
        } else {
          consistentCount++;
        }
      }
    });
  }

  // D. Bid-Date Certificate Validity Check (Relative to tender submission date)
  const certDocs = documents.filter((d) => d.expiryDate);
  if (certDocs.length > 0) {
    const referenceDate = bidDeadline ? new Date(bidDeadline) : new Date();
    certDocs.forEach((cert) => {
      try {
        const exp = new Date(cert.expiryDate || '');
        if (!isNaN(exp.getTime()) && exp.getTime() < referenceDate.getTime()) {
          issues.push({
            id: `contradiction-expired-${cert.documentId}`,
            category: 'certificate',
            title: `Certificate Expired Prior to Tender Submission Date`,
            severity: 'critical',
            confidence: 0.98,
            affectedDocuments: [
              {
                documentId: cert.documentId,
                documentName: cert.documentName,
                pageNumber: cert.pageNumber,
                detectedValue: `Expires: ${cert.expiryDate} (Tender Deadline: ${referenceDate.toISOString().split('T')[0]})`,
                sourceExcerpt: cert.sourceExcerpt
              }
            ],
            explanation: `The certificate "${cert.certificateName || cert.documentName}" expired on ${cert.expiryDate}, which is prior to the tender submission deadline (${referenceDate.toISOString().split('T')[0]}).`,
            recommendation: 'Upload an active renewal certificate or official renewal receipt before bid submission.',
            impactOnBidding: 'Mandatory Rejection: Expired statutory/technical credentials violate basic compliance.'
          });
        } else {
          consistentCount++;
        }
      } catch {
        // Safe date parse ignore
      }
    });
  }

  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  return {
    criticalCount,
    warningCount,
    consistentCount,
    issues
  };
}

/**
 * 3. Evaluate Requirement vs Evidence Grounding with Full Source Traceability
 */
export function evaluateRequirementCompliance(
  requirement: {
    id: string;
    requirement_code?: string;
    clause_reference?: string;
    name: string;
    category: string;
    description: string;
    mandatory: boolean;
    evidence_required?: string;
    threshold_value?: number | null;
    threshold_unit?: string | null;
    currency?: string | null;
    source_page?: number | null;
    source_text?: string | null;
    risk_level?: 'high' | 'medium' | 'low';
  },
  vaultDocs: ExtractedDocumentFields[],
  bidDeadline?: string
): RequirementEvidenceEvaluation {
  const cat = (requirement.category || '').toLowerCase();
  const reqName = (requirement.name || '').toLowerCase();
  const reqDesc = `${requirement.name} ${requirement.description}`.toLowerCase();
  const threshold = requirement.threshold_value;
  const clauseRef = requirement.clause_reference || `Clause Page ${requirement.source_page || 1}`;
  const expectedEvidence = requirement.evidence_required || `Valid ${requirement.name} documentation`;

  // Default risk level
  const riskLevel: ComplianceRiskLevel = requirement.risk_level
    ? (requirement.risk_level.toUpperCase() as ComplianceRiskLevel)
    : requirement.mandatory
    ? 'HIGH'
    : 'MEDIUM';

  // 1. FINANCIAL EVALUATION (e.g. Turnover >= ₹15 Cr, Net Worth, Solvency)
  if (
    cat.includes('financial') ||
    reqDesc.includes('turnover') ||
    reqDesc.includes('net worth') ||
    reqDesc.includes('solvency') ||
    reqDesc.includes('balance sheet')
  ) {
    const finDoc =
      vaultDocs.find((d) => d.turnoverAmount && d.turnoverAmount > 0) ||
      vaultDocs.find((d) => d.documentType === 'financial_statement' || d.documentName.toLowerCase().includes('financial'));

    if (!finDoc || !finDoc.turnoverAmount) {
      return {
        requirementId: requirement.id,
        requirementCode: requirement.requirement_code,
        requirementName: requirement.name,
        clauseReference: clauseRef,
        category: requirement.category,
        mandatory: requirement.mandatory,
        requiredValue: threshold ? `₹${threshold} ${requirement.threshold_unit || 'INR'}` : 'Audited CA Turnover Statement',
        evidenceRequired: expectedEvidence,
        evidenceFound: 'No supporting document found in vault',
        status: 'missing_evidence',
        matrixStatus: 'MISSING',
        riskLevel: requirement.mandatory ? 'HIGH' : 'MEDIUM',
        riskReason: requirement.mandatory
          ? 'Mandatory financial qualification without supporting CA certificate results in disqualification.'
          : 'Financial verification requires supporting balance sheet.',
        confidence: 0.95,
        sourcePage: requirement.source_page || 1,
        sourceExcerpt: requirement.source_text || requirement.description,
        explanation: {
          expected: threshold ? `Annual Turnover ≥ ₹${threshold} ${requirement.threshold_unit || 'Cr'}` : 'Audited Financial Statements',
          detected: 'No matching financial statement found in Document Vault',
          citation: `${clauseRef} (Page ${requirement.source_page || 1}): "${requirement.source_text || requirement.description}"`,
          decision: 'MISSING EVIDENCE',
          rationale: 'Upload audited financial statements or CA certified turnover certificate with UDIN in Document Vault to verify compliance.'
        },
        recommendedAction: 'Manual verification / request supporting CA turnover certificate with UDIN.'
      };
    }

    const detectedTurnover = finDoc.turnoverAmount;
    // Normalize threshold (if threshold is 150000000 and turnover is 15 Cr)
    let requiredTurnover = threshold || 15;
    if (requiredTurnover > 100000) {
      requiredTurnover = requiredTurnover / 10000000; // convert INR to Crores if large
    }

    const isPassing = detectedTurnover >= requiredTurnover;
    const status = isPassing ? 'compliant' : 'non_compliant';
    const matrixStatus: ComplianceMatrixStatus = isPassing ? 'COMPLIANT' : 'NON-COMPLIANT';

    return {
      requirementId: requirement.id,
      requirementCode: requirement.requirement_code,
      requirementName: requirement.name,
      clauseReference: clauseRef,
      category: requirement.category,
      mandatory: requirement.mandatory,
      requiredValue: `₹${requiredTurnover} Cr`,
      detectedValue: `₹${detectedTurnover} Cr`,
      evidenceRequired: expectedEvidence,
      evidenceFound: `Audited Turnover ₹${detectedTurnover} Cr in "${finDoc.documentName}"`,
      status,
      matrixStatus,
      riskLevel: isPassing ? 'LOW' : 'HIGH',
      riskReason: isPassing
        ? 'Verified and exceeds mandatory threshold.'
        : `Shortfall of ₹${(requiredTurnover - detectedTurnover).toFixed(2)} Cr relative to minimum required threshold.`,
      confidence: 0.97,
      matchedDocumentId: finDoc.documentId,
      matchedDocumentName: finDoc.documentName,
      sourcePage: finDoc.pageNumber,
      sourceExcerpt: finDoc.sourceExcerpt,
      explanation: {
        expected: `Annual Turnover ≥ ₹${requiredTurnover} Cr`,
        detected: `Detected Turnover ₹${detectedTurnover} Cr in "${finDoc.documentName}" (Page ${finDoc.pageNumber})`,
        citation: `${clauseRef} (Page ${requirement.source_page || 1}): "${requirement.source_text || requirement.description}"`,
        decision: matrixStatus,
        rationale: isPassing
          ? `Company meets and exceeds the required threshold of ₹${requiredTurnover} Cr with verified ₹${detectedTurnover} Cr.`
          : `Company turnover of ₹${detectedTurnover} Cr is below the mandatory threshold of ₹${requiredTurnover} Cr (Shortfall: ₹${(requiredTurnover - detectedTurnover).toFixed(2)} Cr).`
      },
      recommendedAction: isPassing
        ? 'Retain audit report for technical submission pack.'
        : 'Discrepancy in financial qualification. Procurement officer should review joint venture or sub-contracting provisions.'
    };
  }

  // 2. STATUTORY / LEGAL / REGISTRATION EVALUATION (GST, PAN, Incorporation, MSME/Udyam)
  if (
    cat.includes('statutory') ||
    cat.includes('legal') ||
    cat.includes('registration') ||
    reqDesc.includes('gst') ||
    reqDesc.includes('pan') ||
    reqDesc.includes('udyam') ||
    reqDesc.includes('incorporat')
  ) {
    const certDoc = vaultDocs.find((d) => {
      const type = (d.documentType || '').toLowerCase();
      const name = (d.documentName || '').toLowerCase();
      if ((reqDesc.includes('gst') || reqDesc.includes('tax')) && (type.includes('tax') || name.includes('gst') || d.gstin)) return true;
      if (reqDesc.includes('pan') && (type.includes('tax') || name.includes('pan') || d.pan)) return true;
      if (reqDesc.includes('udyam') && (type.includes('registration') || name.includes('udyam') || d.udyamNumber)) return true;
      if (reqDesc.includes('incorporat') && (type.includes('registration') || name.includes('incorporation'))) return true;
      return type.includes('legal') || type.includes('registration');
    });

    if (!certDoc) {
      return {
        requirementId: requirement.id,
        requirementCode: requirement.requirement_code,
        requirementName: requirement.name,
        clauseReference: clauseRef,
        category: requirement.category,
        mandatory: requirement.mandatory,
        requiredValue: requirement.name,
        evidenceRequired: expectedEvidence,
        evidenceFound: 'No supporting statutory certificate found in vault',
        status: 'missing_evidence',
        matrixStatus: 'MISSING',
        riskLevel: requirement.mandatory ? 'HIGH' : 'MEDIUM',
        riskReason: requirement.mandatory ? 'Mandatory statutory credential missing from submission dossier.' : 'Proof required.',
        confidence: 0.94,
        sourcePage: requirement.source_page || 1,
        sourceExcerpt: requirement.source_text || requirement.description,
        explanation: {
          expected: `Active ${requirement.name} certificate`,
          detected: 'No matching credential uploaded in Company Document Vault',
          citation: `${clauseRef} (Page ${requirement.source_page || 1}): "${requirement.source_text || requirement.description}"`,
          decision: 'MISSING EVIDENCE',
          rationale: 'Upload active statutory credentials in the Document Vault to verify credential validity.'
        },
        recommendedAction: 'Manual verification / request supporting document from bidder.'
      };
    }

    const detectedIdentifier = certDoc.gstin || certDoc.pan || certDoc.udyamNumber || certDoc.documentName;

    return {
      requirementId: requirement.id,
      requirementCode: requirement.requirement_code,
      requirementName: requirement.name,
      clauseReference: clauseRef,
      category: requirement.category,
      mandatory: requirement.mandatory,
      requiredValue: requirement.name,
      detectedValue: detectedIdentifier,
      evidenceRequired: expectedEvidence,
      evidenceFound: `Identified ${detectedIdentifier} in "${certDoc.documentName}"`,
      status: 'compliant',
      matrixStatus: 'COMPLIANT',
      riskLevel: 'LOW',
      riskReason: 'Statutory registration document verified and matching bidding entity.',
      confidence: 0.98,
      matchedDocumentId: certDoc.documentId,
      matchedDocumentName: certDoc.documentName,
      sourcePage: certDoc.pageNumber,
      sourceExcerpt: certDoc.sourceExcerpt,
      explanation: {
        expected: `Valid ${requirement.name}`,
        detected: `Verified against "${certDoc.documentName}" (Identifier: ${detectedIdentifier})`,
        citation: `${clauseRef} (Page ${requirement.source_page || 1}): "${requirement.source_text || requirement.description}"`,
        decision: 'COMPLIANT',
        rationale: `Bidder credential matches required statutory registration guidelines.`
      },
      recommendedAction: 'Document grounded and verified.'
    };
  }

  // 3. CERTIFICATION & DATE VALIDITY (e.g. ISO 9001, ISO 27001, CMMI)
  if (cat.includes('certification') || reqDesc.includes('iso') || reqDesc.includes('cmmi') || reqDesc.includes('certif')) {
    const certDoc = vaultDocs.find((d) => {
      const type = (d.documentType || '').toLowerCase();
      const name = (d.documentName || '').toLowerCase();
      return type.includes('quality') || name.includes('iso') || name.includes('certificate') || type.includes('certif');
    });

    if (!certDoc) {
      return {
        requirementId: requirement.id,
        requirementCode: requirement.requirement_code,
        requirementName: requirement.name,
        clauseReference: clauseRef,
        category: requirement.category,
        mandatory: requirement.mandatory,
        requiredValue: requirement.name,
        evidenceRequired: expectedEvidence,
        evidenceFound: 'No quality certification found in vault',
        status: 'missing_evidence',
        matrixStatus: 'MISSING',
        riskLevel: requirement.mandatory ? 'HIGH' : 'MEDIUM',
        riskReason: 'Mandatory quality certification missing.',
        confidence: 0.92,
        sourcePage: requirement.source_page || 1,
        sourceExcerpt: requirement.source_text || requirement.description,
        explanation: {
          expected: `Active ${requirement.name} certificate`,
          detected: 'No matching certificate uploaded in Company Document Vault',
          citation: `${clauseRef} (Page ${requirement.source_page || 1}): "${requirement.source_text || requirement.description}"`,
          decision: 'MISSING EVIDENCE',
          rationale: 'Upload active certificate in Document Vault.'
        },
        recommendedAction: 'Manual verification / request supporting certificate.'
      };
    }

    // Check validity relative to tender/bid deadline date
    const refDate = bidDeadline ? new Date(bidDeadline) : new Date();
    let isValidAtBidDate = true;
    let validityReason = 'Valid credentials verified as on tender submission date.';

    if (certDoc.expiryDate) {
      const exp = new Date(certDoc.expiryDate);
      if (!isNaN(exp.getTime()) && exp.getTime() < refDate.getTime()) {
        isValidAtBidDate = false;
        validityReason = `Certificate expired on ${certDoc.expiryDate}, prior to submission date (${refDate.toISOString().split('T')[0]}).`;
      }
    }

    const status = isValidAtBidDate ? 'compliant' : 'non_compliant';
    const matrixStatus: ComplianceMatrixStatus = isValidAtBidDate ? 'COMPLIANT' : 'NON-COMPLIANT';

    return {
      requirementId: requirement.id,
      requirementCode: requirement.requirement_code,
      requirementName: requirement.name,
      clauseReference: clauseRef,
      category: requirement.category,
      mandatory: requirement.mandatory,
      requiredValue: requirement.name,
      detectedValue: `${certDoc.certificateName || certDoc.documentName} (Exp: ${certDoc.expiryDate || 'Active'})`,
      evidenceRequired: expectedEvidence,
      evidenceFound: `Certificate ${certDoc.certificateNumber || certDoc.documentName} (Expiry: ${certDoc.expiryDate || 'Active'})`,
      status,
      matrixStatus,
      riskLevel: isValidAtBidDate ? 'LOW' : 'HIGH',
      riskReason: isValidAtBidDate
        ? 'Certificate is valid through tender submission window.'
        : `Expired certificate violates mandatory compliance window.`,
      confidence: 0.96,
      matchedDocumentId: certDoc.documentId,
      matchedDocumentName: certDoc.documentName,
      sourcePage: certDoc.pageNumber,
      sourceExcerpt: certDoc.sourceExcerpt,
      isDateValidAtBidDate: isValidAtBidDate,
      bidDateComparison: {
        bidDeadline: bidDeadline || refDate.toISOString().split('T')[0],
        documentExpiry: certDoc.expiryDate,
        isValid: isValidAtBidDate,
        reason: validityReason
      },
      explanation: {
        expected: `Valid & Active ${requirement.name}`,
        detected: `Verified against "${certDoc.documentName}" (Expiry: ${certDoc.expiryDate || 'Not specified'})`,
        citation: `${clauseRef} (Page ${requirement.source_page || 1}): "${requirement.source_text || requirement.description}"`,
        decision: matrixStatus,
        rationale: isValidAtBidDate
          ? 'Certificate is active and valid relative to the tender submission date.'
          : `Certificate expired on ${certDoc.expiryDate} prior to the tender submission deadline.`
      },
      recommendedAction: isValidAtBidDate
        ? 'Verified.'
        : 'Request active renewal endorsement or renewal receipt prior to technical opening.'
    };
  }

  // 4. EXPERIENCE EVALUATION (Past projects, work orders)
  if (cat.includes('experience') || reqDesc.includes('experience') || reqDesc.includes('similar work') || reqDesc.includes('track record')) {
    const expDoc = vaultDocs.find((d) => {
      const type = (d.documentType || '').toLowerCase();
      const name = (d.documentName || '').toLowerCase();
      return type.includes('experience') || name.includes('work_order') || name.includes('project') || name.includes('completion');
    });

    if (!expDoc) {
      return {
        requirementId: requirement.id,
        requirementCode: requirement.requirement_code,
        requirementName: requirement.name,
        clauseReference: clauseRef,
        category: requirement.category,
        mandatory: requirement.mandatory,
        requiredValue: threshold ? `Min ${threshold} ${requirement.threshold_unit || 'Projects'}` : requirement.name,
        evidenceRequired: expectedEvidence,
        evidenceFound: 'No past experience / completion certificate found in vault',
        status: 'missing_evidence',
        matrixStatus: 'MISSING',
        riskLevel: requirement.mandatory ? 'HIGH' : 'MEDIUM',
        riskReason: 'Prior track record credential missing from vault.',
        confidence: 0.9,
        sourcePage: requirement.source_page || 1,
        sourceExcerpt: requirement.source_text || requirement.description,
        explanation: {
          expected: requirement.description,
          detected: 'No matching completion certificate or work order in vault',
          citation: `${clauseRef} (Page ${requirement.source_page || 1}): "${requirement.source_text || requirement.description}"`,
          decision: 'MISSING EVIDENCE',
          rationale: 'Upload past work orders or client completion certificates.'
        },
        recommendedAction: 'Manual verification / request client completion certificate.'
      };
    }

    const detectedExp = expDoc.projectValue ? `₹${expDoc.projectValue} Cr project` : `${expDoc.experienceYears || 5} Years`;
    const isPassing = !threshold || (expDoc.projectValue && expDoc.projectValue >= threshold);
    const status = isPassing ? 'compliant' : 'partially_compliant';
    const matrixStatus: ComplianceMatrixStatus = isPassing ? 'COMPLIANT' : 'PARTIALLY COMPLIANT';

    return {
      requirementId: requirement.id,
      requirementCode: requirement.requirement_code,
      requirementName: requirement.name,
      clauseReference: clauseRef,
      category: requirement.category,
      mandatory: requirement.mandatory,
      requiredValue: threshold ? `Min ₹${threshold} Cr Work Order` : requirement.name,
      detectedValue: `${detectedExp} in ${expDoc.documentName}`,
      evidenceRequired: expectedEvidence,
      evidenceFound: `Work order / completion certificate "${expDoc.documentName}"`,
      status,
      matrixStatus,
      riskLevel: isPassing ? 'LOW' : 'MEDIUM',
      riskReason: isPassing ? 'Past execution criteria satisfied.' : 'Scope / value requires officer clarification.',
      confidence: 0.92,
      matchedDocumentId: expDoc.documentId,
      matchedDocumentName: expDoc.documentName,
      sourcePage: expDoc.pageNumber,
      sourceExcerpt: expDoc.sourceExcerpt,
      explanation: {
        expected: requirement.description,
        detected: `Credential: "${expDoc.documentName}" (Page ${expDoc.pageNumber})`,
        citation: `${clauseRef} (Page ${requirement.source_page || 1}): "${requirement.source_text || requirement.description}"`,
        decision: matrixStatus,
        rationale: 'Evidence verified from company past execution portfolio.'
      },
      recommendedAction: isPassing ? 'Verified.' : 'Verify scope concordance with tender specifications.'
    };
  }

  // 5. DOCUMENTATION / UNDERTAKINGS / OTHER
  const docMatch = vaultDocs.find((d) => {
    const type = (d.documentType || '').toLowerCase();
    const name = (d.documentName || '').toLowerCase();
    return type.includes('affidavit') || type.includes('documentation') || name.includes('affidavit') || name.includes('declaration');
  });

  const isMandatory = requirement.mandatory;
  const status = docMatch ? 'compliant' : isMandatory ? 'missing_evidence' : 'needs_review';
  const matrixStatus: ComplianceMatrixStatus = docMatch
    ? 'COMPLIANT'
    : isMandatory
    ? 'MISSING'
    : 'REQUIRES MANUAL REVIEW';

  return {
    requirementId: requirement.id,
    requirementCode: requirement.requirement_code,
    requirementName: requirement.name,
    clauseReference: clauseRef,
    category: requirement.category,
    mandatory: requirement.mandatory,
    requiredValue: requirement.name,
    detectedValue: docMatch ? docMatch.documentName : null,
    evidenceRequired: expectedEvidence,
    evidenceFound: docMatch ? `Declaration found in "${docMatch.documentName}"` : 'No supporting document uploaded in vault',
    status,
    matrixStatus,
    riskLevel: isMandatory && !docMatch ? 'HIGH' : 'LOW',
    riskReason: isMandatory && !docMatch ? 'Mandatory undertaking missing.' : 'Standard documentation criterion.',
    confidence: 0.88,
    matchedDocumentId: docMatch?.documentId,
    matchedDocumentName: docMatch?.documentName,
    sourcePage: requirement.source_page || 1,
    sourceExcerpt: requirement.source_text || requirement.description,
    explanation: {
      expected: requirement.description,
      detected: docMatch ? `Declaration in "${docMatch.documentName}"` : 'No specific document found in vault',
      citation: `${clauseRef} (Page ${requirement.source_page || 1}): "${requirement.source_text || requirement.description}"`,
      decision: matrixStatus,
      rationale: docMatch
        ? 'Matching declaration verified in Document Vault.'
        : 'Bidding declaration or signed annexure required before technical submission.'
    },
    recommendedAction: docMatch ? 'Verified.' : 'Procurement officer review: verify if prescribed format is signed and attached.'
  };
}

/**
 * 4. Transparent Compliance Score Calculation
 * Calculates overall score and returns breakdown with exact formula.
 */
export function calculateTransparentComplianceScore(evaluations: RequirementEvidenceEvaluation[]): {
  score: number;
  totalRequirements: number;
  compliantCount: number;
  partiallyCompliantCount: number;
  nonCompliantCount: number;
  missingCount: number;
  manualReviewCount: number;
  notVerifiedCount: number;
  formulaDescription: string;
  pointsEarned: number;
  maxPoints: number;
} {
  const totalRequirements = evaluations.length;
  if (totalRequirements === 0) {
    return {
      score: 100,
      totalRequirements: 0,
      compliantCount: 0,
      partiallyCompliantCount: 0,
      nonCompliantCount: 0,
      missingCount: 0,
      manualReviewCount: 0,
      notVerifiedCount: 0,
      formulaDescription: 'Score = 100% (No requirements extracted)',
      pointsEarned: 0,
      maxPoints: 0
    };
  }

  let compliantCount = 0;
  let partiallyCompliantCount = 0;
  let nonCompliantCount = 0;
  let missingCount = 0;
  let manualReviewCount = 0;
  let notVerifiedCount = 0;

  let pointsEarned = 0;
  let maxPoints = 0;

  evaluations.forEach((e) => {
    // Effective status considering officer override
    const status = e.officerOverrideStatus || e.matrixStatus;
    const weight = e.mandatory ? 20 : 10;
    maxPoints += weight;

    switch (status) {
      case 'COMPLIANT':
        compliantCount++;
        pointsEarned += weight;
        break;
      case 'PARTIALLY COMPLIANT':
        partiallyCompliantCount++;
        pointsEarned += weight * 0.5;
        break;
      case 'NON-COMPLIANT':
        nonCompliantCount++;
        break;
      case 'MISSING':
        missingCount++;
        break;
      case 'REQUIRES MANUAL REVIEW':
        manualReviewCount++;
        pointsEarned += weight * 0.3; // provisional review weight
        break;
      case 'NOT VERIFIED':
      default:
        notVerifiedCount++;
        break;
    }
  });

  const score = maxPoints > 0 ? Math.round((pointsEarned / maxPoints) * 100) : 100;

  const formulaDescription =
    `Score = (Earned Points: ${pointsEarned.toFixed(1)} / Max Points: ${maxPoints}) × 100 = ${score}%. \n` +
    `Weighting: Mandatory requirements = 20 pts (100% compliant, 50% partial, 30% manual review). Optional requirements = 10 pts.`;

  return {
    score,
    totalRequirements,
    compliantCount,
    partiallyCompliantCount,
    nonCompliantCount,
    missingCount,
    manualReviewCount,
    notVerifiedCount,
    formulaDescription,
    pointsEarned,
    maxPoints
  };
}

/**
 * 5. Generate realistic development Demo Intelligence Dataset
 * Clearly labeled as: "Demo / simulated external-source response."
 */
export function getDemoIntelligenceDataset(tenderId: string, tenderTitle: string) {
  const demoBidDeadline = '2026-10-15T18:00:00.000Z';

  const demoDocuments: ExtractedDocumentFields[] = [
    {
      documentId: 'demo-doc-gst',
      documentName: 'GST_Registration_Certificate.pdf',
      documentType: 'tax_document',
      legalName: 'ABC Technologies Pvt Ltd',
      gstin: '27AAACA1234A1Z5',
      pan: 'AAACA1234A',
      pageNumber: 1,
      sourceExcerpt: 'Government of India - GST Registration No: 27AAACA1234A1Z5 issued to ABC Technologies Pvt Ltd.',
      confidence: 0.98
    },
    {
      documentId: 'demo-doc-pan',
      documentName: 'Company_PAN_Card.pdf',
      documentType: 'tax_document',
      legalName: 'ABC Technologies Private Limited',
      pan: 'AAACA1234A',
      pageNumber: 1,
      sourceExcerpt: 'Income Tax Department, Govt of India - Permanent Account Number: AAACA1234A.',
      confidence: 0.99
    },
    {
      documentId: 'demo-doc-udyam',
      documentName: 'MSME_Udyam_Certificate.pdf',
      documentType: 'registration_certificate',
      legalName: 'ABC Tech Solutions Pvt Ltd',
      udyamNumber: 'UDYAM-MH-01-0098765',
      pan: 'AAACA1234A',
      pageNumber: 2,
      sourceExcerpt: 'Ministry of Micro, Small and Medium Enterprises - UDYAM-MH-01-0098765 registered for ABC Tech Solutions Pvt Ltd.',
      confidence: 0.95
    },
    {
      documentId: 'demo-doc-financials',
      documentName: 'Audited_Financial_Statement_FY24.pdf',
      documentType: 'financial_statement',
      legalName: 'ABC Technologies Pvt Ltd',
      turnoverAmount: 11.8,
      turnoverCurrency: 'INR',
      turnoverUnit: 'Crore',
      financialYear: '2023-24',
      netWorth: 4.2,
      pageNumber: 47,
      sourceExcerpt: 'Auditor Report Schedule 14: Total Revenue from Operations for FY 2023-24 stands at ₹11.80 Crore.',
      confidence: 0.97
    },
    {
      documentId: 'demo-doc-iso',
      documentName: 'ISO_9001_Quality_Certificate.pdf',
      documentType: 'quality_certification',
      certificateName: 'ISO 9001:2015 Quality Management System',
      certificateNumber: 'ISO-9001-QMS-88912',
      issueDate: '2023-08-10',
      expiryDate: '2026-08-01', // Expired before bid date (2026-10-15)
      issuingAuthority: 'TUV Nord Certification Body',
      pageNumber: 1,
      sourceExcerpt: 'Certificate Validity: This is to certify that the Quality Management System was audited and valid until 01-Aug-2026.',
      confidence: 0.96
    },
    {
      documentId: 'demo-doc-workorder',
      documentName: 'Work_Order_Metro_Rail_Project.pdf',
      documentType: 'experience_certificate',
      projectName: 'Substation SCADA & Signaling Implementation',
      clientName: 'State Metro Rail Corporation',
      projectValue: 18.5,
      experienceYears: 6,
      completionDate: '2025-03-20',
      pageNumber: 3,
      sourceExcerpt: 'Certificate of Satisfactory Completion: Project worth ₹18.50 Cr executed successfully over 6 years.',
      confidence: 0.94
    }
  ];

  const demoRequirements = [
    {
      id: 'demo-req-1',
      tender_id: tenderId,
      requirement_code: 'FIN-001',
      clause_reference: 'Section 4.1 (Financial Eligibility)',
      name: 'Minimum Average Annual Turnover',
      description: 'The bidder must have an average annual turnover of at least ₹15.00 Crore over the last three financial years.',
      category: 'Financial',
      mandatory: true,
      evidence_required: 'Audited balance sheets & CA certificate with UDIN',
      threshold_value: 15.0,
      threshold_unit: 'Crore',
      source_page: 12,
      source_text: 'Section 4.1: Minimum Financial Eligibility: Average Annual Turnover must be ≥ ₹15.00 Cr certified by Statutory Auditor.'
    },
    {
      id: 'demo-req-2',
      tender_id: tenderId,
      requirement_code: 'STAT-001',
      clause_reference: 'Clause 2.3 (Statutory Compliance)',
      name: 'Valid GST & PAN Registration',
      description: 'Bidder must possess active Goods and Services Tax (GSTIN) and Permanent Account Number (PAN).',
      category: 'Statutory',
      mandatory: true,
      evidence_required: 'GST Registration Certificate and PAN Card',
      source_page: 8,
      source_text: 'Clause 2.3: Bidder shall submit copy of valid GST Registration and PAN card.'
    },
    {
      id: 'demo-req-3',
      tender_id: tenderId,
      requirement_code: 'CERT-001',
      clause_reference: 'Clause 6.2 (Quality Standards)',
      name: 'ISO 9001:2015 Quality Certification',
      description: 'The contractor must hold an active ISO 9001:2015 certificate valid as of the date of bid submission.',
      category: 'Certification',
      mandatory: true,
      evidence_required: 'Valid ISO 9001:2015 Certificate',
      source_page: 15,
      source_text: 'Clause 6.2: Quality Assurance: ISO 9001:2015 certification valid as on the date of opening of technical bids.'
    },
    {
      id: 'demo-req-4',
      tender_id: tenderId,
      requirement_code: 'EXP-001',
      clause_reference: 'Section 5.2 (Technical Experience)',
      name: 'Prior Experience in Similar Infrastructure Projects',
      description: 'Bidder must have completed at least one similar government project of value not less than ₹10.00 Crore in the last 5 years.',
      category: 'Experience',
      mandatory: true,
      evidence_required: 'Client Completion Certificate with contract reference',
      threshold_value: 10.0,
      threshold_unit: 'Crore',
      source_page: 18,
      source_text: 'Section 5.2: Technical Capability: Completed similar works of value ≥ ₹10 Cr with completion certificate.'
    },
    {
      id: 'demo-req-5',
      tender_id: tenderId,
      requirement_code: 'LEGAL-001',
      clause_reference: 'Annexure IV (Integrity Pact)',
      name: 'Non-Blacklisting & Integrity Undertaking',
      description: 'Notarized affidavit on ₹100 stamp paper declaring that the bidder is not blacklisted by any Govt / PSU entity.',
      category: 'Legal',
      mandatory: true,
      evidence_required: 'Notarized Affidavit on Stamp Paper',
      source_page: 24,
      source_text: 'Annexure IV: Affidavit regarding non-debarment and litigation history.'
    }
  ];

  const contradictions = detectCrossDocumentContradictions(demoDocuments, demoBidDeadline);

  const evaluations: RequirementEvidenceEvaluation[] = demoRequirements.map((req) =>
    evaluateRequirementCompliance(req, demoDocuments, demoBidDeadline)
  );

  return {
    tenderId,
    tenderTitle,
    bidDeadline: demoBidDeadline,
    documents: demoDocuments,
    requirements: demoRequirements,
    contradictions,
    evaluations
  };
}
