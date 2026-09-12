'use client';

/**
 * Government Verification Gateway — Full Dashboard
 *
 * Interactive demo dashboard allowing selection of pre-built test cases
 * or custom bidder identity input. Calls the /api/government/verify endpoint
 * and renders the complete GovernmentVerificationReport.
 */

import React, { useState } from 'react';
import type {
  GovernmentVerificationReport,
  BidderExtractedIdentity,
  GovVerificationResult,
  GovVerificationEnvironment,
} from '@/lib/verification/types';
import { VerificationPanel } from './VerificationPanel';
import { EvidenceDrawer } from './EvidenceDrawer';
import {
  Shield,
  Loader2,
  Play,
  Building2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

// ──────────────────────────────────────────
// Pre-built Test Cases
// ──────────────────────────────────────────

const TEST_CASES: {
  id: string;
  name: string;
  description: string;
  identity: BidderExtractedIdentity;
}[] = [
  {
    id: 'case1',
    name: 'Case 1 — Genuine Bidder (All Match)',
    description: 'All identity fields match across Udyam, GST, and MCA.',
    identity: {
      legalName: 'ABC Robotics Private Limited',
      udyamNumber: 'UDYAM-DEMO-0001',
      pan: 'ABCDE1234F',
      gstin: '29ABCDE1234F1Z5',
      cin: 'U72900KA2022PTC000001',
    },
  },
  {
    id: 'case2',
    name: 'Case 2 — Name Variation (Pvt Ltd vs Private Limited)',
    description: 'Tests name normalization: "Pvt Ltd" should resolve to "Private Limited".',
    identity: {
      legalName: 'ABC Robotics Pvt Ltd',
      udyamNumber: 'UDYAM-DEMO-0001',
      pan: 'ABCDE1234F',
      gstin: '29ABCDE1234F1Z5',
      cin: 'U72900KA2022PTC000001',
    },
  },
  {
    id: 'case3',
    name: 'Case 3 — Wrong PAN (Critical Mismatch)',
    description: 'Submitted PAN does not match any government record. Should flag CRITICAL.',
    identity: {
      legalName: 'ABC Robotics Private Limited',
      udyamNumber: 'UDYAM-DEMO-0001',
      pan: 'ABCDE9999F',
      gstin: '29ABCDE1234F1Z5',
      cin: 'U72900KA2022PTC000001',
    },
  },
  {
    id: 'case4',
    name: 'Case 4 — Cancelled Registration',
    description: 'TechNova Automation has CANCELLED status in Udyam and GST registries.',
    identity: {
      legalName: 'TechNova Automation',
      udyamNumber: 'UDYAM-DEMO-0002',
      pan: 'ABCDE5678F',
      gstin: '27ABCDE5678F1Z3',
    },
  },
  {
    id: 'case5',
    name: 'Case 5 — Fake Registration Number',
    description: 'Non-existent Udyam number and PAN. Should return NOT FOUND.',
    identity: {
      legalName: 'Phantom Industries',
      udyamNumber: 'UDYAM-DEMO-9999',
      pan: 'ZZZZZ0000Z',
    },
  },
  {
    id: 'case6',
    name: 'Case 6 — Apex Heavy Engineering (Repository Bidder)',
    description: 'Existing repository bidder. Full cross-verification with matching data.',
    identity: {
      legalName: 'Apex Heavy Engineering Pvt Ltd',
      udyamNumber: 'UDYAM-TN-02-0049182',
      pan: 'AABCA1234F',
      gstin: '33AABCA1234F1Z8',
      cin: 'U28100TN2012PTC085123',
    },
  },
];

// ──────────────────────────────────────────
// Helper Components
// ──────────────────────────────────────────

function ScoreBreakdownBar({ label, score, maxScore }: { label: string; score: number; maxScore: number }) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-36 text-[#555555] truncate">{label}</span>
      <div className="flex-1 h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct >= 80 ? 'bg-[#111111]' : pct >= 50 ? 'bg-[#F59E0B]' : 'bg-[#EF4444]'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono w-12 text-right text-[#555555]">
        {score}/{maxScore}
      </span>
    </div>
  );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${color}`}>
      {icon}
      <div>
        <div className="text-lg font-medium">{value}</div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#777777]">{label}</div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────
// Main Dashboard Component
// ──────────────────────────────────────────

export function GovernmentVerificationDashboard() {
  const [selectedTestCase, setSelectedTestCase] = useState(TEST_CASES[0].id);
  const [identity, setIdentity] = useState<BidderExtractedIdentity>(TEST_CASES[0].identity);
  const [environment, setEnvironment] = useState<GovVerificationEnvironment>('DEMO');
  const [selectedResultForDrawer, setSelectedResultForDrawer] = useState<GovVerificationResult | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<GovernmentVerificationReport | null>(null);

  const handleTestCaseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTestCase(val);
    const tc = TEST_CASES.find((t) => t.id === val);
    if (tc) {
      setIdentity(tc.identity);
      setReport(null);
    }
  };

  const handleInputChange = (field: keyof BidderExtractedIdentity, value: string) => {
    setIdentity((prev) => ({ ...prev, [field]: value }));
  };

  const handleVerify = async () => {
    setLoading(true);
    setReport(null);
    try {
      const res = await fetch('/api/government/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidderId: selectedTestCase,
          bidderName: identity.legalName || 'Demo Bidder',
          identity,
          environment,
        }),
      });
      if (res.ok) {
        const data: GovernmentVerificationReport = await res.json();
        setReport(data);
      } else {
        console.error('Verification failed:', await res.text());
      }
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCase = TEST_CASES.find((tc) => tc.id === selectedTestCase);

  const IDENTITY_FIELDS: { key: keyof BidderExtractedIdentity; label: string }[] = [
    { key: 'legalName', label: 'Legal Name' },
    { key: 'udyamNumber', label: 'Udyam Number' },
    { key: 'pan', label: 'PAN' },
    { key: 'gstin', label: 'GSTIN' },
    { key: 'cin', label: 'CIN' },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-16 font-sans">
      {/* ─── Header ─── */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#E5E5E5]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5]">
              Government Verification Gateway
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
            Cross-Verify Government Records
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
            Verify bidder certificates against Udyam, GST, and MCA government registries with deterministic field matching.
          </p>
        </div>

        {/* Environment Mode Switcher (Demo Sandbox vs Production API) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-lg border border-[#E5E5E5] bg-[#F7F7F7] text-xs">
            <button
              type="button"
              onClick={() => setEnvironment('DEMO')}
              className={`px-3 py-1 rounded text-[10px] font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                environment === 'DEMO'
                  ? 'bg-white text-[#92400E] shadow-2xs border border-[#FDE68A]'
                  : 'text-[#555555] hover:text-[#111111]'
              }`}
            >
              Demo / Sandbox
            </button>
            <button
              type="button"
              onClick={() => setEnvironment('PRODUCTION')}
              className={`px-3 py-1 rounded text-[10px] font-mono uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                environment === 'PRODUCTION'
                  ? 'bg-[#111111] text-white shadow-2xs'
                  : 'text-[#555555] hover:text-[#111111]'
              }`}
            >
              Production API
            </button>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-mono uppercase tracking-wider font-semibold border ${
            environment === 'PRODUCTION'
              ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
              : 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
          }`}>
            {environment === 'PRODUCTION' ? '🟢 LIVE CONNECTORS' : '🟡 SANDBOX ACTIVE'}
          </span>
        </div>
      </header>

      {/* ─── Content Grid ─── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* ─── Left Panel: Identity Input ─── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-lg border border-[#E5E5E5] bg-white p-5">
            <h2 className="font-mono text-[10px] uppercase tracking-wider text-[#555555] mb-4 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-[#111111]" />
              BIDDER IDENTITY SUBJECT
            </h2>

            {/* Test Case Selector */}
            <div className="mb-4">
              <label className="block font-mono text-[10px] uppercase text-[#777777] mb-1">
                Test Scenario
              </label>
              <select
                value={selectedTestCase}
                onChange={handleTestCaseChange}
                className="w-full text-sm p-2.5 border border-[#E5E5E5] rounded-md bg-[#FAFAFA] text-[#111111] focus:ring-1 focus:ring-[#111111] outline-none"
              >
                {TEST_CASES.map((tc) => (
                  <option key={tc.id} value={tc.id}>
                    {tc.name}
                  </option>
                ))}
              </select>
              {selectedCase && (
                <p className="text-[11px] text-[#777777] mt-1.5 leading-relaxed">
                  {selectedCase.description}
                </p>
              )}
            </div>

            {/* Identity Fields */}
            <div className="space-y-3 pt-4 border-t border-[#E5E5E5]">
              {IDENTITY_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label className="block font-mono text-[10px] uppercase text-[#777777] mb-1">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={identity[key] || ''}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="w-full text-sm p-2 border border-[#E5E5E5] rounded-md focus:border-[#111111] focus:ring-1 focus:ring-[#111111] outline-none transition-colors font-mono text-[12px]"
                    placeholder={`Enter ${label}`}
                  />
                </div>
              ))}
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full mt-5 bg-[#111111] text-white py-2.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#222222] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={14} />
              )}
              {loading ? 'Querying Government Records...' : 'Verify Government Records'}
            </button>
          </div>
        </div>

        {/* ─── Right Panel: Results ─── */}
        <div className="lg:col-span-2">
          {/* Empty State */}
          {!report && !loading && (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-[#777777] bg-[#FAFAFA] rounded-lg border border-dashed border-[#E5E5E5]">
              <Search size={36} className="mb-3 text-[#E5E5E5]" />
              <p className="text-sm">Select a test scenario and click &quot;Verify Government Records&quot;</p>
              <p className="text-[11px] text-[#999999] mt-1">
                Results will appear here with field-by-field comparison evidence
              </p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-[#555555] bg-[#FAFAFA] rounded-lg border border-[#E5E5E5]">
              <Loader2 size={36} className="animate-spin mb-4 text-[#111111]" />
              <p className="font-mono text-xs uppercase tracking-wider">
                Querying statutory government APIs...
              </p>
              <p className="text-[11px] text-[#777777] mt-1">
                Checking Udyam → GST → MCA registries
              </p>
            </div>
          )}

          {/* Results */}
          {report && !loading && (
            <div className="space-y-6">
              {/* ─── Score Overview ─── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Big Score */}
                <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 sm:p-6 flex flex-col justify-center items-center">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#777777] mb-3">
                    GOVERNMENT VERIFICATION SCORE
                  </span>
                  <div className="text-5xl font-light text-[#111111] mb-2">
                    {report.overallScore.total}
                    <span className="text-lg text-[#777777]"> / 100</span>
                  </div>
                  <div
                    className={`font-mono text-[10px] uppercase px-3 py-1 rounded-full border font-semibold ${
                      report.overallScore.riskLevel === 'LOW'
                        ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                        : report.overallScore.riskLevel === 'MEDIUM'
                        ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]'
                        : report.overallScore.riskLevel === 'HIGH'
                        ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                        : 'bg-[#FEF2F2] text-[#7F1D1D] border-[#EF4444]'
                    }`}
                  >
                    {report.overallScore.riskLevel} RISK
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 space-y-4">
                  <h3 className="font-mono text-[10px] uppercase tracking-wider text-[#777777]">
                    SCORE BREAKDOWN
                  </h3>
                  <div className="space-y-3">
                    <ScoreBreakdownBar
                      label="Identity (PAN, GSTIN, Name)"
                      score={report.overallScore.breakdown.identity.score}
                      maxScore={report.overallScore.breakdown.identity.maxScore}
                    />
                    <ScoreBreakdownBar
                      label="Registration"
                      score={report.overallScore.breakdown.registration.score}
                      maxScore={report.overallScore.breakdown.registration.maxScore}
                    />
                    <ScoreBreakdownBar
                      label="Status"
                      score={report.overallScore.breakdown.status.score}
                      maxScore={report.overallScore.breakdown.status.maxScore}
                    />
                    <ScoreBreakdownBar
                      label="Cross-Verification"
                      score={report.overallScore.breakdown.crossVerification.score}
                      maxScore={report.overallScore.breakdown.crossVerification.maxScore}
                    />
                  </div>

                  {/* Field Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E5E5E5]">
                    <StatCard
                      icon={<CheckCircle2 className="h-4 w-4 text-[#065F46]" />}
                      value={report.overallScore.matchedFields}
                      label="Matched"
                      color="border-[#A7F3D0] bg-[#ECFDF5]"
                    />
                    <StatCard
                      icon={<AlertTriangle className="h-4 w-4 text-[#92400E]" />}
                      value={report.overallScore.reviewFields}
                      label="Review"
                      color="border-[#FDE68A] bg-[#FFFBEB]"
                    />
                    <StatCard
                      icon={<XCircle className="h-4 w-4 text-[#991B1B]" />}
                      value={report.overallScore.mismatchedFields}
                      label="Mismatch"
                      color="border-[#FECACA] bg-[#FEF2F2]"
                    />
                  </div>
                </div>
              </div>

              {/* ─── Entity Resolution ─── */}
              <div className="rounded-lg border border-[#E5E5E5] bg-white p-5">
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-[#555555] mb-4 flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5" />
                  ENTITY RESOLUTION
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#FAFAFA] p-3 rounded-md border border-[#EEEEEE]">
                    <span className="text-[10px] font-mono uppercase text-[#777777] block">Normalized Name</span>
                    <span className="text-sm font-semibold text-[#111111] mt-0.5 block">
                      {report.entityResolution.normalizedName || '—'}
                    </span>
                  </div>
                  <div className="bg-[#FAFAFA] p-3 rounded-md border border-[#EEEEEE]">
                    <span className="text-[10px] font-mono uppercase text-[#777777] block">Name Consistency</span>
                    <span className={`text-sm font-semibold mt-0.5 block ${
                      report.entityResolution.nameConsistency === 'CONSISTENT' ? 'text-[#065F46]' :
                      report.entityResolution.nameConsistency === 'VARIATION_DETECTED' ? 'text-[#92400E]' :
                      'text-[#991B1B]'
                    }`}>
                      {report.entityResolution.nameConsistency === 'CONSISTENT' ? '✓ Consistent' :
                       report.entityResolution.nameConsistency === 'VARIATION_DETECTED' ? '⚠ Variation Detected' :
                       '✗ Conflict'}
                    </span>
                  </div>
                  <div className="bg-[#FAFAFA] p-3 rounded-md border border-[#EEEEEE]">
                    <span className="text-[10px] font-mono uppercase text-[#777777] block">PAN Consistency</span>
                    <span className={`text-sm font-semibold mt-0.5 block ${
                      report.entityResolution.panConsistency === 'CONSISTENT' ? 'text-[#065F46]' :
                      report.entityResolution.panConsistency === 'INCOMPLETE' ? 'text-[#777777]' :
                      'text-[#991B1B]'
                    }`}>
                      {report.entityResolution.panConsistency === 'CONSISTENT' ? '✓ Consistent' :
                       report.entityResolution.panConsistency === 'INCOMPLETE' ? '— Incomplete' :
                       '✗ Conflict'}
                    </span>
                  </div>
                </div>

                {/* Name Variations */}
                {report.entityResolution.nameVariations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                    <span className="text-[10px] font-mono uppercase text-[#777777] block mb-2">
                      Name Across Sources
                    </span>
                    <div className="space-y-1">
                      {report.entityResolution.nameVariations.map((nv, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-xs">
                          <span className="font-mono text-[10px] text-[#777777] w-40 shrink-0 truncate">
                            {nv.source}
                          </span>
                          <span className="text-[#111111] font-medium">{nv.name}</span>
                          <span className="text-[#999999]">→</span>
                          <span className="font-mono text-[11px] text-[#555555]">{nv.normalized}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conflicts */}
                {report.entityResolution.conflicts.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                    <span className="text-[10px] font-mono uppercase text-[#991B1B] block mb-2">
                      ⚠ CONFLICTS DETECTED
                    </span>
                    <div className="space-y-2">
                      {report.entityResolution.conflicts.map((c, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-md text-xs ${
                            c.severity === 'HIGH'
                              ? 'bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B]'
                              : 'bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E]'
                          }`}
                        >
                          <span className="font-mono text-[10px] uppercase font-bold">
                            [{c.severity}] {c.field}
                          </span>
                          <p className="mt-0.5">{c.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Individual Verification Panels ─── */}
              <div className="space-y-4">
                <h3 className="font-mono text-[10px] uppercase tracking-wider text-[#555555]">
                  VERIFICATION CONNECTORS
                </h3>
                {report.verifications.map((result, idx) => (
                  <VerificationPanel
                    key={result.connectorId}
                    result={result}
                    defaultExpanded={idx === 0}
                    onViewEvidence={(res) => {
                      setSelectedResultForDrawer(res);
                      setDrawerOpen(true);
                    }}
                  />
                ))}
              </div>

              {/* ─── Footer ─── */}
              <div className="pt-4 border-t border-[#E5E5E5] text-[10px] font-mono text-[#999999] flex flex-col sm:flex-row justify-between gap-1">
                <span>Generated: {report.generatedAt}</span>
                <span>
                  Environment: {report.environment} • Bidder ID: {report.bidderId}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Evidence Drawer ─── */}
      <EvidenceDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedResultForDrawer(null);
        }}
        result={selectedResultForDrawer}
      />
    </div>
  );
}
