# CLAUSENTIS PRODUCTION ARCHITECTURE ROADMAP
**Enterprise Evolution from SIH Prototype to Sovereign Government-Grade Procurement Intelligence**  
**Document Code:** `ROADMAP-CLAUSENTIS-PROD-V2.4`  
**Target Audience:** Chief Technology Officers, Procurement Directors, MeitY / NIC Auditors, Technical Evaluation Committees  

---

## 1. Executive Architectural Vision

**CLAUSENTIS** is designed on a core foundational principle:
> **Clausentis is not an AI model. It is a sovereign procurement verification system with deterministic auditability and AI-assisted extraction.**

While standard AI applications rely on generative probabilistic predictions, public procurement operates under strict administrative law (GFR 2017, CVC guidelines, Arbitration & Conciliation Act 1996). Under this legal regime:
- Disqualifications must be justified by clear, demonstrable non-compliance with tender conditions.
- Black-box probabilistic "risk scores" or "fraud likelihood percentages" without grounded document evidence are legally indefensible in tender appellate tribunals and High Courts.
- Every automated assertion must trace directly to an immutable source document and verified page number.

This roadmap articulates the transition from the current high-fidelity prototype to a government-grade production deployment.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PHASE PROGRESSION                                │
├──────────────────────────┬──────────────────────────┬───────────────────────┤
│ PHASE 1: SIH PROTOTYPE   │ PHASE 2: PILOT (PSU)     │ PHASE 3: SOVEREIGN    │
│ - Next.js 16 + Supabase  │ - NIC / G2G API Sandboxes│ - On-premise / MeghRaj│
│ - Deterministic Rules    │ - DSC Token e-Signing    │ - Air-gapped OCR/LLM  │
│ - In-Memory & Edge DB    │ - Asynchronous Workers   │ - STQC / CVC Certified│
│ - Byte Forensics v1      │ - Enterprise KMS Keys    │ - GeM / CPPP Native   │
└──────────────────────────┴──────────────────────────┴───────────────────────┘
```

---

## 2. Three-Phase Evolution Matrix

### Phase 1: SIH Prototype & Validated Sandbox (Current State)
- **Primary Goal:** Flawless demonstration of end-to-end tender lifecycle, document ingestion, SHA-256 fingerprinting, byte-level forensics, deterministic compliance calculation, cross-document reconciliation, and sovereign procurement officer signing.
- **Architecture:**
  - **Frontend/Backend:** Next.js 16 (React 19 App Router, Server Actions, Server Components).
  - **Data Persistence:** Supabase PostgreSQL with Row Level Security (RLS) + In-Memory Fallback Repository.
  - **Document Processing:** Server-side Node.js / TypeScript byte analyzers (`%PDF-`, `%%EOF`, PKCS#7 detection).
  - **G2G Verification:** Normalized statutory providers with live simulation and fail-safe `UNABLE_TO_VERIFY` fallbacks.
  - **Design & Theme:** Strict Enterprise Slate palette (accessible, high contrast), single language (English), zero user personalization noise.

### Phase 2: Production Pilot Deployment (PSU / Departmental Staging)
- **Primary Goal:** Live deployment within a single Central Public Sector Undertaking (e.g., CPCL / ONGC / IOCL) handling active tenders with controlled vendor traffic.
- **Architectural Enhancements:**
  1. **Government API Connectivity:**
     - Integration with GSTN GSP (GST Suvidha Provider) APIs for live tax filing verification.
     - Integration with MCA21 / RoC API via Corporate Affairs Gateway.
     - Integration with Udyam verification API via MSME National Portal.
  2. **Statutory Digital Signature (DSC) Integration:**
     - Support for Class-3 USB Crypto Token digital signatures (eMudhra, Capricorn, VSign) using the CCA PKI hierarchy.
     - Implementation of Aadhaar-based e-Sign via MeitY empaneled e-Sign Service Providers (ESP).
  3. **Queue & Background Task Processing:**
     - Decoupling of heavy PDF OCR and forensic extraction using Postgres-backed transactional queues (`pg-boss` or native Supabase Realtime).
     - Idempotent document processing workers with strict timeout guarantees.
  4. **Document Storage Scaling:**
     - Transition to S3-compatible MeitY-empaneled cloud storage (NIC Cloud / MeghRaj) with client-side envelope encryption using AWS KMS / Azure Key Vault.

### Phase 3: Sovereign Government-Grade Deployment (National CPPP / GeM)
- **Primary Goal:** Integration into the Central Public Procurement Portal (CPPP - `eprocure.gov.in`) and Government e-Marketplace (GeM) serving hundreds of thousands of tenders nationwide.
- **Architectural Enhancements:**
  1. **Air-Gapped & Sovereign AI Inference:**
     - Fully isolated, local LLM inference engines (quantized open-weights or dedicated GPU appliances) deployed within government data centers without internet egress.
     - Zero telemetry, zero external model provider dependency (OpenAI/Anthropic/Google external APIs replaced with sovereign clusters).
  2. **Security & STQC Certification:**
     - Full compliance with MeitY Guidelines for Cloud Service Providers.
     - STQC (Standardisation Testing and Quality Certification) website quality and cybersecurity audit certification.
     - CERT-In empaneled security auditor penetration testing.
  3. **High-Availability Infrastructure:**
     - Multi-region active-active disaster recovery across National Data Centers (NDC New Delhi, NDC Bhubaneswar, NDC Hyderabad).
     - Kubernetes (K8s) orchestration with automated autoscaling.
  4. **Cryptographic Blockchain / Immutable Audit Ledger:**
     - Integration of tender evaluation dossiers into an append-only permissioned ledger for anti-tamper legal protection against corrupt bid alterations.

---

## 3. Technology Stack Justification & Anti-Bloat Philosophy

A common anti-pattern in modern software engineering is introducing complex distributed infrastructure prematurely (e.g., Kubernetes, Kafka, Redis, Celery, MongoDB) for a system whose core requirement is **deterministic correctness and low failure probability**.

### 3.1 Why Next.js + Supabase is Production-Ready
1. **Server Actions with Server-Side Isolation:** File ingestion, SHA-256 calculation, and forensic byte parsing execute strictly server-side in Node.js, ensuring client devices cannot tamper with evaluation results.
2. **PostgreSQL Relational Rigor:** Public procurement is inherently relational. Tenders have clauses, bids have exhibits, findings have evidence pointers. PostgreSQL with foreign keys and ACID transactions is vastly superior to non-relational document stores for procurement audits.
3. **Row Level Security (RLS):** Supabase RLS enforces strict sovereign boundaries at the database kernel level:
   - Authority officers cannot access bids from unassigned tenders.
   - Bidders cannot view competitors' submissions or internal authority notes before technical opening.
4. **Low Operational Overhead:** Eliminating unneeded message brokers and cache tiers reduces the attack surface and points of failure, which is critical for government security approvals.

---

## 4. Digital Signature & Non-Repudiation Architecture

In Indian public procurement, Section 5 of the Information Technology Act, 2000 grants legal recognition to electronic records signed using digital signatures issued under the Controller of Certifying Authorities (CCA).

### 4.1 Production Signing Hierarchy
```
Controller of Certifying Authorities (CCA India)
        ↓
Licensed Certifying Authority (eMudhra / Capricorn / (n)Code)
        ↓
Class-3 Digital Signature Certificate (DSC)
        ↓
Hardware Crypto Token (FIPS 140-2 Level 3)
        ↓
PKCS#7 / PAdES Digital Signature on Evaluation Dossier PDF
```

### 4.2 Step-by-Step Signing Protocol
1. **Dossier Finalization:** The Procurement Officer confirms their evaluation. The system renders the standardized CVC Decision Record.
2. **Hash Computation:** A SHA-256 digest is generated over the canonical dossier JSON and PDF artifact.
3. **DSC Signing Ceremony:**
   - In browser/client environment, the Clausentis PKI Bridge connects to the officer's plugged-in USB crypto token.
   - The token computes the digital signature using the officer's private key without ever exposing the key to memory.
4. **Embedding:** The PKCS#7 signature dictionary is embedded into the generated PDF with `/ByteRange` and timestamp.
5. **Ledger Sealing:** The transaction hash, DSC serial number, and timestamp are committed to the immutable audit table.

---

## 5. Defense-in-Depth Security Boundaries

| Security Domain | Phase 1 (Prototype) | Phase 2 (Pilot) | Phase 3 (Production) |
| :--- | :--- | :--- | :--- |
| **Authentication** | Supabase Auth (Email + RLS) | SAML 2.0 / OAuth2 / Parichay (Jan Parichay SSO) | Multi-Factor Authentication + Hardware DSC Token |
| **Data Encryption** | TLS 1.3 in-transit, AES-256 at-rest | Dedicated KMS Keys per PSU Tenant | Hardware Security Module (HSM) Level 3 |
| **Network Isolation** | Public Cloud HTTPS | Virtual Private Cloud (VPC) + IP Whitelisting | Air-Gapped Intranet / Dedicated Government Network |
| **Vulnerability Scanning** | Static Analysis / TypeScript Strict | Weekly Automated DAST/SAST Scans | Continuous CERT-In Red-Teaming & Audit |

---

## 6. Conclusion & Roadmap Timeline

| Milestone | Deliverable | Target Timeline |
| :--- | :--- | :--- |
| **M1: Prototype Verification** | SIH26100 Demonstration, Forensics Engine, Fail-safe G2G fallbacks | Complete |
| **M2: Sandbox Interoperability** | GSP sandbox integration, Class-3 DSC USB token signing bridge | Month 1 - 3 |
| **M3: Departmental Pilot** | Pilot tender deployment at CPCL / PSU with live vendor submissions | Month 4 - 6 |
| **M4: STQC Certification** | Formal security audit, code hardening, CERT-In compliance | Month 7 - 9 |
| **M5: National Rollout** | CPPP / GeM plugin architecture and sovereign air-gapped inference | Month 10 - 12 |
