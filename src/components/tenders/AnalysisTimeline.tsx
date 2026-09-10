'use client';

import { 
  CheckCircle2, 
  UploadCloud, 
  FileSearch, 
  ListOrdered, 
  FileCheck2, 
  Scale, 
  ShieldAlert, 
  Award 
} from 'lucide-react';

const TIMELINE_STEPS = [
  { id: '1', title: 'Document Uploaded', desc: 'Secure vault storage', icon: UploadCloud },
  { id: '2', title: 'Text Extracted', desc: 'Deterministic OCR & tokens', icon: FileSearch },
  { id: '3', title: 'Requirements Identified', desc: 'Category criteria chunking', icon: ListOrdered },
  { id: '4', title: 'Evidence Matched', desc: 'Vault cross-grounding', icon: FileCheck2 },
  { id: '5', title: 'Compliance Evaluated', desc: 'Threshold & date verification', icon: Scale },
  { id: '6', title: 'Risks Identified', desc: 'Contradiction radar audit', icon: ShieldAlert },
  { id: '7', title: 'Bid Readiness Generated', desc: 'Dossier score compiled', icon: Award }
];

export function AnalysisTimeline() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-5 font-sans">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <span className="text-[11px] font-normal uppercase tracking-[0.14em] text-muted-foreground block mb-0.5">
            05. AUDIT TRAIL
          </span>
          <h3 className="text-base sm:text-lg font-medium text-foreground">
            Analysis Timeline & Traceability Log
          </h3>
        </div>
        <span className="text-xs text-foreground font-mono flex items-center gap-1.5 font-medium">
          <span className="h-2 w-2 rounded-full bg-foreground" />
          ✓ 7/7 Stages Verified
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {TIMELINE_STEPS.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className="rounded-lg border border-border bg-background p-3 flex flex-col justify-between space-y-2 relative group hover:border-foreground/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="h-7 w-7 rounded-md bg-surface border border-border flex items-center justify-center text-foreground">
                  <Icon className="h-3.5 w-3.5 stroke-[1.5]" />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">0{idx + 1}</span>
              </div>

              <div>
                <h5 className="text-xs font-medium text-foreground leading-tight">{step.title}</h5>
                <p className="text-[10px] text-muted-foreground font-light mt-0.5">{step.desc}</p>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-foreground font-mono border-t border-border pt-1.5">
                <CheckCircle2 className="h-3 w-3" />
                <span>✓ Verified</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
