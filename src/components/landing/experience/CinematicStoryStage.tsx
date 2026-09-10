'use client';

import { useRef } from 'react';
import { useFullLandingScroll } from '@/hooks/useFullLandingScroll';
import { MinimalHudOverlay } from './MinimalHudOverlay';

export function CinematicStoryStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const story = useFullLandingScroll();
  const progress = story.damped;

  return (
    <div ref={containerRef} className="relative min-h-[90vh] w-full bg-transparent flex flex-col justify-center select-none">
      {/* Subtle Full-Screen Technical Spatial Grid with Scroll Parallax (0.5x) */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none will-change-transform"
        style={{
          backgroundImage: `linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          transform: `translate3d(0, ${-progress * 60}px, 0)`,
        }}
      />

      {/* Minimal Editorial HUD Typography Overlay with Continuous Layered Motion */}
      <div className="relative min-h-[85vh] flex items-center justify-center">
        <MinimalHudOverlay />
      </div>
    </div>
  );
}
