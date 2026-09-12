'use client';

import React, { useState } from 'react';
import {
  Server,
  Database,
  Cpu,
  ShieldCheck,
  FileCheck,
  Users,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Layers,
  Lock,
  ExternalLink,
  ChevronRight,
  Activity,
  GitBranch,
  type LucideIcon
} from 'lucide-react';

interface PipelineNode {
  id: string;
  step: string;
  name: string;
  shortDesc: string;
  status: 'ONLINE' | 'ACTIVE' | 'VERIFIED';
  latency: string;
  icon: LucideIcon;
  details: {
    description: string;
    engine: string;
    statutoryRule: string;
    samplePayload: Record<string, string>;
  };
}

const PIPELINE_NODES: PipelineNode[] = [
  {
    id: 'node-ingest',
    step: 'GATE-01',
    name: 'Tender & Bid Vault Ingestion',
    shortDesc: 'Multi-format PDF unbundling & SHA-256 tamper hashing',
    status: 'ONLINE',
    latency: '45ms',
    icon: Server,
    details: {
      description: 'Ingests tender specifications, RFP clauses, and vendor bid submission packages. Generates immutable cryptographic SHA-256 fingerprints to verify document integrity before processing.',
      engine: 'High-Throughput Streaming Ingestion & Cryptographic Checksum Engine',
      statutoryRule: 'CPPP Technical Tender Guidelines & GeM Submission Standard',
      samplePayload: {
        "tenderId": "CPCL/RE/2026/0412",
        "hashAlgorithm": "SHA-256",
        "integrityCheck": "VERIFIED_UNALTERED",
        "documentsIngested": "142 files"
      }
    }
  },
  {
    id: 'node-ai-ocr',
    step: 'GATE-02',
    name: 'Document AI & OCR Parsing',
    shortDesc: 'Clause extraction, tabular parsing & confidence scoring',
    status: 'ONLINE',
    latency: '320ms',
    icon: Cpu,
    details: {
      description: 'Executes high-accuracy optical character recognition and multi-modal semantic parsing on unstructured financial statements, audited balance sheets, and OEM authorization certificates.',
      engine: 'Document AI Semantic Parsing & LayoutLM Neural Pipeline',
      statutoryRule: 'ISO 15489 Document Lifecycle & Digital Record Management',
      samplePayload: {
        "extractedTurnover": "₹12.40 Cr",
        "ocrConfidence": "99.4%",
        "panDetected": "ABCDE1234F",
        "gstinDetected": "33AABCA1234F1Z8"
      }
    }
  },
  {
    id: 'node-gov-gateway',
    step: 'GATE-03',
    name: 'Government Verification Gateway',
    shortDesc: '8 Statutory registries (Udyam, GSTN, MCA21, CBDT, etc.)',
    status: 'ONLINE',
    latency: '180ms',
    icon: Database,
    details: {
      description: 'Connects to official Government of India registries via authorized secure APIs and sandboxes. Verifies MSME classification, live GST filing status, Corporate RoC standing, and CVC debarment records without web scraping.',
      engine: 'Government Gateway Direct API Connector Stack (G2G Protocol)',
      statutoryRule: 'GFR 2017 Rule 151 (Debarment) & MSMED Act Section 7',
      samplePayload: {
        "udyamRegistry": "VERIFIED_ACTIVE (Small Enterprise)",
        "gstnStatus": "ACTIVE_REGULAR",
        "mca21Standing": "ACTIVE_LIMITED_BY_SHARES",
        "cvcDebarment": "CLEAR_ZERO_INCIDENTS"
      }
    }
  },
  {
    id: 'node-entity-res',
    step: 'GATE-04',
    name: 'Cross-Document Entity Resolution',
    shortDesc: 'Fuzzy string matching & PAN-Aadhaar-MCA consistency check',
    status: 'ONLINE',
    latency: '95ms',
    icon: GitBranch,
    details: {
      description: 'Cross-correlates legal entity identities across independent statutory sources. Detects subtle alias variations (e.g. Pvt Ltd vs Private Limited) and uncovers potential front companies or shell company indicators.',
      engine: 'Levenshtein Distance & Phonetic Jaro-Winkler Entity Linker',
      statutoryRule: 'Income Tax Rule 114AAA & MCA Entity Identification Mandate',
      samplePayload: {
        "nameConcordance": "CONSISTENT (1.00)",
        "panLinkage": "CONFIRMED_IDENTICAL_ACROSS_5_SOURCES",
        "entityConflicts": "0 DETECTED"
      }
    }
  },
  {
    id: 'node-compliance-matrix',
    step: 'GATE-05',
    name: 'Automated Compliance Engine',
    shortDesc: 'GFR 2017 & CVC statutory rule evaluation matrix',
    status: 'ONLINE',
    latency: '110ms',
    icon: ShieldCheck,
    details: {
      description: 'Evaluates extracted facts and verified government credentials against 40+ statutory compliance rules including Make in India (PPP-MII) local content %, turnover deficit calculations, and OEM direct authorization.',
      engine: 'Rule-Based Statutory Compliance Evaluator & GFR Validator',
      statutoryRule: 'General Financial Rules (GFR 2017) Rule 173 & PPP-MII Order 2017',
      samplePayload: {
        "totalClausesEvaluated": "38 Clauses",
        "complianceScore": "90.0%",
        "provisionalVerdict": "QUALIFIED_WITH_CONDITIONS"
      }
    }
  },
  {
    id: 'node-officer-deck',
    step: 'GATE-06',
    name: 'Officer Adjudication & Signing',
    shortDesc: 'Sovereign human decision support with DSC token signing',
    status: 'ACTIVE',
    latency: 'Manual',
    icon: Lock,
    details: {
      description: 'Presents the procurement officer with transparent advisory evidence, audit citations, and side-by-side verification proofs. Facilitates sovereign qualification, clarification dispatch, and immutable DSC certificate signing.',
      engine: 'CCA-Compliant PKI Digital Signature & Audit Ledger',
      statutoryRule: 'Information Technology Act 2000 Section 3 & CVC Transparency Mandate',
      samplePayload: {
        "authorityRole": "Superintending Procurement Officer",
        "actionTaken": "QUALIFY_BIDDER",
        "statutoryJustification": "Meets technical thresholds and verified on GSTN/Udyam",
        "dscAuditHash": "0x7F2A...9C1B"
      }
    }
  }
];

export function ArchitectureWorkflowDiagram() {
  const [selectedNode, setSelectedNode] = useState<PipelineNode>(PIPELINE_NODES[2]); // Default to Gov Gateway
  const [activeTab, setActiveTab] = useState<'ARCHITECTURE' | 'FUNNEL'>('ARCHITECTURE');

  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-6 shadow-2xs space-y-6">
      
      {/* Header & Sub-tab navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E5E5] gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
            <h3 className="text-sm font-semibold text-[#111111]">
              System Architecture & Verification Dataflow
            </h3>
          </div>
          <p className="text-[11px] text-[#777777] mt-0.5">
            Interactive visual diagram of Clausentis AI multi-stage statutory evaluation pipeline
          </p>
        </div>

        <div className="flex items-center gap-1 bg-[#F5F5F5] p-1 rounded-lg border border-[#E5E5E5] text-xs">
          <button
            onClick={() => setActiveTab('ARCHITECTURE')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === 'ARCHITECTURE'
                ? 'bg-white text-[#111111] shadow-2xs font-semibold'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            End-to-End Pipeline
          </button>
          <button
            onClick={() => setActiveTab('FUNNEL')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              activeTab === 'FUNNEL'
                ? 'bg-white text-[#111111] shadow-2xs font-semibold'
                : 'text-[#666666] hover:text-[#111111]'
            }`}
          >
            Bid Qualification Funnel
          </button>
        </div>
      </div>

      {activeTab === 'ARCHITECTURE' ? (
        <div className="space-y-6">
          {/* Visual Interactive Pipeline Canvas */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[760px] grid grid-cols-6 gap-2 relative">
              {PIPELINE_NODES.map((node, i) => {
                const Icon = node.icon;
                const isSelected = selectedNode.id === node.id;

                return (
                  <div key={node.id} className="relative">
                    <button
                      onClick={() => setSelectedNode(node)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between h-[130px] group ${
                        isSelected
                          ? 'border-[#111111] bg-[#F9FAFB] ring-2 ring-[#111111]/10 shadow-sm'
                          : 'border-[#E5E5E5] bg-white hover:border-[#CCCCCC] hover:bg-[#FAFAFA]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[9px] font-bold text-[#777777] group-hover:text-[#111111]">
                            {node.step}
                          </span>
                          <div className={`p-1 rounded-md ${isSelected ? 'bg-[#111111] text-white' : 'bg-[#F0F0F0] text-[#555555]'}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <h4 className="text-xs font-semibold text-[#111111] line-clamp-1">
                          {node.name}
                        </h4>
                        <p className="text-[10px] text-[#666666] mt-1 line-clamp-2 leading-snug">
                          {node.shortDesc}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#F0F0F0] mt-auto text-[9px] font-mono">
                        <span className="text-[#059669] font-semibold">{node.status}</span>
                        <span className="text-[#777777]">{node.latency}</span>
                      </div>
                    </button>

                    {/* Connector arrow between nodes */}
                    {i < PIPELINE_NODES.length - 1 && (
                      <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full bg-white border border-[#E5E5E5] items-center justify-center text-[#777777] shadow-2xs">
                        <ArrowRight className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Node Deep-Dive Inspection Panel */}
          <div className="rounded-xl border border-[#E5E5E5] bg-[#FBFBFC] p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-[#E5E5E5] gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#111111] text-white">
                  <selectedNode.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] bg-[#E5E5E5] px-1.5 py-0.5 rounded font-bold text-[#111111]">
                      {selectedNode.step}
                    </span>
                    <h4 className="text-sm font-bold text-[#111111]">
                      {selectedNode.name}
                    </h4>
                  </div>
                  <p className="text-xs text-[#666666] mt-0.5">
                    Engine: <span className="font-mono text-[#111111] font-medium">{selectedNode.details.engine}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <div className="flex items-center gap-1 text-[#059669] bg-[#ECFDF5] px-2.5 py-1 rounded-md border border-[#A7F3D0]">
                  <Activity className="w-3.5 h-3.5" />
                  <span className="font-bold">HEALTH: 100%</span>
                </div>
                <div className="text-[#555555] bg-white px-2.5 py-1 rounded-md border border-[#E5E5E5]">
                  LATENCY: {selectedNode.latency}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-4">
              <div className="md:col-span-7 space-y-3">
                <div>
                  <h5 className="text-xs font-semibold text-[#111111] uppercase tracking-wider font-mono">
                    Architectural Specification
                  </h5>
                  <p className="text-xs text-[#444444] mt-1 leading-relaxed">
                    {selectedNode.details.description}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#E5E5E5]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777] font-semibold block">
                    Statutory Rule Reference
                  </span>
                  <span className="text-xs font-medium text-[#111111] mt-0.5 block">
                    {selectedNode.details.statutoryRule}
                  </span>
                </div>
              </div>

              <div className="md:col-span-5">
                <div className="bg-[#1E1E1E] text-[#D4D4D4] rounded-lg p-3.5 font-mono text-[11px] space-y-1.5 overflow-x-auto shadow-inner">
                  <div className="flex items-center justify-between text-[#888888] pb-1.5 border-b border-[#333333] text-[10px]">
                    <span>STAGE TELEMETRY PAYLOAD</span>
                    <span className="text-[#059669]">● JSON 200 OK</span>
                  </div>
                  <pre className="text-[10.5px] leading-snug">
                    {JSON.stringify(selectedNode.details.samplePayload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SANKY / FUNNEL VISUALIZATION */
        <div className="space-y-4 pt-2">
          <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#E5E5E5]">
            <h4 className="text-xs font-mono font-bold uppercase text-[#111111] tracking-wider mb-2">
              Bid Elimination & Qualification Funnel (4 Total Active Bidders)
            </h4>
            <p className="text-xs text-[#666666]">
              Visual breakdown of bidder progression through 5 strict statutory qualification gates.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                stage: 'Stage 1: Document Vault & OCR Verification',
                passed: 4,
                total: 4,
                color: 'bg-[#059669]',
                note: '100% of bidders submitted readable, non-corrupted PDF packages with valid hashes.'
              },
              {
                stage: 'Stage 2: Statutory Registry Verification (Udyam, GSTN, MCA21)',
                passed: 4,
                total: 4,
                color: 'bg-[#059669]',
                note: 'All 4 bidders have active GSTIN and authentic corporate entity records.'
              },
              {
                stage: 'Stage 3: Minimum Annual Turnover (Threshold: ₹10.0 Cr)',
                passed: 3,
                total: 4,
                color: 'bg-[#F59E0B]',
                note: 'Zenith Marine eliminated due to ₹8.90 Cr turnover deficit (-₹1.10 Cr below mandatory cutoff).'
              },
              {
                stage: 'Stage 4: OEM Authorization & Technical Compliance',
                passed: 2,
                total: 3,
                color: 'bg-[#2563EB]',
                note: 'Apex and ABC verified direct OEM authorization. XYZ Engineering flagged for channel partner review.'
              },
              {
                stage: 'Stage 5: Final Recommended Qualification Status',
                passed: 2,
                total: 2,
                color: 'bg-[#059669]',
                note: '2 Bidders Fully Qualified (Apex, ABC) • 1 Request Clarification (XYZ) • 1 Disqualified (Zenith).'
              }
            ].map((gate, gIdx) => {
              const pct = (gate.passed / 4) * 100;

              return (
                <div key={gIdx} className="p-3.5 rounded-lg border border-[#E5E5E5] bg-white space-y-2 hover:border-[#CCCCCC] transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                    <span className="font-semibold text-[#111111]">{gate.stage}</span>
                    <span className="font-mono font-bold text-[#111111]">
                      {gate.passed} / 4 Bids Active ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#F0F0F0] h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${gate.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#666666]">
                    {gate.note}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
