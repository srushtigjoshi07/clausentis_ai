import { getDashboardStats, getRecentTenders, getRecentAuditEvents } from '@/lib/actions/tenders';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  ArrowRight, 
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

function formatDate(dateStr: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateStr));
  } catch {
    return 'Recent';
  }
}

export default async function DashboardPage() {
  const [stats, recentTenders, recentEvents] = await Promise.all([
    getDashboardStats(),
    getRecentTenders(6),
    getRecentAuditEvents(5)
  ]);

  const pendingTenders = recentTenders.filter(t => t.status === 'uploaded' || t.status === 'processing');

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* 1. HEADER */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#777777]">
            PROCUREMENT OVERVIEW
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-[#111111]">
          Dashboard
        </h1>
        <p className="text-sm text-[#555555] mt-1.5">
          Procurement compliance overview and recent activity.
        </p>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] transition-colors">
          <span className="text-[11px] uppercase font-mono tracking-wider text-[#777777]">Active Tenders</span>
          <div className="mt-2">
            <span className="text-3xl font-bold text-[#111111] font-mono">{stats?.tendersAnalyzed || 0}</span>
          </div>
        </div>
        <div className="p-5 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] transition-colors">
          <span className="text-[11px] uppercase font-mono tracking-wider text-[#777777]">Pending Review</span>
          <div className="mt-2">
            <span className="text-3xl font-bold text-[#111111] font-mono">{pendingTenders.length}</span>
          </div>
        </div>
        <div className="p-5 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] transition-colors">
          <span className="text-[11px] uppercase font-mono tracking-wider text-[#777777]">Avg. Compliance</span>
          <div className="mt-2">
            <span className="text-3xl font-bold text-[#111111] font-mono">{stats?.averageCompliance || 0}%</span>
          </div>
        </div>
        <div className="p-5 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] transition-colors">
          <span className="text-[11px] uppercase font-mono tracking-wider text-[#777777]">Critical Issues</span>
          <div className="mt-2">
            <span className="text-3xl font-bold text-[#111111] font-mono">{stats?.criticalIssues || 0}</span>
          </div>
        </div>
      </div>

      {/* 3. ACTIVE TENDERS TABLE */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white overflow-hidden">
        <div className="p-5 border-b border-[#E5E5E5] flex justify-between items-center">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#777777] block mb-1">
              REPOSITORY
            </span>
            <h3 className="text-sm sm:text-base font-semibold text-[#111111]">
              Active Tenders &amp; Procurement Records
            </h3>
          </div>
          {recentTenders.length > 0 && (
            <Link href="/tenders" className="text-xs text-[#111111] hover:underline flex items-center gap-1 font-medium">
              View All Tenders <ArrowRight className="h-3.5 w-3.5 stroke-[1.5]" />
            </Link>
          )}
        </div>
        
        {recentTenders.length === 0 ? (
          <div className="p-14 sm:p-20 text-center flex flex-col items-center justify-center">
            <div className="h-12 w-12 rounded-xl bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center mb-4 text-[#555555]">
              <FileText className="h-5 w-5 stroke-[1.5]" />
            </div>
            <h3 className="font-light text-xl text-[#111111] tracking-tight">No tenders analyzed yet</h3>
            <p className="text-sm font-light text-[#555555] mt-1 mb-6 max-w-sm leading-relaxed">
              Upload your first tender or RFP document to begin building your procurement intelligence workspace.
            </p>
            <Link href="/tenders/new">
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
                  <th className="px-6 py-3.5 font-medium">Tender</th>
                  <th className="px-6 py-3.5 font-medium">Status</th>
                  <th className="px-6 py-3.5 font-medium">Requirements</th>
                  <th className="px-6 py-3.5 font-medium">Compliance</th>
                  <th className="px-6 py-3.5 font-medium">Last Updated</th>
                  <th className="px-6 py-3.5 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {recentTenders.map((tender) => {
                  const score = tender.compliance_score;
                  const isAnalyzed = tender.status === 'analyzed';
                  const isProcessing = tender.status === 'processing';
                  const isFailed = tender.status === 'failed';

                  return (
                    <tr key={tender.id} className="hover:bg-[#F7F7F7] transition-colors group">
                      <td className="px-6 py-4">
                        <Link href={`/authority/tenders`} className="text-[13px] text-[#111111] group-hover:underline font-medium flex items-center gap-2 max-w-xs truncate">
                          {tender.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-mono uppercase bg-[#F5F5F5] border border-[#E5E5E5] text-[#111111] font-medium">
                          {isAnalyzed ? '✓ ANALYZED' : isProcessing ? '⏳ PROCESSING' : isFailed ? '✕ FAILED' : '• DRAFT'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#555555] text-xs font-mono">
                        {tender.requirements_count ? `${tender.requirements_count} items` : 'Pending'}
                      </td>
                      <td className="px-6 py-4">
                        {score !== null && score !== undefined ? (
                          <div className="flex items-center gap-2.5">
                            <div className="w-16 h-1.5 rounded-full bg-[#E5E5E5] overflow-hidden">
                              <div 
                                className="h-full rounded-full bg-[#111111]" 
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <span className="text-xs font-mono font-medium text-[#111111]">{score}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#777777]">&mdash;</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-[#777777] font-mono">
                        {formatDate(tender.updated_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/authority/tenders`}>
                          <Button variant="ghost" size="sm" className="text-xs text-[#555555] hover:text-[#111111] hover:bg-[#F5F5F5] font-medium">
                            View &rarr;
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

      {/* 4. RECENT ACTIVITY FEED */}
      {recentEvents && recentEvents.length > 0 && (
        <div className="rounded-xl border border-[#E5E5E5] bg-white p-6">
          <div className="mb-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#777777] block mb-1">
              AUDIT TRAIL
            </span>
            <h3 className="text-sm font-semibold text-[#111111]">
              Recent Activity &amp; Verification Log
            </h3>
          </div>
          <div className="divide-y divide-[#E5E5E5]">
            {recentEvents.map((evt) => (
              <div key={evt.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#555555] shrink-0 stroke-[1.5]" />
                  <span className="text-[#111111] font-medium shrink-0">{evt.event_type || 'System Event'}</span>
                  <span className="text-[#777777] truncate">&bull; {evt.description || 'Action processed'}</span>
                </div>
                <span className="text-xs text-[#777777] shrink-0">{formatDate(evt.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
