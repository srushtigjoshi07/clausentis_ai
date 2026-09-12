/**
 * Bid Upload Contextual Guidance Provider
 *
 * Dynamically resolves "WHAT TO SUBMIT" instructions and expected evidence
 * checklists for bidder document upload tags, synchronized directly with
 * the active tender's requirements, thresholds, and clause citations.
 */

import type { BidUploadedDocument, DiscoveredTender } from '@/types/tender-discovery';

export interface BidUploadGuidance {
  documentType: BidUploadedDocument['documentType'];
  title: string;
  clauseRef?: string;
  purpose: string;
  whatToSubmit: string;
  expectedEvidence: string[];
}

export function getBidUploadGuidance(
  documentType: BidUploadedDocument['documentType'],
  tender?: DiscoveredTender | null
): BidUploadGuidance | null {
  const orgName = tender?.issuingOrganisation || 'the procurement authority';
  const tenderRef = tender?.referenceNumber ? `tender ref ${tender.referenceNumber}` : 'the tender';

  // Dynamic tender-specific thresholds
  const turnoverStr = tender?.minimumTurnoverRequired
    ? `₹${tender.minimumTurnoverRequired.toFixed(2).replace(/\.00$/, '')} Crore`
    : 'the stipulated';
  const expYears = tender?.minimumExperienceYears ?? 5;
  const similarProjects = tender?.similarProjectsRequired ?? 3;
  const emdAmount = tender?.emdAmount || 'the stipulated tender amount';

  switch (documentType) {
    case 'non_blacklisting_declaration':
      return {
        documentType: 'non_blacklisting_declaration',
        title: 'Non-Blacklisting & Debarment Declaration',
        clauseRef: 'Annexure-B • Debarment Restrictions',
        purpose: 'Evidence for bidder integrity, anti-corruption compliance, and non-debarment eligibility.',
        whatToSubmit: `Submit a signed non-blacklisting and non-debarment declaration on official letterhead issued by the bidder or authorized signatory confirming that the bidder is not currently blacklisted, suspended, or debarred by ${orgName}, any Central/State Government Ministry, or PSU.`,
        expectedEvidence: [
          'Bidder legal entity name (matching corporate registration)',
          'Explicit non-blacklisting declaration statement',
          'Non-debarment / disciplinary status declaration',
          'Declaration execution date (within tender validity window)',
          'Authorized signatory name and official designation',
          'Official company seal / stamp',
        ],
      };

    case 'audited_financials':
      return {
        documentType: 'audited_financials',
        title: 'Audited Financial Statements & CA Turnover Certificate',
        clauseRef: 'NIT Section 3.1 & 3.3 • Financial Qualification',
        purpose: `Evidence for the tender's minimum annual turnover (${turnoverStr}) and positive net worth criteria.`,
        whatToSubmit: `Submit audited financial statements (Balance Sheets and Profit & Loss statements) or the applicable CA-certified turnover evidence demonstrating that the bidder satisfies the minimum ${turnoverStr} annual turnover requirement over the last 3 audited financial years.`,
        expectedEvidence: [
          'Bidder / corporate entity legal name',
          'Audited financial years (e.g. FY 2022-23, 2023-24, and 2024-25)',
          'Annual turnover figures and calculated average annual turnover',
          'Certification of positive net worth as of preceding financial year',
          'Practicing Chartered Accountant (CA) membership details and firm name',
          'Unique Document Identification Number (UDIN) on CA certificate',
        ],
      };

    case 'experience_certificate':
      return {
        documentType: 'experience_certificate',
        title: 'Client Work Orders & Completion Proof',
        clauseRef: 'BQC Clause 4.1 & 4.2 • Technical Eligibility Criteria',
        purpose: `Evidence demonstrating at least ${expYears} years of technical track record and completed similar contracts.`,
        whatToSubmit: `Submit client-issued work orders, contracts, and completion or performance certificates demonstrating at least ${expYears} years of continuous relevant industry experience and successful execution of at least ${similarProjects} similar works/supplies for government, PSU, or reputable corporate clients.`,
        expectedEvidence: [
          'Client / issuing organization name, address, and contact details',
          'Project / work description clearly matching the tender scope',
          'Contract or work order reference number and formal award date',
          'Contract monetary value demonstrating qualifying scale',
          'Start date, completion date, and overall execution duration',
          'Satisfactory completion / performance certificate issued by the client',
        ],
      };

    case 'gst_certificate':
      return {
        documentType: 'gst_certificate',
        title: 'GST Registration Certificate (REG-06)',
        clauseRef: 'NIT Section 2.1 • Statutory Tax Registration',
        purpose: 'Statutory proof of active tax registration and interstate billing eligibility.',
        whatToSubmit: `Submit the current official GST registration certificate (Form GST REG-06) showing the bidder's legal name, trade name, and active 15-digit GSTIN.`,
        expectedEvidence: [
          'Bidder legal entity name and trade name',
          '15-digit Goods and Services Tax Identification Number (GSTIN)',
          'Active registration status and effective date of registration',
          'Principal place of business address matching the bidder profile',
          'Annexure A and Annexure B sheets of Form GST REG-06',
        ],
      };

    case 'pan_card':
      return {
        documentType: 'pan_card',
        title: 'Company PAN Card',
        clauseRef: 'NIT Section 2.2 • PAN Registration',
        purpose: 'Statutory identity verification issued by the Income Tax Department of India.',
        whatToSubmit: `Submit a clear, legible copy of the company PAN card or e-PAN certificate containing the bidder's legal entity name and PAN.`,
        expectedEvidence: [
          'Bidder corporate / legal entity name',
          '10-character alphanumeric Permanent Account Number (PAN)',
          'Date of incorporation / issuance',
          'Income Tax Department seal and relevant identifying details',
        ],
      };

    case 'local_content_declaration':
      return {
        documentType: 'local_content_declaration',
        title: 'Local Content (Make in India) Declaration',
        clauseRef: 'Public Procurement Order • Preference to Make in India',
        purpose: 'Evidence for domestic value addition and Class-I / Class-II Local Supplier purchase preference.',
        whatToSubmit: `Submit a signed local-content declaration on company letterhead indicating the percentage of domestic local value addition (minimum 50% for Class-I Local Supplier status) for ${tenderRef}.`,
        expectedEvidence: [
          `Bidder legal name and reference to ${tenderRef}`,
          'Product / equipment / service items covered by the declaration',
          'Exact percentage of local domestic content calculated and declared',
          'Location(s) at which local value addition is manufactured / performed',
          'Supplier category claimed (Class-I or Class-II Local Supplier)',
          'Authorized signatory signature, stamp, and execution date',
        ],
      };

    case 'technical_compliance': {
      const specHighlight =
        tender?.keyTechnicalSpecs && tender.keyTechnicalSpecs.length > 0
          ? ` (including ${tender.keyTechnicalSpecs.slice(0, 2).join('; ')})`
          : '';
      return {
        documentType: 'technical_compliance',
        title: 'Technical Datasheet & Deviation Statement',
        clauseRef: 'Technical Specification & Annexure-C • Schedule of Compliance',
        purpose: 'Verification of unconditional technical conformance to tender specifications and scope of work.',
        whatToSubmit: `Submit an item-by-item technical compliance statement and signed deviation schedule confirming unconditional adherence to all technical parameters${specHighlight}.`,
        expectedEvidence: [
          'Item-by-item clause compliance confirmation against all specifications',
          'Technical datasheets, model numbers, and OEM product literature',
          'Explicit "NIL DEVIATION" statement or itemized list of exceptions',
          'Authorized engineering lead or technical signatory signature & stamp',
        ],
      };
    }

    case 'emd_proof':
      return {
        documentType: 'emd_proof',
        title: 'EMD Bank Receipt or Udyam Exemption Certificate',
        clauseRef: 'NIT Section 1.4 • Earnest Money Deposit',
        purpose: 'Proof of bid security deposit or statutory MSME exemption.',
        whatToSubmit: `Submit proof of EMD payment or Bank Guarantee for ${emdAmount}, or upload a valid Udyam / MSME Registration Certificate to claim statutory exemption under Government of India guidelines.`,
        expectedEvidence: [
          'EMD bank transaction receipt, NEFT/RTGS counterfoil, or Bank Guarantee copy',
          'Guarantee amount and validity period matching tender stipulations',
          `Beneficiary named as ${orgName}`,
          'OR valid Udyam certificate showing MSE status for fee/EMD exemption',
        ],
      };

    case 'udyam_certificate':
      return {
        documentType: 'udyam_certificate',
        title: 'Udyam / MSME Registration',
        clauseRef: 'Public Procurement Policy for MSEs Order 2012',
        purpose: 'Proof of micro/small enterprise status for procurement fee waivers and purchase preferences.',
        whatToSubmit: `Submit a valid Udyam Registration Certificate issued by the Ministry of MSME demonstrating the bidder's classification and active registration status.`,
        expectedEvidence: [
          'Enterprise legal name & registered unit address',
          'Udyam Registration Number (format: UDYAM-XX-00-0000000)',
          'Enterprise classification (Micro, Small, or Medium Enterprise)',
          'Major business activity (Manufacturing / Services) & 5-digit NIC code(s)',
          'Registration date and official verification details',
        ],
      };

    case 'other':
      return {
        documentType: 'other',
        title: 'Supplementary Credential / Supporting Exhibit',
        clauseRef: 'General Conditions • Additional Exhibit Submission',
        purpose: 'Additional corroborating evidence, manufacturer authorizations, or tender-stipulated exhibits.',
        whatToSubmit: `Submit authorized OEM Authorization letter, Power of Attorney, Board Resolution, ISO Quality Certifications (e.g. ISO 9001/14001/45001), EPFO/ESIC registrations, or consortium agreements as required under ${tenderRef}.`,
        expectedEvidence: [
          `Bidder legal entity name and reference to ${tenderRef}`,
          'Clear exhibit title and purpose of submission',
          'Issuance date and validity period where applicable',
          'Authorized signatory or certifying authority seal and signatures',
        ],
      };

    default:
      return null;
  }
}
