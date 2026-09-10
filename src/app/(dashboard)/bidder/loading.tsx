import React from 'react';
import { Loader2 } from 'lucide-react';

export default function BidderLoading() {
  return (
    <div className="flex items-center justify-center min-h-[300px] w-full bg-white font-sans">
      <div className="flex items-center gap-2.5 text-xs text-[#555555] font-mono">
        <Loader2 className="h-4 w-4 animate-spin text-[#111111]" />
        <span>Loading workspace data...</span>
      </div>
    </div>
  );
}
