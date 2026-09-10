'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useAdaptiveQuality } from '@/hooks/useAdaptiveQuality';
import { useFullLandingScroll } from '@/hooks/useFullLandingScroll';
import { SceneCamera } from './SceneCamera';
import { SceneAtmosphere } from './SceneAtmosphere';
import { MorphingIntelligenceCore } from './MorphingIntelligenceCore';
import { calcNormalizedProgress } from '@/hooks/useLandingScroll';

export function LandingPersistent3DCanvas() {
  const { dpr, reducedMotion } = useAdaptiveQuality();
  const story = useFullLandingScroll();
  const progress = story.damped;

  const sceneProgresses = {
    global: progress,
    hero: 1 - Math.min(progress / 0.12, 1),
    ingestion: calcNormalizedProgress(progress, 0.10, 0.25),
    extraction: calcNormalizedProgress(progress, 0.25, 0.45),
    graph: calcNormalizedProgress(progress, 0.45, 0.65),
    evidence: calcNormalizedProgress(progress, 0.65, 0.80),
    compliance: calcNormalizedProgress(progress, 0.80, 0.92),
    readiness: calcNormalizedProgress(progress, 0.90, 0.98),
    product: calcNormalizedProgress(progress, 0.92, 1.0),
    cta: calcNormalizedProgress(progress, 0.95, 1.0),
    mouse: story.mouse,
  };

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 w-full h-full overflow-hidden select-none">
      {/* Dynamic Scroll Progress Indicator for Verification */}
      <div className="absolute top-4 right-4 z-50 text-[10px] font-mono text-blue-400/60 bg-blue-950/40 px-2.5 py-1 rounded-full border border-blue-500/20 backdrop-blur-md hidden sm:block">
        SCENE: {Math.round(progress * 100)}%
      </div>

      <Canvas
        dpr={dpr}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0.0, 0.0, 7.0], fov: 45, near: 0.1, far: 50 }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <SceneCamera progresses={sceneProgresses} reducedMotion={reducedMotion} />
          <SceneAtmosphere progresses={sceneProgresses} />
          <MorphingIntelligenceCore
            progresses={sceneProgresses}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
