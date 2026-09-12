/**
 * Synthetic / Demo Government Database Records for Ministry of MSME (Udyam Portal)
 *
 * Used exclusively for DEMO / SANDBOX VERIFICATION under SIH26100.
 * Clearly labeled as synthetic records — never claimed as live Government of India data.
 */

export interface UdyamGovernmentRecord {
  udyamNumber: string;
  enterpriseName: string;
  pan: string;
  status: 'ACTIVE' | 'CANCELLED' | 'SUSPENDED' | 'EXPIRED';
  organisationType: string;
  majorActivity: string;
  enterpriseType: 'Micro' | 'Small' | 'Medium';
  registrationDate: string; // DD-MM-YYYY or ISO
  validityDate?: string; // DD-MM-YYYY or ISO
  registeredDistrict: string;
  registeredState: string;
  portalSource: string;
  lastUpdated: string;
}

export const UDYAM_DEMO_GOVERNMENT_DATABASE: Record<string, UdyamGovernmentRecord> = {
  // CASE 1: MATCH
  'UDYAM-DEMO-VALID-001': {
    udyamNumber: 'UDYAM-DEMO-VALID-001',
    enterpriseName: 'ABC Robotics Pvt Ltd',
    pan: 'ABCDE1234F',
    status: 'ACTIVE',
    organisationType: 'Private Limited Company',
    majorActivity: 'Robotics, Automation & Control Systems Manufacturing',
    enterpriseType: 'Small',
    registrationDate: '15-05-2021',
    registeredDistrict: 'Bengaluru Urban',
    registeredState: 'Karnataka',
    portalSource: 'Ministry of MSME — Udyam Registration Portal (Synthetic Sandbox)',
    lastUpdated: '2026-01-10T00:00:00Z',
  },

  // CASE 2: MISMATCH (PAN differs: ABCDE9876F vs submitted ABCDE1234F)
  'UDYAM-DEMO-MISMATCH-001': {
    udyamNumber: 'UDYAM-DEMO-MISMATCH-001',
    enterpriseName: 'ABC Robotics Private Limited',
    pan: 'ABCDE9876F', // Mismatch!
    status: 'ACTIVE',
    organisationType: 'Private Limited Company',
    majorActivity: 'Industrial Machinery Manufacturing',
    enterpriseType: 'Small',
    registrationDate: '15-05-2021',
    registeredDistrict: 'Bengaluru Urban',
    registeredState: 'Karnataka',
    portalSource: 'Ministry of MSME — Udyam Registration Portal (Synthetic Sandbox)',
    lastUpdated: '2026-01-10T00:00:00Z',
  },

  // (CASE 3: NOT FOUND is simply omitted from this dictionary)

  // CASE 4: INACTIVE (Status is CANCELLED)
  'UDYAM-DEMO-INACTIVE-001': {
    udyamNumber: 'UDYAM-DEMO-INACTIVE-001',
    enterpriseName: 'ABC Robotics Pvt Ltd',
    pan: 'ABCDE1234F',
    status: 'CANCELLED', // Cancelled in government registry!
    organisationType: 'Private Limited Company',
    majorActivity: 'Robotics Equipment',
    enterpriseType: 'Micro',
    registrationDate: '10-01-2022',
    registeredDistrict: 'Pune',
    registeredState: 'Maharashtra',
    portalSource: 'Ministry of MSME — Udyam Registration Portal (Synthetic Sandbox)',
    lastUpdated: '2025-11-20T00:00:00Z',
  },

  // CASE 5: EXPIRED FOR TENDER DATE (Validity ended on 31-03-2026)
  'UDYAM-DEMO-EXPIRED-001': {
    udyamNumber: 'UDYAM-DEMO-EXPIRED-001',
    enterpriseName: 'ABC Robotics Pvt Ltd',
    pan: 'ABCDE1234F',
    status: 'ACTIVE',
    organisationType: 'Private Limited Company',
    majorActivity: 'Machinery Overhaul & Robotics',
    enterpriseType: 'Small',
    registrationDate: '01-04-2023',
    validityDate: '31-03-2026', // Expired relative to 2026 tender date
    registeredDistrict: 'Chennai',
    registeredState: 'Tamil Nadu',
    portalSource: 'Ministry of MSME — Udyam Registration Portal (Synthetic Sandbox)',
    lastUpdated: '2026-03-31T23:59:59Z',
  },

  // REPOSITORY BIDDER 01: Apex Heavy Engineering Pvt Ltd (COMPLIANT)
  'UDYAM-TN-02-0049182': {
    udyamNumber: 'UDYAM-TN-02-0049182',
    enterpriseName: 'Apex Heavy Engineering Pvt Ltd',
    pan: 'AABCA1234F',
    status: 'ACTIVE',
    organisationType: 'Private Limited Company',
    majorActivity: 'Industrial Machinery & High-Pressure Compressor Manufacturing',
    enterpriseType: 'Medium',
    registrationDate: '12-08-2020',
    registeredDistrict: 'Thiruvallur',
    registeredState: 'Tamil Nadu',
    portalSource: 'Ministry of MSME — Udyam Registration Portal (Synthetic Sandbox)',
    lastUpdated: '2026-02-15T00:00:00Z',
  },

  // REPOSITORY BIDDER 02: Zenith Marine & Mechanical Works Ltd
  'UDYAM-DL-01-0078129': {
    udyamNumber: 'UDYAM-DL-01-0078129',
    enterpriseName: 'Zenith Marine & Mechanical Works Ltd',
    pan: 'AABCV5678K',
    status: 'ACTIVE',
    organisationType: 'Public Limited Company',
    majorActivity: 'Marine & Fabrication Works',
    enterpriseType: 'Small',
    registrationDate: '05-11-2021',
    registeredDistrict: 'Central Delhi',
    registeredState: 'Delhi',
    portalSource: 'Ministry of MSME — Udyam Registration Portal (Synthetic Sandbox)',
    lastUpdated: '2026-01-12T00:00:00Z',
  },

  // REPOSITORY BIDDER 03: Trident Energy Equipment Pvt Ltd
  'UDYAM-GJ-03-0012984': {
    udyamNumber: 'UDYAM-GJ-03-0012984',
    enterpriseName: 'Trident Energy Equipment Pvt Ltd',
    pan: 'AAACT1111M',
    status: 'ACTIVE',
    organisationType: 'Private Limited Company',
    majorActivity: 'Energy Sector Equipment',
    enterpriseType: 'Medium',
    registrationDate: '18-03-2020',
    registeredDistrict: 'Vadodara',
    registeredState: 'Gujarat',
    portalSource: 'Ministry of MSME — Udyam Registration Portal (Synthetic Sandbox)',
    lastUpdated: '2026-02-28T00:00:00Z',
  },
};

/**
 * Look up a synthetic Udyam government record by Udyam Number
 */
export function lookupUdyamDemoRecord(rawUdyamNumber: string | undefined | null): UdyamGovernmentRecord | null {
  if (!rawUdyamNumber) return null;
  const clean = rawUdyamNumber.trim().toUpperCase();
  return UDYAM_DEMO_GOVERNMENT_DATABASE[clean] || null;
}
