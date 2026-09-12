'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  GitBranch,
  ShieldCheck,
  Award,
  FileCheck,
  TrendingUp,
  Percent
} from 'lucide-react';
import type { PreBidEligibilityEvaluation } from '@/types/eligibility';

interface SpeedometerProps {
  score: number; // 0 - 100
  verdict: 'HIGH_PROBABILITY' | 'BORDERLINE' | 'DISQUALIFIED_RISK';
}

export function EligibilitySpeedometer({ score, verdict }: SpeedometerProps) {
  // Semi-circle gauge (180 degrees)
  const size = 200;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const arcLength = Math.PI * radius; // Half circumference
  const filledArc = (score / 100) * arcLength;

  let statusColor = '#059669';
  let badgeLabel = 'HIGH PROBABILITY';
  let badgeBg = 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]';

  if (verdict === 'BORDERLINE') {
    statusColor = '#D97706';
    badgeLabel = 'BORDERLINE / CONDITIONAL';
    badgeBg = 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]';
  } else if (verdict === 'DISQUALIFIED_RISK') {
    statusColor = '#DC2626';
    badgeLabel = 'HIGH DISQUALIFICATION RISK';
    badgeBg = 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]';
  }

  // Calculate needle rotation angle (-90deg to +90deg)
  const needleAngle = -90 + (score / 100) * 180;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-[#E5E5E5] shadow-2xs">
      <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777] font-semibold mb-1">
        Preliminary Qualification Score
      </span>

      <div className="relative w-[200px] h-[115px] flex items-end justify-center overflow-hidden">
        <svg width={size} height={size} className="overflow-visible">
          {/* Background Arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Filled Arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={statusColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${filledArc} ${arcLength}`}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />

          {/* Needle pivot */}
          <circle cx={size / 2} cy={size / 2} r="6" fill="#111111" />
          
          {/* Needle line */}
          <line
            x1={size / 2}
            y1={size / 2}
            x2={size / 2 + (radius - 12) * Math.cos((needleAngle * Math.PI) / 180)}
            y2={size / 2 + (radius - 12) * Math.sin((needleAngle * Math.PI) / 180)}
            stroke="#111111"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Score number readout in center */}
        <div className="absolute bottom-0 flex flex-col items-center">
          <span className="text-3xl font-extrabold font-mono text-[#111111] tracking-tight">
            {score}%
          </span>
        </div>
      </div>

      <div className={`mt-3 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badgeBg}`}>
        {badgeLabel}
      </div>
      <p className="text-[10px] text-[#777777] mt-1 text-center">
        Evaluated against 9 mandatory tender criteria
      </p>
    </div>
  );
}

interface DecisionTreeProps {
  evaluation: PreBidEligibilityEvaluation;
}

export function DecisionTreeDiagram({ evaluation }: DecisionTreeProps) {
  const hasTurnoverGap = evaluation.gaps.some(g => g.id === 'gap-turnover' || g.criterion.toLowerCase().includes('turnover'));
  const isEligible = evaluation.status === 'LIKELY_ELIGIBLE';
  const isDisqualified = evaluation.status === 'POTENTIALLY_INELIGIBLE';

  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#555555]" />
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
            Statutory Decision Tree Flowchart
          </h4>
        </div>
        <span className="text-[10px] font-mono text-[#777777]">
          GFR 2017 & CVC Logic Map
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 relative">
        {/* Step 1: Turnover & Solvency */}
        <div className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
          hasTurnoverGap ? 'bg-[#FFFBEB] border-[#FDE68A]' : 'bg-[#F9FAFB] border-[#E5E5E5]'
        }`}>
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#777777] mb-1">
              <span>NODE 1</span>
              {hasTurnoverGap ? (
                <AlertTriangle className="w-3 h-3 text-[#D97706]" />
              ) : (
                <CheckCircle2 className="w-3 h-3 text-[#059669]" />
              )}
            </div>
            <span className="font-semibold text-[#111111] block text-xs">
              Annual Turnover
            </span>
            <p className="text-[10px] text-[#666666] mt-0.5">
              Target: ₹10.0 Cr
            </p>
          </div>
          <span className="text-[9px] font-mono mt-2 font-medium text-[#555555]">
            {hasTurnoverGap ? '⚠️ Exemption Branch' : '✓ Criteria Met'}
          </span>
        </div>

        {/* Step 2: MSME / DPIIT Exemption */}
        <div className="p-3 rounded-lg border border-[#E5E5E5] bg-[#F9FAFB] text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#777777] mb-1">
              <span>NODE 2</span>
              <CheckCircle2 className="w-3 h-3 text-[#059669]" />
            </div>
            <span className="font-semibold text-[#111111] block text-xs">
              MSME / Startup Check
            </span>
            <p className="text-[10px] text-[#666666] mt-0.5">
              GFR Rule 173(i) Waiver
            </p>
          </div>
          <span className="text-[9px] font-mono mt-2 font-medium text-[#059669]">
            Active Exemption Rule
          </span>
        </div>

        {/* Step 3: Statutory Registries */}
        <div className="p-3 rounded-lg border border-[#E5E5E5] bg-[#F9FAFB] text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#777777] mb-1">
              <span>NODE 3</span>
              <CheckCircle2 className="w-3 h-3 text-[#059669]" />
            </div>
            <span className="font-semibold text-[#111111] block text-xs">
              GSTN & PAN Verification
            </span>
            <p className="text-[10px] text-[#666666] mt-0.5">
              Operative Standing
            </p>
          </div>
          <span className="text-[9px] font-mono mt-2 font-medium text-[#059669]">
            100% Registry Verified
          </span>
        </div>

        {/* Step 4: Make In India */}
        <div className="p-3 rounded-lg border border-[#E5E5E5] bg-[#F9FAFB] text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#777777] mb-1">
              <span>NODE 4</span>
              <CheckCircle2 className="w-3 h-3 text-[#059669]" />
            </div>
            <span className="font-semibold text-[#111111] block text-xs">
              Make in India %
            </span>
            <p className="text-[10px] text-[#666666] mt-0.5">
              Class-I (≥ 50%)
            </p>
          </div>
          <span className="text-[9px] font-mono mt-2 font-medium text-[#059669]">
            Preference Eligible
          </span>
        </div>

        {/* Step 5: Final Recommended Verdict */}
        <div className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
          isEligible 
            ? 'bg-[#ECFDF5] border-[#A7F3D0]' 
            : isDisqualified
            ? 'bg-[#FEF2F2] border-[#FECACA]'
            : 'bg-[#FFFBEB] border-[#FDE68A]'
        }`}>
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#777777] mb-1">
              <span>VERDICT</span>
              <Award className="w-3 h-3 text-[#111111]" />
            </div>
            <span className="font-bold text-[#111111] block text-xs">
              {isEligible ? 'Likely Eligible' : isDisqualified ? 'Disqualification Risk' : 'Conditional / Review'}
            </span>
            <p className="text-[10px] text-[#555555] mt-0.5">
              Score: {evaluation.preliminaryScore}%
            </p>
          </div>
          <span className="text-[9px] font-mono mt-2 font-bold text-[#111111]">
            Ready for Vault Upload
          </span>
        </div>
      </div>
    </div>
  );
}
