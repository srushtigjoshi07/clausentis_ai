/**
 * v2 chart primitives: plain HTML/SVG, no chart library.
 * Every chart carries an accessible name, direct value labels and, for
 * multi-series marks, a legend. Status is never conveyed by colour alone:
 * segments carry text in their title/aria label and missing is hatched.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cx, Legend, STATUS_LEGEND } from './ui';
import { MISSING_FILL, OUTCOME_FILL, OUTCOME_LABEL, OUTCOMES, type Outcome, type OutcomeCounts } from './status';

/* ───────────────────────── StackedStatusBar ───────────────────────── */

export function StackedStatusBar({
  counts,
  label,
  height = 10,
  className,
  unit = 'clauses',
}: {
  counts: OutcomeCounts;
  label: string;
  height?: number;
  className?: string;
  unit?: string;
}) {
  const total = OUTCOMES.reduce((s, k) => s + counts[k], 0);
  const present = OUTCOMES.filter((k) => counts[k] > 0);
  const summary = present.map((k) => `${counts[k]} ${OUTCOME_LABEL[k].toLowerCase()}`).join(', ');
  if (total === 0) {
    return (
      <span role="img" aria-label={`${label}: no evaluated ${unit}`} className={cx('block rounded-r bg-line', className)} style={{ height }} title="No evaluated clauses" />
    );
  }
  return (
    <span role="img" aria-label={`${label}: ${summary} of ${total} ${unit}`} className={cx('flex gap-0.5', className)} style={{ height }}>
      {present.map((k, i) => (
        <span
          key={k}
          className="mark block"
          title={`${counts[k]} of ${total} ${unit} ${OUTCOME_LABEL[k].toLowerCase()}`}
          style={{
            flex: `${counts[k]} 1 0`,
            height,
            background: k === 'missing' ? MISSING_FILL : OUTCOME_FILL[k],
            border: k === 'missing' ? '1px solid #94A3B8' : undefined,
            boxSizing: 'border-box',
            borderRadius: i === present.length - 1 ? '0 4px 4px 0' : 0,
          }}
        />
      ))}
    </span>
  );
}

export function OutcomeCountLegend({ counts, className }: { counts: OutcomeCounts; className?: string }) {
  return (
    <Legend
      className={cx('grid grid-cols-2 gap-x-3 gap-y-1', className)}
      items={OUTCOMES.map((k) => ({ label: `${counts[k]} ${OUTCOME_LABEL[k].toLowerCase()}`, swatch: k }))}
    />
  );
}

/* ───────────────────────── HBarList ───────────────────────── */

export interface HBarItem {
  key: string;
  label: ReactNode;
  sub?: ReactNode;
  value: number;
  /** Per-row maximum; when set the track length is proportional to it (shared scale). */
  max?: number;
  valueLabel?: ReactNode;
  tip: string;
  href?: string;
  right?: ReactNode;
  fill?: string;
}

export function HBarList({
  items,
  max,
  ariaLabel,
  labelWidth = 150,
  stacked = false,
  className,
}: {
  items: HBarItem[];
  max: number;
  ariaLabel: string;
  labelWidth?: number;
  /** Stacked layout puts the label above the bar (good for narrow cards). */
  stacked?: boolean;
  className?: string;
}) {
  const safeMax = max > 0 ? max : 1;
  return (
    <ul className={cx('m-0 flex list-none flex-col gap-3 p-0', className)} aria-label={ariaLabel}>
      {items.map((it) => {
        const trackPct = it.max !== undefined ? Math.min(100, (it.max / safeMax) * 100) : 100;
        const fillPct = Math.max(0, Math.min(100, (it.value / (it.max ?? safeMax)) * 100));
        const bar = (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="relative block h-3 rounded-r bg-track" style={{ width: `${trackPct}%` }}>
              <span
                className="mark absolute left-0 top-0 block h-3 rounded-r"
                title={it.tip}
                style={{ width: `${fillPct}%`, background: it.fill ?? '#2563EB' }}
              />
            </span>
            <span className="mono shrink-0 text-xs font-semibold">{it.valueLabel ?? it.value}</span>
          </span>
        );
        const labelEl = (
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-semibold">{it.label}</span>
            {it.sub ? <span className="truncate text-[11px] text-fg-3">{it.sub}</span> : null}
          </span>
        );
        const body = stacked ? (
          <span className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between gap-2">
              {labelEl}
              {it.right}
            </span>
            {bar}
          </span>
        ) : (
          <span className="grid items-center gap-3" style={{ gridTemplateColumns: `minmax(0, ${labelWidth}px) minmax(0, 1fr)${it.right ? ' auto' : ''}` }}>
            {labelEl}
            {bar}
            {it.right}
          </span>
        );
        return (
          <li key={it.key}>
            {it.href ? (
              <Link href={it.href} className="block rounded-md text-fg no-underline hover:bg-page">
                {body}
              </Link>
            ) : (
              body
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ───────────────────────── BulletChart ───────────────────────── */

export interface BulletRow {
  key: string;
  label: string;
  sub?: string;
  /** Tender threshold (minimum). */
  threshold: number;
  /** Verified / audited value, or the bidder's profile value. */
  actual: number | null;
  /** Value the bidder declared, if different from the audited evidence. */
  declared?: number | null;
  unit: string;
  note?: string;
}

function fmt(n: number, unit: string) {
  const v = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, '');
  return unit === '%' ? `${v}%` : `${v} ${unit}`.trim();
}

export function BulletChart({
  rows,
  ariaLabel,
  actualLabel = 'Audited',
  thresholdLabel = 'Tender minimum',
  declaredLabel = 'Declared',
  showVerdict = true,
}: {
  rows: BulletRow[];
  ariaLabel: string;
  actualLabel?: string;
  thresholdLabel?: string;
  declaredLabel?: string;
  showVerdict?: boolean;
}) {
  const hasDeclared = rows.some((r) => r.declared !== undefined && r.declared !== null);
  return (
    <div className="flex flex-col gap-3">
      <Legend
        items={[
          { label: thresholdLabel, swatch: 'line' },
          { label: actualLabel, swatch: 'ink' },
          ...(hasDeclared ? [{ label: declaredLabel, swatch: 'ring' as const }] : []),
        ]}
      />
      <ul className="m-0 flex list-none flex-col gap-4 p-0" aria-label={ariaLabel}>
        {rows.map((r) => {
          const scaleMax = Math.max(r.threshold, r.actual ?? 0, r.declared ?? 0) * 1.25 || 1;
          const pct = (v: number) => `${Math.min(100, (v / scaleMax) * 100)}%`;
          const meets = r.actual !== null && r.actual >= r.threshold;
          const tip = `${r.label}: ${r.actual === null ? 'no value' : `${actualLabel.toLowerCase()} ${fmt(r.actual, r.unit)}`}, minimum ${fmt(r.threshold, r.unit)}${
            r.declared != null ? `, ${declaredLabel.toLowerCase()} ${fmt(r.declared, r.unit)}` : ''
          }`;
          return (
            <li key={r.key} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)_minmax(0,170px)] sm:gap-4">
              <span className="flex flex-col">
                <span className="text-[13px] font-semibold">{r.label}</span>
                {r.sub ? <span className="mono text-[10px] uppercase text-fg-3">{r.sub}</span> : null}
              </span>
              <span className="mark relative block h-5 bg-[#F1F5F9]" role="img" aria-label={tip} title={tip}>
                {r.actual !== null ? <span className="absolute left-0 top-0 block h-5 bg-mark" style={{ width: pct(r.actual) }} /> : null}
                <span className="absolute -top-1 block h-7 w-0.5 bg-fg" style={{ left: pct(r.threshold) }} />
                {r.declared != null ? (
                  <span
                    className="absolute top-1/2 block h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-fg bg-white"
                    style={{ left: pct(r.declared) }}
                  />
                ) : null}
              </span>
              <span className="flex items-baseline justify-between gap-3">
                <span className="flex flex-col">
                  <span className="mono text-[11px] font-semibold">
                    {r.actual === null ? 'No value' : fmt(r.actual, r.unit)} vs {fmt(r.threshold, r.unit)}
                  </span>
                  {r.note ? <span className="mono text-[10px] uppercase text-fg-3">{r.note}</span> : null}
                </span>
                {showVerdict ? (
                  <span className="mono text-[11px] font-bold" style={{ color: r.actual === null ? '#475569' : meets ? '#065F46' : '#991B1B' }}>
                    {r.actual === null ? 'UNKNOWN' : meets ? 'MEETS' : 'SHORT'}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ───────────────────────── ClauseHeatmap ───────────────────────── */

export interface HeatmapColumn {
  key: string;
  label: string;
  href?: string;
}
export interface HeatmapRow {
  key: string;
  code: string;
  label: string;
  cells: Array<{ outcome: Outcome | null; value: string }>;
}

const CELL_CLASS: Record<Outcome, string> = {
  pass: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]',
  review: 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]',
  fail: 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]',
  missing: 'border-dashed border-[#94A3B8] text-fg-2',
};

export function ClauseHeatmap({ columns, rows, caption }: { columns: HeatmapColumn[]; rows: HeatmapRow[]; caption: string }) {
  const grid = { gridTemplateColumns: `minmax(180px, 250px) repeat(${columns.length}, minmax(130px, 1fr))` };
  return (
    <div className="flex flex-col gap-3">
      <Legend items={STATUS_LEGEND} />
      <div className="overflow-x-auto">
        <table className="w-full border-separate" style={{ borderSpacing: 6, minWidth: 180 + columns.length * 136 }}>
          <caption className="sr-only-v2">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="th text-left">Clause</th>
              {columns.map((c) => (
                <th key={c.key} scope="col" className="th text-left">
                  {c.href ? <Link href={c.href} className="hover:text-brand hover:underline">{c.label}</Link> : c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row" className="text-left text-xs font-normal">
                  <span className="mono text-fg-3">{r.code}</span> {r.label}
                </th>
                {r.cells.map((c, i) => {
                  const tag = c.outcome ? OUTCOME_LABEL[c.outcome].toUpperCase() : 'N/A';
                  return (
                    <td
                      key={i}
                      title={`${columns[i]?.label} · ${r.code}: ${tag} (${c.value})`}
                      className={cx(
                        'h-[34px] rounded border px-2.5 text-xs',
                        c.outcome ? CELL_CLASS[c.outcome] : 'border-line bg-page text-fg-3'
                      )}
                      style={c.outcome === 'missing' ? { background: 'repeating-linear-gradient(45deg,#FFFFFF 0 4px,#F1F5F9 4px 5px)' } : undefined}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="mono text-[10px] font-bold">{tag}</span>
                        <span className="truncate" style={{ maxWidth: 160 }}>{c.value}</span>
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ───────────────────────── DeadlineTimeline ───────────────────────── */

export interface DeadlineItem {
  key: string;
  label: string;
  meta: string;
  date: string;
  tip: string;
}

function dayOffset(from: Date, date: string): number | null {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / 86_400_000);
}

function shortDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();
}

export function DeadlineTimeline({ items, from, days = 30 }: { items: DeadlineItem[]; from: Date; days?: number }) {
  const W = 400;
  const X0 = 8;
  const X1 = 392;
  const placed = items
    .map((it) => ({ it, off: dayOffset(from, it.date) }))
    .filter((p): p is { it: DeadlineItem; off: number } => p.off !== null && p.off >= 0 && p.off <= days)
    .sort((a, b) => a.off - b.off);
  const rowH = 28;
  const baseY = Math.max(140, 30 + placed.length * rowH + 10);
  const H = baseY + 36;
  const x = (d: number) => X0 + (d / days) * (X1 - X0);
  const ticks = [0, Math.round(days / 3), Math.round((2 * days) / 3), days];
  const label = `Timeline of tender closing dates over the next ${days} days: ${placed.map((p) => p.it.tip).join('; ') || 'none'}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={label} className="block max-w-full">
      <title>{label}</title>
      <line x1={X0} y1={baseY} x2={X1} y2={baseY} stroke="#E2E8F0" />
      <line x1={X0} y1={20} x2={X0} y2={baseY} stroke="#0F172A" />
      {ticks.map((t, i) => {
        const d = new Date(from.getTime() + t * 86_400_000);
        return (
          <text key={t} x={x(t)} y={baseY + 20} className="axis" textAnchor={i === 0 ? 'start' : i === ticks.length - 1 ? 'end' : 'middle'}>
            {shortDate(d)}
          </text>
        );
      })}
      {placed.map((p, i) => {
        const cx = x(p.off);
        const y = 30 + i * rowH;
        const flip = cx > 280;
        const lx = flip ? cx - 10 : cx + 10;
        return (
          <g key={p.it.key} className="mark">
            <title>{p.it.tip}</title>
            <line x1={cx} y1={y} x2={cx} y2={baseY} stroke="#CBD5E1" />
            <circle cx={cx} cy={y} r={5} fill="#2563EB" stroke="#FFFFFF" strokeWidth={2} />
            <text x={lx} y={y - 2} className="clabel" style={{ fontSize: 11, fontWeight: 600 }} textAnchor={flip ? 'end' : 'start'}>
              {p.it.label}
            </text>
            <text x={lx} y={y + 11} className="axis" textAnchor={flip ? 'end' : 'start'}>
              {p.it.meta}
            </text>
          </g>
        );
      })}
      {placed.length === 0 ? (
        <text x={W / 2} y={baseY / 2 + 10} className="clabel" textAnchor="middle" style={{ fill: '#475569' }}>
          No tender closes in the next {days} days
        </text>
      ) : null}
    </svg>
  );
}

/* ───────────────────────── ValidityTimeline ───────────────────────── */

export interface ValidityDoc {
  key: string;
  name: string;
  /** ISO date; null when no expiry is recorded. */
  validUntil: string | null;
  noExpiry?: boolean;
}

export function ValidityTimeline({
  docs,
  closes,
  from,
  days = 181,
}: {
  docs: ValidityDoc[];
  closes: Array<{ key: string; label: string; date: string }>;
  from: Date;
  days?: number;
}) {
  const W = 1000;
  const X0 = 220;
  const X1 = 960;
  const x = (d: number) => X0 + (Math.max(0, Math.min(days, d)) / days) * (X1 - X0);
  const dated = docs.filter((d) => d.validUntil || d.noExpiry);
  const H = 60 + Math.max(1, dated.length) * 36;
  const months: Array<{ label: string; off: number }> = [];
  for (let m = 1; m <= 6; m++) {
    const d = new Date(Date.UTC(from.getFullYear(), from.getMonth() + m, 1));
    const off = dayOffset(from, d.toISOString());
    if (off !== null && off <= days) months.push({ label: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(), off });
  }
  const label = `Document validity against tender closing dates over the next ${Math.round(days / 30)} months. ${
    dated.length ? dated.map((d) => `${d.name}: ${d.noExpiry ? 'no expiry' : `valid until ${d.validUntil}`}`).join('; ') : 'No documents have a recorded expiry date.'
  }`;
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 640 }} role="img" aria-label={label}>
        <title>{label}</title>
        {months.map((m) => (
          <text key={m.label + m.off} x={x(m.off)} y={14} className="axis" textAnchor="middle">
            {m.label}
          </text>
        ))}
        {closes.map((c, i) => {
          const off = dayOffset(from, c.date);
          if (off === null || off < 0 || off > days) return null;
          return (
            <g key={c.key}>
              <title>{`${c.label} closes ${c.date}`}</title>
              <line x1={x(off)} y1={22} x2={x(off)} y2={H - 14} stroke="#CBD5E1" />
              <text x={x(off)} y={H - 2} className="axis" textAnchor="middle">
                {i % 2 ? '' : c.label}
              </text>
            </g>
          );
        })}
        <line x1={X0} y1={22} x2={X0} y2={H - 14} stroke="#0F172A" strokeWidth={1.5} />
        {dated.length === 0 ? (
          <text x={X0 + 12} y={52} className="clabel" style={{ fill: '#475569' }}>
            No expiry dates are recorded for your vault documents yet.
          </text>
        ) : (
          dated.map((d, i) => {
            const y = 36 + i * 36;
            const off = d.noExpiry ? days : dayOffset(from, d.validUntil as string) ?? 0;
            const expiring = !d.noExpiry && off < days;
            const w = x(off) - X0;
            const endLabel = d.noExpiry ? 'No expiry' : `To ${d.validUntil}`;
            return (
              <g key={d.key} className="mark">
                <title>{`${d.name}: ${endLabel}`}</title>
                <text x={0} y={y + 12} className="clabel" style={{ fontWeight: 600 }}>
                  {d.name.length > 30 ? `${d.name.slice(0, 29)}…` : d.name}
                </text>
                <rect x={X0} y={y} width={Math.max(0, expiring ? w : w - 120)} height={16} fill={expiring ? '#F59E0B' : '#2563EB'} />
                <text x={expiring ? X0 + w + 8 : X1 - 110} y={y + 12} className="axis" style={{ fill: '#334155' }}>
                  {endLabel}
                </text>
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}

/* ───────────────────────── ColumnPair ───────────────────────── */

export interface ColumnDatum {
  key: string;
  label: string;
  sub?: string;
  value: number;
  tone: 'ink' | 'muted';
  tip: string;
}

export function ColumnPair({ columns, max = 100, ariaLabel }: { columns: ColumnDatum[]; max?: number; ariaLabel: string }) {
  const W = 460;
  const H = 230;
  const base = 190;
  const top = 30;
  const scale = (v: number) => ((base - top) * Math.min(v, max)) / max;
  const slot = (W - 60) / Math.max(columns.length, 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={ariaLabel} className="block max-w-[520px]">
      <title>{ariaLabel}</title>
      <line x1={40} y1={base} x2={W - 20} y2={base} stroke="#E2E8F0" />
      {[0, max / 2, max].map((t) => (
        <g key={t}>
          {t > 0 ? <line x1={40} y1={base - scale(t)} x2={W - 20} y2={base - scale(t)} stroke="#EEF2F7" /> : null}
          <text x={32} y={base - scale(t) + 4} className="axis" textAnchor="end">
            {t}
          </text>
        </g>
      ))}
      {columns.map((c, i) => {
        const cxm = 40 + slot * i + slot / 2;
        const h = scale(c.value);
        return (
          <g key={c.key} className="mark">
            <title>{c.tip}</title>
            <rect x={cxm - 14} y={base - h} width={28} height={h} rx={4} fill={c.tone === 'ink' ? '#2563EB' : '#94A3B8'} />
            <text x={cxm} y={base - h - 8} className="cvalue" textAnchor="middle">
              {c.value}
            </text>
            <text x={cxm} y={base + 20} className="axis" textAnchor="middle">
              {c.label}
            </text>
            {c.sub ? (
              <text x={cxm} y={base + 34} className="axis" textAnchor="middle">
                {c.sub}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

/* ───────────────────────── ThresholdBars ───────────────────────── */

export function ThresholdBars({
  rows,
  threshold,
  ariaLabel,
}: {
  rows: Array<{ key: string; label: string; value: number; display: string; style: 'solid' | 'outline' }>;
  threshold: { value: number; label: string };
  ariaLabel: string;
}) {
  const max = Math.max(threshold.value, ...rows.map((r) => r.value)) * 1.2 || 1;
  const pct = (v: number) => `${(v / max) * 100}%`;
  return (
    <div role="img" aria-label={ariaLabel} className="relative flex flex-col gap-3 pb-6">
      {rows.map((r) => (
        <div key={r.key} className="grid grid-cols-[minmax(0,130px)_minmax(0,1fr)] items-center gap-3" title={`${r.label}: ${r.display}`}>
          <span className="text-[13px] font-semibold">{r.label}</span>
          <span className="relative flex items-center gap-2">
            <span
              className="block h-4"
              style={{
                width: pct(r.value),
                background: r.style === 'solid' ? '#2563EB' : '#FFFFFF',
                border: r.style === 'outline' ? '1.5px solid #0F172A' : undefined,
                boxSizing: 'border-box',
              }}
            />
            <span className="mono shrink-0 text-[11px] font-semibold">{r.display}</span>
          </span>
        </div>
      ))}
      <span className="pointer-events-none absolute inset-y-0 left-[calc(130px+0.75rem)] right-0" aria-hidden="true">
        <span className="absolute -top-1 bottom-4 w-0.5 bg-fail" style={{ left: pct(threshold.value) }} />
        <span className="mono absolute bottom-0 -translate-x-1/2 text-[10px] font-bold text-[#991B1B]" style={{ left: pct(threshold.value) }}>
          {threshold.label}
        </span>
      </span>
    </div>
  );
}
