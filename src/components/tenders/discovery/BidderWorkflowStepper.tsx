'use client';

/**
 * Persistent 6-Stage Bidder Progress Stepper
 *
 * 01 Find Tender → 02 Review Requirements → 03 Upload Bid →
 * 04 Verify Compliance → 05 Resolve Issues → 06 Submit
 */

import {
  Search,
  FileText,
  UploadCloud,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  SendHorizontal,
} from 'lucide-react';

export type WorkflowStepId =
  | 'search'
  | 'overview'
  | 'intake'
  | 'verification'
  | 'remediation'
  | 'submission';

interface StepDefinition {
  id: WorkflowStepId;
  number: string;
  label: string;
  icon: typeof Search;
}

const STEPS: StepDefinition[] = [
  { id: 'search', number: '01', label: 'Find Tender', icon: Search },
  { id: 'overview', number: '02', label: 'Requirements', icon: FileText },
  { id: 'intake', number: '03', label: 'Upload Bid', icon: UploadCloud },
  { id: 'verification', number: '04', label: 'Verify Compliance', icon: ShieldCheck },
  { id: 'remediation', number: '05', label: 'Resolve Issues', icon: AlertTriangle },
  { id: 'submission', number: '06', label: 'Submit Package', icon: SendHorizontal },
];

interface BidderWorkflowStepperProps {
  currentStep: WorkflowStepId;
  completedSteps: WorkflowStepId[];
  onSelectStep?: (step: WorkflowStepId) => void;
  canNavigateTo?: (step: WorkflowStepId) => boolean;
}

export function BidderWorkflowStepper({
  currentStep,
  completedSteps,
  onSelectStep,
  canNavigateTo = () => true,
}: BidderWorkflowStepperProps) {
  return (
    <div className="w-full bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg p-2 sm:p-2.5">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {STEPS.map((step, idx) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isClickable = Boolean(onSelectStep && canNavigateTo(step.id));

          let stateStyles = 'border-transparent bg-transparent text-[#777777]';
          if (isCurrent) {
            stateStyles = 'border-[#111111] bg-[#111111] text-white';
          } else if (isCompleted) {
            stateStyles = 'border-[#E5E5E5] bg-white text-[#111111] shadow-xs';
          }

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onSelectStep?.(step.id)}
              className={`flex items-center gap-2.5 p-2 rounded-md border text-left transition-colors ${stateStyles} ${
                isClickable ? 'cursor-pointer hover:border-[#CCCCCC]' : 'cursor-default'
              }`}
            >
              <div
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-mono font-medium ${
                  isCurrent
                    ? 'bg-white text-[#111111]'
                    : isCompleted
                    ? 'bg-[#F7F7F7] text-[#111111]'
                    : 'bg-white border border-[#E5E5E5] text-[#777777]'
                }`}
              >
                {isCompleted && !isCurrent ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#111111]" />
                ) : (
                  step.number
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div
                  className={`text-[9px] uppercase font-mono tracking-wider leading-none mb-0.5 ${
                    isCurrent ? 'text-white/70' : 'text-[#777777]'
                  }`}
                >
                  Step {idx + 1}
                </div>
                <div
                  className={`text-xs font-medium truncate ${
                    isCurrent ? 'text-white' : isCompleted ? 'text-[#111111]' : 'text-[#777777]'
                  }`}
                >
                  {step.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
