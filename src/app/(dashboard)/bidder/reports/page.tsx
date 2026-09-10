import React from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  FileText,
  Search,
  Inbox
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllTenders } from '@/lib/actions/tenders';

export const metadata = {
  title: 'Reports - Clausentis Bidder Portal',
  description: 'Bid readiness reports, evaluation dossiers, and documentary compliance analysis.',
};

export const dynamic = 'force-dynamic';

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(dateStr));
  } catch {
    return 'Recent';
  }
}

export default async function BidderReportsPage() {
  let analyzedTenders: Awaited<ReturnType<typeof getAllTenders>> = [];
  try {
    const tenders = await getAllTenders();
    analyzedTenders = (tenders || []).filter(t => t.status === 'analyzed');
  } catch (err) {
    console.warn('[BidderReports] Failed to query tenders:', err);
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 font-sans bg-white">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] pb-6 pt-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E5E5]">
            INTELLIGENCE DOSSIERS
          </span>
          <span className="text-[#777777] text-xs">&bull;</span>
          <span className="text-[#555555] text-xs font-mono">Apex Heavy Engineering Pvt Ltd</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111] mt-1">
          Bid Readiness &amp; Compliance Reports
        </h1>
        <p className="text-xs sm:text-sm text-[#555555] mt-1">
          Audit-ready intelligence summaries, clause eligibility matrixes, and verifiable citations.
        </p>
      </div>

      {/* Reports Data Table */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#E5E5E5] flex items-center justify-between bg-[#F7F7F7]">
          <h3 className="text-xs font-medium uppercase tracking-wider text-[#555555] font-mono">
            Analyzed Evaluation Dossiers
          </h3>
          <span className="text-xs font-mono text-[#777777]">{analyzedTenders.length} Ready</span>
        </div>

        {analyzedTenders.length === 0 ? (
          <div className="p-14 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-xl bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center text-[#555555] mb-4">
              <BarChart3 className="h-6 w-6 stroke-[1.5]" />
            </div>
            <h3 className="font-semibold text-base text-[#111111]">No reports generated yet</h3>
            <p className="text-xs sm:text-sm text-[#555555] mt-1.5 mb-6 max-w-sm leading-relaxed">
              Analyze a tender RFP or run eligibility verification to generate structured compliance matrixes and bid readiness reports.
            </p>
            <Link href="/bidder/tenders">
              <Button size="sm" className="bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs px-5 h-9 gap-2">
                <Search className="w-3.5 h-3.5" />
                Find Tenders to Analyze <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-[#555555] uppercase tracking-wider bg-[#F7F7F7] border-b border-[#E5E5E5] font-mono">
                <tr>
                  <th className="px-5 py-3 font-medium">Tender Title</th>
                  <th className="px-5 py-3 font-medium">Readiness Score</th>
                  <th className="px-5 py-3 font-medium">Risk Level</th>
                  <th className="px-5 py-3 font-medium">Date Analyzed</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5] text-xs">
                {analyzedTenders.map((tender) => {
                  const score = tender.compliance_score;
                  const hasScore = score !== null && score !== undefined;
                  const riskLevel = tender.risk_level || 'low';
                  const isHighRisk = riskLevel === 'critical' || riskLevel === 'high';

                  return (
                    <tr key={tender.id} className="hover:bg-[#F7F7F7] transition-colors group">
                      <td className="px-5 py-4 max-w-md">
                        <Link href={`/reports/${tender.id}`} className="text-xs text-[#111111] group-hover:underline font-medium block truncate">
                          {tender.title}
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        {hasScore ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold text-[#111111]">{score}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#777777]">&mdash;</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {isHighRisk ? (
                          <span className="inline-flex items-center text-[10px] font-medium text-[#111111] gap-1 uppercase tracking-wider font-mono bg-[#F5F5F5] border border-[#E5E5E5] px-2 py-0.5 rounded">
                            <AlertTriangle className="h-3 w-3 stroke-[1.5]" /> {riskLevel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-medium text-[#555555] gap-1 uppercase tracking-wider font-mono bg-[#F5F5F5] border border-[#E5E5E5] px-2 py-0.5 rounded">
                            <CheckCircle2 className="h-3 w-3 stroke-[1.5]" /> {riskLevel}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#777777] font-mono">
                        {formatDate(tender.updated_at)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/reports/${tender.id}`}>
                          <Button size="sm" variant="outline" className="text-xs border-[#E5E5E5] text-[#111111] hover:bg-[#F5F5F5] h-7 px-3 gap-1">
                            Open Report <ArrowRight className="h-3 w-3 stroke-[1.5]" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
