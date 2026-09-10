'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BidderErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log detailed error to console/logging without exposing raw stack to user
    console.error('[BidderPortal] Runtime caught error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center font-sans bg-white">
      <div className="h-12 w-12 rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-center text-[#111111] mb-4">
        <AlertCircle className="h-6 w-6 stroke-[1.5]" />
      </div>
      <h2 className="text-xl font-semibold text-[#111111] tracking-tight">
        Something went wrong
      </h2>
      <p className="text-xs sm:text-sm text-[#555555] mt-1.5 mb-6 max-w-sm leading-relaxed">
        We couldn&apos;t load this section. Please try again or return to the bidder dashboard.
      </p>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => reset()}
          size="sm"
          className="bg-[#111111] hover:bg-[#222222] text-white text-xs px-4 h-8 gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Try again</span>
        </Button>
      </div>
    </div>
  );
}
