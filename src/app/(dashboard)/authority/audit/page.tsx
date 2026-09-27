import { createClient } from '@/lib/supabase/server';
import { getAllBidderDossiers } from '@/lib/compliance/repository';
import { EmptyState, PageBody, PageHeader } from '@/components/v2/ui';
import { HBarList } from '@/components/v2/charts';

export const metadata = { title: 'Audit trail · Clausentis officer portal' };
export const dynamic = 'force-dynamic';

type ActorKind = 'engine' | 'officer' | 'bidder';

interface LedgerEvent {
  key: string;
  timestamp: string;
  sortKey: number;
  action: string;
  actor: string;
  role: string;
  details: string;
  bidId: string | null;
  bidLabel: string | null;
  kind: ActorKind;
  source: 'dossier' | 'database';
}

function classify(actor: string, role: string): ActorKind {
  const s = `${actor} ${role}`.toLowerCase();
  if (/bidder|vendor|signatory/.test(s)) return 'bidder';
  if (/engine|system|verifier|gateway|assistant|advisory|automated|clausentis/.test(s)) return 'engine';
  return 'officer';
}

function parseTime(ts: string): number {
  const cleaned = ts.replace(/\s*IST$/, '').replace(',', '');
  const t = Date.parse(cleaned);
  return Number.isNaN(t) ? 0 : t;
}

const KIND_META: Record<ActorKind, { label: string; sub: string; dot: string }> = {
  engine: { label: 'Automated engines', sub: 'Compliance, verifier, advisory', dot: '#94A3B8' },
  officer: { label: 'Tender authority', sub: 'Officers and tender office', dot: '#2563EB' },
  bidder: { label: 'Bidders', sub: 'Authorised signatories', dot: '#0F172A' },
};

export default async function AuditTrailPage({ searchParams }: { searchParams: Promise<{ tenderId?: string; bid?: string; actor?: string }> }) {
  const sp = await searchParams;
  const all = getAllBidderDossiers();
  const tenderIds = Array.from(new Set(all.map((d) => d.tenderId)));
  const tenderId = sp.tenderId && tenderIds.includes(sp.tenderId) ? sp.tenderId : tenderIds[0];
  const dossiers = all.filter((d) => d.tenderId === tenderId);
  const tenderRef = dossiers[0]?.tenderReference ?? '';

  const events: LedgerEvent[] = [];
  for (const d of dossiers) {
    (d.auditEvents || []).forEach((e, i) => {
      events.push({
        key: `${d.bidId}-${i}`,
        timestamp: e.timestamp,
        sortKey: parseTime(e.timestamp),
        action: e.action,
        actor: e.actor,
        role: e.role,
        details: e.details,
        bidId: d.bidId,
        bidLabel: d.shortName || d.bidderName,
        kind: classify(e.actor, e.role),
        source: 'dossier',
      });
    });
  }

  // Persisted events (RLS applies). Not available without a database connection.
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('audit_events')
      .select('id, created_at, event_type, description, metadata')
      .eq('tender_id', tenderId)
      .order('created_at', { ascending: true })
      .limit(200);
    for (const row of data || []) {
      const meta = (row.metadata || {}) as Record<string, unknown>;
      const bidId = typeof meta.bid_id === 'string' ? meta.bid_id : null;
      const d = bidId ? dossiers.find((x) => x.bidId === bidId) : undefined;
      const actor = typeof meta.actor === 'string' ? meta.actor : 'Clausentis user';
      const role = typeof meta.role === 'string' ? meta.role : '';
      const created = String(row.created_at || '');
      events.push({
        key: `db-${row.id}`,
        timestamp: created ? new Date(created).toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST' : '',
        sortKey: Date.parse(created) || 0,
        action: String(row.event_type || 'Event'),
        actor,
        role,
        details: String(row.description || ''),
        bidId,
        bidLabel: d ? d.shortName || d.bidderName : null,
        kind: classify(actor, role),
        source: 'database',
      });
    }
  } catch {
    // no database: dossier ledger only
  }

  const dedupe = (list: LedgerEvent[], keyOf: (e: LedgerEvent) => string) => {
    const seen = new Set<string>();
    return list.filter((e) => {
      const k = keyOf(e);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };
  events.sort((a, b) => a.sortKey - b.sortKey);
  // Per bid: an event written to both stores counts once for that bid.
  const perBidEvents = dedupe(events, (e) => `${e.bidId}|${e.action}|${e.details}`);
  // Tender-wide: tender-level events copied onto every bid collapse to one entry.
  const unique = dedupe(events, (e) => `${e.timestamp}|${e.action}|${e.details}`);

  const byKind = (['engine', 'officer', 'bidder'] as ActorKind[]).map((k) => ({ kind: k, n: unique.filter((e) => e.kind === k).length }));
  const perBid = dossiers.map((d) => ({ d, n: perBidEvents.filter((e) => e.bidId === d.bidId).length })).sort((a, b) => b.n - a.n);
  const maxKind = Math.max(1, ...byKind.map((b) => b.n));
  const maxBid = Math.max(1, ...perBid.map((b) => b.n));

  const bidFilter = sp.bid && dossiers.some((d) => d.bidId === sp.bid) ? sp.bid : '';
  const actorFilter = sp.actor === 'engine' || sp.actor === 'officer' || sp.actor === 'bidder' ? sp.actor : '';
  const visible = (bidFilter ? perBidEvents.filter((e) => e.bidId === bidFilter) : unique).filter((e) => !actorFilter || e.kind === actorFilter);

  return (
    <PageBody>
      <PageHeader
        eyebrow={`Audit trail${tenderRef ? ` · ${tenderRef}` : ''}`}
        title="Every check and decision, in order"
        actions={
          bidFilter ? (
            <a href={`/api/pdf/download?type=audit&bidId=${encodeURIComponent(bidFilter)}`} className="btn btn-secondary" download>
              Export audit ledger PDF
            </a>
          ) : (
            <span className="text-xs text-fg-3">Choose a bid to export its ledger as PDF</span>
          )
        }
      />

      {unique.length === 0 ? (
        <EmptyState title="No audit events yet">Events are recorded as tenders are published, bids are sealed and decisions are signed.</EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section aria-label="Events by actor" className="card flex flex-col gap-3 p-[18px]">
              <div className="flex flex-col gap-1">
                <h2 className="h2">Who acted</h2>
                <span className="text-xs text-fg-3">{unique.length} recorded events on this tender</span>
              </div>
              <HBarList
                ariaLabel="Audit events by actor type"
                max={maxKind}
                items={byKind.map((b) => ({
                  key: b.kind,
                  label: KIND_META[b.kind].label,
                  sub: KIND_META[b.kind].sub,
                  value: b.n,
                  tip: `${KIND_META[b.kind].label}: ${b.n} events`,
                }))}
              />
            </section>
            <section aria-label="Events by bid" className="card flex flex-col gap-3 p-[18px]">
              <div className="flex flex-col gap-1">
                <h2 className="h2">Events per bid</h2>
                <span className="text-xs text-fg-3">Includes tender-level events recorded on each bid</span>
              </div>
              <HBarList
                ariaLabel="Audit events per bid"
                max={maxBid}
                items={perBid.map((b) => ({
                  key: b.d.bidId,
                  label: b.d.shortName || b.d.bidderName,
                  value: b.n,
                  href: `/authority/audit?tenderId=${encodeURIComponent(tenderId)}&bid=${encodeURIComponent(b.d.bidId)}`,
                  tip: `${b.d.bidderName}: ${b.n} events`,
                }))}
              />
            </section>
          </div>

          <form method="get" className="flex flex-wrap items-center gap-2.5" aria-label="Filter events">
            {tenderIds.length > 1 ? (
              <>
                <label htmlFor="a-tender" className="sr-only-v2">Tender</label>
                <select id="a-tender" name="tenderId" defaultValue={tenderId} className="input w-full sm:w-[240px]">
                  {tenderIds.map((t) => (
                    <option key={t} value={t}>{all.find((d) => d.tenderId === t)?.tenderReference ?? t}</option>
                  ))}
                </select>
              </>
            ) : (
              <input type="hidden" name="tenderId" value={tenderId} />
            )}
            <label htmlFor="a-bid" className="sr-only-v2">Bid</label>
            <select id="a-bid" name="bid" defaultValue={bidFilter} className="input w-full sm:w-[240px]">
              <option value="">All bids</option>
              {dossiers.map((d) => (
                <option key={d.bidId} value={d.bidId}>{d.bidderName}</option>
              ))}
            </select>
            <label htmlFor="a-actor" className="sr-only-v2">Actor</label>
            <select id="a-actor" name="actor" defaultValue={actorFilter} className="input w-full sm:w-[190px]">
              <option value="">All actors</option>
              <option value="officer">Officers</option>
              <option value="engine">Engines</option>
              <option value="bidder">Bidders</option>
            </select>
            <button type="submit" className="btn btn-secondary">Apply</button>
            <span className="ml-auto text-xs text-fg-3">{visible.length} events · oldest first</span>
          </form>

          <section aria-label="Event log" className="card overflow-hidden">
            <ol className="m-0 list-none p-0">
              {visible.map((e) => (
                <li key={e.key} className="tr grid grid-cols-1 items-start gap-1 px-5 py-3.5 text-xs md:grid-cols-[170px_20px_minmax(0,1.2fr)_minmax(0,2fr)] md:gap-3.5">
                  <span className="mono text-fg-2">{e.timestamp}</span>
                  <span
                    className="dot mt-1 hidden md:inline-block"
                    aria-hidden="true"
                    style={{ background: KIND_META[e.kind].dot, boxShadow: `0 0 0 2px #FFFFFF, 0 0 0 3px ${KIND_META[e.kind].dot}` }}
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-semibold">{e.action}</span>
                    <span className="text-fg-3">
                      {e.actor}
                      {e.bidLabel ? ` · ${e.bidLabel}` : ''} · {KIND_META[e.kind].label.toLowerCase()}
                    </span>
                  </span>
                  <span className="text-fg-4">{e.details}</span>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </PageBody>
  );
}
