'use client';

import { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useAdaptiveQuality } from '@/hooks/useAdaptiveQuality';
import { SceneCamera } from './SceneCamera';
import { SceneAtmosphere } from './SceneAtmosphere';
import { MorphingIntelligenceCore } from './MorphingIntelligenceCore';
import { StageProgresses } from '@/hooks/useLandingScroll';

const INITIAL_PROGRESSES: StageProgresses = {
  global: 0,
  hero: 1,
  ingestion: 0,
  extraction: 0,
  graph: 0,
  evidence: 0,
  compliance: 0,
  readiness: 0,
  product: 0,
  cta: 0,
  mouse: { x: 0, y: 0 },
};

export function PersistentHeroBackground() {
  const { dpr, reducedMotion } = useAdaptiveQuality();

  // Stable reference so Canvas never re-renders unnecessarily on scroll.
  // SceneCamera, SceneAtmosphere, and MorphingIntelligenceCore read
  // window.__landingScrollProgress at 60 FPS inside useFrame directly.
  const staticProgresses = useMemo(() => INITIAL_PROGRESSES, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 w-full h-full overflow-hidden select-none">
      <Canvas
        dpr={dpr}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0.0, 0.0, 7.0], fov: 45, near: 0.1, far: 80 }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <SceneCamera progresses={staticProgresses} reducedMotion={reducedMotion} />
          <SceneAtmosphere progresses={staticProgresses} />
          <MorphingIntelligenceCore
            progresses={staticProgresses}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
