'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Building2, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  Eye, 
  Check, 
  X, 
  FileCheck2, 
  ExternalLink 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportAuditPdfButton } from '@/components/audit/ExportAuditPdfButton';
import { MatchedRequirementsPdfButton } from '@/components/reports/MatchedRequirementsPdfButton';
import { OfficerDecisionSection } from '@/components/authority/OfficerDecisionSection';
import { SignedDecisionPdfButton } from '@/components/authority/SignedDecisionPdfButton';
import { getUserProfile } from '@/app/auth/actions';
import { getLatestProcurementDecision } from '@/lib/actions/decisions';
import { recordOfficerDecision } from '@/lib/actions/audit';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';
import { CorrigendumManager } from '@/components/tenders/CorrigendumManager';
import { getBidderDossier, recordOfficerVerdict } from '@/lib/compliance/repository';
import { CrossDocumentFinding, RequirementComplianceResult } from '@/lib/compliance/types';
import { runAllStatutoryEvaluations } from '@/lib/providers/providers';
import { GovernmentVerificationCard } from '@/components/compliance/GovernmentVerificationCard';
import { PreBidVsVerifiedComparison } from '@/components/compliance/PreBidVsVerifiedComparison';
import type { ProcurementDecisionRecord } from '@/types/procurement-decision';

interface PrioritizedFinding {
  id: string;
  priority: string;
  title: string;
  clause: string;
  issue: string;
  evidenceDocument: string;
  page: number;
  recommendation: string;
}

export default function AuthorityBidDetailPage() {
  const params = useParams();
  const bidId = params.id as string;

  const dossier = getBidderDossier(bidId) || getBidderDossier('bid-apex-02')!;

  const [selectedFinding, setSelectedFinding] = useState<PrioritizedFinding | null>(null);
  const [officerDecision, setOfficerDecision] = useState<{
    decision: string;
    timestamp: string;
    notes?: string;
  } | null>(dossier.officerDecision || null);
  const [signedDecision, setSignedDecision] = useState<ProcurementDecisionRecord | null>(null);
  const [officerProfile, setOfficerProfile] = useState<{
    fullName: string;
    email: string;
    organisationName: string;
    role: string;
  }>({
    fullName: 'Dr. R. Venkataraman',
    email: 'r.venkataraman@cpcl.gov.in',
    organisationName: 'Chennai Petroleum Corporation Limited',
    role: 'tender_authority',
  });

  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'QUALIFIED' | 'DISQUALIFIED'>('QUALIFIED');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [decisionSuccessMsg, setDecisionSuccessMsg] = useState('');

  useEffect(() => {
    getUserProfile().then((prof) => {
      if (prof) {
        setOfficerProfile({
          fullName: prof.fullName || 'Dr. R. Venkataraman',
          email: prof.email || 'r.venkataraman@cpcl.gov.in',
          organisationName: prof.organisationName || 'Chennai Petroleum Corporation Limited',
          role: prof.role || 'tender_authority',
        });
      }
    }).catch((err) => console.warn('Profile fetch notice:', err));

    getLatestProcurementDecision(bidId).then((res) => {
      if (res.success && res.decision) {
        setSignedDecision(res.decision);
        setOfficerDecision({
          decision: res.decision.decision,
          timestamp: res.decision.signed_at,
          notes: res.decision.remarks,
        });
      }
    }).catch((err) => console.warn('Decision fetch notice:', err));
  }, [bidId]);

  const handleDecisionSigned = (decision: ProcurementDecisionRecord) => {
    setSignedDecision(decision);
    setOfficerDecision({
      decision: decision.decision,
      timestamp: decision.signed_at,
      notes: decision.remarks,
    });
  };

  const bidder = {
    companyName: dossier.bidderName,
    registrationNumber: dossier.registrationNumber,
    gstin: dossier.gstin,
    pan: dossier.pan,
    udyamNumber: dossier.udyamNumber,
    registeredAddress: dossier.registeredAddress,
    contactPerson: dossier.contactPerson,
    contactEmail: dossier.contactEmail,
    tenderTitle: dossier.tenderTitle,
    tenderReference: dossier.tenderReference,
    overallCompliance: dossier.complianceScore,
    riskLevel: dossier.riskLevel,
    mandatoryTotal: dossier.mandatoryTotal,
    mandatoryPassed: dossier.mandatoryPassed,
    failuresCount: dossier.failuresCount,
    warningsCount: dossier.warningsCount,
    missingCount: dossier.missingCount,
    submissionId: dossier.submissionId,
    submittedAt: dossier.submittedAt,
    aiRecommendation: dossier.aiRecommendation,
  };

  const findings = dossier.crossDocumentFindings.map((cf) => ({
    id: cf.id,
    priority: cf.severity,
    title: cf.title,
    clause: 'Cross-Document Reconciliation Check',
    issue: cf.explanation,
    evidenceDocument: `${cf.primaryDocument.name} (p.${cf.primaryDocument.page}) vs ${cf.conflictingDocument.name} (p.${cf.conflictingDocument.page})`,
    page: cf.conflictingDocument.page,
    recommendation: cf.recommendedAction,
  })).concat(
    dossier.requirementResults
      .filter((r) => r.status === 'FAIL' || r.status === 'MISSING' || r.status === 'WARNING')
      .map((r) => ({
        id: r.requirementId,
        priority: r.riskFactor,
        title: `${r.clauseCode}: ${r.title}`,
        clause: r.clauseCode,
        issue: r.reason + (r.discrepancyDelta ? ` [${r.discrepancyDelta}]` : ''),
        evidenceDocument: r.evidence?.documentName || 'Document Missing',
        page: r.evidence?.pageNumber || 1,
        recommendation: r.status === 'FAIL' 
          ? 'Grounds for qualification disqualification under tender terms.'
          : 'Request formal clarification / sworn undertaking from bidder before award release.',
      }))
  );

  const analysisRows = dossier.requirementResults.map((r) => ({
    clause: `${r.clauseCode}: ${r.title}`,
    expected: r.expectedValue,
    extracted: r.declaredValue ? `${r.declaredValue} (Verified: ${r.verifiedValue})` : r.verifiedValue,
    status: r.status,
    confidence: r.evidence?.confidence ? Math.round(r.evidence.confidence * 100) : 95,
    sourceDoc: r.evidence?.documentName || 'Not Submitted',
    page: r.evidence?.pageNumber || 1,
  }));

  const statutoryEvaluations = runAllStatutoryEvaluations({
    companyName: bidder.companyName,
    pan: bidder.pan,
    gstin: bidder.gstin,
    udyamNumber: bidder.udyamNumber?.includes('UDYAM') ? bidder.udyamNumber : undefined,
    localContentPercent: 62.0,
    oemManufacturer: dossier.requirementResults.find((r) => r.clauseCode.includes('5.1'))?.verifiedValue,
    epfoApplicable: true,
    esicApplicable: true,
    documentsSubmitted: dossier.requirementResults.filter((r) => r.evidence).map((r) => ({
      documentId: r.evidence!.documentId,
      documentType: r.clauseCode.includes('6.3') ? 'local_content_declaration' : r.expectedValue,
      documentName: r.evidence!.documentName,
      pageNumber: r.evidence!.pageNumber
    }))
  });

  const udyamGovtVerification = statutoryEvaluations.find((res) => res.providerId === 'udyam')?.governmentVerification;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 font-sans bg-white">
      {/* Header */}
      <div>
        <Link 
          href="/authority/bids" 
          className="inline-flex items-center text-xs text-[#555555] hover:text-[#111111] mb-3 transition-colors font-mono"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Submitted Bids
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5]">
                Bid Compliance Audit Dossier
              </span>
              <span className="text-[#777777] text-xs">•</span>
              <span className="text-xs text-[#555555] font-mono">{bidder.submissionId}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#111111] tracking-tight mt-1">
              Bid Review: {bidder.companyName}
            </h1>
            <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
              Tender: <span className="text-[#111111] font-medium">{bidder.tenderTitle}</span> ({bidder.tenderReference})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <MatchedRequirementsPdfButton
              bidId={dossier.bidId}
              tenderId={dossier.tenderId}
              bidderCompanyName={bidder.companyName}
              label="Matched Requirements PDF"
              showSaveButton={true}
            />
            <ExportAuditPdfButton
              tenderTitle={bidder.tenderTitle}
              tenderRef={bidder.tenderReference}
              bidId={dossier.bidId}
              bidderCompanyName={bidder.companyName}
              label="Export Audit PDF"
            />
            {officerDecision ? (
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold border ${
                  officerDecision.decision === 'QUALIFIED' || officerDecision.decision === 'APPROVED'
                    ? 'bg-[#F7F7F7] text-[#111111] border-[#111111]'
                    : officerDecision.decision === 'CLARIFICATION_REQUIRED'
                    ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                    : 'bg-[#FFF5F5] text-[#991B1B] border-[#FCA5A5]'
                }`}>
                  {officerDecision.decision === 'QUALIFIED' || officerDecision.decision === 'APPROVED' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#111111]" />
                  ) : officerDecision.decision === 'CLARIFICATION_REQUIRED' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-[#991B1B]" />
                  )}
                  <span>DECISION: {officerDecision.decision}</span>
                </div>
                <SignedDecisionPdfButton
                  bidId={dossier.bidId}
                  decision={signedDecision}
                  dossier={dossier}
                  tenderTitle={bidder.tenderTitle}
                  tenderReference={bidder.tenderReference}
                  label="Signed Decision PDF"
                />
              </div>
            ) : (
              <Button 
                size="sm" 
                onClick={() => {
                  const el = document.getElementById('officer-decision-section');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    setIsDecisionModalOpen(true);
                  }
                }}
                className="h-8 px-4 bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs gap-1.5 cursor-pointer rounded-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Record Officer Decision</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* BIDDER PROFILE CARD */}
      <div className="p-6 rounded-lg border border-[#E5E5E5] bg-white shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-[#111111] flex items-center gap-2 border-b border-[#E5E5E5] pb-3">
          <Building2 className="w-4 h-4 text-[#111111]" />
          Verified Corporate Bidder Profile
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-mono text-[#777777]">Corporate RoC Entity</span>
            <p className="font-semibold text-[#111111] mt-0.5">{bidder.companyName}</p>
            <p className="text-[11px] text-[#555555] font-mono">{bidder.registrationNumber}</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-[#777777]">Tax Identifiers</span>
            <p className="font-mono text-[#111111] mt-0.5">GSTIN: {bidder.gstin}</p>
            <p className="font-mono text-[#555555]">PAN: {bidder.pan}</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-[#777777]">MSME Status</span>
            <p className="font-mono text-[#111111] mt-0.5">{bidder.udyamNumber}</p>
            <p className="text-[11px] text-[#555555] font-medium font-mono">EMD Waiver Validated</p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-mono text-[#777777]">Authorized Signatory</span>
            <p className="font-medium text-[#111111] mt-0.5">{bidder.contactPerson}</p>
            <p className="text-[11px] text-[#555555]">{bidder.contactEmail}</p>
          </div>
        </div>
      </div>

      {/* COMPLIANCE OVERVIEW BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-lg border border-[#E5E5E5] bg-[#F7F7F7] text-center">
          <span className="text-[10px] uppercase font-mono text-[#777777]">Overall Compliance</span>
          <p className="text-2xl font-mono font-bold text-[#111111] mt-1">{bidder.overallCompliance}%</p>
        </div>

        <div className="p-4 rounded-lg border border-[#E5E5E5] bg-white text-center">
          <span className="text-[10px] uppercase font-mono text-[#777777]">Mandatory Criteria</span>
          <p className="text-2xl font-mono font-bold text-[#111111] mt-1">
            {bidder.mandatoryPassed} / {bidder.mandatoryTotal}
          </p>
        </div>

        <div className="p-4 rounded-lg border border-[#E5E5E5] bg-white text-center">
          <span className="text-[10px] uppercase font-mono text-[#777777]">Failures Count</span>
          <p className="text-2xl font-mono font-bold text-[#111111] mt-1">{bidder.failuresCount}</p>
        </div>

        <div className="p-4 rounded-lg border border-[#E5E5E5] bg-white text-center">
          <span className="text-[10px] uppercase font-mono text-[#777777]">Warnings Count</span>
          <p className="text-2xl font-mono font-bold text-[#111111] mt-1">{bidder.warningsCount}</p>
        </div>

        <div className="p-4 rounded-lg border border-[#E5E5E5] bg-white text-center">
          <span className="text-[10px] uppercase font-mono text-[#777777]">Missing Evidence</span>
          <p className="text-2xl font-mono font-bold text-[#111111] mt-1">{bidder.missingCount}</p>
        </div>
      </div>

      {/* PRIORITIZED RISK FINDINGS */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-[#111111] flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#111111]" />
          Prioritized Risk & Governance Findings ({findings.length})
        </h3>

        <div className="space-y-3">
          {findings.map((finding) => (
            <div
              key={finding.id}
              className="p-4 rounded-lg border border-[#E5E5E5] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-[#CCCCCC] transition-all shadow-sm"
            >
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-[#E5E5E5] bg-[#F7F7F7] text-[#111111]">
                    {finding.priority} RISK
                  </span>
                  <span className="font-semibold text-[#111111] text-xs">{finding.title}</span>
                </div>
                <div className="text-[#111111] text-[11px] font-mono">
                  <MarkdownRenderer content={`**Recommendation:** ${finding.recommendation}`} />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedFinding(finding)}
                className="h-8 px-3 text-xs gap-1.5 shrink-0 border-[#E5E5E5] bg-white text-[#111111] hover:bg-[#F7F7F7] rounded-md cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect Evidence</span>
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* CORRIGENDUM & AMENDMENTS IMPACT */}
      <CorrigendumManager role="AUTHORITY" />

      {/* 1. STATUTORY & GOVERNMENT PORTAL VERIFICATION MATRIX (SIH26100) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
          <h3 className="text-base font-semibold text-[#111111] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#111111]" />
            Statutory &amp; Government Portal Verification Matrix
          </h3>
          <span className="text-xs font-mono text-[#777777]">15 Normalized G2G Providers</span>
        </div>

        <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs table-fixed min-w-[1000px] border-collapse">
              <colgroup>
                <col className="w-[18%]" />
                <col className="w-[15%]" />
                <col className="w-[16%]" />
                <col className="w-[15%]" />
                <col className="w-[16%]" />
                <col className="w-[20%]" />
              </colgroup>
              <thead className="bg-[#F7F7F7] border-b border-[#E5E5E5] text-[10px] font-mono uppercase tracking-wider text-[#777777]">
                <tr>
                  <th className="py-3 px-3.5 font-semibold">Requirement</th>
                  <th className="py-3 px-3.5 font-semibold">Source</th>
                  <th className="py-3 px-3.5 font-semibold">Verification</th>
                  <th className="py-3 px-3.5 font-semibold">Authority</th>
                  <th className="py-3 px-3.5 font-semibold">Evidence</th>
                  <th className="py-3 px-3.5 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {statutoryEvaluations.map((res, idx) => (
                  <tr key={idx} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                      <div className="font-semibold text-[#111111] text-xs">
                        {res.provider.replace(/\(.*\)/, '').trim()}
                      </div>
                      <div className="text-[10px] text-[#777777] font-mono mt-0.5">
                        Provider ID: {res.providerId}
                      </div>
                    </td>

                    <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                      <span className="font-mono text-[11px] text-[#111111] block break-all">
                        {res.providerId}.gov.in
                      </span>
                    </td>

                    <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                        res.status === 'LIVE_VERIFIED'
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : res.status === 'DOCUMENT_VERIFIED'
                          ? 'bg-[#F7F7F7] text-[#111111] border-[#CCCCCC]'
                          : res.status === 'INTEGRATION_READY'
                          ? 'bg-white text-[#555555] border-[#CCCCCC]'
                          : res.status === 'NOT_APPLICABLE'
                          ? 'bg-white text-[#888888] border-[#E5E5E5]'
                          : 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                      }`}>
                        {res.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                      <span className="text-[11px] text-[#555555] leading-snug">
                        Government of India
                      </span>
                    </td>

                    <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                      <div className="flex items-start gap-1 text-[#111111] font-mono font-medium text-[11px]">
                        <FileText className="w-3 h-3 text-[#111111] shrink-0 mt-0.5" />
                        <span className="leading-snug break-words">
                          {typeof res.evidence === 'string' ? res.evidence : `${res.evidence.documentName} (p.${res.evidence.pageNumber})`}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                      <p className="text-[11px] text-[#555555] leading-relaxed">
                        {res.findingMessage || 'Statutory records verified concordant.'}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Government Record Cross-Verification Card */}
        {udyamGovtVerification && (
          <div className="space-y-2 mt-4 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase tracking-wider text-[#111111] font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#111111]" />
                Official Government Registry Cross-Verification (G2G Audit)
              </h4>
              <span className="text-[11px] text-[#777777] font-mono">
                Registry: Ministry of MSME / Udyam
              </span>
            </div>
            <GovernmentVerificationCard verification={udyamGovtVerification} />
          </div>
        )}

        {/* Pre-Bid Self-Declared vs Final Post-Verification Comparison */}
        <div className="mt-6 pt-4 border-t border-[#E5E5E5]">
          <PreBidVsVerifiedComparison 
            bidderName={dossier.bidderName}
            preBidScore={95}
            preBidVerdict="LIKELY ELIGIBLE"
            verifiedScore={dossier.complianceScore}
            verifiedVerdict={dossier.complianceScore >= 80 ? 'COMPLIANT & QUALIFIED' : 'REQUIRES REVIEW'}
          />
        </div>
      </div>

      {/* 2. REQUIREMENT-BY-REQUIREMENT ANALYSIS TABLE */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-[#111111] flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#111111]" />
          Clause-by-Clause Compliance &amp; Evidence Audit Trail
        </h3>

        <div className="rounded-lg border border-[#E5E5E5] bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed border-collapse text-xs min-w-[950px]">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[18%]" />
                <col className="w-[28%]" />
                <col className="w-[12%]" />
                <col className="w-[18%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#F7F7F7] text-[#777777] uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-3 px-3.5 font-semibold">Tender Clause</th>
                  <th className="py-3 px-3.5 font-semibold">Expected Value</th>
                  <th className="py-3 px-3.5 font-semibold">Bidder Evidence &amp; Extracted Value</th>
                  <th className="py-3 px-3.5 font-semibold text-center">Status</th>
                  <th className="py-3 px-3.5 font-semibold text-right">Evidence Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {analysisRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3.5 px-3.5 font-medium text-[#111111] align-top break-words overflow-wrap-anywhere">
                      {row.clause}
                    </td>
                    <td className="py-3.5 px-3.5 text-[#555555] font-mono align-top break-words overflow-wrap-anywhere">
                      {row.expected}
                    </td>
                    <td className="py-3.5 px-3.5 text-[#111111] font-mono align-top break-words overflow-wrap-anywhere">
                      {row.extracted}
                    </td>
                    <td className="py-3.5 px-3.5 text-center align-top">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${
                        row.status === 'PASS'
                          ? 'bg-[#F7F7F7] text-[#111111] border-[#CCCCCC]'
                          : row.status === 'FAIL'
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : row.status === 'WARNING'
                          ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]'
                          : 'bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]'
                      }`}>
                        {row.status === 'PASS' && <CheckCircle2 className="w-3 h-3 text-[#111111]" />}
                        {row.status === 'FAIL' && <XCircle className="w-3 h-3 text-white" />}
                        {row.status === 'WARNING' && <AlertTriangle className="w-3 h-3 text-[#B45309]" />}
                        {row.status === 'MISSING' && <XCircle className="w-3 h-3 text-[#991B1B]" />}
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-right align-top break-words overflow-wrap-anywhere">
                      <span className="font-mono text-[#555555] text-[11px] block break-words">
                        {row.sourceDoc} (p.{row.page})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. OFFICER DECISION & APPROVAL (SIH26100 SOVEREIGN DECISION WORKFLOW) */}
      <div id="officer-decision-section">
        <OfficerDecisionSection
          bidId={dossier.bidId}
          tenderId={dossier.tenderId}
          tenderTitle={bidder.tenderTitle}
          tenderReference={bidder.tenderReference}
          dossier={dossier}
          initialDecision={signedDecision}
          officerProfile={officerProfile}
          onDecisionSigned={handleDecisionSigned}
        />
      </div>

      {/* INSPECT EVIDENCE POPUP MODAL */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg rounded-lg border border-[#E5E5E5] bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#111111]" />
                <h3 className="text-sm font-semibold text-[#111111]">Officer Evidence Inspection</h3>
              </div>
              <button onClick={() => setSelectedFinding(null)} className="text-[#777777] hover:text-[#111111] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono text-[#777777]">Finding</span>
                <p className="font-semibold text-[#111111] text-sm">{selectedFinding.title}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-[#777777]">Clause Reference</span>
                <p className="font-mono text-[#555555]">{selectedFinding.clause}</p>
              </div>
              <div className="p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
                <span className="text-[10px] uppercase font-mono text-[#111111] font-semibold">Detected Issue</span>
                <p className="text-[#555555] leading-relaxed">{selectedFinding.issue}</p>
              </div>
              <div className="p-3 rounded-md bg-[#F7F7F7] border border-[#E5E5E5]">
                <span className="text-[10px] uppercase font-mono text-[#777777]">Attached Credential</span>
                <p className="font-mono text-[#111111] mt-0.5">{selectedFinding.evidenceDocument} (Page {selectedFinding.page})</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#E5E5E5]">
              <Button size="sm" variant="outline" onClick={() => setSelectedFinding(null)} className="h-8 px-4 text-xs border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] rounded-md cursor-pointer">
                Close Inspection
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* OFFICER DECISION RECORDING MODAL */}
      {isDecisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-lg rounded-lg border border-[#E5E5E5] bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#111111]" />
                <h3 className="text-sm font-semibold text-[#111111]">
                  Record Official Procurement Officer Decision
                </h3>
              </div>
              <button 
                onClick={() => setIsDecisionModalOpen(false)} 
                className="text-[#777777] hover:text-[#111111] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#555555] space-y-3">
              <p>
                As the designated Procurement Officer, your verdict will be cryptographically registered in the CVC audit ledger for <span className="font-semibold text-[#111111]">{bidder.companyName}</span> ({bidder.submissionId}).
              </p>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono text-[#777777] font-semibold block">
                  Officer Verdict
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecisionType('QUALIFIED')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-md border text-xs font-semibold cursor-pointer transition-all ${
                      decisionType === 'QUALIFIED'
                        ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                        : 'border-[#E5E5E5] bg-[#F7F7F7] text-[#111111] hover:bg-[#EEEEEE]'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>QUALIFIED</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDecisionType('DISQUALIFIED')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-md border text-xs font-semibold cursor-pointer transition-all ${
                      decisionType === 'DISQUALIFIED'
                        ? 'border-[#991B1B] bg-[#991B1B] text-white shadow-xs'
                        : 'border-[#E5E5E5] bg-[#F7F7F7] text-[#111111] hover:bg-[#EEEEEE]'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    <span>DISQUALIFIED</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-mono text-[#777777] font-semibold block">
                  Official Justification / Notes
                </label>
                <textarea
                  rows={3}
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder={
                    decisionType === 'QUALIFIED'
                      ? 'Bidder satisfies all technical and financial minimum pre-qualification thresholds.'
                      : 'Specify disqualification clause and grounds (e.g. non-conforming tender submission)...'
                  }
                  className="w-full p-2.5 bg-white border border-[#E5E5E5] rounded-md text-xs text-[#111111] placeholder:text-[#777777] focus:outline-none focus:border-[#111111]"
                />
              </div>

              {decisionSuccessMsg && (
                <div className="p-2.5 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] text-xs text-[#111111] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#111111]" />
                  <span>{decisionSuccessMsg}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5E5]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDecisionModalOpen(false)}
                disabled={isSubmittingDecision}
                className="h-8 px-4 text-xs border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] rounded-md cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isSubmittingDecision}
                onClick={async () => {
                  setIsSubmittingDecision(true);
                  try {
                    recordOfficerVerdict(
                      bidId,
                      decisionType,
                      'Procurement Officer',
                      decisionNotes || (decisionType === 'QUALIFIED' ? 'Passed all mandatory criteria.' : 'Failed qualification criteria.')
                    );

                    const res = await recordOfficerDecision({
                      tenderId: bidder.tenderReference,
                      bidderId: bidder.submissionId,
                      bidderName: bidder.companyName,
                      decision: decisionType,
                      notes: decisionNotes || (decisionType === 'QUALIFIED' ? 'Passed all mandatory criteria.' : 'Failed qualification criteria.'),
                    });

                    if (res.success) {
                      setOfficerDecision({
                        decision: decisionType,
                        timestamp: res.timestamp || new Date().toISOString(),
                        notes: decisionNotes,
                      });
                      setDecisionSuccessMsg(`Verdict registered in CVC audit trail.`);
                      setTimeout(() => {
                        setIsDecisionModalOpen(false);
                      }, 1200);
                    }
                  } catch (err) {
                    console.error('[OfficerDecision] Recording failed:', err);
                  } finally {
                    setIsSubmittingDecision(false);
                  }
                }}
                className="h-8 px-4 bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs rounded-md cursor-pointer"
              >
                {isSubmittingDecision ? 'Signing into Ledger...' : 'Confirm & Sign Decision'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
