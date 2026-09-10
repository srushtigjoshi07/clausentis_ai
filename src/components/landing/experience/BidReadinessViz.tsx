'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StageProgresses } from '@/hooks/useLandingScroll';

interface BidReadinessVizProps {
  progresses: StageProgresses;
  reducedMotion: boolean;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function BidReadinessViz({ progresses, reducedMotion }: BidReadinessVizProps) {
  const groupRef = useRef<THREE.Group>(null);
  const innerDialRef = useRef<THREE.Group>(null);
  const outerDialRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const particleData = useMemo(() => {
    const count = 55;
    const positions = new Float32Array(count * 3);
    const origins = [];

    for (let i = 0; i < count; i++) {
      const angle = pseudoRandom(i * 1.3) * Math.PI * 2;
      const radius = 2.4 + pseudoRandom(i * 2.7) * 1.5;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = (pseudoRandom(i * 3.5) - 0.5) * 1.2;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      origins.push({ x, y, z, speed: 0.01 + pseudoRandom(i * 4.2) * 0.015, progress: pseudoRandom(i * 5.1) });
    }

    return { positions, origins };
  }, []);

  const satellites = [
    { label: 'LEGAL 96%', angle: 0, score: '96%' },
    { label: 'FINANCIAL 92%', angle: (Math.PI * 2) / 5, score: '92%' },
    { label: 'EXPERIENCE 85%', angle: ((Math.PI * 2) / 5) * 2, score: '85%' },
    { label: 'TECHNICAL 78%', angle: ((Math.PI * 2) / 5) * 3, score: '78%' },
    { label: 'DOCS 100%', angle: ((Math.PI * 2) / 5) * 4, score: '100%' },
  ];

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    const { readiness, product, cta } = progresses;

    // Active during readiness (0 to 1) and transitioning into product / cta
    const isVisible = readiness > 0.02 && cta < 0.9;
    groupRef.current.visible = isVisible;
    if (!isVisible) return;

    // Readiness scale and transformation to product frame
    const enterScale = THREE.MathUtils.lerp(0.2, 1.0, Math.min(readiness * 1.6, 1.0));
    const flattenP = product;

    const scaleX = enterScale * (1.0 + flattenP * 0.4);
    const scaleY = enterScale * (1.0 - flattenP * 0.3);
    const scaleZ = enterScale * (1.0 - flattenP * 0.6);

    groupRef.current.scale.set(scaleX, scaleY, scaleZ);

    if (!reducedMotion) {
      if (innerDialRef.current) {
        innerDialRef.current.rotation.z = time * 0.35;
      }
      if (outerDialRef.current) {
        outerDialRef.current.rotation.z = -time * 0.2;
      }
    }

    // Animate inward converging particles
    if (!reducedMotion && particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const array = posAttr.array as Float32Array;

      particleData.origins.forEach((orig, i) => {
        orig.progress += orig.speed;
        if (orig.progress >= 1.0) orig.progress = 0.0;

        const p = 1.0 - orig.progress;
        array[i * 3] = orig.x * p;
        array[i * 3 + 1] = orig.y * p;
        array[i * 3 + 2] = orig.z * p;
      });

      posAttr.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer Rotating Segmented Hologram Ring */}
      <group ref={outerDialRef}>
        <mesh>
          <torusGeometry args={[2.0, 0.025, 16, 64]} />
          <meshStandardMaterial
            color="#38bdf8"
            emissive="#38bdf8"
            emissiveIntensity={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Dial Measurement Ticks */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2;
          const isLong = i % 4 === 0;
          const len = isLong ? 0.22 : 0.1;
          const r = 2.0;
          return (
            <mesh
              key={`tick-${i}`}
              position={[Math.cos(angle) * r, Math.sin(angle) * r, 0]}
              rotation={[0, 0, angle + Math.PI / 2]}
            >
              <boxGeometry args={[0.02, len, 0.01]} />
              <meshBasicMaterial color={isLong ? '#38bdf8' : '#60a5fa'} />
            </mesh>
          );
        })}
      </group>

      {/* Inner Fast Rotating Tech Ring */}
      <group ref={innerDialRef}>
        <mesh>
          <torusGeometry args={[1.3, 0.018, 16, 48]} />
          <meshBasicMaterial color="#06b6d4" />
        </mesh>
      </group>

      {/* Central Dark Glass Plate */}
      <mesh position={[0, 0, 0]}>
        <circleGeometry args={[0.9, 32]} />
        <meshStandardMaterial
          color="#0b1329"
          roughness={0.2}
          metalness={0.5}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Outer Cyan Ring on Plate */}
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[0.82, 0.88, 32]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Central Glowing Orb Core */}
      <mesh position={[0, 0, -0.05]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
      </mesh>

      {/* 5 Categorical Satellite Nodes */}
      {satellites.map((sat, idx) => {
        const x = Math.cos(sat.angle) * 2.6;
        const y = Math.sin(sat.angle) * 2.6;
        return (
          <group key={`sat-${idx}`} position={[x, y, 0]}>
            {/* Satellite Node */}
            <mesh>
              <sphereGeometry args={[0.12, 16, 16]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#38bdf8"
                emissiveIntensity={1.2}
              />
            </mesh>

            {/* Dark Glass Satellite Card Pill */}
            <mesh position={[0, 0.22, 0]}>
              <planeGeometry args={[0.85, 0.2]} />
              <meshStandardMaterial color="#0b1329" roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.22, 0.01]}>
              <planeGeometry args={[0.7, 0.05]} />
              <meshBasicMaterial color="#10b981" />
            </mesh>

            {/* Connecting Spoke Line to Center */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[new Float32Array([0, 0, 0, -x * 0.6, -y * 0.6, 0]), 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#38bdf8" transparent opacity={0.4} />
            </line>
          </group>
        );
      })}

      {/* Converging Stream Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particleData.positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#38bdf8"
          transparent
          opacity={0.9}
        />
      </points>
    </group>
  );
}
