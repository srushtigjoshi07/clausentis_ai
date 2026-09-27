import { getLiveAdapterIds } from '@/lib/verification/engine';
import type { GovConnectorId } from '@/lib/verification/types';
import { Legend, PageBody, PageHeader, cx } from '@/components/v2/ui';

export const metadata = { title: 'Data sources · Clausentis officer portal' };

type Mode = 'Live' | 'Sandbox' | 'From documents' | 'Not connected';

interface Source {
  name: string;
  usedFor: string;
  connector: GovConnectorId | null;
  fallback: Mode;
}

/** Connectors implemented in src/lib/verification/connectors (sandbox registry in src/data/government). */
const SOURCES: Source[] = [
  { name: 'Udyam Registration', usedFor: 'MSME status, EMD exemption', connector: 'udyam', fallback: 'Sandbox' },
  { name: 'GSTN', usedFor: 'Registration status, return filing', connector: 'gst', fallback: 'Sandbox' },
  { name: 'Income Tax (PAN)', usedFor: 'PAN validity, GSTIN–PAN match', connector: 'pan', fallback: 'Sandbox' },
  { name: 'Income Tax e-filing', usedFor: 'ITR compliance', connector: null, fallback: 'Not connected' },
  { name: 'MCA21', usedFor: 'CIN and company status', connector: 'mca', fallback: 'Sandbox' },
  { name: 'EPFO / ESIC', usedFor: 'Provident fund and employee insurance compliance', connector: 'epfo', fallback: 'Sandbox' },
  { name: 'Startup India (DPIIT)', usedFor: 'Startup relaxations', connector: 'startup_india', fallback: 'Sandbox' },
  { name: 'NSIC', usedFor: 'Single-point registration', connector: 'nsic', fallback: 'Sandbox' },
  { name: 'BIS', usedFor: 'Quality certification', connector: 'bis', fallback: 'Sandbox' },
  { name: 'DigiLocker / EntityLocker', usedFor: 'Issuer-signed documents', connector: 'digilocker', fallback: 'Sandbox' },
  { name: 'Debarment registry (CVC / GeM)', usedFor: 'Blacklisting and suspension', connector: 'blacklisting', fallback: 'Sandbox' },
  { name: 'Make in India local content', usedFor: 'Class-I / II supplier status', connector: null, fallback: 'From documents' },
];

const MODE_PILL: Record<Mode, string> = {
  Live: 'pill-pass',
  Sandbox: 'pill-review',
  'From documents': 'pill-neutral',
  'Not connected': 'pill-fail',
};

type Coverage = 'C' | 'P' | 'G';
const COVERAGE_PILL: Record<Coverage, string> = { C: 'pill-pass', P: 'pill-review', G: 'pill-fail' };
const COVERAGE_LABEL: Record<Coverage, string> = { C: 'Covered', P: 'Partial', G: 'Gap' };

export default function IntegrationsPage() {
  const live = new Set(getLiveAdapterIds());
  const sources = SOURCES.map((s) => ({ ...s, mode: (s.connector && live.has(s.connector) ? 'Live' : s.fallback) as Mode }));

  // SIH26100 capability self-assessment. "Live portal integration" is derived from the engine.
  const coverage: Array<[string, Coverage]> = [
    ['Live portal integration', live.size > 0 ? 'P' : 'G'],
    ['Udyam / MSME', 'C'],
    ['GST & returns', 'C'],
    ['PAN & income tax', 'P'],
    ['Make in India', 'C'],
    ['EPFO / ESIC', 'P'],
    ['Startup, NSIC, OEM', 'P'],
    ['DigiLocker', 'P'],
    ['Debarment', 'C'],
    ['Tender-specific rules', 'C'],
    ['AI gap detection', 'C'],
    ['Score & risk', 'C'],
    ['AI recommendation', 'C'],
    ['Audit record', 'P'],
  ];
  const counts = { C: 0, P: 0, G: 0 } as Record<Coverage, number>;
  coverage.forEach(([, c]) => (counts[c] += 1));

  return (
    <PageBody>
      <PageHeader
        eyebrow="Data sources"
        title="Where each check gets its data"
        sub={
          live.size === 0
            ? "No live government API is connected. Every registry check uses synthetic sandbox records bundled with Clausentis: they show the workflow, and don't prove anything about a real bidder."
            : 'Checks marked sandbox use synthetic registry records bundled with Clausentis; checks marked live call the authorised government API.'
        }
      />

      <section aria-label="Requirement coverage" className="card flex flex-col gap-3.5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="h2">SIH26100 requirement coverage</h2>
            <span className="text-xs text-fg-3">{coverage.length} expected capabilities</span>
          </div>
          <Legend
            items={[
              { label: `Covered ${counts.C}`, swatch: 'pass' },
              { label: `Partial ${counts.P}`, swatch: 'review' },
              { label: `Gap ${counts.G}`, swatch: 'fail' },
            ]}
          />
        </div>
        <span className="flex h-4 gap-0.5" role="img" aria-label={`${counts.C} covered, ${counts.P} partial, ${counts.G} gaps of ${coverage.length}`}>
          {(['C', 'P', 'G'] as Coverage[])
            .filter((k) => counts[k] > 0)
            .map((k, i, arr) => (
              <span
                key={k}
                title={`${COVERAGE_LABEL[k]}: ${counts[k]} of ${coverage.length}`}
                className="block h-4"
                style={{ flex: `${counts[k]} 1 0`, background: k === 'C' ? '#047857' : k === 'P' ? '#F59E0B' : '#B91C1C', borderRadius: i === arr.length - 1 ? '0 4px 4px 0' : 0 }}
              />
            ))}
        </span>
        <ul className="m-0 grid list-none grid-cols-2 gap-1.5 p-0 sm:grid-cols-4 xl:grid-cols-7">
          {coverage.map(([t, c], i) => (
            <li
              key={t}
              className={cx('pill', COVERAGE_PILL[c])}
              title={`${t}: ${COVERAGE_LABEL[c]}`}
              style={{ minHeight: 44, padding: '6px 8px', whiteSpace: 'normal', textTransform: 'none', letterSpacing: 0, lineHeight: 1.3, fontWeight: 600 }}
            >
              <span className="mono text-[10px]">{i + 1}</span> {t}
              <span className="sr-only-v2"> ({COVERAGE_LABEL[c]})</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Sources" className="card overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-xs">
          <thead>
            <tr className="border-b border-line bg-page text-left">
              <th scope="col" className="th px-5 py-2.5">Source</th>
              <th scope="col" className="th px-3 py-2.5">Used for</th>
              <th scope="col" className="th px-5 py-2.5">Current mode</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((s) => (
              <tr key={s.name} className="tr">
                <td className="px-5 py-3 text-[13px] font-semibold">{s.name}</td>
                <td className="px-3 py-3 text-fg-2">{s.usedFor}</td>
                <td className="px-5 py-3"><span className={cx('pill', MODE_PILL[s.mode])}>{s.mode}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="m-0 text-xs text-fg-3">
        Connecting a live source needs an authorised API agreement; once a connector calls the real API it is listed as Live here automatically.
      </p>
    </PageBody>
  );
}
