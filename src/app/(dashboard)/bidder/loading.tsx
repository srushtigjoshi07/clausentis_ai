import { Loader2 } from 'lucide-react';

export default function BidderLoading() {
  return (
    <div role="status" className="flex min-h-[300px] w-full items-center justify-center gap-2.5 text-sm text-fg-2">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>Loading…</span>
    </div>
  );
}
