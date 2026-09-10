'use client';

import { useEffect, useState, useRef } from 'react';

export function MotionBackground() {
  const [scrollY, setScrollY] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Check initial match without synchronous setState warning
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      // Defer update slightly or via event
      const timer = setTimeout(() => setPrefersReducedMotion(true), 0);
      return () => clearTimeout(timer);
    }

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleMediaChange);

    // Optimized scroll listener attached to main container or window
    const mainEl = document.getElementById('dashboard-main-scroll');

    const onScroll = () => {
      if (mediaQuery.matches) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const currentY = mainEl ? mainEl.scrollTop : window.scrollY;
        setScrollY(currentY);
      });
    };

    if (mainEl) {
      mainEl.addEventListener('scroll', onScroll, { passive: true });
    } else {
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
      if (mainEl) {
        mainEl.removeEventListener('scroll', onScroll);
      } else {
        window.removeEventListener('scroll', onScroll);
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const parallaxY = prefersReducedMotion ? 0 : -(scrollY * 0.06);

  return (
    <div 
      className="fixed inset-0 overflow-hidden pointer-events-none -z-10 select-none bg-[#05070B]"
      aria-hidden="true"
    >
      {/* 1. LAYER 2 — VERY SUBTLE TECHNICAL GRID (80px spacing, ~3% opacity) */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(59, 130, 246, 0.6) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.6) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* 2. LAYER 3 — DRIFTING BLUE LIGHT FIELDS (3 asynchronous slow fields) */}
      
      {/* Field A: Hero / Upper Right Ambient Light (28s cycle) */}
      <div 
        className={`absolute -top-32 right-[-10%] w-[650px] h-[650px] lg:w-[850px] lg:h-[850px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.09)_0%,rgba(59,130,246,0.03)_45%,transparent_70%)] blur-[130px] ${
          prefersReducedMotion ? '' : 'animate-drift-a'
        }`}
      />

      {/* Field B: Center-Left / Stats Ambient Light (42s cycle) */}
      <div 
        className={`absolute top-[40%] left-[-8%] w-[550px] h-[550px] lg:w-[750px] lg:h-[750px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.06)_0%,rgba(56,189,248,0.02)_40%,transparent_65%)] blur-[140px] ${
          prefersReducedMotion ? '' : 'animate-drift-b'
        }`}
      />

      {/* Field C: Lower Workspace / Repository Light (58s cycle) */}
      <div 
        className={`absolute bottom-[-15%] right-[20%] w-[600px] h-[600px] lg:w-[800px] lg:h-[800px] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.05)_0%,rgba(59,130,246,0.015)_40%,transparent_65%)] blur-[150px] ${
          prefersReducedMotion ? '' : 'animate-drift-c'
        }`}
      />

      {/* 3. LAYER 4 — ABSTRACT NEURAL ENERGY LINES & TRAVELING DATA NODES */}
      <div 
        className="absolute inset-0 w-full h-full will-change-transform transition-transform duration-75 ease-out opacity-90 hidden sm:block"
        style={{
          transform: `translate3d(0, ${parallaxY}px, 0)`,
        }}
      >
        <svg 
          className="w-full h-full"
          viewBox="0 0 1440 1024" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMin slice"
        >
          <defs>
            {/* Fine Gradient for Signal Pathways */}
            <linearGradient id="neuralGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.02" />
              <stop offset="35%" stopColor="#3B82F6" stopOpacity="0.13" />
              <stop offset="70%" stopColor="#60A5FA" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.01" />
            </linearGradient>

            <linearGradient id="neuralGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.01" />
              <stop offset="45%" stopColor="#38BDF8" stopOpacity="0.12" />
              <stop offset="85%" stopColor="#3B82F6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.01" />
            </linearGradient>

            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Trace 1: Upper Right to Center Margin */}
          <path
            id="path1"
            d="M 1440,120 L 1150,120 Q 1080,120 1040,160 L 960,240 Q 920,280 850,280 L 520,280"
            stroke="url(#neuralGrad1)"
            strokeWidth="0.85"
            strokeDasharray="4 6"
            strokeLinecap="round"
          />

          {/* Trace 2: Perimeter Top to Right Descent */}
          <path
            id="path2"
            d="M 380,0 L 380,80 Q 380,140 440,140 L 760,140 Q 820,140 860,180 L 980,300 Q 1020,340 1020,420 L 1020,720"
            stroke="url(#neuralGrad2)"
            strokeWidth="0.75"
            strokeDasharray="6 8"
            strokeLinecap="round"
          />

          {/* Trace 3: Lower Background Structural Rail */}
          <path
            id="path3"
            d="M 0,620 L 280,620 Q 340,620 380,660 L 460,740 Q 500,780 580,780 L 1100,780 Q 1160,780 1200,820 L 1260,880 L 1440,880"
            stroke="url(#neuralGrad1)"
            strokeWidth="0.85"
            strokeLinecap="round"
          />

          {/* Trace 4: Subtle Left Margin Vertical Conduit */}
          <path
            id="path4"
            d="M 120,160 L 120,440 Q 120,500 160,540 L 220,600 Q 260,640 260,720 L 260,980"
            stroke="url(#neuralGrad2)"
            strokeWidth="0.75"
            strokeDasharray="3 5"
            strokeLinecap="round"
          />

          {/* Trace 5: Far Right Ambient Link */}
          <path
            id="path5"
            d="M 1320,320 L 1320,580 Q 1320,640 1260,680 L 1180,730 Q 1120,770 1120,850 L 1120,1024"
            stroke="url(#neuralGrad1)"
            strokeWidth="0.75"
            strokeLinecap="round"
          />

          {/* 4. TRAVELING DATA NODES (Micro 2px pulses on paths, only if motion allowed) */}
          {!prefersReducedMotion && (
            <>
              {/* Node 1 on Path 1 (14s) */}
              <circle r="2.2" fill="#60A5FA" opacity="0.85" filter="url(#nodeGlow)">
                <animateMotion
                  dur="14s"
                  repeatCount="indefinite"
                  path="M 1440,120 L 1150,120 Q 1080,120 1040,160 L 960,240 Q 920,280 850,280 L 520,280"
                  keyPoints="0;0.5;1"
                  keyTimes="0;0.5;1"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.9;0.9;0"
                  keyTimes="0;0.1;0.85;1"
                  dur="14s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Node 2 on Path 2 (18s) */}
              <circle r="1.8" fill="#38BDF8" opacity="0.75" filter="url(#nodeGlow)">
                <animateMotion
                  dur="18s"
                  repeatCount="indefinite"
                  path="M 380,0 L 380,80 Q 380,140 440,140 L 760,140 Q 820,140 860,180 L 980,300 Q 1020,340 1020,420 L 1020,720"
                  keyPoints="0;0.5;1"
                  keyTimes="0;0.5;1"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.8;0.8;0"
                  keyTimes="0;0.15;0.85;1"
                  dur="18s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Node 3 on Path 3 (16s) */}
              <circle r="2" fill="#3B82F6" opacity="0.8" filter="url(#nodeGlow)">
                <animateMotion
                  dur="16s"
                  repeatCount="indefinite"
                  path="M 0,620 L 280,620 Q 340,620 380,660 L 460,740 Q 500,780 580,780 L 1100,780 Q 1160,780 1200,820 L 1260,880 L 1440,880"
                  keyPoints="0;0.5;1"
                  keyTimes="0;0.5;1"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.85;0.85;0"
                  keyTimes="0;0.1;0.9;1"
                  dur="16s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Node 4 on Path 4 (22s) */}
              <circle r="1.8" fill="#60A5FA" opacity="0.75" filter="url(#nodeGlow)">
                <animateMotion
                  dur="22s"
                  repeatCount="indefinite"
                  path="M 120,160 L 120,440 Q 120,500 160,540 L 220,600 Q 260,640 260,720 L 260,980"
                  keyPoints="0;0.5;1"
                  keyTimes="0;0.5;1"
                  calcMode="spline"
                  keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"
                />
                <animate
                  attributeName="opacity"
                  values="0;0.75;0.75;0"
                  keyTimes="0;0.15;0.85;1"
                  dur="22s"
                  repeatCount="indefinite"
                />
              </circle>
            </>
          )}
        </svg>
      </div>

      {/* Subtle Vignette Framing on outer borders */}
      <div 
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,#05070B_95%)] opacity-70"
      />
    </div>
  );
}