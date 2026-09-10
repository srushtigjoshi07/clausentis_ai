'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollProgress } from '@/components/landing/scroll-progress';
import { MultilingualAudioPreview } from '@/components/landing/multilingual-audio-preview';
import { ProductPreview } from '@/components/landing/product-preview';
import { Benefits } from '@/components/landing/benefits';
import { CtaSection } from '@/components/landing/cta-section';
import { Footer } from '@/components/landing/footer';
import { MinimalHudOverlay } from '@/components/landing/experience/MinimalHudOverlay';
import { useFullLandingScroll } from '@/hooks/useFullLandingScroll';

const PersistentHeroBackground = dynamic(
  () => import('@/components/landing/experience/PersistentHeroBackground').then((mod) => mod.PersistentHeroBackground),
  { ssr: false }
);

// Helper for smooth Hermite interpolation
function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

// ============================================================================
// CHAPTER 01: HERO TYPOGRAPHIC CHOREOGRAPHY
// ============================================================================
function HeroSection() {
  const story = useFullLandingScroll();
  const global = story.damped;

  // Scene 01 window: 0.00 to 0.125
  const p = Math.min(Math.max(global / 0.12, 0), 1);

  // Badge: early upward slide and dissolution
  const badgeY = -p * 110;
  const badgeOpacity = Math.max(0, 1 - p * 3.0);

  // Line 1 ("AI-Powered Tender"): shifts left, expands tracking, lifts into space
  const line1X = -p * 70;
  const line1Y = -p * 90;
  const line1Scale = 1 - p * 0.08;
  const line1Opacity = Math.max(0, 1 - p * 1.5);
  const line1Tracking = -0.04 + p * 0.03;

  // Line 2 ("Compliance Verification"): differential parallax, shifts right, resolves deeper
  const line2X = p * 45;
  const line2Y = -p * 60;
  const line2Scale = 1 - p * 0.12;
  const line2Opacity = Math.max(0, 1 - p * 1.7);

  // Paragraph: depth attenuation blur and slower receding rate
  const paragraphY = -p * 45;
  const paragraphBlur = p * 4;
  const paragraphOpacity = Math.max(0, 1 - p * 2.1);

  // Buttons: scale-down and exit
  const ctaY = -p * 35;
  const ctaScale = 1 - p * 0.15;
  const ctaOpacity = Math.max(0, 1 - p * 2.4);

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 z-10 select-none pointer-events-none">
      <div className="max-w-4xl mx-auto space-y-6 pt-20 pb-16 pointer-events-auto">
        {/* Eyebrow badge */}
        <div
          className="will-change-transform"
          style={{
            transform: `translate3d(0, ${badgeY}px, 0)`,
            opacity: badgeOpacity,
            pointerEvents: badgeOpacity > 0.1 ? 'auto' : 'none',
          }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-1.5 text-xs font-mono text-[#333333] shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-[#111111]" />
            <span>Know Before You Bid</span>
          </div>
        </div>

        {/* Word/Line Group Choreographed Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light leading-[1.08] select-none">
          <span
            className="block text-[#111111] will-change-transform font-normal"
            style={{
              transform: `translate3d(${line1X}px, ${line1Y}px, 0) scale(${line1Scale})`,
              opacity: line1Opacity,
              letterSpacing: `${line1Tracking}em`,
            }}
          >
            AI-Powered Tender
          </span>
          <span
            className="block text-[#333333] will-change-transform font-light"
            style={{
              transform: `translate3d(${line2X}px, ${line2Y}px, 0) scale(${line2Scale})`,
              opacity: line2Opacity,
              letterSpacing: '-0.04em',
            }}
          >
            Compliance Verification
          </span>
        </h1>

        {/* Paragraph */}
        <p
          className="text-base sm:text-lg font-light text-[#555555] max-w-xl mx-auto leading-relaxed will-change-transform"
          style={{
            transform: `translate3d(0, ${paragraphY}px, 0)`,
            filter: paragraphBlur > 0.1 ? `blur(${paragraphBlur.toFixed(1)}px)` : 'none',
            opacity: paragraphOpacity,
          }}
        >
          Upload multi-hundred-page RFPs, extract deterministic requirements, and verify compliance against your credential vault in minutes.
        </p>

        {/* CTA Buttons */}
        <div
          className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 will-change-transform"
          style={{
            transform: `translate3d(0, ${ctaY}px, 0) scale(${ctaScale})`,
            opacity: ctaOpacity,
            pointerEvents: ctaOpacity > 0.1 ? 'auto' : 'none',
          }}
        >
          <Link href="/dashboard">
            <Button size="lg" className="h-12 px-8 bg-[#111111] hover:bg-[#222222] text-white font-medium text-sm tracking-wide gap-2 shadow-sm border border-[#222222] transition-colors">
              Launch Command Center <ArrowRight className="h-4 w-4 stroke-[1.5]" />
            </Button>
          </Link>
          <a href="#workspace">
            <Button variant="outline" size="lg" className="h-12 px-8 border-[#111111] bg-white text-[#111111] hover:bg-[#F5F5F5] font-medium text-sm transition-colors">
              Explore Platform
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// CHAPTER 02: COMPLEX PROCUREMENT DOCUMENTS CHOREOGRAPHY
// ============================================================================
function DocumentsSection() {
  const story = useFullLandingScroll();
  const global = story.damped;

  // Scene 02 window: 0.125 to 0.250
  const s2 = (global - 0.125) / 0.125;

  // Entrance motion: -0.3 to 0.25
  const enterAlpha = smoothStep(-0.25, 0.18, s2);
  // Exit motion: 0.70 to 1.15
  const exitAlpha = smoothStep(0.72, 1.10, s2);
  const totalAlpha = enterAlpha * (1 - exitAlpha);

  // Eyebrow mask-reveal
  const eyebrowX = (1 - enterAlpha) * -30;
  const eyebrowTracking = 0.22 - enterAlpha * 0.06;

  // Heading lateral shift & scale as camera travels past archive sheets
  const headingShiftX = s2 > 0.20 ? Math.min((s2 - 0.20) / 0.45, 1) * -35 : 0;
  const headingScale = 1 - (s2 > 0.25 ? (s2 - 0.25) * 0.09 : 0);
  const headingY = (1 - enterAlpha) * 25 - exitAlpha * 40;

  // Paragraph parallax
  const paragraphY = (1 - enterAlpha) * 35 - exitAlpha * 25;
  const paragraphBlur = Math.max(0, (1 - enterAlpha) * 3);

  // Micro-metadata tags (active during document fly-through: s2 0.28 to 0.80)
  const metadataAlpha = s2 >= 0.25 && s2 <= 0.82
    ? Math.sin(((s2 - 0.25) / 0.57) * Math.PI)
    : 0;

  // Resolution statement at end of Scene 02
  const climaxAlpha = smoothStep(0.78, 0.95, s2) * (1 - smoothStep(1.05, 1.20, s2));

  return (
    <section className="relative min-h-[85vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 z-10 py-24 select-none pointer-events-none">
      <div
        className="max-w-3xl mx-auto space-y-6 pointer-events-auto will-change-transform"
        style={{
          opacity: totalAlpha,
          pointerEvents: totalAlpha > 0.1 ? 'auto' : 'none',
        }}
      >
        {/* Eyebrow with Mask-Reveal */}
        <div className="overflow-hidden">
          <span
            className="inline-block text-xs font-mono uppercase text-[#555555] will-change-transform"
            style={{
              transform: `translate3d(${eyebrowX}px, 0, 0)`,
              letterSpacing: `${eyebrowTracking}em`,
            }}
          >
            02 // UNSTRUCTURED INFORMATION OVERLOAD
          </span>
        </div>

        {/* Primary Heading with Lateral Drift & Parallax */}
        <div
          className="space-y-4 will-change-transform"
          style={{
            transform: `translate3d(${headingShiftX}px, ${headingY}px, 0) scale(${headingScale})`,
          }}
        >
          <h2 className="text-3xl sm:text-5xl font-light text-[#111111] tracking-[-0.03em]">
            Complex Procurement Documents
          </h2>
          <p
            className="text-base sm:text-lg font-light text-[#555555] max-w-lg mx-auto leading-relaxed will-change-transform"
            style={{
              transform: `translate3d(0, ${paragraphY}px, 0)`,
              filter: paragraphBlur > 0.1 ? `blur(${paragraphBlur.toFixed(1)}px)` : 'none',
            }}
          >
            Scattered across hundreds of pages of unstructured technical criteria, complex qualification requirements, and ambiguous legal clauses.
          </p>
        </div>

        {/* Spatial Micro-Metadata Tags (Examined during Camera Flight) */}
        <div
          className="flex flex-wrap items-center justify-center gap-3 pt-2 will-change-transform"
          style={{
            opacity: metadataAlpha,
            transform: `translate3d(0, ${(1 - metadataAlpha) * 18}px, 0)`,
          }}
        >
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#E5E5E5] text-[#333333] shadow-xs">
            [ CORPUS: 480 SPECIFICATION PAGES ]
          </span>
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#E5E5E5] text-[#333333] shadow-xs">
            [ SCANNING EVIDENCE VECTORS ]
          </span>
          <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#E5E5E5] text-[#333333] shadow-xs">
            [ AMBIGUITY PURGED ]
          </span>
        </div>

        {/* Climax Resolution Badge */}
        <div
          className="pt-4 will-change-transform"
          style={{
            opacity: climaxAlpha,
            transform: `translate3d(0, ${(1 - climaxAlpha) * 15}px, 0)`,
          }}
        >
          <div className="inline-block px-5 py-2 rounded-full border border-[#E5E5E5] bg-white/95 shadow-sm">
            <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#111111]">
              &bull; UNSTRUCTURED DOCUMENTS RESOLVED INTO REQUISITION ESSENCE &bull;
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// CHAPTER 03: AUTONOMOUS TENDER DECOMPOSITION CHOREOGRAPHY
// ============================================================================
function DecompositionSection() {
  const story = useFullLandingScroll();
  const global = story.damped;

  // Scene 03 window: 0.250 to 0.375
  const s3 = (global - 0.250) / 0.125;

  const enterAlpha = smoothStep(-0.22, 0.20, s3);
  const exitAlpha = smoothStep(0.75, 1.10, s3);
  const totalAlpha = enterAlpha * (1 - exitAlpha);

  const headingY = (1 - enterAlpha) * 30 - exitAlpha * 40;
  const tiersAlpha = smoothStep(0.18, 0.45, s3);
  const verifP = smoothStep(0.40, 0.75, s3);
  const compressAlpha = smoothStep(0.75, 0.95, s3);

  return (
    <section className="relative min-h-[85vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 z-10 py-24 select-none pointer-events-none">
      <div
        className="max-w-4xl mx-auto space-y-6 pointer-events-auto will-change-transform"
        style={{
          opacity: totalAlpha,
          pointerEvents: totalAlpha > 0.1 ? 'auto' : 'none',
        }}
      >
        {/* Eyebrow */}
        <div className="overflow-hidden">
          <span
            className="inline-block text-xs font-mono uppercase tracking-[0.16em] text-[#555555] will-change-transform"
            style={{
              transform: `translate3d(0, ${(1 - enterAlpha) * 20}px, 0)`,
            }}
          >
            03 // AUTONOMOUS DECOMPOSITION & MATRIX
          </span>
        </div>

        {/* Heading */}
        <div
          className="space-y-4 will-change-transform"
          style={{
            transform: `translate3d(0, ${headingY}px, 0)`,
          }}
        >
          <h2 className="text-3xl sm:text-5xl font-light text-[#111111] tracking-[-0.03em]">
            Autonomous Tender Decomposition & Compliance Matrix
          </h2>
          <p className="text-base sm:text-lg font-light text-[#555555] max-w-lg mx-auto leading-relaxed">
            High-speed LLaMA extraction parses unstructured tender text streams into structured, machine-verifiable data vectors.
          </p>
        </div>

        {/* 4 Architectural Hierarchy Tiers */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-left will-change-transform"
          style={{
            opacity: tiersAlpha * (1 - compressAlpha * 0.8),
            transform: `translate3d(0, ${(1 - tiersAlpha) * 25}px, 0) scale(${1 - compressAlpha * 0.1})`,
          }}
        >
          <div className="p-3.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] shadow-xs">
            <span className="text-[10px] font-mono text-[#555555] uppercase tracking-widest block">TIER 01 // FINANCIAL</span>
            <span className="text-xs font-medium text-[#111111] block pt-1">$12.5M TURNOVER CRITERIA</span>
            <span className="text-[10px] font-mono text-[#111111] block pt-1.5">{verifP > 0.2 ? '✓ VERIFIED MATCH' : 'PARSING...'}</span>
          </div>

          <div className="p-3.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] shadow-xs">
            <span className="text-[10px] font-mono text-[#555555] uppercase tracking-widest block">TIER 02 // LEGAL</span>
            <span className="text-xs font-medium text-[#111111] block pt-1">DIRECTOR AUTHORIZATIONS</span>
            <span className="text-[10px] font-mono text-[#111111] block pt-1.5">{verifP > 0.4 ? '✓ VERIFIED MATCH' : 'PARSING...'}</span>
          </div>

          <div className="p-3.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] shadow-xs">
            <span className="text-[10px] font-mono text-[#555555] uppercase tracking-widest block">TIER 03 // TECHNICAL</span>
            <span className="text-xs font-medium text-[#111111] block pt-1">ISO 27001 / SOC 2</span>
            <span className="text-[10px] font-mono text-[#111111] block pt-1.5">{verifP > 0.6 ? '✓ VERIFIED MATCH' : 'PARSING...'}</span>
          </div>

          <div className="p-3.5 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] shadow-xs">
            <span className="text-[10px] font-mono text-[#555555] uppercase tracking-widest block">TIER 04 // EXPERIENCE</span>
            <span className="text-xs font-medium text-[#111111] block pt-1">3 SIMILAR DEPLOYMENTS</span>
            <span className="text-[10px] font-mono text-[#111111] block pt-1.5">{verifP > 0.8 ? '✓ VERIFIED MATCH' : 'PARSING...'}</span>
          </div>
        </div>

        {/* Resolution Statement */}
        <div
          className="pt-4 will-change-transform"
          style={{
            opacity: compressAlpha,
            transform: `translate3d(0, ${(1 - compressAlpha) * 15}px, 0)`,
          }}
        >
          <div className="inline-block px-5 py-2 rounded-full border border-[#E5E5E5] bg-white/95 shadow-sm">
            <span className="text-xs font-mono uppercase tracking-[0.16em] text-[#111111]">
              &bull; 100% AUDITABLE COMPLIANCE ARCHITECTURE RESOLVED &bull;
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// CHAPTER 04: ORGANIZED INTELLIGENCE PATHWAYS CHOREOGRAPHY
// ============================================================================
function PathwaysSection() {
  const story = useFullLandingScroll();
  const global = story.damped;

  // Scene 04 window: 0.375 to 0.500
  const s4 = (global - 0.375) / 0.125;

  const enterAlpha = smoothStep(-0.22, 0.20, s4);
  const exitAlpha = smoothStep(0.78, 1.10, s4);
  const totalAlpha = enterAlpha * (1 - exitAlpha);

  // Travelling route indicator during decision turn: s4 0.22 to 0.65
  const routeAlpha = s4 >= 0.22 && s4 <= 0.65
    ? Math.sin(((s4 - 0.22) / 0.43) * Math.PI)
    : 0;

  // Grand pull-back wide reveal: s4 > 0.62
  const wideRevealAlpha = smoothStep(0.62, 0.85, s4);
  const clarityHoldAlpha = smoothStep(0.82, 0.98, s4);

  return (
    <section className="relative min-h-[85vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 z-10 py-24 select-none pointer-events-none">
      <div
        className="max-w-4xl mx-auto space-y-6 pointer-events-auto will-change-transform"
        style={{
          opacity: totalAlpha,
          pointerEvents: totalAlpha > 0.1 ? 'auto' : 'none',
        }}
      >
        {/* Eyebrow */}
        <span
          className="inline-block text-xs font-mono uppercase tracking-[0.16em] text-[#555555] will-change-transform"
          style={{
            transform: `translate3d(0, ${(1 - enterAlpha) * 20}px, 0)`,
          }}
        >
          04 // REQUIREMENT CONDUITS
        </span>

        {/* Primary Heading */}
        <div
          className="space-y-4 will-change-transform"
          style={{
            transform: `translate3d(0, ${(1 - enterAlpha) * 25 - exitAlpha * 35}px, 0)`,
            opacity: 1 - wideRevealAlpha * 0.4,
          }}
        >
          <h2 className="text-3xl sm:text-5xl font-light text-[#111111] tracking-[-0.03em]">
            Organized Intelligence Pathways
          </h2>
          <p className="text-base sm:text-lg font-light text-[#555555] max-w-lg mx-auto leading-relaxed">
            Financial turnover, legal authorizations, technical specifications, and experience thresholds structured into distinct domains.
          </p>
        </div>

        {/* Travelling Decision Route Badges */}
        <div
          className="flex flex-wrap items-center justify-center gap-4 pt-2 will-change-transform"
          style={{
            opacity: routeAlpha,
            transform: `translate3d(${Math.sin(s4 * Math.PI * 2) * 18}px, ${(1 - routeAlpha) * 15}px, 0)`,
          }}
        >
          <span className="text-[11px] font-mono px-3.5 py-1.5 rounded-full bg-[#111111] border border-[#222222] text-white shadow-sm">
            ► ACTIVE DECISION PATH: CRITICAL QUALIFICATION ROUTE
          </span>
          <span className="text-[11px] font-mono px-3.5 py-1.5 rounded-full bg-[#F5F5F5] border border-[#E5E5E5] text-[#888888] line-through">
            REDUNDANT CRITERIA // DISSOLVED
          </span>
        </div>

        {/* Grand Pull-Back Wide Topology Statement */}
        <div
          className="pt-6 will-change-transform space-y-2"
          style={{
            opacity: wideRevealAlpha,
            transform: `scale(${0.92 + wideRevealAlpha * 0.08})`,
          }}
        >
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#555555] block">
            MACRO SYSTEM TOPOLOGY
          </span>
          <p className="text-base sm:text-lg font-light text-[#333333] max-w-2xl mx-auto leading-relaxed">
            Every requirement is interconnected through an immutable graph. Deterministic evidence routes eliminate human omission.
          </p>
        </div>

        {/* Clarity Hold Statement */}
        <div
          className="pt-4 will-change-transform"
          style={{
            opacity: clarityHoldAlpha,
            transform: `translate3d(0, ${(1 - clarityHoldAlpha) * 15}px, 0)`,
          }}
        >
          <div className="inline-block px-6 py-2 rounded-full border border-[#E5E5E5] bg-white/95 shadow-sm">
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#111111]">
              &bull; COMPREHENSIVE TENDER CLARITY &bull;
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// MAIN PAGE EXPORT
// ============================================================================
export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full bg-transparent overflow-x-hidden font-sans">
      {/* 1. SINGLE PERSISTENT 3D WEBGL ENVIRONMENT */}
      <PersistentHeroBackground />

      {/* 2. PERSISTENT FIXED VIEWPORT HUD BADGES */}
      <MinimalHudOverlay />

      {/* 3. TOP SCROLL PROGRESS BAR */}
      <ScrollProgress />

      {/* ============================================================ */}
      {/* CHAPTER 01: HERO INTELLIGENCE CORE */}
      {/* ============================================================ */}
      <HeroSection />

      {/* ============================================================ */}
      {/* CHAPTER 02: COMPLEX PROCUREMENT DOCUMENTS */}
      {/* ============================================================ */}
      <DocumentsSection />

      {/* ============================================================ */}
      {/* CHAPTER 03: AUTONOMOUS DATA EXTRACTION */}
      {/* ============================================================ */}
      <DecompositionSection />

      {/* ============================================================ */}
      {/* CHAPTER 04: REQUIREMENT GRAPH LATTICE */}
      {/* ============================================================ */}
      <PathwaysSection />

      {/* ============================================================ */}
      {/* CHAPTER 05: PRODUCTION WORKSPACE & MATRIX */}
      {/* ============================================================ */}
      <div id="workspace" className="relative z-10 bg-transparent py-16">
        <ProductPreview />
      </div>

      {/* ============================================================ */}
      {/* CHAPTER 06: MULTILINGUAL ACCESSIBILITY */}
      {/* ============================================================ */}
      <section className="relative py-24 border-t border-white/5 overflow-hidden bg-transparent z-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
          <MultilingualAudioPreview />
        </div>
      </section>

      {/* ============================================================ */}
      {/* CHAPTER 07: COMPETITIVE BENEFITS GRID */}
      {/* ============================================================ */}
      <div className="relative z-10 bg-transparent py-16">
        <Benefits />
      </div>

      {/* ============================================================ */}
      {/* CHAPTER 08: FINAL DECISION, CTA & FOOTER */}
      {/* ============================================================ */}
      <div className="relative z-10 bg-transparent">
        <CtaSection />
        <Footer />
      </div>
    </div>
  );
}