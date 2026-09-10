'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Building2, 
  ArrowLeft,
  RefreshCw
} from 'lucide-react';

import { BidderWorkflowStepper } from '@/components/tenders/discovery/BidderWorkflowStepper';
import { TenderSearchForm } from '@/components/tenders/discovery/TenderSearchForm';
import { TenderResultsList } from '@/components/tenders/discovery/TenderResultsList';
import { TenderDetailWorkspace } from '@/components/tenders/discovery/TenderDetailWorkspace';
import { BidderProfileCard } from '@/components/tenders/discovery/BidderProfileCard';
import { BidDocumentUploader } from '@/components/tenders/discovery/BidDocumentUploader';
import { BidComplianceDashboard } from '@/components/tenders/discovery/BidComplianceDashboard';
import { BidRequirementMatrix } from '@/components/tenders/discovery/BidRequirementMatrix';
import { BidReadinessGate } from '@/components/tenders/discovery/BidReadinessGate';
import { FinalBidPackageModal } from '@/components/tenders/discovery/FinalBidPackageModal';
import { BidSubmissionReceipt } from '@/components/tenders/discovery/BidSubmissionReceipt';

import { 
  searchActiveTendersAction, 
  getDiscoveredTenderAction, 
  runBidVerificationAction, 
  submitBidPackageAction,
  getBidderProfileAction
} from '@/lib/actions/tender-discovery';

import type { 
  WorkflowStepId, 
  DiscoveredTender, 
  TenderSearchParams, 
  BidderProfile, 
  BidUploadedDocument, 
  BidComplianceReport, 
  BidSubmissionRecord 
} from '@/types/tender-discovery';

function DiscoverContent() {
  const searchParams = useSearchParams();

  // Workflow State
  const [currentStep, setCurrentStep] = useState<WorkflowStepId>('search');
  const [completedSteps, setCompletedSteps] = useState<WorkflowStepId[]>([]);

  // Data State
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<DiscoveredTender[]>([]);
  const [totalSearchMatches, setTotalSearchMatches] = useState(0);
  const [selectedTender, setSelectedTender] = useState<DiscoveredTender | null>(null);

  // Bid Preparation State
  const [bidderProfile, setBidderProfile] = useState<BidderProfile | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<BidUploadedDocument[]>([]);

  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [complianceReport, setComplianceReport] = useState<BidComplianceReport | null>(null);
  const [verificationIteration, setVerificationIteration] = useState(1);

  // Submission State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionRecord, setSubmissionRecord] = useState<BidSubmissionRecord | null>(null);

  // Initial Data Fetch
  useEffect(() => {
    async function initData() {
      // 1. Initial Tender Search
      setIsSearching(true);
      try {
        const searchRes = await searchActiveTendersAction();
        setSearchResults(searchRes.tenders);
        setTotalSearchMatches(searchRes.totalCount);
      } catch (err) {
        console.error('Initial tender search failed:', err);
      } finally {
        setIsSearching(false);
      }

      // 2. Fetch default Bidder Profile
      try {
        const profile = await getBidderProfileAction();
        setBidderProfile(profile);
      } catch (err) {
        console.error('Failed to load bidder profile:', err);
      }

      // 3. Direct tender ID in URL if present
      const queryTenderId = searchParams.get('tenderId');
      if (queryTenderId) {
        try {
          const detailRes = await getDiscoveredTenderAction(queryTenderId);
          if (detailRes) {
            setSelectedTender(detailRes);
            setCurrentStep('overview');
            setCompletedSteps(['search']);
          }
        } catch (err) {
          console.error('Failed to fetch queried tender:', err);
        }
      }
    }
    initData();
  }, [searchParams]);

  // Handler: Execute Search
  const handleSearch = async (params: TenderSearchParams, mode: 'live' | 'imported' = 'imported') => {
    setIsSearching(true);
    try {
      const res = await searchActiveTendersAction(params, mode);
      setSearchResults(res.tenders);
      setTotalSearchMatches(res.totalCount);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Handler: Select Tender
  const handleSelectTender = (tender: DiscoveredTender) => {
    setSelectedTender(tender);
    setCurrentStep('overview');
    if (!completedSteps.includes('search')) {
      setCompletedSteps([...completedSteps, 'search']);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: Begin Intake
  const handleStartVerification = () => {
    setCurrentStep('intake');
    if (!completedSteps.includes('overview')) {
      setCompletedSteps([...completedSteps, 'overview']);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: Run Verification Pipeline
  const handleRunVerification = async (iteration = 1) => {
    if (!selectedTender || !bidderProfile) return;

    setIsVerifying(true);
    try {
      const report = await runBidVerificationAction(
        selectedTender.id,
        bidderProfile,
        uploadedDocuments,
        iteration
      );

      setComplianceReport(report);
      setVerificationIteration(iteration);
      setCurrentStep('verification');

      const nextCompleted: WorkflowStepId[] = Array.from(new Set([...completedSteps, 'search', 'overview', 'intake', 'verification'] as WorkflowStepId[]));
      setCompletedSteps(nextCompleted);

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Handler: Re-verify after remediation
  const handleReRunVerification = () => {
    handleRunVerification(verificationIteration + 1);
  };

  // Handler: Final Submission
  const handleConfirmSubmit = async () => {
    if (!selectedTender || !bidderProfile || !complianceReport) return;

    setIsSubmitting(true);
    try {
      const res = await submitBidPackageAction(
        selectedTender.id,
        bidderProfile,
        complianceReport
      );

      if (res.success && res.submission) {
        setSubmissionRecord(res.submission);
        setIsSubmitModalOpen(false);
        setCurrentStep('submission');
        setCompletedSteps(['search', 'overview', 'intake', 'verification', 'remediation', 'submission']);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Reset Workflow
  const handleResetWorkflow = () => {
    setCurrentStep('search');
    setCompletedSteps([]);
    setSelectedTender(null);
    setUploadedDocuments([]);
    setComplianceReport(null);
    setSubmissionRecord(null);
    setVerificationIteration(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-[#111111] pb-20 font-sans">
      {/* Top Header */}
      <div className="border-b border-[#E5E5E5] bg-white sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5]">
                  Government Procurement Pipeline
                </span>
                <span className="text-[#777777] text-xs hidden sm:inline">•</span>
                <span className="text-xs text-[#555555] hidden sm:inline font-mono">Active Public Portals</span>
              </div>
              <h1 className="text-xl font-semibold text-[#111111] tracking-tight mt-1 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#111111]" />
                Tender Discovery & Bid Verification Engine
              </h1>
            </div>

            {selectedTender && currentStep !== 'search' && currentStep !== 'submission' && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentStep('search')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-[#F7F7F7] text-xs font-medium text-[#111111] border border-[#E5E5E5] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change Tender
                </button>
              </div>
            )}
          </div>

          {/* Stepper Bar */}
          <div className="mt-5">
            <BidderWorkflowStepper
              currentStep={currentStep}
              completedSteps={completedSteps}
              onSelectStep={(stepId) => {
                if (completedSteps.includes(stepId) || stepId === currentStep) {
                  setCurrentStep(stepId);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* STEP 1: SEARCH & DISCOVER TENDERS */}
        {currentStep === 'search' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-[#111111]">Find Active Public Tenders</h2>
              <p className="text-sm text-[#555555] mt-0.5">
                Query central procurement portals (CPPP, GeM, PSU tenders) for verified tenders with official NITs and spec sheets.
              </p>
            </div>

            <TenderSearchForm onSearch={(params, mode) => handleSearch(params, mode)} isLoading={isSearching} />

            <div className="border-t border-[#E5E5E5] pt-6">
              <TenderResultsList
                tenders={searchResults}
                onSelectTender={handleSelectTender}
                selectedTenderId={selectedTender?.id}
                sourceUsed="Central Public Procurement Portal (CPPP)"
              />
            </div>
          </div>
        )}

        {/* STEP 2: REVIEW REQUIREMENTS */}
        {currentStep === 'overview' && selectedTender && (
          <div>
            <TenderDetailWorkspace
              tender={selectedTender}
              onStartVerification={handleStartVerification}
              onBackToSearch={() => setCurrentStep('search')}
            />
          </div>
        )}

        {/* STEP 3: UPLOAD BID DOCUMENTS & PROFILE */}
        {currentStep === 'intake' && selectedTender && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-4">
              <div>
                <h2 className="text-lg font-semibold text-[#111111]">Upload Bid Submissions & Profile</h2>
                <p className="text-sm text-[#555555] mt-0.5">
                  Prepare your organisation profile and upload all required technical, financial, and statutory credentials for verification.
                </p>
              </div>

              <button
                onClick={() => handleRunVerification(1)}
                disabled={isVerifying || uploadedDocuments.length === 0}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-[#111111] hover:bg-[#222222] disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Running Verification Pipeline...
                  </>
                ) : (
                  <span>Verify Bid Compliance</span>
                )}
              </button>
            </div>

            {/* Bidder Profile */}
            {bidderProfile && (
              <BidderProfileCard
                initialProfile={bidderProfile}
                onChange={(updated: BidderProfile) => setBidderProfile(updated)}
              />
            )}

            {/* Document Uploader */}
            <BidDocumentUploader
              documents={uploadedDocuments}
              onDocumentsChange={(docs: BidUploadedDocument[]) => setUploadedDocuments(docs)}
              onProceedToVerification={() => handleRunVerification(1)}
              isVerifying={isVerifying}
            />

            {/* Quick Action Footer */}
            {uploadedDocuments.length > 0 && (
              <div className="flex items-center justify-end pt-4">
                <button
                  onClick={() => handleRunVerification(1)}
                  disabled={isVerifying}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing Documents...
                    </>
                  ) : (
                    <span>Proceed to Verification Analysis</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 4 & 5: VERIFY COMPLIANCE & REMEDIATE */}
        {(currentStep === 'verification' || currentStep === 'remediation') && selectedTender && complianceReport && (
          <div className="space-y-8">
            {/* Header with Iteration Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#777777]">
                    Verification Dossier
                  </span>
                  <span className="text-[#777777] text-xs">•</span>
                  <span className="text-xs font-mono text-[#111111] bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5]">
                    Iteration #{verificationIteration}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-[#111111] tracking-tight mt-1">
                  Comprehensive Bid Compliance Analysis
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentStep('intake')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-white hover:bg-[#F7F7F7] text-xs font-medium text-[#111111] border border-[#E5E5E5] transition-colors cursor-pointer"
                >
                  Edit Uploaded Documents
                </button>
                <button
                  onClick={handleReRunVerification}
                  disabled={isVerifying}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>Re-Verify</span>
                </button>
              </div>
            </div>

            {/* High-Level Score Dashboard */}
            <BidComplianceDashboard report={complianceReport} />

            {/* Bid Readiness Gate (Submissions Blocker / Unblocker) */}
            <BidReadinessGate
              report={complianceReport}
              onFixIssues={() => {
                setCurrentStep('intake');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onRerunVerification={handleReRunVerification}
              onProceedToFinalReview={() => setIsSubmitModalOpen(true)}
              isReverifying={isVerifying}
            />

            {/* Detailed Requirement Matrix with Evidence & Sources */}
            <BidRequirementMatrix matrix={complianceReport.matrix} />
          </div>
        )}

        {/* STEP 6: FINAL SUBMISSION RECEIPT */}
        {currentStep === 'submission' && selectedTender && submissionRecord && (
          <div>
            <BidSubmissionReceipt
              submission={submissionRecord}
              tender={selectedTender}
              onResetWorkflow={handleResetWorkflow}
            />
          </div>
        )}
      </main>

      {/* FINAL BID SUBMISSION MODAL */}
      {selectedTender && bidderProfile && complianceReport && (
        <FinalBidPackageModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onConfirmSubmission={handleConfirmSubmit}
          tender={selectedTender}
          bidderProfile={bidderProfile}
          report={complianceReport}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

export default function TenderDiscoverPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center text-[#555555]">
        <div className="flex items-center gap-3 font-mono text-xs">
          <RefreshCw className="w-4 h-4 animate-spin text-[#111111]" />
          <span>Loading Tender Discovery Pipeline...</span>
        </div>
      </div>
    }>
      <DiscoverContent />
    </Suspense>
  );
}
