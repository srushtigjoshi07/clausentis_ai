'use client';

import { useState, useEffect } from 'react';
import { useFullLandingScroll } from '@/hooks/useFullLandingScroll';

export function MinimalHudOverlay() {
  const story = useFullLandingScroll();
  const p = story.damped;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  // 8-scene index (1 to 8)
  const sceneNum = Math.min(8, Math.max(1, Math.floor(p * 8) + 1));
  const sceneString = `0${sceneNum} / 08`;

  // Scene names for HUD badge
  const sceneNames = [
    '01 // INTELLIGENCE CORE',
    '02 // MONOLITHIC ARCHIVE',
    '03 // ARCHITECTURAL DECOMPOSITION',
    '04 // DECISION CONDUITS',
    '05 // EVIDENCE MATCHING TRACE',
    '06 // COMPLIANCE MATRIX PRISM',
    '07 // INTELLIGENCE CONVERGENCE',
    '08 // FINAL INTELLIGENCE FIELD',
  ];
  const activeSceneName = sceneNames[sceneNum - 1];

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between p-6 sm:p-10 select-none font-sans">
      {/* Top Fixed Header Status */}
      <div 
        className={`flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.14em] transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-[#E5E5E5] backdrop-blur-md text-[#555555] shadow-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" />
          <span className="text-[#111111] font-medium">{activeSceneName}</span>
        </div>

        {/* Dynamic Numeric Transition Badge */}
        <div className="flex items-center gap-2 text-[#555555] font-mono text-[11px] font-semibold tracking-widest px-3.5 py-1.5 rounded-full bg-white/90 border border-[#E5E5E5] backdrop-blur-md shadow-xs">
          <span>STAGE</span>
          <span className="text-[#111111]">{sceneString}</span>
          <span className="text-[#888888]">&bull;</span>
          <span className="text-[#111111]">{Math.round(p * 100)}%</span>
        </div>
      </div>

      {/* Bottom Fixed Status Bar */}
      <div 
        className={`flex items-center justify-between text-[10px] font-mono text-[#555555] uppercase tracking-widest transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <div className="px-3.5 py-1 rounded-full bg-white/90 border border-[#E5E5E5] backdrop-blur-md shadow-xs">
          <span>CLAUSENTIS // PROCUREMENT INTELLIGENCE</span>
        </div>
        <div className="px-3.5 py-1 rounded-full bg-white/90 border border-[#E5E5E5] backdrop-blur-md text-[#111111] font-medium shadow-xs">
          <span>{sceneString}</span>
        </div>
      </div>
    </div>
  );
}
