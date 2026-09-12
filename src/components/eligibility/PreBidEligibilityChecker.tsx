'use client';

/**
 * Pre-Bid Eligibility Checker Component
 *
 * Interactive workflow allowing bidders to evaluate their eligibility before uploading
 * formal bid documents. Generates Gap Analysis and Required Documents checklist.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight, 
  FileCheck2, 
  ShieldCheck, 
  Sparkles, 
  Download, 
  CheckSquare, 
  Square,
  RefreshCw,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  extractTenderEligibilityCriteria, 
  evaluatePreBidEligibility,
  DEFAULT_CPCL_ELIGIBILITY_CRITERIA 
} from '@/lib/compliance/eligibility-engine';
import type { 
  PreBidEligibilityCriteria, 
  PreBidEligibilityAnswers, 
  PreBidEligibilityEvaluation 
} from '@/types/eligibility';
import { EligibilitySpeedometer, DecisionTreeDiagram } from '@/components/charts/EligibilitySpeedometerAndTree';

interface PreBidEligibilityCheckerProps {
  tenderId?: string;
  tenderTitle?: string;
  referenceNumber?: string;
  onProceedToUpload?: (evaluation: PreBidEligibilityEvaluation) => void;
}

// Preset Profiles for quick demonstration
const DEMO_PROFILES = [
  {
    id: 'profile-apex',
    name: 'Apex Heavy Engineering (Compliant Bidder)',
    answers: {
      annualTurnoverCr: 12.4,
      experienceYears: 8,
      hasActiveGst: true,
      hasPan: true,
      isUdyamRegistered: true,
      isStartupIndiaRecognized: false,
      hasOemAuthorization: true,
      localContentPercent: 68,
      hasNonBlacklistingAffidavit: true,
      hasEpfoEsicRegistration: true,
    }
  },
  {
    id: 'profile-mid',
    name: 'TechnoFab Infra (Class-II MII / Turnover Borderline)',
    answers: {
      annualTurnoverCr: 7.5,
      experienceYears: 4,
      hasActiveGst: true,
      hasPan: true,
      isUdyamRegistered: true,
      isStartupIndiaRecognized: false,
      hasOemAuthorization: true,
      localContentPercent: 35,
      hasNonBlacklistingAffidavit: true,
      hasEpfoEsicRegistration: true,
    }
  },
  {
    id: 'profile-startup',
    name: 'AeroRobotics Labs (Startup India Exemption)',
    answers: {
      annualTurnoverCr: 3.2,
      experienceYears: 2,
      hasActiveGst: true,
      hasPan: true,
      isUdyamRegistered: true,
      isStartupIndiaRecognized: true,
      hasOemAuthorization: true,
      localContentPercent: 75,
      hasNonBlacklistingAffidavit: true,
      hasEpfoEsicRegistration: true,
    }
  },
  {
    id: 'profile-disqualified',
    name: 'Ineligible Vendor (Debarment Flag / No OEM)',
    answers: {
      annualTurnoverCr: 4.0,
      experienceYears: 2,
      hasActiveGst: true,
      hasPan: true,
      isUdyamRegistered: false,
      isStartupIndiaRecognized: false,
      hasOemAuthorization: false,
      localContentPercent: 15,
      hasNonBlacklistingAffidavit: false,
      hasEpfoEsicRegistration: false,
    }
  }
];

export function PreBidEligibilityChecker({
  tenderId = 'tender-cpcl-2026-0412',
  tenderTitle = 'Supply, Installation & Commissioning of High-Pressure Gas Compressor System',
  referenceNumber = 'CPCL/ENG/2026/HPGC-0412',
  onProceedToUpload
}: PreBidEligibilityCheckerProps) {
  const criteria = extractTenderEligibilityCriteria(tenderId, tenderTitle, referenceNumber);

  // Form State
  const [answers, setAnswers] = useState<PreBidEligibilityAnswers>(DEMO_PROFILES[0].answers);
  const [activePreset, setActivePreset] = useState<string>(DEMO_PROFILES[0].id);
  const [evaluation, setEvaluation] = useState<PreBidEligibilityEvaluation>(() => 
    evaluatePreBidEligibility(criteria, DEMO_PROFILES[0].answers)
  );

  // Checklist tracking state
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  const handleProfileSelect = (profileId: string) => {
    setActivePreset(profileId);
    const selected = DEMO_PROFILES.find(p => p.id === profileId);
    if (selected) {
      setAnswers(selected.answers);
      const evalResult = evaluatePreBidEligibility(criteria, selected.answers);
      setEvaluation(evalResult);
    }
  };

  const handleFieldChange = <K extends keyof PreBidEligibilityAnswers>(
    field: K,
    value: PreBidEligibilityAnswers[K]
  ) => {
    const updated = { ...answers, [field]: value };
    setAnswers(updated);
    setActivePreset('');
    const evalResult = evaluatePreBidEligibility(criteria, updated);
    setEvaluation(evalResult);
  };

  const toggleDocChecked = (docId: string) => {
    setCheckedDocs(prev => ({ ...prev, [docId]: !prev[docId] }));
  };

  return (
    <div className="space-y-8 font-sans">
      
      {/* 1. HEADER SECTION */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-[#111111] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E5E5]">
                PRE-BID GATEWAY
              </span>
              <span className="text-[#777777] text-xs">•</span>
              <span className="text-[#555555] text-xs font-mono">{criteria.referenceNumber}</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
              Check My Bid Eligibility
            </h1>
            
            <p className="text-xs sm:text-sm text-[#555555] leading-relaxed">
              Verify your operational capacity against tender clauses before investing resources into bid preparation. Identify compliance gaps early.
            </p>
          </div>

          {/* Quick Preset Profiles Selector */}
          <div className="w-full lg:w-auto p-3 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA]">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-[#777777] mb-1.5 font-semibold">
              Demo Test Profiles:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_PROFILES.map(prof => (
                <button
                  key={prof.id}
                  type="button"
                  onClick={() => handleProfileSelect(prof.id)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    activePreset === prof.id 
                      ? 'bg-[#111111] text-white font-medium shadow-2xs' 
                      : 'bg-white text-[#555555] hover:text-[#111111] border border-[#E5E5E5]'
                  }`}
                >
                  {prof.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC QUESTIONNAIRE & REAL-TIME RESULT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Dynamic Questionnaire (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5] mb-5">
              <div>
                <h2 className="text-base font-semibold text-[#111111] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#555555]" />
                  Eligibility Questionnaire
                </h2>
                <p className="text-xs text-[#777777] mt-0.5">
                  Parameters extracted automatically from tender specification
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#777777] uppercase bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E5E5]">
                9 Parameters
              </span>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* Question 1: Annual Turnover */}
              <div className="p-3.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-[#111111]">
                    1. Average Annual Turnover (Last 3 Financial Years)
                  </label>
                  <span className="text-[10px] font-mono text-[#777777] bg-white px-2 py-0.5 rounded border border-[#E5E5E5]">
                    Required: ≥ ₹{criteria.minimumTurnoverCr} Cr
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-[#777777] font-mono text-xs">₹</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={answers.annualTurnoverCr}
                      onChange={(e) => handleFieldChange('annualTurnoverCr', parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-12 py-2 border border-[#E5E5E5] rounded-md bg-white text-xs text-[#111111] font-mono focus:border-[#111111] outline-none"
                    />
                    <span className="absolute right-3 top-2.5 text-[#777777] font-mono text-xs">Crores</span>
                  </div>
                </div>
              </div>

              {/* Question 2: Relevant Past Experience */}
              <div className="p-3.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-[#111111]">
                    2. Past Experience in Similar Supply / Works
                  </label>
                  <span className="text-[10px] font-mono text-[#777777] bg-white px-2 py-0.5 rounded border border-[#E5E5E5]">
                    Required: ≥ {criteria.minimumExperienceYears} Years
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={answers.experienceYears}
                    onChange={(e) => handleFieldChange('experienceYears', parseInt(e.target.value, 10))}
                    className="flex-1 accent-[#111111]"
                  />
                  <span className="w-20 text-right font-mono font-bold text-xs text-[#111111] bg-white px-2.5 py-1.5 rounded border border-[#E5E5E5]">
                    {answers.experienceYears} Years
                  </span>
                </div>
              </div>

              {/* Question 3 & 4: Statutory GST & PAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-[#111111]">3. Active GSTIN</label>
                    <span className="text-[9px] font-mono text-[#065F46] bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-[#A7F3D0]">Mandatory</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('hasActiveGst', true)}
                      className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                        answers.hasActiveGst 
                          ? 'bg-[#111111] text-white border-[#111111] font-medium' 
                          : 'bg-white text-[#555555] border-[#E5E5E5]'
                      }`}
                    >
                      ✓ Active
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('hasActiveGst', false)}
                      className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                        !answers.hasActiveGst 
                          ? 'bg-red-600 text-white border-red-600 font-medium' 
                          : 'bg-white text-[#555555] border-[#E5E5E5]'
                      }`}
                    >
                      ✗ Inactive / None
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-[#111111]">4. Enterprise PAN</label>
                    <span className="text-[9px] font-mono text-[#065F46] bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-[#A7F3D0]">Mandatory</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('hasPan', true)}
                      className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                        answers.hasPan 
                          ? 'bg-[#111111] text-white border-[#111111] font-medium' 
                          : 'bg-white text-[#555555] border-[#E5E5E5]'
                      }`}
                    >
                      ✓ Available
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('hasPan', false)}
                      className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                        !answers.hasPan 
                          ? 'bg-red-600 text-white border-red-600 font-medium' 
                          : 'bg-white text-[#555555] border-[#E5E5E5]'
                      }`}
                    >
                      ✗ Missing
                    </button>
                  </div>
                </div>
              </div>

              {/* Question 5: OEM Authorization */}
              <div className="p-3.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-[#111111]">
                    5. OEM Status / Manufacturer Authorization (MAF)
                  </label>
                  <span className="text-[9px] font-mono text-[#065F46] bg-[#ECFDF5] px-1.5 py-0.5 rounded border border-[#A7F3D0]">Mandatory</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('hasOemAuthorization', true)}
                    className={`py-2 text-xs rounded border transition-colors ${
                      answers.hasOemAuthorization 
                        ? 'bg-[#111111] text-white border-[#111111] font-medium' 
                        : 'bg-white text-[#555555] border-[#E5E5E5]'
                    }`}
                  >
                    Direct OEM / Valid MAF Ready
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFieldChange('hasOemAuthorization', false)}
                    className={`py-2 text-xs rounded border transition-colors ${
                      !answers.hasOemAuthorization 
                        ? 'bg-red-600 text-white border-red-600 font-medium' 
                        : 'bg-white text-[#555555] border-[#E5E5E5]'
                    }`}
                  >
                    No OEM Authorization
                  </button>
                </div>
              </div>

              {/* Question 6: Make in India (Local Content) */}
              <div className="p-3.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-[#111111]">
                    6. Make in India (Domestic Value Addition)
                  </label>
                  <span className="text-[10px] font-mono text-[#777777] bg-white px-2 py-0.5 rounded border border-[#E5E5E5]">
                    Class-I: ≥ 50% | Class-II: 20-49%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={answers.localContentPercent}
                    onChange={(e) => handleFieldChange('localContentPercent', parseInt(e.target.value, 10))}
                    className="flex-1 accent-[#111111]"
                  />
                  <span className={`w-24 text-right font-mono font-bold text-xs px-2.5 py-1.5 rounded border ${
                    answers.localContentPercent >= 50 ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]' :
                    answers.localContentPercent >= 20 ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]' :
                    'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                  }`}>
                    {answers.localContentPercent}% ({answers.localContentPercent >= 50 ? 'Class-I' : answers.localContentPercent >= 20 ? 'Class-II' : 'Non-Local'})
                  </span>
                </div>
              </div>

              {/* Question 7, 8, 9: Policies & Undertakings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* MSME Udyam */}
                <div 
                  onClick={() => handleFieldChange('isUdyamRegistered', !answers.isUdyamRegistered)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    answers.isUdyamRegistered 
                      ? 'bg-white border-[#111111] ring-1 ring-[#111111]' 
                      : 'bg-[#FAFAFA] border-[#E5E5E5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-[#111111]">MSME / Udyam</span>
                    {answers.isUdyamRegistered ? <CheckCircle2 className="w-3.5 h-3.5 text-[#111111]" /> : <Square className="w-3.5 h-3.5 text-[#777777]" />}
                  </div>
                  <p className="text-[10px] text-[#777777]">Fee / EMD Exemption</p>
                </div>

                {/* Startup India */}
                <div 
                  onClick={() => handleFieldChange('isStartupIndiaRecognized', !answers.isStartupIndiaRecognized)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    answers.isStartupIndiaRecognized 
                      ? 'bg-white border-[#111111] ring-1 ring-[#111111]' 
                      : 'bg-[#FAFAFA] border-[#E5E5E5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-[#111111]">DPIIT Startup</span>
                    {answers.isStartupIndiaRecognized ? <CheckCircle2 className="w-3.5 h-3.5 text-[#111111]" /> : <Square className="w-3.5 h-3.5 text-[#777777]" />}
                  </div>
                  <p className="text-[10px] text-[#777777]">Turnover Relaxation</p>
                </div>

                {/* Non-Blacklisting */}
                <div 
                  onClick={() => handleFieldChange('hasNonBlacklistingAffidavit', !answers.hasNonBlacklistingAffidavit)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    answers.hasNonBlacklistingAffidavit 
                      ? 'bg-white border-[#111111] ring-1 ring-[#111111]' 
                      : 'bg-[#FAFAFA] border-red-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-[#111111]">Non-Debarred</span>
                    {answers.hasNonBlacklistingAffidavit ? <CheckCircle2 className="w-3.5 h-3.5 text-[#111111]" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                  </div>
                  <p className="text-[10px] text-[#777777]">Affidavit &lt; 30 days</p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Preliminary Eligibility Result & Score Card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-2xs space-y-6">
            
            {/* Verdict Card */}
            <div>
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#777777] block mb-2">
                PRELIMINARY ELIGIBILITY VERDICT
              </span>
              
              <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                evaluation.status === 'LIKELY_ELIGIBLE' ? 'bg-[#ECFDF5] border-[#A7F3D0]' :
                evaluation.status === 'POTENTIALLY_INELIGIBLE' ? 'bg-[#FEF2F2] border-[#FECACA]' :
                'bg-[#FFFBEB] border-[#FDE68A]'
              }`}>
                {evaluation.status === 'LIKELY_ELIGIBLE' && <CheckCircle2 className="w-6 h-6 text-[#065F46] shrink-0 mt-0.5" />}
                {evaluation.status === 'POTENTIALLY_INELIGIBLE' && <XCircle className="w-6 h-6 text-[#991B1B] shrink-0 mt-0.5" />}
                {evaluation.status === 'INSUFFICIENT_INFORMATION' && <AlertTriangle className="w-6 h-6 text-[#92400E] shrink-0 mt-0.5" />}

                <div>
                  <h3 className={`text-base font-bold uppercase tracking-wide ${
                    evaluation.status === 'LIKELY_ELIGIBLE' ? 'text-[#065F46]' :
                    evaluation.status === 'POTENTIALLY_INELIGIBLE' ? 'text-[#991B1B]' :
                    'text-[#92400E]'
                  }`}>
                    {evaluation.status.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-xs mt-1 text-[#333333] leading-relaxed">
                    {evaluation.status === 'LIKELY_ELIGIBLE' 
                      ? 'Your self-declared operational criteria align with the tender requirements. Proceed to formal document upload.' 
                      : evaluation.status === 'POTENTIALLY_INELIGIBLE'
                      ? 'Critical gaps identified in tender mandatory clauses. Review the gap analysis before bidding.'
                      : 'Additional parameters are required to evaluate your eligibility.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Score Metric Speedometer Gauge */}
            <EligibilitySpeedometer 
              score={evaluation.preliminaryScore} 
              verdict={
                evaluation.status === 'LIKELY_ELIGIBLE' 
                  ? 'HIGH_PROBABILITY' 
                  : evaluation.status === 'POTENTIALLY_INELIGIBLE' 
                  ? 'DISQUALIFIED_RISK' 
                  : 'BORDERLINE'
              } 
            />

            {/* Criteria Concordance summary row */}
            <div className="p-3 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-between text-xs font-mono">
              <span className="text-[#777777] uppercase text-[10px]">Criteria Concordance:</span>
              <span className="font-bold text-[#111111]">
                {evaluation.criteriaMetCount} of {evaluation.totalCriteriaCount} Rules Met
              </span>
            </div>

            {/* Mandatory Statutory Disclaimer */}
            <div className="p-3.5 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] text-[#92400E] space-y-1">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold tracking-wider">
                <Info className="w-3.5 h-3.5 shrink-0" />
                Statutory Assessment Notice
              </div>
              <p className="text-[11px] leading-relaxed text-[#78350F]">
                {evaluation.disclaimer}
              </p>
            </div>

            {/* Action Button: Proceed to Upload */}
            <div className="pt-2">
              <Link href={`/bidder/tenders?tenderId=${criteria.tenderId}&step=intake`}>
                <Button 
                  onClick={() => onProceedToUpload?.(evaluation)}
                  className="w-full h-11 bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-sm rounded-lg"
                >
                  <span>Proceed to Document Upload &amp; Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

          </div>
        </div>

      </div>

      {/* 2.5 STATUTORY DECISION TREE FLOWCHART */}
      <DecisionTreeDiagram evaluation={evaluation} />

      {/* 3. ELIGIBILITY GAP ANALYSIS TABLE */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white overflow-hidden shadow-2xs">
        <div className="p-6 border-b border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#111111] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#555555]" />
              Eligibility Gap Analysis Table
            </h2>
            <p className="text-xs text-[#555555] mt-0.5">
              Side-by-side comparison of tender criteria against your declared profile with actionable remediation advice
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#777777] bg-[#F7F7F7] px-2.5 py-1 rounded border border-[#E5E5E5]">
            {evaluation.gaps.filter(g => g.status === 'GAP').length} Gaps Detected
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#E5E5E5] bg-[#F7F7F7] text-[#555555] font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 font-medium">Evaluation Criterion</th>
                <th className="py-3 px-4 font-medium">Tender Requirement</th>
                <th className="py-3 px-4 font-medium">Your Declared Capacity</th>
                <th className="py-3 px-4 font-medium text-center">Status</th>
                <th className="py-3 px-4 font-medium">Gap Analysis &amp; Remediation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {evaluation.gaps.map((gap) => (
                <tr key={gap.id} className={gap.status === 'GAP' ? 'bg-[#FFFDF5]' : 'hover:bg-[#FAFAFA]'}>
                  <td className="py-3.5 px-4 font-medium text-[#111111]">
                    {gap.criterion}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#555555]">
                    {gap.requiredValue}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] font-semibold text-[#111111]">
                    {gap.declaredValue}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${
                      gap.status === 'MET' ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]' :
                      gap.status === 'EXEMPTED' ? 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]' :
                      gap.status === 'PARTIAL' ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]' :
                      'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]'
                    }`}>
                      {gap.status === 'MET' && <CheckCircle2 className="w-3 h-3" />}
                      {gap.status === 'GAP' && <XCircle className="w-3 h-3" />}
                      {gap.status === 'PARTIAL' && <AlertTriangle className="w-3 h-3" />}
                      {gap.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-[#555555] leading-relaxed max-w-sm">
                    {gap.remediationAdvice}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. REQUIRED DOCUMENTS CHECKLIST */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white overflow-hidden shadow-2xs">
        <div className="p-6 border-b border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#111111] flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#555555]" />
              Required Bid Documents Checklist
            </h2>
            <p className="text-xs text-[#555555] mt-0.5">
              Certificates and undertakings required for official technical submission. Check items as you prepare your vault dossier.
            </p>
          </div>
          <span className="text-[10px] font-mono text-[#777777] bg-[#F7F7F7] px-2.5 py-1 rounded border border-[#E5E5E5]">
            {Object.values(checkedDocs).filter(Boolean).length} of {evaluation.requiredDocuments.length} Ready
          </span>
        </div>

        <div className="divide-y divide-[#E5E5E5]">
          {evaluation.requiredDocuments.map((doc, idx) => {
            const isChecked = Boolean(checkedDocs[doc.id]);
            return (
              <div 
                key={doc.id}
                onClick={() => toggleDocChecked(doc.id)}
                className={`p-4 flex items-start justify-between gap-4 cursor-pointer transition-colors ${
                  isChecked ? 'bg-[#FAFAFA]' : 'hover:bg-[#FAFBFD]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-0.5 text-[#111111]">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-[#065F46]" />
                    ) : (
                      <Square className="w-4 h-4 text-[#777777]" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-xs font-semibold ${isChecked ? 'text-[#777777] line-through' : 'text-[#111111]'}`}>
                        {idx + 1}. {doc.documentName}
                      </h4>
                      <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                        doc.mandatory 
                          ? 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA] font-bold' 
                          : 'bg-[#F5F5F5] text-[#777777] border-[#E5E5E5]'
                      }`}>
                        {doc.mandatory ? 'Mandatory' : 'Exemption'}
                      </span>
                      <span className="text-[9px] font-mono uppercase text-[#777777]">
                        [{doc.category}]
                      </span>
                    </div>
                    <p className="text-[11px] text-[#555555] mt-0.5">
                      {doc.purpose}
                    </p>
                    <p className="text-[10px] font-mono text-[#777777] mt-1 bg-[#F5F5F5] inline-block px-2 py-0.5 rounded border border-[#EEEEEE]">
                      Format: {doc.sampleOrFormatNote}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 pt-1">
                  <span className={`text-[10px] font-mono px-2 py-1 rounded border ${
                    isChecked 
                      ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0] font-semibold' 
                      : 'bg-white text-[#777777] border-[#E5E5E5]'
                  }`}>
                    {isChecked ? '✓ IN VAULT' : 'PENDING'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
