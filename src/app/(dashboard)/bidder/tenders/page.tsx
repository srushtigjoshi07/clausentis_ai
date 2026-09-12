'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Building2, 
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Search,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
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

function BidderTenderDiscoveryContent() {
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

      try {
        const profile = await getBidderProfileAction();
        setBidderProfile(profile);
      } catch (err) {
        console.error('Failed to load bidder profile:', err);
      }

      const queryTenderId = searchParams.get('tenderId');
      const queryStep = searchParams.get('step') as WorkflowStepId | null;

      if (queryTenderId) {
        try {
          const detailRes = await getDiscoveredTenderAction(queryTenderId);
          if (detailRes) {
            setSelectedTender(detailRes);
            setCurrentStep(queryStep || 'overview');
            setCompletedSteps(['search']);
          }
        } catch (err) {
          console.error('Failed to fetch queried tender:', err);
        }
      }
    }
    initData();
  }, [searchParams]);

  // Search Handler
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

  // Select Tender
  const handleSelectTender = (tender: DiscoveredTender) => {
    setSelectedTender(tender);
    setCurrentStep('overview');
    if (!completedSteps.includes('search')) {
      setCompletedSteps([...completedSteps, 'search']);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Begin Intake / Verification
  const handleStartVerification = () => {
    setCurrentStep('intake');
    if (!completedSteps.includes('overview')) {
      setCompletedSteps([...completedSteps, 'overview']);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Run Verification Pipeline
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

      const nextCompleted: WorkflowStepId[] = Array.from(
        new Set([...completedSteps, 'search', 'overview', 'intake', 'verification'] as WorkflowStepId[])
      );
      setCompletedSteps(nextCompleted);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Final Submission
  const handleConfirmSubmit = async (options?: { allowUnresolvedSubmission?: boolean }) => {
    if (!selectedTender || !bidderProfile || !complianceReport) return;

    setIsSubmitting(true);
    try {
      const res = await submitBidPackageAction(
        selectedTender.id,
        bidderProfile,
        complianceReport,
        options
      );

      if (res.success && res.submission) {
        setSubmissionRecord(res.submission);
        setIsSubmitModalOpen(false);
        setCurrentStep('submission');
        setCompletedSteps(['search', 'overview', 'intake', 'verification', 'remediation', 'submission']);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (res.error) {
        alert(res.error);
      }
    } catch (err) {
      console.error('Submission failed:', err);
      alert('An error occurred during submission. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset
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
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 font-sans bg-white">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] pb-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E5E5]">
                GOVERNMENT PROCUREMENT CATALOG
              </span>
              <span className="text-[#777777] text-xs">&bull;</span>
              <span className="text-[#555555] text-xs font-mono">CPPP / GeM / State PSUs</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111] mt-1">
              Find Active Government Tenders
            </h1>
            <p className="text-xs sm:text-sm text-[#555555] mt-1">
              Discover active tenders, verify pre-qualification readiness, and submit cryptographically sealed bid packages.
            </p>
          </div>

          {selectedTender && currentStep !== 'search' && currentStep !== 'submission' && (
            <button
              onClick={() => setCurrentStep('search')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-[#F7F7F7] text-xs font-medium text-[#111111] border border-[#E5E5E5] transition-colors cursor-pointer self-start sm:self-center"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Change Tender
            </button>
          )}
        </div>

        {/* Stepper Bar */}
        <div className="mt-6">
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

      {/* Main Workflow Content */}
      <div className="space-y-6">
        {/* STEP 1: SEARCH */}
        {currentStep === 'search' && (
          <div className="space-y-6">
            <TenderSearchForm onSearch={handleSearch} isLoading={isSearching} />

            <div className="border-t border-[#E5E5E5] pt-4">
              <TenderResultsList
                tenders={searchResults}
                onSelectTender={handleSelectTender}
                selectedTenderId={selectedTender?.id}
                sourceUsed="Central Public Procurement Portal (CPPP)"
              />
            </div>
          </div>
        )}

        {/* STEP 2: OVERVIEW */}
        {currentStep === 'overview' && selectedTender && (
          <TenderDetailWorkspace
            tender={selectedTender}
            onStartVerification={handleStartVerification}
            onBackToSearch={() => setCurrentStep('search')}
          />
        )}

        {/* STEP 3: INTAKE / UPLOAD */}
        {currentStep === 'intake' && selectedTender && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-4">
              <div>
                <h2 className="text-base font-semibold text-[#111111]">Upload Bid Credentials &amp; Profile</h2>
                <p className="text-xs text-[#555555] mt-0.5">
                  Prepare your enterprise credentials for autonomous qualification verification.
                </p>
              </div>

              <button
                onClick={() => handleRunVerification(1)}
                disabled={isVerifying || uploadedDocuments.length === 0}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-md bg-[#111111] hover:bg-[#222222] disabled:opacity-40 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Running Verification...
                  </>
                ) : (
                  <>
                    <span>Run Verification Pipeline</span>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">8-Stage</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                {bidderProfile && (
                  <BidderProfileCard 
                    initialProfile={bidderProfile}
                    onChange={(updated: BidderProfile) => setBidderProfile(updated)}
                  />
                )}
              </div>
              <div className="lg:col-span-8">
                <BidDocumentUploader
                  documents={uploadedDocuments}
                  onDocumentsChange={(docs: BidUploadedDocument[]) => {
                    setUploadedDocuments(docs);
                    if (bidderProfile) {
                      let updated = { ...bidderProfile };
                      let changed = false;
                      for (const d of docs) {
                        if (d.extractedFacts?.gstin && typeof d.extractedFacts.gstin === 'string' && (!updated.gstin || updated.gstin.startsWith('33AABCA0000'))) {
                          updated.gstin = d.extractedFacts.gstin;
                          changed = true;
                        }
                        if (d.extractedFacts?.pan && typeof d.extractedFacts.pan === 'string' && (!updated.pan || updated.pan.startsWith('AABCA0000'))) {
                          updated.pan = d.extractedFacts.pan;
                          changed = true;
                        }
                        if (d.extractedFacts?.udyamNumber && typeof d.extractedFacts.udyamNumber === 'string' && (!updated.udyamNumber || updated.udyamNumber.includes('0000000'))) {
                          updated.udyamNumber = d.extractedFacts.udyamNumber;
                          changed = true;
                        }
                      }
                      if (changed) {
                        setBidderProfile(updated);
                      }
                    }
                  }}
                  onProceedToVerification={() => handleRunVerification(1)}
                  isVerifying={isVerifying}
                  tender={selectedTender}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 & 5: VERIFICATION & REMEDIATION */}
        {(currentStep === 'verification' || currentStep === 'remediation') && selectedTender && complianceReport && (
          <div className="space-y-6">
            <BidComplianceDashboard report={complianceReport} />

            <BidReadinessGate
              report={complianceReport}
              onFixIssues={() => {
                setCurrentStep('intake');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onRerunVerification={() => handleRunVerification(verificationIteration + 1)}
              onProceedToFinalReview={() => setIsSubmitModalOpen(true)}
              isReverifying={isVerifying}
            />

            <BidRequirementMatrix matrix={complianceReport.matrix} />

            {/* Bottom Review & Submission Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-lg border border-[#E5E5E5] bg-white shadow-xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep('intake');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-[#E5E5E5] bg-white text-xs font-medium text-[#111111] hover:bg-[#F7F7F7] cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back / Resolve Issues</span>
                </button>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-medium text-[#111111]">
                    {complianceReport.mandatoryPassed === complianceReport.mandatoryTotal
                      ? '100% Mandatory Criteria Satisfied'
                      : `${complianceReport.mandatoryFailed + complianceReport.mandatoryMissing} Criteria Unresolved`}
                  </div>
                  <div className="text-[11px] text-[#777777] font-mono">
                    Score: {complianceReport.overallScore}% &bull; {complianceReport.documentsCount} Exhibits
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md bg-[#111111] hover:bg-[#222222] text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer shadow-xs"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Submit Bid Package</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: SUBMISSION RECEIPT */}
        {currentStep === 'submission' && selectedTender && submissionRecord && (
          <div className="space-y-6">
            <BidSubmissionReceipt
              submission={submissionRecord}
              tender={selectedTender}
              onResetWorkflow={handleResetWorkflow}
            />
          </div>
        )}
      </div>

      {/* Final Submission Modal */}
      {selectedTender && bidderProfile && complianceReport && (
        <FinalBidPackageModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onConfirmSubmission={handleConfirmSubmit}
          tender={selectedTender}
          report={complianceReport}
          bidderProfile={bidderProfile}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

export default function BidderTendersPage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-xs text-[#555555] font-mono">
        Loading procurement pipeline...
      </div>
    }>
      <BidderTenderDiscoveryContent />
    </Suspense>
  );
}
