'use client';

import { useEffect, useState } from 'react';
import { FileText, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ReportGenerator3DProps {
  tenderId: string;
  onComplete?: () => void;
}

export function ReportGenerator3D({ tenderId, onComplete }: ReportGenerator3DProps) {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsDone(true);
          if (onComplete) onComplete();
          return 100;
        }
        return prev + 2;
      });
    }, 45);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B111C] p-8 shadow-2xl space-y-6 text-center max-w-lg mx-auto font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(37,99,235,0.18),transparent_70%)] pointer-events-none" />

      {/* 3D Crystallizing Report Dossier */}
      <div className="relative h-44 flex items-center justify-center">
        {/* Converging Data Streams */}
        {!isDone && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-36 h-36 rounded-full border border-blue-500/30 animate-ping opacity-25" />
            <div className="w-24 h-24 rounded-full border border-sky-400/40 animate-pulse opacity-40" />
          </div>
        )}

        {/* 3D Dossier Card */}
        <div
          style={{
            transform: `perspective(600px) rotateY(${isDone ? 0 : (100 - progress) * 0.4}deg) rotateX(10deg)`,
            transition: 'transform 0.4s ease-out',
          }}
          className="relative w-28 h-36 rounded-xl bg-gradient-to-b from-[#0F172A] to-[#080D16] border border-blue-500/50 p-3 shadow-2xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <FileText className="h-5 w-5 text-blue-400" />
            <span className="text-[8px] font-mono text-blue-400">PDF</span>
          </div>

          <div className="space-y-1 text-left">
            <div className="h-1.5 w-full bg-white/20 rounded" />
            <div className="h-1.5 w-3/4 bg-white/20 rounded" />
            <div className="h-1.5 w-1/2 bg-blue-500/40 rounded" />
          </div>

          <div className="text-[8px] font-mono text-[#64748B] text-right">
            AUDIT v4
          </div>
        </div>
      </div>

      {/* Progress & Status */}
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          {isDone ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <Sparkles className="h-4 w-4 text-blue-400 animate-spin" />
          )}
          <span className="text-sm font-medium text-white">
            {isDone ? 'REPORT SYNTHESIS COMPLETE' : 'SYNTHESIZING AUDIT DOSSIER'}
          </span>
        </div>

        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
          <div
            className="bg-gradient-to-r from-blue-600 to-sky-400 h-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-xs text-[#94A3B8] font-light">
          {isDone
            ? 'All extracted evidence, contradiction alerts, and compliance decisions compiled.'
            : 'Fusing requirements, vault citations, and risk matrices...'}
        </p>
      </div>

      {/* Action CTA */}
      {isDone && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href={`/reports/${tenderId}`}>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm h-10 px-6 shadow-md shadow-blue-600/25 border border-blue-400/20">
              Open Full Report <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
