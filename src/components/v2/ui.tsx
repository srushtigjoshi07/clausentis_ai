import Link from 'next/link';
import type { ReactNode } from 'react';
import { categoryClass, OUTCOME_LABEL, OUTCOME_PILL, type Outcome } from './status';

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-md bg-mark shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size * 0.57} height={size * 0.57} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l8 4v5c0 4.5-3.2 8.2-8 9-4.8-.8-8-4.5-8-9V7l8-4z" />
        <path d="M8.5 12l2.5 2.5 4.5-5" />
      </svg>
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cx('font-display text-[15px] font-bold tracking-[.06em]', className)}>CLAUSENTIS</span>
  );
}

export function Card({
  as: Tag = 'section',
  className,
  children,
  label,
  ...rest
}: {
  as?: 'section' | 'div' | 'article' | 'aside';
  className?: string;
  children: ReactNode;
  label?: string;
} & Record<string, unknown>) {
  return (
    <Tag className={cx('card', className)} aria-label={label} {...rest}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, sub, right, className }: { title: ReactNode; sub?: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="flex flex-col gap-1 min-w-0">
        <h2 className="h2">{title}</h2>
        {sub ? <span className="text-xs text-fg-3">{sub}</span> : null}
      </div>
      {right ? <div className="flex flex-wrap items-center gap-3">{right}</div> : null}
    </div>
  );
}

export function StatusPill({ outcome, label, className }: { outcome: Outcome; label?: string; className?: string }) {
  return <span className={cx('pill', OUTCOME_PILL[outcome], className)}>{label ?? OUTCOME_LABEL[outcome]}</span>;
}

export function Pill({ tone = 'neutral', children, className, title }: { tone?: 'pass' | 'review' | 'fail' | 'neutral' | 'critical' | 'ink'; children: ReactNode; className?: string; title?: string }) {
  return (
    <span className={cx('pill', `pill-${tone}`, className)} title={title}>
      {children}
    </span>
  );
}

export function RawPill({ cls, children, className }: { cls: string; children: ReactNode; className?: string }) {
  return <span className={cx('pill', cls, className)}>{children}</span>;
}

export function CategoryChip({ category, className }: { category: string; className?: string }) {
  return <span className={cx('cat', categoryClass(category), className)}>{category || 'Other'}</span>;
}

export function SandboxBadge({ label = 'Sandbox data', href = '/authority/integrations', tone = 'neutral' }: { label?: string; href?: string | null; tone?: 'neutral' | 'review' }) {
  const cls = cx('pill', tone === 'review' ? 'pill-review' : 'pill-neutral');
  if (!href) return <span className={cls}>{label}</span>;
  return (
    <Link href={href} className={cls} title="Registry results come from bundled synthetic records, not live government APIs">
      {label}
    </Link>
  );
}

const TILE_ICONS: Record<string, ReactNode> = {
  doc: (<><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5" /><path d="M10 13h6M10 17h6" /></>),
  inbox: (<><path d="M4 13l2-8h12l2 8" /><path d="M4 13v6h16v-6h-5l-1 2h-4l-1-2z" /></>),
  clock: (<><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>),
  alert: (<><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17v.5" /></>),
  send: (<><path d="M4 12l16-8-6 16-2-6z" /><path d="M12 14l8-10" /></>),
  check: (<><circle cx="12" cy="12" r="8" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>),
  search: (<><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></>),
  calendar: (<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>),
  folder: (<><path d="M3 7h6l2 2h10v10H3z" /></>),
};

export function KpiTile({
  label,
  value,
  unit,
  note,
  icon = 'doc',
  tone = 'blue',
  badge,
}: {
  label: string;
  value: ReactNode;
  unit?: ReactNode;
  note?: ReactNode;
  icon?: keyof typeof TILE_ICONS | string;
  tone?: 'blue' | 'violet' | 'amber' | 'red' | 'teal' | 'green';
  badge?: ReactNode;
}) {
  return (
    <div className="card flex items-start gap-3.5 px-[18px] py-4">
      <span className={cx('tile', `tile-${tone}`)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {TILE_ICONS[icon] ?? TILE_ICONS.doc}
        </svg>
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-[13px] text-fg-2">{label}</span>
        <span className="flex flex-wrap items-center gap-2.5">
          <span className="font-display text-[26px] font-semibold leading-[1.1]">
            {value}
            {unit ? <span className="ml-1 text-sm font-normal text-fg-3">{unit}</span> : null}
          </span>
          {badge}
        </span>
        {note ? <span className="text-xs text-fg-3">{note}</span> : null}
      </span>
    </div>
  );
}

export function SummaryBand({ eyebrow, title, sub, actions }: { eyebrow: ReactNode; title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-5 rounded-[14px] bg-band px-7 py-6 text-white md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-2">
        <span className="eyebrow" style={{ color: '#BFDBFE' }}>{eyebrow}</span>
        <h1 className="h1" style={{ color: '#FFFFFF' }}>{title}</h1>
        {sub ? <span className="text-sm" style={{ color: '#DBEAFE' }}>{sub}</span> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function PageHeader({
  eyebrow,
  title,
  back,
  actions,
  sub,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-2">
      {back ? (
        <Link href={back.href} className="self-start text-xs text-fg-2 hover:text-brand hover:underline">
          ← {back.label}
        </Link>
      ) : null}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          <h1 className="h1">{title}</h1>
          {sub ? <p className="sub max-w-3xl">{sub}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export type LegendItem = { label: ReactNode; swatch: 'pass' | 'review' | 'fail' | 'missing' | 'ink' | 'track' | 'line' | 'line-red' | 'ring' };

export function Legend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <ul className={cx('m-0 flex list-none flex-wrap gap-3 p-0 text-[11px] text-fg-2', className)} aria-label="Legend">
      {items.map((it, i) => (
        <li key={i} className="inline-flex items-center gap-1.5">
          {it.swatch === 'line' || it.swatch === 'line-red' ? (
            <span className="inline-block h-3 w-0.5" style={{ background: it.swatch === 'line' ? '#0F172A' : '#B91C1C' }} aria-hidden="true" />
          ) : it.swatch === 'ring' ? (
            <span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-fg bg-white" aria-hidden="true" />
          ) : (
            <span className={cx('swatch', `sw-${it.swatch}`)} aria-hidden="true" />
          )}
          {it.label}
        </li>
      ))}
    </ul>
  );
}

export const STATUS_LEGEND: LegendItem[] = [
  { label: 'Pass', swatch: 'pass' },
  { label: 'Review', swatch: 'review' },
  { label: 'Fail', swatch: 'fail' },
  { label: 'Missing', swatch: 'missing' },
];

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="panel flex flex-col items-start gap-2 p-5">
      <span className="text-sm font-semibold text-fg">{title}</span>
      {children ? <span className="text-[13px] leading-relaxed text-fg-2">{children}</span> : null}
      {action}
    </div>
  );
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('mx-auto flex w-full max-w-[1200px] flex-col gap-5 md:gap-6', className)}>{children}</div>;
}

export function DefinitionGrid({ rows, className }: { rows: Array<[ReactNode, ReactNode]>; className?: string }) {
  return (
    <dl className={cx('m-0 grid grid-cols-[minmax(110px,150px)_minmax(0,1fr)] gap-x-4 gap-y-3 text-[13px]', className)}>
      {rows.map(([k, v], i) => (
        <div key={i} className="contents">
          <dt className="text-fg-3">{k}</dt>
          <dd className="m-0 min-w-0 break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
