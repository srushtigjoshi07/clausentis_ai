import { getAllTenders } from '@/lib/actions/tenders';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';

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

export default async function ReportsPage() {
  const tenders = await getAllTenders();
  const analyzedTenders = tenders.filter(t => t.status === 'analyzed');

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-[#E5E5E5] pb-6 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#777777]">
              INTELLIGENCE REPORTS
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-[#111111]">Compliance & Bid Reports</h1>
          <p className="text-sm text-[#555555] mt-1">
            Audit-ready intelligence summaries, readiness breakdowns, and verifiable citations.
          </p>
        </div>
      </div>

      {/* Reports Data Table */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white overflow-hidden">
        <div className="p-4 border-b border-[#E5E5E5] flex items-center justify-between bg-[#F7F7F7]">
          <h3 className="text-xs sm:text-sm font-medium uppercase tracking-wider text-[#555555] font-mono">
            Analyzed Tenders & Evaluation Dossiers
          </h3>
          <span className="text-xs text-[#777777]">{analyzedTenders.length} Ready</span>
        </div>

        {analyzedTenders.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-2xl bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center text-[#555555] mb-4">
              <BarChart3 className="h-6 w-6 stroke-[1.5]" />
            </div>
            <h3 className="font-medium text-base text-[#111111]">No reports generated yet</h3>
            <p className="text-sm text-[#555555] mt-1.5 mb-6 max-w-sm leading-relaxed">
              Analyze a tender RFP to generate structured compliance matrixes and bid readiness reports.
            </p>
            <Link href="/tenders">
              <Button size="sm" className="bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm px-6 h-9">
                Analyze a Tender &rarr;
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-[#555555] uppercase tracking-wider bg-[#F7F7F7] border-b border-[#E5E5E5] font-mono">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Tender Title</th>
                  <th className="px-6 py-3.5 font-medium">Readiness Score</th>
                  <th className="px-6 py-3.5 font-medium">Risk Level</th>
                  <th className="px-6 py-3.5 font-medium">Date Analyzed</th>
                  <th className="px-6 py-3.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {analyzedTenders.map((tender) => {
                  const score = tender.compliance_score;
                  const hasScore = score !== null && score !== undefined;
                  const riskLevel = tender.risk_level || 'low';
                  const isHighRisk = riskLevel === 'critical' || riskLevel === 'high';

                  return (
                    <tr key={tender.id} className="hover:bg-[#F7F7F7] transition-colors group">
                      <td className="px-6 py-4">
                        <Link href={`/reports/${tender.id}`} className="text-[13px] text-[#111111] group-hover:underline font-medium flex items-center gap-2 max-w-md truncate">
                          {tender.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {hasScore ? (
                          <div className="flex items-center gap-2.5">
                            <div className="w-16 h-1.5 rounded-full bg-[#E5E5E5] overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-[#111111]"
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-medium text-[#111111]">{score} / 100</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#777777]">&mdash;</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isHighRisk ? (
                          <span className="inline-flex items-center text-xs font-medium text-[#111111] gap-1.5 uppercase tracking-wider font-mono bg-[#F5F5F5] border border-[#E5E5E5] px-2 py-0.5 rounded">
                            <AlertTriangle className="h-3.5 w-3.5 stroke-[1.5]" /> {riskLevel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium text-[#555555] gap-1.5 uppercase tracking-wider font-mono bg-[#F5F5F5] border border-[#E5E5E5] px-2 py-0.5 rounded">
                            <CheckCircle2 className="h-3.5 w-3.5 stroke-[1.5]" /> {riskLevel}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#777777] font-mono">
                        {formatDate(tender.updated_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/reports/${tender.id}`}>
                            <Button size="sm" className="bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm h-8 px-4 gap-1.5">
                              Open Report <ArrowRight className="h-3 w-3 stroke-[1.5]" />
                            </Button>
                          </Link>
                        </div>
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