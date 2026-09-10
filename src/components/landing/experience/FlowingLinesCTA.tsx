'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StageProgresses } from '@/hooks/useLandingScroll';

interface FlowingLinesCTAProps {
  progresses: StageProgresses;
  reducedMotion: boolean;
}

export function FlowingLinesCTA({ progresses, reducedMotion }: FlowingLinesCTAProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Generate 5 smooth flowing ribbon splines
  const splineCurves = useMemo(() => {
    const curves = [];
    const count = 6;

    for (let i = 0; i < count; i++) {
      const yBase = (i - count / 2) * 0.45;
      const pts = [];
      for (let j = 0; j <= 8; j++) {
        const x = (j / 8) * 12 - 6;
        const y = yBase + Math.sin(j * 0.8 + i) * 0.4;
        const z = Math.cos(j * 0.6 + i) * 0.5;
        pts.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const points = curve.getPoints(48);
      const coords: number[] = [];
      points.forEach((p) => coords.push(p.x, p.y, p.z));

      curves.push({
        points: new Float32Array(coords),
        color: i % 2 === 0 ? '#2563eb' : '#38bdf8',
        opacity: 0.25 + (i % 3) * 0.1,
      });
    }

    return curves;
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    const { cta, product } = progresses;

    // Becomes visible toward end of page (product & cta)
    const isVisible = product > 0.2 || cta > 0.05;
    groupRef.current.visible = isVisible;
    if (!isVisible) return;

    const scale = THREE.MathUtils.lerp(0.3, 1.0, Math.min((product + cta) * 1.2, 1.0));
    groupRef.current.scale.setScalar(scale);

    if (!reducedMotion) {
      groupRef.current.position.y = Math.sin(time * 0.5) * 0.1;
      groupRef.current.rotation.z = Math.sin(time * 0.2) * 0.03;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {splineCurves.map((curve, idx) => (
        <line key={`flow-${idx}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[curve.points, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={curve.color}
            transparent
            opacity={curve.opacity}
            linewidth={1.5}
          />
        </line>
      ))}

      {/* Central Serene Shield Node at CTA */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshStandardMaterial
          color="#2563eb"
          emissive="#2563eb"
          emissiveIntensity={0.6}
          roughness={0.15}
        />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[0.38, 0.44, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}
