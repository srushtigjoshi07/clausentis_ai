/**
 * Pre-Bid Eligibility Evaluation Engine
 *
 * Extracts tender eligibility rules and evaluates bidder self-declared responses
 * before formal document upload, generating a Gap Analysis and Required Documents checklist.
 */

import type {
  PreBidEligibilityCriteria,
  PreBidEligibilityAnswers,
  PreBidEligibilityEvaluation,
  EligibilityGapItem,
  RequiredDocumentChecklistItem,
} from '@/types/eligibility';

/** Standard CPCL tender eligibility rules fallback */
export const DEFAULT_CPCL_ELIGIBILITY_CRITERIA: PreBidEligibilityCriteria = {
  tenderId: 'tender-cpcl-2026-0412',
  tenderTitle: 'Supply, Installation & Commissioning of High-Pressure Gas Compressor System',
  referenceNumber: 'CPCL/ENG/2026/HPGC-0412',
  minimumTurnoverCr: 10.0,
  minimumExperienceYears: 5,
  gstRequired: true,
  panRequired: true,
  msmeUdyamAllowedForExemption: true,
  startupIndiaRelaxationAllowed: true,
  oemAuthorizationMandatory: true,
  minimumLocalContentPercent: 50, // Class-I local supplier
  nonBlacklistingMandatory: true,
  epfoEsicRequired: true,
  tenderSpecificRules: [
    { rule: 'Supply of at least 2 similar high-pressure gas compressors in last 3 years', mandatory: true },
    { rule: 'Valid ISO 9001:2015 certification for manufacturing quality systems', mandatory: false },
  ],
};

/**
 * Extract or synthesize eligibility rules from tender parameters
 */
export function extractTenderEligibilityCriteria(
  tenderId: string,
  title?: string,
  reference?: string
): PreBidEligibilityCriteria {
  // If specific tender matches CPCL compressor RFP
  if (tenderId === 'tender-cpcl-2026-0412' || (title && title.toLowerCase().includes('compressor'))) {
    return DEFAULT_CPCL_ELIGIBILITY_CRITERIA;
  }

  return {
    tenderId,
    tenderTitle: title || 'Public Procurement Tender RFP',
    referenceNumber: reference || 'GEM/2026/B/RFP-001',
    minimumTurnoverCr: 8.0,
    minimumExperienceYears: 3,
    gstRequired: true,
    panRequired: true,
    msmeUdyamAllowedForExemption: true,
    startupIndiaRelaxationAllowed: true,
    oemAuthorizationMandatory: true,
    minimumLocalContentPercent: 50,
    nonBlacklistingMandatory: true,
    epfoEsicRequired: true,
    tenderSpecificRules: [
      { rule: 'Relevant project completion certificate from PSU or central authority', mandatory: true },
    ],
  };
}

/**
 * Evaluates bidder answers against tender eligibility criteria
 */
export function evaluatePreBidEligibility(
  criteria: PreBidEligibilityCriteria,
  answers: PreBidEligibilityAnswers
): PreBidEligibilityEvaluation {
  const gaps: EligibilityGapItem[] = [];
  let score = 0;
  let totalPoints = 0;
  let criticalFailures = 0;

  // 1. Annual Turnover (Weight: 20 pts)
  totalPoints += 20;
  if (answers.annualTurnoverCr >= criteria.minimumTurnoverCr) {
    score += 20;
    gaps.push({
      id: 'turnover',
      criterion: 'Annual Average Turnover',
      requiredValue: `₹${criteria.minimumTurnoverCr} Cr (last 3 FYs)`,
      declaredValue: `₹${answers.annualTurnoverCr} Cr`,
      status: 'MET',
      severity: 'INFO',
      remediationAdvice: 'Exceeds tender threshold. Provide CA certified balance sheets for FY 2022-23, 2023-24, 2024-25.',
    });
  } else if (answers.isStartupIndiaRecognized && criteria.startupIndiaRelaxationAllowed) {
    score += 18;
    gaps.push({
      id: 'turnover',
      criterion: 'Annual Average Turnover',
      requiredValue: `₹${criteria.minimumTurnoverCr} Cr`,
      declaredValue: `₹${answers.annualTurnoverCr} Cr (DPIIT Startup)`,
      status: 'EXEMPTED',
      severity: 'INFO',
      remediationAdvice: 'Exempted under DPIIT Startup India Policy. Upload valid DPIIT Recognition Certificate.',
    });
  } else {
    criticalFailures++;
    gaps.push({
      id: 'turnover',
      criterion: 'Annual Average Turnover',
      requiredValue: `₹${criteria.minimumTurnoverCr} Cr`,
      declaredValue: `₹${answers.annualTurnoverCr} Cr`,
      status: 'GAP',
      severity: 'CRITICAL',
      remediationAdvice: `Deficit of ₹${(criteria.minimumTurnoverCr - answers.annualTurnoverCr).toFixed(2)} Cr. Consider bidding in Joint Venture/Consortium if tender allows.`,
    });
  }

  // 2. Past Relevant Experience (Weight: 15 pts)
  totalPoints += 15;
  if (answers.experienceYears >= criteria.minimumExperienceYears) {
    score += 15;
    gaps.push({
      id: 'experience',
      criterion: 'Past Relevant Experience',
      requiredValue: `${criteria.minimumExperienceYears}+ Years`,
      declaredValue: `${answers.experienceYears} Years`,
      status: 'MET',
      severity: 'INFO',
      remediationAdvice: 'Meets criteria. Ensure completion certificates contain client reference and contract value.',
    });
  } else if (answers.isStartupIndiaRecognized && criteria.startupIndiaRelaxationAllowed) {
    score += 13;
    gaps.push({
      id: 'experience',
      criterion: 'Past Relevant Experience',
      requiredValue: `${criteria.minimumExperienceYears}+ Years`,
      declaredValue: `${answers.experienceYears} Years (DPIIT Startup)`,
      status: 'EXEMPTED',
      severity: 'INFO',
      remediationAdvice: 'Prior experience threshold relaxed under DPIIT policy. Upload DPIIT certification.',
    });
  } else {
    criticalFailures++;
    gaps.push({
      id: 'experience',
      criterion: 'Past Relevant Experience',
      requiredValue: `${criteria.minimumExperienceYears}+ Years`,
      declaredValue: `${answers.experienceYears} Years`,
      status: 'GAP',
      severity: 'CRITICAL',
      remediationAdvice: `Experience is below the ${criteria.minimumExperienceYears} years minimum requirement.`,
    });
  }

  // 3. GST Registration (Weight: 10 pts)
  totalPoints += 10;
  if (answers.hasActiveGst) {
    score += 10;
    gaps.push({
      id: 'gst',
      criterion: 'Valid & Active GSTIN',
      requiredValue: 'Active Regular Taxpayer',
      declaredValue: 'Active Confirmed',
      status: 'MET',
      severity: 'INFO',
      remediationAdvice: 'GST is active. Ensure returns (GSTR-3B) are filed up to the current month.',
    });
  } else {
    criticalFailures++;
    gaps.push({
      id: 'gst',
      criterion: 'Valid & Active GSTIN',
      requiredValue: 'Active Regular Taxpayer',
      declaredValue: 'Not Provided / Inactive',
      status: 'GAP',
      severity: 'CRITICAL',
      remediationAdvice: 'Mandatory statutory requirement. Obtain or activate GSTIN before bid submission.',
    });
  }

  // 4. PAN Card (Weight: 10 pts)
  totalPoints += 10;
  if (answers.hasPan) {
    score += 10;
    gaps.push({
      id: 'pan',
      criterion: 'Permanent Account Number (PAN)',
      requiredValue: 'Corporate / Firm PAN',
      declaredValue: 'Confirmed Available',
      status: 'MET',
      severity: 'INFO',
      remediationAdvice: 'PAN matches enterprise entity.',
    });
  } else {
    criticalFailures++;
    gaps.push({
      id: 'pan',
      criterion: 'Permanent Account Number (PAN)',
      requiredValue: 'Corporate / Firm PAN',
      declaredValue: 'Missing',
      status: 'GAP',
      severity: 'CRITICAL',
      remediationAdvice: 'Mandatory statutory requirement. Bid will be rejected without valid PAN.',
    });
  }

  // 5. OEM Authorization (Weight: 15 pts)
  totalPoints += 15;
  if (answers.hasOemAuthorization) {
    score += 15;
    gaps.push({
      id: 'oem',
      criterion: 'OEM Authorization / Direct Manufacturer',
      requiredValue: 'Direct OEM or Tender-Specific MAF',
      declaredValue: 'Certified / Authorized',
      status: 'MET',
      severity: 'INFO',
      remediationAdvice: 'Ensure Manufacturer Authorization Form follows Annexure-IV tender format precisely.',
    });
  } else if (criteria.oemAuthorizationMandatory) {
    criticalFailures++;
    gaps.push({
      id: 'oem',
      criterion: 'OEM Authorization / Direct Manufacturer',
      requiredValue: 'Direct OEM or Tender-Specific MAF',
      declaredValue: 'Not Available',
      status: 'GAP',
      severity: 'CRITICAL',
      remediationAdvice: 'Mandatory technical clause. Request OEM Authorization from original equipment manufacturer.',
    });
  }

  // 6. Make in India Local Content (Weight: 10 pts)
  totalPoints += 10;
  if (answers.localContentPercent >= criteria.minimumLocalContentPercent) {
    score += 10;
    gaps.push({
      id: 'mii',
      criterion: 'Make in India (Local Content)',
      requiredValue: `>= ${criteria.minimumLocalContentPercent}% (Class-I)`,
      declaredValue: `${answers.localContentPercent}%`,
      status: 'MET',
      severity: 'INFO',
      remediationAdvice: `Qualifies as Class-I Local Supplier (>= ${criteria.minimumLocalContentPercent}%). Upload CA or self-declaration of local value addition.`,
    });
  } else if (answers.localContentPercent >= 20) {
    score += 5;
    gaps.push({
      id: 'mii',
      criterion: 'Make in India (Local Content)',
      requiredValue: `>= ${criteria.minimumLocalContentPercent}% (Class-I)`,
      declaredValue: `${answers.localContentPercent}% (Class-II)`,
      status: 'PARTIAL',
      severity: 'WARNING',
      remediationAdvice: 'Class-II Local Supplier (20% - 49%). Purchase preference may not apply against Class-I bidders.',
    });
  } else {
    gaps.push({
      id: 'mii',
      criterion: 'Make in India (Local Content)',
      requiredValue: `>= ${criteria.minimumLocalContentPercent}%`,
      declaredValue: `${answers.localContentPercent}% (Non-Local)`,
      status: 'GAP',
      severity: 'WARNING',
      remediationAdvice: 'Below Class-II threshold (< 20%). Non-local suppliers are excluded if tender reserves under PPP-MII.',
    });
  }

  // 7. Non-Blacklisting Affidavit (Weight: 10 pts)
  totalPoints += 10;
  if (answers.hasNonBlacklistingAffidavit) {
    score += 10;
    gaps.push({
      id: 'blacklisting',
      criterion: 'Non-Blacklisting & Integrity Undertaking',
      requiredValue: 'Notarized Affidavit (within 30 days)',
      declaredValue: 'Ready to submit',
      status: 'MET',
      severity: 'INFO',
      remediationAdvice: 'Ensure notarization date is within 30 days of tender submission deadline.',
    });
  } else {
    criticalFailures++;
    gaps.push({
      id: 'blacklisting',
      criterion: 'Non-Blacklisting & Integrity Undertaking',
      requiredValue: 'Notarized Affidavit (within 30 days)',
      declaredValue: 'Not Available',
      status: 'GAP',
      severity: 'CRITICAL',
      remediationAdvice: 'Mandatory compliance. Debarred firms are ineligible under CVC circular 02/02/2021.',
    });
  }

  // 8. MSME / Udyam (Weight: 5 pts bonus/exemption)
  totalPoints += 5;
  if (answers.isUdyamRegistered) {
    score += 5;
    gaps.push({
      id: 'udyam',
      criterion: 'MSME / Udyam Registration',
      requiredValue: 'Optional (EMD / Fee Exemption)',
      declaredValue: 'Active Udyam Holder',
      status: 'MET',
      severity: 'INFO',
      remediationAdvice: 'Entitled to tender document fee and Earnest Money Deposit (EMD) exemption under PP Policy 2012.',
    });
  } else {
    score += 3; // Neutral
    gaps.push({
      id: 'udyam',
      criterion: 'MSME / Udyam Registration',
      requiredValue: 'Optional',
      declaredValue: 'Not Registered',
      status: 'MET',
      severity: 'INFO',
      remediationAdvice: 'General bidder. EMD and tender fee must be submitted as specified in tender notice.',
    });
  }

  // 9. EPFO / ESIC Statutory Clearance (Weight: 5 pts)
  totalPoints += 5;
  if (answers.hasEpfoEsicRegistration) {
    score += 5;
    gaps.push({
      id: 'epfo_esic',
      criterion: 'EPFO & ESIC Compliance',
      requiredValue: 'Valid Registration with Recent Challans',
      declaredValue: 'Registered & Active',
      status: 'MET',
      severity: 'INFO',
      remediationAdvice: 'Provide latest paid electronic challan return (ECR) copy.',
    });
  } else {
    gaps.push({
      id: 'epfo_esic',
      criterion: 'EPFO & ESIC Compliance',
      requiredValue: 'Valid Registration with Recent Challans',
      declaredValue: 'Pending',
      status: 'PARTIAL',
      severity: 'WARNING',
      remediationAdvice: 'Mandatory labor compliance for installation/commissioning works.',
    });
  }

  // Normalized score out of 100
  const preliminaryScore = Math.round((score / totalPoints) * 100);

  // Determine overall status
  let status: PreBidEligibilityEvaluation['status'];
  if (criticalFailures === 0 && preliminaryScore >= 80) {
    status = 'LIKELY_ELIGIBLE';
  } else if (criticalFailures > 0) {
    status = 'POTENTIALLY_INELIGIBLE';
  } else {
    status = 'INSUFFICIENT_INFORMATION';
  }

  // Required Documents Checklist tailored to bidder's declarations
  const requiredDocuments: RequiredDocumentChecklistItem[] = [
    {
      id: 'doc-turnover',
      documentName: 'Audited Financial Statements & CA Net Worth Certificate',
      purpose: `Proof of Average Annual Turnover >= ₹${criteria.minimumTurnoverCr} Cr across 3 FYs`,
      mandatory: !answers.isStartupIndiaRecognized,
      category: 'FINANCIAL',
      sampleOrFormatNote: 'Must contain UDIN number from practicing Chartered Accountant',
    },
    {
      id: 'doc-experience',
      documentName: 'Client Completion Certificates / Work Orders',
      purpose: `Proof of ${criteria.minimumExperienceYears}+ years relevant execution`,
      mandatory: !answers.isStartupIndiaRecognized,
      category: 'TECHNICAL',
      sampleOrFormatNote: 'Showing project value, scope of equipment, and satisfactory commissioning letter',
    },
    {
      id: 'doc-gst',
      documentName: 'GST Registration Certificate (Form REG-06)',
      purpose: 'Verification of active GSTIN and state presence',
      mandatory: true,
      category: 'STATUTORY',
      sampleOrFormatNote: 'All 3 pages showing principal and additional places of business',
    },
    {
      id: 'doc-pan',
      documentName: 'Income Tax PAN Card Copy',
      purpose: 'Corporate / Enterprise identity verification',
      mandatory: true,
      category: 'STATUTORY',
      sampleOrFormatNote: 'Self-attested with company seal',
    },
    {
      id: 'doc-oem',
      documentName: 'Manufacturer Authorization Form (MAF)',
      purpose: 'Proof of direct OEM certification for High-Pressure Gas Compressors',
      mandatory: criteria.oemAuthorizationMandatory,
      category: 'TECHNICAL',
      sampleOrFormatNote: 'Follow tender Annexure-IV on OEM letterhead signed by authorized officer',
    },
    {
      id: 'doc-mii',
      documentName: 'Make in India Local Content Declaration',
      purpose: `Certification of ${answers.localContentPercent}% domestic value addition`,
      mandatory: true,
      category: 'UNDERTAKING',
      sampleOrFormatNote: 'Self-declaration for bids < ₹10 Cr; CA/Cost Auditor certificate for bids > ₹10 Cr',
    },
    {
      id: 'doc-blacklisting',
      documentName: 'Non-Blacklisting & Integrity Affidavit',
      purpose: 'Under non-debarment declaration as per CVC/GFR guidelines',
      mandatory: true,
      category: 'UNDERTAKING',
      sampleOrFormatNote: 'Notarized on non-judicial stamp paper of ₹100 value within last 30 days',
    },
  ];

  if (answers.isUdyamRegistered) {
    requiredDocuments.push({
      id: 'doc-udyam',
      documentName: 'Udyam Registration Certificate',
      purpose: 'MSME qualification for EMD and tender fee exemption',
      mandatory: false,
      category: 'STATUTORY',
      sampleOrFormatNote: 'With verifiable dynamic QR code from Ministry of MSME portal',
    });
  }

  if (answers.isStartupIndiaRecognized) {
    requiredDocuments.push({
      id: 'doc-startup',
      documentName: 'DPIIT Startup India Certificate',
      purpose: 'Turnover and prior experience relaxation',
      mandatory: false,
      category: 'STATUTORY',
      sampleOrFormatNote: 'Must be active and verified on Startup India portal',
    });
  }

  const criteriaMetCount = gaps.filter(g => g.status === 'MET' || g.status === 'EXEMPTED').length;

  return {
    tenderId: criteria.tenderId,
    status,
    preliminaryScore,
    criteriaMetCount,
    totalCriteriaCount: gaps.length,
    gaps,
    requiredDocuments,
    evaluatedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' IST',
    disclaimer: 'This is an AI-powered preliminary eligibility assessment based on self-declared parameters. Final qualification strictly depends on document validation, OCR extraction, and statutory government verification (Udyam, GSTN, MCA21) by the Procurement Officer.',
  };
}
