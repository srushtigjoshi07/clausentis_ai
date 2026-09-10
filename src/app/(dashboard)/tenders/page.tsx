import { getAllTenders } from '@/lib/actions/tenders';
import { Button } from '@/components/ui/button';
import { Plus, ShieldCheck, Search } from 'lucide-react';
import Link from 'next/link';
import { TendersTable } from '@/components/tenders/tenders-table';

export default async function TendersPage() {
  const tenders = await getAllTenders();

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto h-full pb-12 font-sans">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6 border-b border-[#E5E5E5] pb-7 pt-2">
        <div className="space-y-2 max-w-2xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#111111] stroke-[1.5]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777]">
              PROCUREMENT INVENTORY
            </span>
          </div>

          {/* Page Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#111111]">
            Tenders & RFPs
          </h1>

          {/* Page Description */}
          <p className="text-sm sm:text-base text-[#555555] leading-relaxed max-w-xl">
            Manage and track your compliance analyses across all bidding opportunities.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 w-full sm:w-auto pb-1">
          <Link href="/tenders/discover" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto h-11 px-5 border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] text-[#111111] font-medium text-xs sm:text-sm tracking-wide gap-2 transition-colors">
              <Search className="h-4 w-4 stroke-[1.5]" />
              Find Active Tenders
            </Button>
          </Link>
          <Link href="/tenders/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto h-11 px-6 bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm tracking-wide gap-2 transition-colors">
              <Plus className="h-4 w-4 stroke-[1.5]" />
              Analyze New Tender
            </Button>
          </Link>
        </div>
      </div>

      {/* Interactive Table */}
      <TendersTable initialTenders={tenders} />

    </div>
  );
}