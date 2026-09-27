import Link from 'next/link';
import { Check } from 'lucide-react';
import { getAllBidderDossiers } from '@/lib/compliance/repository';
import { BrandMark, Legend, RawPill, STATUS_LEGEND } from '@/components/v2/ui';
import { StackedStatusBar } from '@/components/v2/charts';
import { countOutcomes, riskLabel, riskPill } from '@/components/v2/status';

export const dynamic = 'force-dynamic';

const STEPS = [
  ['01', 'Officer publishes', 'The officer sets the tender and confirms each eligibility rule the engine will apply.'],
  ['02', 'Bidder checks', 'The bidder uploads documents and sees exactly which clauses pass, fail or are missing.'],
  ['03', 'Engine verifies', 'Values are read from documents, cross-checked across files and against government registries.'],
  ['04', 'Officer decides', 'The officer reviews evidence and AI advice, then signs a sealed decision.'],
];

const CHECKS = ['Udyam / MSME', 'GST & returns', 'PAN', 'Income tax', 'MCA21', 'EPFO / ESIC', 'Make in India', 'Startup India', 'NSIC', 'OEM authorization', 'DigiLocker', 'Debarment'];

export default function LandingPage() {
  // Seeded sandbox dossiers only (no owner): real submissions are never shown publicly.
  const sample = getAllBidderDossiers()
    .filter((d) => !d.ownerUserId)
    .slice(0, 4);
  const sampleRef = sample[0]?.tenderReference;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-[72px] items-center gap-6 border-b border-line px-4 sm:px-8 lg:gap-10 lg:px-16">
        <Link href="/" className="flex items-center gap-2.5 text-fg no-underline">
          <BrandMark />
          <span className="font-display text-[15px] font-bold tracking-[.06em]">CLAUSENTIS</span>
        </Link>
        <nav aria-label="Site" className="hidden gap-7 text-[13px] md:flex">
          <a href="#how" className="text-fg-2 hover:text-brand">How it works</a>
          <a href="#checks" className="text-fg-2 hover:text-brand">What it checks</a>
          <a href="#roles" className="text-fg-2 hover:text-brand">For officers &amp; bidders</a>
        </nav>
        <span className="ml-auto flex gap-2">
          <Link href="/login" className="btn btn-secondary">Sign in</Link>
          <Link href="/signup" className="btn btn-primary hidden sm:inline-flex">Register as bidder</Link>
        </span>
      </header>

      <main className="flex-1">
        <section aria-label="Introduction" className="grid grid-cols-1 items-center gap-12 border-b border-[#DBEAFE] bg-[#EFF6FF] px-4 py-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-16 lg:px-16 lg:pb-16 lg:pt-[88px]">
          <div className="flex flex-col gap-[22px]">
            <span className="eyebrow">Bid compliance verification for GeM procurement</span>
            <h1 className="m-0 font-display text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[48px] lg:text-[56px]">
              Every bid checked against every clause, before anyone decides.
            </h1>
            <p className="sub max-w-[560px]" style={{ fontSize: 17 }}>
              Clausentis reads bidder documents, cross-checks them with Udyam, GST, PAN and other registries, and shows the procurement officer the evidence, the gaps and a recommendation. The officer makes and signs the decision.
            </p>
            <span className="flex flex-wrap gap-2.5">
              <Link href="/login" className="btn btn-primary btn-lg">Sign in</Link>
              <a href="#how" className="btn btn-secondary btn-lg">See how it works</a>
            </span>
          </div>
          {sample.length ? (
            <div className="card flex flex-col gap-3.5 p-[22px]" style={{ boxShadow: '0 12px 32px rgba(15,23,42,0.08)' }}>
              <span className="flex items-center justify-between gap-2">
                <span className="eyebrow">Sample · {sample.length} bids on {sampleRef}</span>
                <span className="mono text-[10px] text-fg-3">SANDBOX DEMO DATA</span>
              </span>
              <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                {sample.map((d) => {
                  const counts = countOutcomes(d.requirementResults.map((r) => r.status));
                  return (
                    <li key={d.bidId} className="grid grid-cols-[minmax(0,130px)_minmax(0,1fr)_32px_84px] items-center gap-2.5 text-xs">
                      <span className="truncate font-semibold">{d.shortName || d.bidderName}</span>
                      <StackedStatusBar counts={counts} label={`${d.shortName} clause outcomes`} height={10} />
                      <span className="mono text-right font-semibold">{d.complianceScore}</span>
                      <span><RawPill cls={riskPill(d.riskLevel)}>{riskLabel(d.riskLevel)}</RawPill></span>
                    </li>
                  );
                })}
              </ul>
              <Legend className="border-t border-line-3 pt-3" items={STATUS_LEGEND.map((l) => ({ ...l, label: l.swatch === 'pass' ? 'Clause met' : l.label }))} />
            </div>
          ) : null}
        </section>

        <section id="how" aria-label="How it works" className="flex scroll-mt-4 flex-col gap-7 border-b border-line bg-page px-4 py-14 sm:px-8 lg:px-16">
          <h2 className="m-0 font-display text-[32px] font-semibold tracking-[-0.02em]">How it works</h2>
          <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 xl:grid-cols-4">
            {STEPS.map(([n, t, d]) => (
              <li key={n} className="card flex flex-col gap-2.5 p-5">
                <span className="tile tile-blue font-display text-sm font-bold" aria-hidden="true">{n}</span>
                <span className="font-display text-[17px] font-semibold">{t}</span>
                <span className="text-[13px] leading-relaxed text-fg-2">{d}</span>
              </li>
            ))}
          </ol>
        </section>

        <section id="checks" aria-label="What it checks" className="grid scroll-mt-4 grid-cols-1 gap-10 px-4 py-14 sm:px-8 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-12 lg:px-16">
          <div className="flex flex-col gap-3">
            <h2 className="m-0 font-display text-[32px] font-semibold tracking-[-0.02em]">What it checks</h2>
            <p className="sub">Statutory registrations, tender-specific thresholds and the consistency of a bidder&apos;s own documents. Registry checks currently run on sandbox data.</p>
          </div>
          <ul className="m-0 grid list-none grid-cols-1 gap-2.5 p-0 sm:grid-cols-2 xl:grid-cols-4">
            {CHECKS.map((c) => (
              <li key={c} className="flex min-h-12 items-center gap-2.5 rounded-[10px] border border-[#DBEAFE] bg-white px-3.5 text-sm font-semibold">
                <Check className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                {c}
              </li>
            ))}
          </ul>
        </section>

        <section id="roles" aria-label="Roles" className="grid scroll-mt-4 grid-cols-1 gap-4 px-4 pb-16 sm:px-8 md:grid-cols-2 lg:px-16">
          <div className="card flex flex-col gap-2.5 p-7">
            <span className="eyebrow">For procurement officers</span>
            <span className="font-display text-xl font-semibold">Review evidence, not paperwork</span>
            <span className="text-sm leading-relaxed text-fg-2">
              See each bid&apos;s clause results with page citations, portal checks, and contradictions between documents. Record and sign your decision; every step lands in the audit trail.
            </span>
          </div>
          <div className="card flex flex-col gap-2.5 p-7">
            <span className="eyebrow">For bidders</span>
            <span className="font-display text-xl font-semibold">Know what will fail before you submit</span>
            <span className="text-sm leading-relaxed text-fg-2">
              Check your documents against the tender the same way the officer will, fix gaps, then submit a sealed package.
            </span>
            <Link href="/signup" className="link mt-1 text-sm">Register your company →</Link>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 border-t border-line px-4 py-6 text-xs text-fg-3 sm:flex-row sm:justify-between sm:px-8 lg:px-16">
        <span>Clausentis · SIH26100 prototype · registry data shown is synthetic</span>
        <span className="flex gap-5">
          <Link href="/privacy" className="text-fg-2 hover:text-brand">Privacy</Link>
          <Link href="/terms" className="text-fg-2 hover:text-brand">Terms</Link>
        </span>
      </footer>
    </div>
  );
}
