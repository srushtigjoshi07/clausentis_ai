'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StageProgresses } from '@/hooks/useLandingScroll';

interface SceneAtmosphereProps {
  progresses: StageProgresses;
}

export function SceneAtmosphere({ progresses }: SceneAtmosphereProps) {
  const accentLightRef = useRef<THREE.PointLight>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    const rawP =
      typeof window !== 'undefined' &&
      (window as unknown as { __landingScrollProgress?: number }).__landingScrollProgress !== undefined
        ? (window as unknown as { __landingScrollProgress: number }).__landingScrollProgress
        : progresses.global;

    const global = Math.min(Math.max(rawP, 0), 1);

    if (accentLightRef.current) {
      if (global <= 0.125) {
        accentLightRef.current.position.set(2.0, 1.5, 2.5);
        accentLightRef.current.intensity = 2.2;
      } else if (global <= 0.25) {
        // Scene 02: Subtle localized accent light moving through archive
        const s2 = (global - 0.125) / 0.125;
        accentLightRef.current.position.set(
          THREE.MathUtils.lerp(-1.5, 1.5, s2),
          THREE.MathUtils.lerp(1.2, -1.2, s2),
          THREE.MathUtils.lerp(2.0, 0.5, s2)
        );
        accentLightRef.current.intensity = 2.8;
      } else if (global <= 0.375) {
        // Scene 03: Architectural structure key accent
        accentLightRef.current.position.set(0.0, 1.8, 1.5);
        accentLightRef.current.intensity = 3.0;
      } else if (global <= 0.50) {
        // Scene 04: Restrained central point
        accentLightRef.current.position.set(0.0, 0.5, 2.0);
        accentLightRef.current.intensity = 2.4;
      } else {
        accentLightRef.current.position.set(0.0, 1.5, 3.0);
        accentLightRef.current.intensity = 2.0;
      }
    }
  });

  return (
    <>
      {/* Soft neutral white ambient base */}
      <ambientLight intensity={0.75} color="#ffffff" />

      {/* Crisp, subtle directional key light */}
      <directionalLight
        ref={keyLightRef}
        position={[4, 7, 6]}
        intensity={1.2}
        color="#ffffff"
      />

      {/* Controlled, neutral charcoal accent light (never electric blue) */}
      <pointLight
        ref={accentLightRef}
        position={[2.0, 1.5, 2.5]}
        intensity={1.8}
        color="#404040"
        distance={22}
        decay={2.2}
      />

      {/* Pure white atmospheric depth falloff */}
      <fog attach="fog" args={['#FFFFFF', 16, 70]} />
    </>
  );
}
