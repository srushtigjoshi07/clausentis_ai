# CLAUSENTIS DOCUMENT VERIFICATION & FORENSICS SPECIFICATION
**Standard Operating Procedure & Engineering Specification for Public Procurement Verification**  
**Document Code:** `SPEC-CLAUSENTIS-DOCVER-V2.4`  
**Applicability:** Public Procurement Authorities, Central PSUs, State Procurement Portals, SIH26100  

---

## 1. Executive Summary & Purpose

In government procurement, AI is an untrusted parsing assistant—not a legal authority. Under the General Financial Rules (GFR 2017), the Central Vigilance Commission (CVC) guidelines, and the Manual for Procurement of Goods (2022), automated systems must never make unilateral qualification or disqualification decisions. 

**CLAUSENTIS** enforces an evidence-based pipeline where:
1. Every claim is grounded in submitted documents with exact page references.
2. Every document undergoes deterministic byte-level forensic scrutiny before extraction.
3. Official external registries are cross-verified with transparent fail-safe fallbacks.
4. Technical extraction certainty (**Confidence**) is strictly separated from legal impact (**Severity**).
5. The designated Procurement Officer retains sole legal authority, backed by an immutable cryptographic audit ledger.

```
DOCUMENT SUBMISSION
        ↓
INGESTION & SHA-256 DIGESTION
        ↓
DOCUMENT FORENSICS (Byte-level, Revisions, Signatures, Editors)
        ↓
AI FACT EXTRACTION (Page-grounded, Unstructured to Structured JSON)
        ↓
STATUTORY REGISTRY VERIFICATION (GSTN, PAN, Udyam, MCA21, EPFO)
        ↓
DETERMINISTIC COMPLIANCE RULE ENGINE (Pass/Fail, Mathematical Thresholds)
        ↓
CROSS-DOCUMENT RECONCILIATION (Turnover, Entity Identity, OEM Authorizations)
        ↓
PROCUREMENT OFFICER REVIEW (Evidence Root-Cause "Why?" Inspection)
        ↓
SOVEREIGN DIGITAL VERDICT & CVC-COMPLIANT AUDIT TRAIL
```

---

## 2. Ingestion & Provenance Standard

### 2.1 File Size & Format Boundaries
- **Supported Formats:** Portable Document Format (`application/pdf`, `%PDF-` magic header).
- **Maximum File Size:** 25 Megabytes (26,214,400 bytes) per artifact.
- **Minimum Valid Size:** 128 bytes.
- **Magic Byte Verification:** File must start with `%PDF-` at byte offset 0. Any attempt to upload disguised executables, scripts, or non-PDF blobs is halted immediately with status `INGESTION_FAILED`.

### 2.2 Cryptographic Fingerprinting (SHA-256)
- Every ingested file is hashed server-side using cryptographic SHA-256 before disk or bucket storage.
- The hash is permanently bound to the document record:
  $$\text{SHA-256}(D) = \text{HexDigest}(\text{crypto.createHash('sha256').update}(D))$$
- Hash verification guarantees non-repudiation: if a bidder alters a document post-submission, the digest mismatch immediately invalidates the package.

### 2.3 Lifecycle Tracking
Each document advances through discrete, observable states:
`UPLOADED` $\rightarrow$ `PROCESSING` $\rightarrow$ `EXTRACTING` $\rightarrow$ `FORENSIC_ANALYSIS` $\rightarrow$ `VERIFYING` $\rightarrow$ `EVIDENCE_READY` $\rightarrow$ `EVALUATED` $\rightarrow$ `COMPLETED`.  
On failure, it transitions to `PROCESSING_FAILED` or `MANUAL_REVIEW_REQUIRED`.

---

## 3. Specific Document Verification Rules

### 3.1 GST Registration Certificate (Form GST REG-06)
- **Primary Source:** Form GST REG-06 issued under Central Goods and Services Tax Rules, 2017.
- **Extracted Fields:** GSTIN (15 characters), Legal Entity Name, Trade Name, Constitution of Business, Principal Place of Business, Date of Liability, Period of Validity, Taxpayer Type.
- **Verification Logic:**
  1. **Format Validation:** Matches regex `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`.
  2. **State Code Concordance:** Leading 2 digits must match the state of execution or inter-state eligibility.
  3. **Embedded PAN Extraction:** Digits 3 through 12 represent the corporate PAN. Must match standalone PAN card identically.
  4. **Government Registry Cross-Check:** Verified via GSTN sandbox / production API. Confirms status is `ACTIVE`. If status is `CANCELLED` or `SUSPENDED`, status = `FAIL`.

### 3.2 Permanent Account Number (PAN) Card
- **Primary Source:** PAN Certificate / e-PAN issued by Income Tax Department (NSDL / UTIITSL).
- **Extracted Fields:** Permanent Account Number (10 alphanumeric), Name of Entity, Father's Name / Date of Incorporation.
- **Verification Logic:**
  1. **Format Validation:** Matches regex `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`.
  2. **Entity Type Code (4th Character):** Must match corporate constitution (e.g., `C` for Company, `F` for Partnership/LLP, `A` for Association, `P` for Individual).
  3. **Cross-Check with GSTIN:** Characters 3-12 of the submitted GSTIN must equal the PAN.

### 3.3 Udyam Registration Certificate (MSME)
- **Primary Source:** Ministry of Micro, Small and Medium Enterprises (MSME) Udyam Portal.
- **Extracted Fields:** Udyam Registration Number, Enterprise Name, Major Activity (Manufacturing / Services), Enterprise Category (Micro / Small / Medium), Date of Incorporation, Date of Udyam Registration, NIC 2-Digit / 4-Digit / 5-Digit codes.
- **Verification Logic:**
  1. **Format Validation:** Matches regex `^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$`.
  2. **EMD Exemption Eligibility:** Under Public Procurement Policy for MSEs Order, 2012, Micro and Small enterprises qualify for 100% EMD fee waiver. Medium enterprises are evaluated based on tender-specific NIT terms.
  3. **NIC Code Conformance:** The tender's scope of work must match the registered National Industrial Classification (NIC) activities on the certificate.

### 3.4 MCA21 / Company Incorporation Certificate
- **Primary Source:** Ministry of Corporate Affairs (MCA21) RoC database.
- **Extracted Fields:** Corporate Identification Number (CIN), Company Name, RoC Code, Registration Number, Company Category, Authorized Capital, Paid-up Capital, Date of Incorporation.
- **Verification Logic:**
  1. **CIN Validation:** Matches 21-character structure `[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}`.
  2. **Director Identification Number (DIN):** Signatory authorization matched against MCA Director Master Data.
  3. **Active Status:** Confirms entity is `Active` and has not been struck off under Section 248 of the Companies Act, 2013.

### 3.5 OEM Authorization Letter (Manufacturer's Authorization Form - MAF)
- **Primary Source:** Direct Manufacturer Authorization issued on OEM corporate letterhead.
- **Extracted Fields:** Issuing OEM Name, Authorized Bidder Name, Tender Reference Number, Product Line / Model Numbers, Authorization Period, Signatory Name and Designation.
- **Verification Logic:**
  1. **Brand / OEM Identity Match:** Manufacturer issuing the letter must match the approved OEM specified in the tender datasheet.
  2. **Direct Authorization Requirement:** Authorization must be direct from OEM to Bidder; secondary or chain-distributor authorizations without explicit OEM consent are rejected (`OEM_MISMATCH`).
  3. **Tender Specificity:** Letter must explicitly reference the current tender NIT number.

### 3.6 Audited Financial Statements & Turnover Certificate
- **Primary Source:** Balance Sheet, Profit & Loss Account, and CA Turnover Certificate with Unique Document Identification Number (UDIN).
- **Extracted Fields:** 3-Year Annual Turnover (FY-1, FY-2, FY-3), Net Worth, Operating Profit, Auditor Membership Number, UDIN.
- **Verification Logic:**
  1. **Mathematical Average:** $\text{Average Turnover} = \frac{\text{FY}_1 + \text{FY}_2 + \text{FY}_3}{3}$. Must be $\ge$ Tender Minimum Threshold.
  2. **Net Worth Check:** Net worth must be strictly positive as on 31st March of the preceding financial year.
  3. **Cross-Document Harmonization:** Declared turnover in Bid Submission Form must equal audited balance sheet figures within a tolerance of $\pm 0.5\%$. Differences $> ₹0.50\text{ Cr}$ trigger `TURNOVER_MISMATCH`.

### 3.7 Non-Blacklisting / Debarment Undertaking
- **Primary Source:** Sworn affidavit or letterhead undertaking executed by an authorized signatory.
- **Extracted Fields:** Sworn statement confirming non-debarment by Central/State Ministries, PSUs, GeM, or CPCL, Notary Stamp, Execution Date.
- **Verification Logic:**
  1. **Presence Check:** Mandatory qualification document. If omitted, result = `MISSING` (Disqualification ground).
  2. **Date Validity:** Must be executed within 90 days prior to tender closing date.
  3. **Cross-Check with Central Debarment Lists:** Verified against central consolidated blacklist repository.

### 3.8 Make in India Local Content Declaration
- **Primary Source:** Class-I / Class-II Local Supplier self-certification (or statutory auditor certificate if tender value $> ₹10\text{ Cr}$).
- **Extracted Fields:** Percentage of Local Domestic Value Addition, Location(s) of Value Addition, Supplier Classification.
- **Verification Logic:**
  1. **Class-I Local Supplier:** Local Content $\ge 50.0\%$.
  2. **Class-II Local Supplier:** $20.0\% \le \text{Local Content} < 50.0\%$.
  3. **Non-Local Supplier:** Local Content $< 20.0\%$.
  4. Non-qualifying declarations trigger `LOCAL_CONTENT_DEFICIT`.

---

## 4. Document Forensics Engine Specification

The Clausentis Forensics Engine performs deterministic byte-level inspections directly on the file buffer.

### 4.1 Structural Checks & Anomaly Definitions

| Check Name | Target Artifact | Threshold / Anomaly Condition | Status Output | Severity |
| :--- | :--- | :--- | :--- | :--- |
| `PDF_STRUCTURE_ANALYSIS` | File Header Offset 0 | Missing `%PDF-` magic header | `FAILED` | `CRITICAL` |
| `PDF_REVISION_ANALYSIS` | File Trailer Objects | Count of `%%EOF` markers $> 1$ | `WARNING` (2-3) / `SUSPICIOUS` ($\ge 4$) | `MEDIUM` / `HIGH` |
| `PDF_METADATA_ANALYSIS` | `/Producer`, `/Creator`, `/Author` | Matches Graphic Editors (`Canva`, `Photoshop`, `GIMP`, `CorelDraw`, `Illustrator`) | `SUSPICIOUS` | `HIGH` (on statutory cert) |
| `DIGITAL_SIGNATURE_CHECK`| `/ByteRange`, `/Contents`, `/Sig` | Checks for valid PKCS#7 digital signatures | `PASS` (Present) / `WARNING` (Unsigned) | `LOW` |
| `TEXT_IMAGE_LAYER_ANALYSIS`| Streams `/Filter /FlateDecode` vs `/Image` | Zero vector text streams; pure raster image | `WARNING` (Scanned doc) | `LOW` |

### 4.2 Handling Incremental Updates
- In standard PDF generation, a file has a single `%%EOF` marker.
- When an existing PDF is edited in consumer PDF tools, an incremental revision body and a new `%%EOF` are appended without re-rendering original streams.
- **Clausentis Policy:** 
  - 1 `%%EOF`: Clean original document.
  - 2 `%%EOF`: Permissible for scanned forms with appended digital signatures.
  - $\ge 3$ `%%EOF`: Flagged for manual review to verify text coordinates and ensure no numbers or dates were overlaid.

### 4.3 Handling Graphic Editors on Official Documents
- Official government and banking certificates (GST REG-06, PAN, Udyam, Form 16, Bank Guarantees) are issued by automated enterprise systems (Apache FOP, iText, Oracle Reports, Protean eGov Signer).
- If metadata reveals `Producer: Canva`, `Photoshop`, or `Illustrator`, this indicates high probability of visual modification.
- **Clausentis Rule:** The document is flagged as `SUSPICIOUS` with `HIGH` severity. The system does not claim criminal fraud; it alerts the officer: *"Graphic design software metadata detected on statutory certificate. Verify authenticity with issuing registrar."*

---

## 5. Confidence vs. Severity Separation

A foundational flaw in naive AI verification systems is conflating extraction confidence with risk severity.

$$\begin{aligned}
\text{Confidence} &\in [0.0, 1.0] \quad \text{(Statistical certainty that the observation is technically accurate)} \\
\text{Severity} &\in \{\text{LOW}, \text{MEDIUM}, \text{HIGH}, \text{CRITICAL}\} \quad \text{(Material impact on qualification under tender rules)}
\end{aligned}$$

### Example Scenarios:

1. **High Confidence, High Severity:**
   - Observation: Audited turnover is ₹8.72 Cr against mandatory ₹10.00 Cr.
   - Confidence = `0.99` (Extracted from 3 separate balance sheet tables).
   - Severity = `HIGH` (Mandatory financial criteria failed; tender disqualification).

2. **High Confidence, Low Severity:**
   - Observation: Bidder submitted document with Producer `Canva` for a company marketing presentation brochure.
   - Confidence = `0.98` (Metadata string clearly present).
   - Severity = `LOW` (Marketing brochure has no statutory qualification weight).

3. **Low Confidence, High Severity:**
   - Observation: Scanned, faint, skewed copy of non-blacklisting affidavit where Notary date is partially illegible.
   - Confidence = `0.65` (OCR ambiguity).
   - Severity = `HIGH` (Mandatory debarment criterion).
   - Engine Action: Marks finding as `MANUAL_REVIEW` / `CLARIFICATION_REQUIRED`, preventing automated disqualification.

---

## 6. Fail-Safe Offline & Fallback Rules

Government portals (GSTN, Udyam, MCA21, EPFO) frequently experience downtime, maintenance windows, or rate-limiting. A procurement system must never automatically disqualify a vendor due to government gateway outages.

### 6.1 The Fail-Safe Matrix

| External Portal State | Internal Response Status | Officer Dashboard Representation | Impact on Bid Qualification |
| :--- | :--- | :--- | :--- |
| Portal Online & Records Concordant | `LIVE_VERIFIED` / `MATCH` | Green badge: Verified against live G2G database | Evaluated as compliant |
| Portal Online & Discrepancy Found | `MISMATCH` | Red badge: Discrepancy details & delta displayed | Flagged as high risk |
| Portal Unreachable / Gateway Timeout | `UNABLE_TO_VERIFY` | Amber badge: Gateway offline; manual verification link | **No automated penalty** |
| Sandbox / Simulation Mode | `DOCUMENT_VERIFIED` [SANDBOX] | Neutral badge: Offline sample concordant | Validated against test harness |

### 6.2 Manual Review Protocol for `UNABLE_TO_VERIFY`
When an external registry returns `UNABLE_TO_VERIFY`:
1. The engine logs the incident with timestamp and target endpoint.
2. The requirement transitions to `MANUAL_REVIEW_REQUIRED`.
3. The Procurement Officer is provided with direct official portal verification links and extracted credentials for manual lookup.
4. The bidder's score is not docked during this provisional period.

---

## 7. Auditability & Digital Verdicts

To comply with the Central Vigilance Commission (CVC) guidelines:
- Every extraction, forensic check, and evaluation is recorded with an immutable timestamp, user/actor identity, and SHA-256 payload digest.
- The Procurement Officer records their sovereign verdict (`QUALIFIED`, `DISQUALIFIED`, or `CLARIFICATION_REQUIRED`) with mandatory justifying remarks.
- The verdict is sealed with an SHA-256 digital integrity seal and exported as a signed CVC-compliant Audit PDF.
