'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function BidderErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[BidderPortal] Runtime caught error:', error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto flex min-h-[320px] max-w-md flex-col items-center justify-center gap-3 text-center">
      <h2 className="h2 text-xl">Something went wrong</h2>
      <p className="m-0 text-sm text-fg-2">We couldn&apos;t load this section. Try again, or go back to your home page.</p>
      <div className="flex gap-2">
        <button type="button" onClick={() => reset()} className="btn btn-primary">Try again</button>
        <Link href="/bidder/dashboard" className="btn btn-secondary">Home</Link>
      </div>
    </div>
  );
}
