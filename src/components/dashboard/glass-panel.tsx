'use client';

import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  cycleDuration?: number; // e.g. 11, 14, 9, 13, 17, 20
  sweepDuration?: number; // e.g. 12, 16, 18, 22
  delay?: number;
}

export function GlassPanel({
  children,
  className = '',
}: GlassPanelProps) {
  return (
    <div
      className={`relative rounded-xl border border-border bg-surface shadow-sm ${className}`}
    >
      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}
