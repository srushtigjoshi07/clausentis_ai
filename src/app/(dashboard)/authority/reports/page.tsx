import { getAllStructuredReports, type StructuredReportItem } from '@/lib/actions/reports';
import { getAllBidderDossiers } from '@/lib/compliance/repository';
import { ExportAuditPdfButton } from '@/components/audit/ExportAuditPdfButton';
import { EmptyState, Legend, PageBody, PageHeader } from '@/components/v2/ui';

export const metadata = { title: 'Reports · Clausentis officer portal' };
export const dynamic = 'force-dynamic';

const PLAIN_TITLES: Record<StructuredReportItem['type'], string> = {
  TENDER_COMPLIANCE_SUMMARY: 'Tender compliance summary',
  BID_COMPARISON: 'Bid comparison matrix',
  BIDDER_RISK: 'Risk & discrepancy assessment',
  REQUIREMENT_WISE_COMPLIANCE: 'Requirement-wise compliance matrix',
  STATUTORY_VERIFICATION: 'Portal verification report',
  DOCUMENT_VERIFICATION: 'Document & evidence integrity',
  EVALUATION_SUMMARY: 'Evaluation committee summary',
  AUDIT_REPORT: 'Audit ledger',
};

/** Report types the server PDF route renders as the multi-bidder matrix for a tender. */
const MATRIX_TYPES = new Set<StructuredReportItem['type']>(['TENDER_COMPLIANCE_SUMMARY', 'BID_COMPARISON', 'REQUIREMENT_WISE_COMPLIANCE']);

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ tenderId?: string }> }) {
  const { tenderId: requested } = await searchParams;
  const all = getAllBidderDossiers();
  const tenders = Array.from(new Map(all.map((d) => [d.tenderId, d.tenderReference])).entries());
  const tenderId = requested && tenders.some(([id]) => id === requested) ? requested : tenders[0]?.[0];
  const dossiers = all.filter((d) => d.tenderId === tenderId);
  const reports = tenderId ? await getAllStructuredReports(tenderId) : [];
  const ref = dossiers[0]?.tenderReference ?? '';
  const title = dossiers[0]?.tenderTitle ?? '';
  const mandatoryTotal = Math.max(0, ...dossiers.map((d) => d.mandatoryTotal));

  return (
    <PageBody>
      <PageHeader
        eyebrow="Reports"
        title="Committee-ready exports"
        actions={
          tenders.length > 0 ? (
            <form method="get" className="flex items-center gap-2">
              <label htmlFor="r-tender" className="sr-only-v2">Tender</label>
              <select id="r-tender" name="tenderId" defaultValue={tenderId} className="input w-[260px]">
                {tenders.map(([id, r]) => (
                  <option key={id} value={id}>{r}</option>
                ))}
              </select>
              <button type="submit" className="btn btn-secondary">Show</button>
            </form>
          ) : null
        }
      />

      {!tenderId || reports.length === 0 ? (
        <EmptyState title="No reports yet">Reports are generated once a tender has evaluated bids.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section aria-label="Report types" className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {reports.map((r, i) => (
              <article key={r.id} className="card flex flex-col gap-2.5 p-4">
                <span className="flex items-center justify-between">
                  <span className="mono text-[11px] text-fg-3">R{i + 1} · {r.recordCount} record{r.recordCount === 1 ? '' : 's'}</span>
                  <span className="pill pill-neutral">PDF</span>
                </span>
                <h2 className="m-0 text-sm font-semibold">{PLAIN_TITLES[r.type] ?? r.title}</h2>
                <p className="m-0 text-xs leading-relaxed text-fg-2">{r.description}</p>
                <span className="text-[11px] text-fg-3">Generated {r.generatedAt}</span>
                <span className="mt-auto flex flex-wrap gap-2">
                  {MATRIX_TYPES.has(r.type) ? (
                    <a href={`/api/pdf/download?type=matched-requirements&tenderId=${encodeURIComponent(tenderId)}`} className="btn btn-primary btn-sm" download>
                      Download PDF
                    </a>
                  ) : (
                    <ExportAuditPdfButton
                      tenderId={tenderId}
                      tenderRef={ref}
                      tenderTitle={title}
                      label={r.type === 'AUDIT_REPORT' ? 'Download PDF' : 'Download as audit PDF'}
                      variant="default"
                    />
                  )}
                </span>
              </article>
            ))}
          </section>

          <aside className="card flex flex-col gap-3.5 p-[18px]" aria-label="Mandatory clauses met per bid">
            <span className="eyebrow">Preview · Tender compliance summary</span>
            <h2 className="h2">Mandatory clauses met, per bid</h2>
            <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
              {dossiers.map((d) => {
                const gap = Math.max(0, d.mandatoryTotal - d.mandatoryPassed);
                return (
                  <li key={d.bidId} className="flex flex-col gap-1.5">
                    <span className="flex justify-between text-xs">
                      <span className="font-semibold">{d.shortName || d.bidderName}</span>
                      <span className="mono">{d.mandatoryPassed} / {d.mandatoryTotal}</span>
                    </span>
                    <span className="flex h-3 gap-0.5" role="img" aria-label={`${d.bidderName}: ${d.mandatoryPassed} of ${d.mandatoryTotal} mandatory clauses met`}>
                      {d.mandatoryPassed > 0 ? <span className="block h-3 bg-mark" title={`${d.mandatoryPassed} met`} style={{ flex: `${d.mandatoryPassed} 1 0` }} /> : null}
                      {gap > 0 ? <span className="block h-3 rounded-r bg-line" title={`${gap} not met`} style={{ flex: `${gap} 1 0` }} /> : null}
                    </span>
                  </li>
                );
              })}
            </ul>
            <Legend items={[{ label: 'Met', swatch: 'ink' }, { label: 'Not met', swatch: 'track' }]} />
            <span className="border-t border-line-3 pt-3 text-xs text-fg-2">
              {mandatoryTotal} mandatory clauses per bid. Every report carries source citations and the decision hash; AI recommendations are marked advisory.
            </span>
          </aside>
        </div>
      )}
    </PageBody>
  );
}
