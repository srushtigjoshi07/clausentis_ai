import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllBidderDossiers } from '@/lib/compliance/repository';
import { clauseUnion, findPortalTender, outcomeOf, resultFor, shortValue, summarizeDossier } from '@/lib/views/officer';
import { CategoryChip, EmptyState, PageBody, RawPill, cx } from '@/components/v2/ui';
import { ClauseHeatmap, StackedStatusBar } from '@/components/v2/charts';
import { aiAdviceLabel, decisionLabel, formatDate, riskLabel, riskPill, toCrore } from '@/components/v2/status';

export const dynamic = 'force-dynamic';

type Tab = 'bids' | 'clauses' | 'documents';

export default async function TenderWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const tab: Tab = rawTab === 'clauses' || rawTab === 'documents' ? rawTab : 'bids';

  const tender = await findPortalTender(id);
  const dossiers = getAllBidderDossiers(tender?.id ?? id);
  if (!tender && dossiers.length === 0) notFound();

  const bids = dossiers.map(summarizeDossier);
  const clauses = clauseUnion(dossiers);
  const reference = tender?.reference ?? dossiers[0]?.tenderReference ?? id;
  const title = tender?.title ?? dossiers[0]?.tenderTitle ?? 'Tender';
  const valueCr = toCrore(tender?.estimatedValue);
  const tenderId = tender?.id ?? id;

  const tabHref = (t: Tab) => `/authority/tenders/${encodeURIComponent(tenderId)}${t === 'bids' ? '' : `?tab=${t}`}`;
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'bids', label: `Bids (${bids.length})` },
    { id: 'clauses', label: `Clauses (${clauses.length})` },
    { id: 'documents', label: `Tender documents (${tender?.documents.length ?? 0})` },
  ];

  return (
    <PageBody>
      <header className="flex flex-col gap-2.5">
        <Link href="/authority/tenders" className="self-start text-xs text-fg-2 hover:text-brand hover:underline">← Tenders</Link>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex max-w-[760px] flex-col gap-1.5">
            <span className="mono text-xs text-fg-2">
              {[reference, tender?.category, valueCr !== null ? `₹${valueCr.toFixed(2)} Cr` : tender?.estimatedValue].filter(Boolean).join(' · ')}
            </span>
            <h1 className="h1" style={{ fontSize: 28 }}>{title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/authority/reports?tenderId=${encodeURIComponent(tenderId)}`} className="btn btn-secondary">Evaluation report</Link>
            {bids.length ? (
              <a href={`/api/pdf/download?type=matched-requirements&tenderId=${encodeURIComponent(tenderId)}`} className="btn btn-secondary" download>
                Comparison matrix PDF
              </a>
            ) : null}
            {tender?.closingDate ? (
              <span className="pill pill-ink" style={{ minHeight: 40, padding: '0 14px' }}>
                Closes {formatDate(tender.closingDate, { day: 'numeric', month: 'short' })}
                {tender.closingTime ? ` · ${tender.closingTime}` : ''}
              </span>
            ) : null}
          </div>
        </div>
        <nav aria-label="Tender sections" className="flex gap-6 overflow-x-auto border-b border-line">
          {tabs.map((t) => (
            <Link key={t.id} href={tabHref(t.id)} className={cx('tab whitespace-nowrap', tab === t.id && 'tab-on')} aria-current={tab === t.id ? 'page' : undefined}>
              {t.label}
            </Link>
          ))}
        </nav>
      </header>

      {tab === 'bids' ? (
        bids.length === 0 ? (
          <EmptyState title="No bids yet">Bids appear here as soon as bidders seal and submit them.</EmptyState>
        ) : (
          <>
            <section aria-label="Bids" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {bids.map((b) => (
                <Link key={b.bidId} href={`/authority/bids/${b.bidId}`} className="card flex flex-col gap-2.5 p-4 text-fg no-underline transition-colors hover:border-mark">
                  <span className="flex items-center justify-between gap-2">
                    <span className="mono truncate text-[11px] text-fg-3">{b.submissionId}</span>
                    <RawPill cls={riskPill(b.risk)}>{riskLabel(b.risk)}</RawPill>
                  </span>
                  <span className="text-sm font-semibold">{b.bidderName}</span>
                  <span className="flex items-baseline gap-1">
                    <span className="font-display text-[30px] font-semibold">{b.score}</span>
                    <span className="text-xs text-fg-3">/ 100 · {b.mandatoryPassed}/{b.mandatoryTotal} mandatory</span>
                  </span>
                  <StackedStatusBar counts={b.counts} label={`${b.bidderName} clause outcomes`} height={8} />
                  <span className="flex justify-between gap-2 border-t border-line-3 pt-2.5 text-xs">
                    <span className="text-fg-2">AI: {aiAdviceLabel(b.aiRecommendation)}</span>
                    <span className="font-semibold">{b.decision ? `${decisionLabel(b.decision.code)} · signed` : 'Awaiting you'}</span>
                  </span>
                </Link>
              ))}
            </section>

            <section aria-label="Clause comparison" className="card flex flex-col gap-3.5 p-5">
              <div className="flex flex-col gap-1">
                <h2 className="h2">Clause-by-clause comparison</h2>
                <span className="text-xs text-fg-3">What the engine found in each bid, against each tender clause</span>
              </div>
              <ClauseHeatmap
                caption={`Clause outcomes for each bid on ${reference}`}
                columns={dossiers.map((d) => ({ key: d.bidId, label: d.shortName || d.bidderName, href: `/authority/bids/${d.bidId}` }))}
                rows={clauses.map((c) => ({
                  key: c.key,
                  code: c.code,
                  label: c.title,
                  cells: dossiers.map((d) => {
                    const r = resultFor(d, c.key);
                    return { outcome: outcomeOf(r), value: shortValue(r) };
                  }),
                }))}
              />
            </section>
          </>
        )
      ) : null}

      {tab === 'clauses' ? (
        <section aria-label="Tender clauses" className="card overflow-x-auto">
          {clauses.length ? (
            <table className="w-full min-w-[640px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line bg-page text-left">
                  <th scope="col" className="th px-5 py-2.5">Clause</th>
                  <th scope="col" className="th px-3 py-2.5">Requirement</th>
                  <th scope="col" className="th px-3 py-2.5">Category</th>
                  <th scope="col" className="th px-5 py-2.5">Mandatory</th>
                </tr>
              </thead>
              <tbody>
                {clauses.map((c) => (
                  <tr key={c.key} className="tr">
                    <td className="mono px-5 py-2.5 text-fg-2">{c.code}</td>
                    <td className="px-3 py-2.5 font-semibold">{c.title}</td>
                    <td className="px-3 py-2.5"><CategoryChip category={c.category} /></td>
                    <td className="px-5 py-2.5">{c.mandatory ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-5">
              <EmptyState title="No evaluated clauses yet">
                {tender?.minimumTurnover != null || tender?.minimumExperience != null
                  ? `Thresholds on record: turnover ≥ ₹${tender?.minimumTurnover ?? '—'} Cr, experience ≥ ${tender?.minimumExperience ?? '—'} years. Clause results appear once bids are evaluated.`
                  : 'Clause results appear once bids are evaluated.'}
              </EmptyState>
            </div>
          )}
        </section>
      ) : null}

      {tab === 'documents' ? (
        <section aria-label="Tender documents" className="card overflow-hidden">
          {tender?.documents.length ? (
            <ul className="m-0 list-none p-0">
              {tender.documents.map((d) => (
                <li key={d.id} className="tr flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-semibold">{d.title}</span>
                    <span className="mono text-[11px] text-fg-3">{d.fileName} · {(d.fileSizeBytes / 1_048_576).toFixed(2)} MB</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="pill pill-neutral">{d.documentType}</span>
                    {d.isMandatory ? <span className="pill pill-ink">Mandatory</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5">
              <EmptyState title="No tender documents on record" />
            </div>
          )}
        </section>
      ) : null}
    </PageBody>
  );
}
