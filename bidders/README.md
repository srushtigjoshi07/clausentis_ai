# CLAUSENTIS — SYNTHETIC BIDDER PACKAGES FOR TENDER DEMONSTRATION

> **IMPORTANT DISCLAIMER**  
> **SYNTHETIC DOCUMENT SUITE — FOR CLAUSENTIS PROTOTYPE DEMONSTRATION ONLY**  
> All legal entities, company names, registration numbers (GSTIN, PAN, CIN, Udyam), audit figures, project references, signatures, and stamps in this directory are **100% fictional and synthetically generated** for Smart India Hackathon 2026 (Problem Statement SIH26100) evaluation and prototype benchmarking. No real government credentials, certificates, or personal data have been used.

---

## 1. Selected Demo Tender

All documents in this directory correspond strictly to the primary benchmark tender configured in CLAUSENTIS:

| Parameter | Tender Specification Details |
| :--- | :--- |
| **Tender Reference Number** | `CPCL/ENG/2026/HPGC-0412` |
| **Tender Portal ID** | `2026_CPCL_894102_1` |
| **Tender Title** | **Supply, Installation and Commissioning of High-Pressure Gas Compressor System at Manali Refinery** |
| **Issuing Authority** | **Chennai Petroleum Corporation Limited (CPCL)** |
| **Tender Category** | Goods & Turnkey Industrial Engineering |
| **Tender Publishing Date** | 04 September 2026 |
| **Bid Submission Closing Date** | **28 September 2026, 15:00 IST** |
| **Estimated Value** | **₹14.50 Crore (INR 145,000,000)** |
| **Earnest Money Deposit (EMD)** | **₹29,00,000** (Exempt for registered MSE/Udyam enterprises) |
| **Delivery / Commissioning Site** | CPCL Manali Refinery, Chennai, Tamil Nadu 600068 |

---

## 2. Tender Qualification Requirements (Single Source of Truth)

The 10 qualification requirements mapped to the CLAUSENTIS deterministic and AI compliance evaluation engines:

| Req ID | Clause | Category | Rule Type | Threshold / Criterion | Expected Document Type |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `req-cpcl-01` | Clause 4.1 | Financial | `MINIMUM_VALUE` | Average 3-Yr Turnover ≥ **₹10.00 Cr** | `Financial_Statement.pdf` |
| `req-cpcl-02` | Clause 4.2 | Experience | `YEARS_EXPERIENCE` | Operational Experience ≥ **5.0 Years** (≥ 120 bar(g)) | `Experience_Certificate.pdf` |
| `req-cpcl-03` | Clause 2.1 | Statutory | `DOCUMENT_REQUIRED` | Active Form GST REG-06 Registration | `GST_Certificate.pdf` |
| `req-cpcl-04` | Clause 2.2 | Statutory | `DOCUMENT_REQUIRED` | Valid Income Tax PAN Allotment | `PAN_Document.pdf` |
| `req-cpcl-05` | Clause 7.1 | Financial | `DOCUMENT_REQUIRED` | ₹29L EMD Proof / Udyam MSME Exemption | `Udyam_Certificate.pdf` |
| `req-cpcl-06` | Clause 5.1 | Technical | `DOCUMENT_REQUIRED` | Direct OEM Authorization (10-Yr Spares + SIL-3) | `OEM_Authorization.pdf` |
| `req-cpcl-07` | Clause 6.3 | Statutory | `PERCENTAGE_THRESHOLD`| Make in India Local Content ≥ **50.0%** (Class-I) | `Local_Content_Declaration.pdf` |
| `req-cpcl-08` | Clause 3.4 | Legal | `DOCUMENT_REQUIRED` | Sworn Non-Blacklisting Affidavit (Annexure-B) | `Non_Debarment_Declaration.pdf` |
| `req-cpcl-09` | Clause 8.2 | Quality | `DATE_VALIDITY` | Valid ISO 9001:2015 on Bid Closing (28-Sep-2026)| `ISO_Quality_Certificate.pdf` |
| `req-cpcl-10` | Clause 5.4 | Technical | `DOCUMENT_REQUIRED` | API 618 5th Ed Conformance (120 bar(g), SIL-3) | `Technical_Compliance_Datasheet.pdf` |

---

## 3. Directory Structure

```
bidders/
├── README.md                                 # This authoritative guide
│
├── bidder_01_compliant/                      # SCENARIO 1: 100% COMPLIANT (LOW RISK)
│   ├── Financial_Statement.pdf               # Avg Turnover: ₹14.80 Cr (PASS, UDIN verified)
│   ├── Experience_Certificate.pdf            # 8.0 Years operational standing at IOCL & BPCL (PASS)
│   ├── GST_Certificate.pdf                   # GSTIN: 33AABCA1234F1Z8 (Active, Tamil Nadu)
│   ├── PAN_Document.pdf                      # PAN: AABCA1234F (Harmonized with GSTIN digits 3-12)
│   ├── Udyam_Certificate.pdf                 # UDYAM-TN-02-0049182 (Medium Enterprise, EMD Exempt)
│   ├── OEM_Authorization.pdf                 # Direct Bauer OEM MAF (GC-1200, 10-Yr Spares, SIL-3)
│   ├── Local_Content_Declaration.pdf         # 68.0% Local Domestic Content (Class-I Supplier)
│   ├── Non_Debarment_Declaration.pdf         # Notarized Sworn Affidavit on ₹100 Stamp Paper
│   ├── ISO_Quality_Certificate.pdf           # ISO 9001:2015 valid till 30-Nov-2027 (PASS)
│   └── Technical_Compliance_Datasheet.pdf    # API 618 120 bar(g) design, SIL-3 ESD logic (PASS)
│
├── bidder_02_non_compliant/                  # SCENARIO 2: NON-COMPLIANT (HIGH RISK)
│   ├── Financial_Statement.pdf               # Avg Turnover: ₹7.85 Cr (FAILS < ₹10.00 Cr threshold)
│   ├── Experience_Certificate.pdf            # 3.2 Years standing, 75 bar(g) (FAILS < 5.0 Yrs & < 120 bar)
│   ├── GST_Certificate.pdf                   # GSTIN: 07AABCV5678K1Z3 (Valid)
│   ├── PAN_Document.pdf                      # PAN: AABCV5678K (Valid)
│   ├── Udyam_Certificate.pdf                 # UDYAM-DL-01-0078129 (Valid)
│   ├── OEM_Authorization.pdf                 # Unauthorized 3rd-party stockist letter (XYZ Corp)
│   ├── Local_Content_Declaration.pdf         # 38.0% Local Content (FAILS mandatory 50.0% threshold)
│   ├── ISO_Quality_Certificate.pdf           # EXPIRED on 15-Apr-2026 (prior to tender closing)
│   ├── Technical_Compliance_Datasheet.pdf    # Deficient: 90 bar(g) max discharge, Non-SIL logic
│   └── [MISSING: Non_Debarment_Declaration]  # OMITTED! Triggers mandatory MISSING rule violation
│
└── bidder_03_contradictory/                  # SCENARIO 3: CONTRADICTIONS (MANUAL REVIEW)
    ├── Financial_Statement.pdf               # Audited Balance Sheet: ₹11.20 Cr Turnover
    ├── Bid_Submission_Declaration_Form.pdf   # CONFLICT 1: Claims ₹16.50 Cr Turnover (+₹5.30 Cr gap!)
    ├── Experience_Certificate.pdf            # Completion Cert: 4.1 Years (CONFLICT 2: Claims 7.5 Yrs)
    ├── GST_Certificate.pdf                   # GSTIN: 24AAACT1111M1Z6 (Embedded PAN: AAACT1111M)
    ├── PAN_Document.pdf                      # CONFLICT 3: PAN is AAACT9999M (Differs from GSTIN!)
    ├── Udyam_Certificate.pdf                 # CONFLICT 4: Name is "Trident Heavy Engineering Works"
    ├── OEM_Authorization.pdf                 # Model GC-1000 (Mismatch with required Model GC-1200)
    ├── Local_Content_Declaration.pdf         # Self-Declaration claims 65.0% Local Content
    ├── Cost_Auditor_Local_Content_Breakdown.pdf # CONFLICT 5: Cost Audit computes only 46.5% Local Content!
    ├── Non_Debarment_Declaration.pdf         # Notarized Affidavit (Entity: Trident Energy Equipment)
    ├── ISO_Quality_Certificate.pdf           # Valid till 15-Oct-2026 (Impending Expiry warning)
    └── Technical_Compliance_Datasheet.pdf    # Name mismatch: "Trident Compressor Technologies Ltd"
```

---

## 4. Detailed Bidder Profiles & Evaluation Benchmarks

### Bidder 01 — Compliant (`bidder_01_compliant`)
* **Legal Entity Name**: **Apex Heavy Engineering Pvt Ltd**
* **CIN**: `U28910TN2014PTC099418` | **PAN**: `AABCA1234F` | **GSTIN**: `33AABCA1234F1Z8`
* **Udyam Number**: `UDYAM-TN-02-0049182` (Medium Manufacturing Enterprise)
* **Registered Address**: Plot 41-B, Ambattur Industrial Estate, Chennai, Tamil Nadu 600058
* **Authorized Signatory**: K. Srinivasan, Director (Commercial & Contracts)
* **Financial Standing**:
  * FY 2023-24: ₹13.80 Cr | FY 2024-25: ₹14.60 Cr | FY 2025-26: ₹16.00 Cr
  * **3-Year Average Audited Turnover**: **₹14.80 Crore** (Surplus: +₹4.80 Cr above threshold)
  * **Net Worth**: ₹8.50 Crore | **UDIN**: `26098192AAAA0192` (M/s S. Ramanathan & Co., CAs)
* **Experience Standing**:
  * Projects at IOCL Panipat (140 bar(g)), BPCL Kochi (130 bar(g)), GAIL Vijaipur (125 bar(g))
  * **Total Consecutive Standing**: **8.0 Years** (Exceeds mandatory 5.0 years)
* **Make in India**: **68.0%** Class-I Domestic Value Addition (Exceeds mandatory 50.0%)
* **OEM Authorization**: Direct OEM Certified backing from Bauer Gas Systems GmbH for Model GC-1200 with 10-year spares and SIL-3 safety.
* **ISO 9001**: Valid until **30-Nov-2027** (Active through delivery window)
* **Expected Clausentis Outcome**:
  * **Status**: `COMPLIANT` / `READY_FOR_REVIEW`
  * **Compliance Score**: **100%** (10/10 Requirements Passed)
  * **Risk Level**: **LOW RISK**
  * **Cross-Document Discrepancies**: 0 detected

---

### Bidder 02 — Non-Compliant (`bidder_02_non_compliant`)
* **Legal Entity Name**: **Vanguard Compression Systems Ltd**
* **CIN**: `L27100DL2015PLC029841` | **PAN**: `AABCV5678K` | **GSTIN**: `07AABCV5678K1Z3`
* **Registered Address**: Plot 88, Okhla Industrial Area Phase-III, New Delhi 110020
* **Authorized Signatory**: Rajesh Malhotra, General Manager (Business Development)
* **Requirement Failures**:
  1. **Turnover Deficit (`req-cpcl-01`)**: 3-Year Average Audited Turnover is **₹7.85 Crore** (Deficit of -₹2.15 Cr below mandatory ₹10.00 Cr minimum).
  2. **Insufficient Experience (`req-cpcl-02`)**: Demonstrates only **3.2 Years** operational standing (Deficit of -1.8 years below 5.0 years requirement), on packages operating at only 75 bar(g) (fails mandatory 120 bar(g)).
  3. **Unauthorized Distributor (`req-cpcl-06`)**: MAF is issued by *XYZ Pumps & Valves Trading Corp* (a third-party commercial trader) rather than an authorized reciprocating compressor OEM.
  4. **Low Domestic Content (`req-cpcl-07`)**: Make in India local content is only **38.0%** (Fails mandatory 50.0% Class-I threshold).
  5. **Expired Quality Certification (`req-cpcl-09`)**: ISO 9001:2015 Certificate expired on **15-April-2026**, prior to tender closing on 28-September-2026.
  6. **Missing Mandatory Document (`req-cpcl-08`)**: Sworn Non-Blacklisting Affidavit (`Non_Debarment_Declaration.pdf`) is **completely omitted from the dossier**.
* **Expected Clausentis Outcome**:
  * **Status**: `NON_COMPLIANT` / `REJECTED`
  * **Compliance Score**: **30% - 47%** (6 Passed, 3 Failed, 1 Missing)
  * **Risk Level**: **HIGH RISK**
  * **AI Recommendation**: Immediate disqualification under GFR 2017 Rule 175(1) and CVC guidelines.

---

### Bidder 03 — Contradictory (`bidder_03_contradictory`)
* **Primary Entity Name**: **Trident Energy Equipment Pvt Ltd**
* **CIN**: `U28100GJ2016PTC089124` | **Address**: Makarpura GIDC Industrial Estate, Vadodara 390010
* **Authorized Signatory**: Sanjay M. Patel, Managing Director
* **Intentional Contradictions (Detectable by Cross-Document Intelligence)**:
  1. **Financial Turnover Contradiction**:
     * `Financial_Statement.pdf` (Audited CA Balance Sheet) certifies 3-year average turnover of **₹11.20 Crore**.
     * `Bid_Submission_Declaration_Form.pdf` (Bidder Qualification Declaration) claims **₹16.50 Crore**!
     * **Discrepancy**: **₹5.30 Crore** unexplained gap between self-declaration and audited books.
  2. **Legal Entity Name Discrepancy**:
     * Incorporation, GST, PAN: `Trident Energy Equipment Pvt Ltd` (Private Limited Company)
     * Udyam MSME Certificate: `Trident Heavy Engineering Works` (Proprietorship / Partnership firm name)
     * Technical Datasheet: `Trident Compressor Technologies Ltd` (Third distinct corporate entity name)
  3. **PAN vs GSTIN Identifier Mismatch**:
     * PAN Document lists: `AAACT9999M`
     * GST Certificate lists GSTIN: `24AAACT1111M1Z6` (Digits 3–12 are `AAACT1111M`, which conflicts with the PAN document!)
  4. **Experience Duration Inconsistency**:
     * `Experience_Certificate.pdf` (Client completion certificate from ONGC) confirms **4.1 Years** operational standing.
     * `Bid_Submission_Declaration_Form.pdf` claims **7.5 Years** experience.
  5. **Make in India Local Content Conflict**:
     * `Local_Content_Declaration.pdf` (Self-declaration) claims **65.0%** local content.
     * `Cost_Auditor_Local_Content_Breakdown.pdf` (Independent Cost Auditor Certificate) calculates actual domestic value addition as only **46.5%** (which also fails the 50.0% threshold!).
* **Expected Clausentis Outcome**:
  * **Status**: `REQUIRES_ATTENTION` / `MANUAL_REVIEW`
  * **Compliance Score**: **80% - 90%** (Heuristic rules pass on paper, but flagged by contradiction engine)
  * **Risk Level**: **HIGH RISK / MEDIUM RISK**
  * **Cross-Document Discrepancies**: **5 Critical Findings** flagged with high severity.
  * **AI Recommendation**: Issue formal 48-hour statutory clarification notice and refer to tender committee.

---

## 5. Technical PDF Specifications

All 31 PDF files generated in this package adhere to strict enterprise document requirements:
1. **Vector & Programmatic Text**: Built using `jsPDF` vector primitives. All text is 100% extractable and selectable by `unpdf`, `pdfjs`, PyPDF, Tesseract, and LLM document extractors.
2. **Standard A4 Layout**: Exact A4 page dimensions (210 mm × 297 mm) with standard margins and clean visual hierarchy.
3. **Multi-Page Completeness**:
   * Financial statements span 3 pages with full balance sheets, P&L extracts, and notes.
   * Experience packages span 2 pages with client completion certificates and project schedules.
   * Technical datasheets span 2 pages with process engineering tables and SIL-3 safety architecture.
4. **Disclaimers**: Top banner and sub-banner on **every page** clearly state:  
   `SYNTHETIC DOCUMENT — FOR CLAUSENTIS PROTOTYPE DEMONSTRATION ONLY`
5. **No External Assets Required**: Clean native vector rendering without reliance on external image files or network URLs.

---

## 6. How to Use in CLAUSENTIS

1. **Authority Portal Evaluation**:
   * Navigate to the Authority Tender Review dashboard for `CPCL/ENG/2026/HPGC-0412`.
   * Inspect the pre-populated dossiers corresponding to Bidder 01 (Apex), Bidder 02 (Vanguard / PQR), and Bidder 03 (Trident / XYZ).
2. **Uploading via Bidder Document Vault**:
   * Upload the PDFs from `bidders/bidder_01_compliant/` into a bidder's vault.
   * Trigger the **Cross-Document Extraction** action.
   * Observe 100% concordance across all 10 requirements.
3. **Benchmarking Contradiction Detection**:
   * Upload the PDFs from `bidders/bidder_03_contradictory/`.
   * Run the **Cross-Document Comparison Analysis**.
   * Verify that the engine detects the turnover mismatch (₹11.20 Cr vs ₹16.50 Cr), the PAN-in-GSTIN mismatch (`AAACT9999M` vs `AAACT1111M`), and the entity name mismatch (`Trident Energy Equipment Pvt Ltd` vs `Trident Heavy Engineering Works`).
