'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { useAdaptiveQuality } from '@/hooks/useAdaptiveQuality';
import { StageProgresses } from '@/hooks/useLandingScroll';
import { SceneCamera } from './SceneCamera';
import { SceneAtmosphere } from './SceneAtmosphere';
import { MorphingIntelligenceCore } from './MorphingIntelligenceCore';

interface PersistentSceneProps {
  progresses: StageProgresses;
}

export function PersistentScene({ progresses }: PersistentSceneProps) {
  const { dpr, reducedMotion } = useAdaptiveQuality();

  return (
    <div className="absolute inset-0 pointer-events-none -z-1">
      <Canvas
        dpr={dpr}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0.0, 0.0, 6.5], fov: 45, near: 0.1, far: 40 }}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <SceneCamera progresses={progresses} reducedMotion={reducedMotion} />
          <SceneAtmosphere progresses={progresses} />

          <MorphingIntelligenceCore
            progresses={progresses}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
