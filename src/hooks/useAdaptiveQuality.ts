'use client';

import { useState, useEffect } from 'react';

export type QualityTier = 'HIGH' | 'MEDIUM' | 'LOW';

export interface QualityConfig {
  tier: QualityTier;
  dpr: number;
  nodeCountMultiplier: number;
  enableComplexMaterials: boolean;
  reducedMotion: boolean;
}

export function useAdaptiveQuality(): QualityConfig {
  const [tier, setTier] = useState<QualityTier>(() => {
    if (typeof window === 'undefined') return 'HIGH';
    const width = window.innerWidth;
    if (width < 768) return 'LOW';
    if (width < 1024) return 'MEDIUM';
    return 'HIGH';
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    const checkDevice = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
      const isTouch = typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 1 || 'ontouchstart' in window);

      if (isMobile || cores <= 2) {
        setTier('LOW');
      } else if (isTablet || (isTouch && cores <= 4)) {
        setTier('MEDIUM');
      } else {
        setTier('HIGH');
      }
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  const dpr = tier === 'HIGH' ? 2 : tier === 'MEDIUM' ? 1.5 : 1;
  const nodeCountMultiplier = tier === 'HIGH' ? 1.0 : tier === 'MEDIUM' ? 0.6 : 0.35;

  return {
    tier,
    dpr,
    nodeCountMultiplier,
    enableComplexMaterials: tier !== 'LOW',
    reducedMotion,
  };
}
