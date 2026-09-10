'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StageProgresses } from '@/hooks/useLandingScroll';

interface ExtractionBeamProps {
  progresses: StageProgresses;
  nodeCountMultiplier: number;
  reducedMotion: boolean;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function ExtractionBeam({ progresses, nodeCountMultiplier, reducedMotion }: ExtractionBeamProps) {
  const groupRef = useRef<THREE.Group>(null);
  const laserBarRef = useRef<THREE.Mesh>(null);
  const scanPlaneRef = useRef<THREE.Mesh>(null);

  const tokenCount = Math.floor(36 * nodeCountMultiplier);
  const tokenData = useMemo(() => {
    const tokens = [];
    const colors = ['#2496ff', '#38bdf8', '#06b6d4', '#4f46e5', '#60a5fa'];
    
    for (let i = 0; i < tokenCount; i++) {
      const docCol = (i % 3) - 1;
      const startX = docCol * 1.8 + (pseudoRandom(i * 1.7) - 0.5) * 1.1;
      const startY = 1.0 - (i / tokenCount) * 2.2;
      const startZ = 0.5 + pseudoRandom(i * 2.9) * 0.4;

      const endX = startX * 1.6 + (pseudoRandom(i * 3.3) - 0.5) * 1.5;
      const endY = startY * 1.3 + (pseudoRandom(i * 4.1) - 0.5) * 1.2;
      const endZ = 1.2 + pseudoRandom(i * 5.7) * 1.8;

      tokens.push({
        startPos: new THREE.Vector3(startX, startY, startZ),
        endPos: new THREE.Vector3(endX, endY, endZ),
        color: colors[i % colors.length],
        size: 0.06 + pseudoRandom(i * 6.9) * 0.08,
        triggerY: startY,
        speed: 0.8 + pseudoRandom(i * 7.5) * 0.6,
      });
    }
    return tokens;
  }, [tokenCount]);

  const tokenMeshesRef = useRef<THREE.Mesh[]>([]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    const { extraction, graph } = progresses;

    const isVisible = extraction > 0.01 && graph < 0.85;
    groupRef.current.visible = isVisible;
    if (!isVisible) return;

    const scanY = THREE.MathUtils.lerp(1.6, -1.6, extraction);

    if (laserBarRef.current) {
      laserBarRef.current.position.set(0, scanY, 1.1);
      const pulse = Math.sin(time * 16) * 0.2 + 0.85;
      laserBarRef.current.scale.set(1.0, pulse, 1.0);
    }

    if (scanPlaneRef.current) {
      scanPlaneRef.current.position.set(0, scanY + 0.4, 0.9);
    }

    tokenData.forEach((token, idx) => {
      const mesh = tokenMeshesRef.current[idx];
      if (!mesh) return;

      const hasPassed = scanY <= token.triggerY;
      if (hasPassed) {
        const tokenP = Math.min(1.0, (token.triggerY - scanY) * token.speed * 0.8 + extraction * 0.4);
        
        mesh.visible = true;
        mesh.position.lerpVectors(token.startPos, token.endPos, tokenP);
        
        if (!reducedMotion) {
          mesh.rotation.x = time * 2.5 + idx;
          mesh.rotation.y = time * 1.8 + idx;
        }

        const scale = THREE.MathUtils.lerp(0.2, 1.0, Math.min(tokenP * 2, 1.0));
        mesh.scale.setScalar(scale);
      } else {
        mesh.visible = false;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* High-Intensity Electric Cyan Scanning Laser Discharge Bar */}
      <mesh ref={laserBarRef} position={[0, 1.6, 1.1]}>
        <boxGeometry args={[5.6, 0.04, 0.04]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Volumetric Glowing Electrical Plasma Scan Curtain */}
      <mesh ref={scanPlaneRef} position={[0, 2.0, 0.9]}>
        <planeGeometry args={[5.6, 0.8]} />
        <meshBasicMaterial
          color="#1683ff"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Extracted 3D Electric Data Tokens */}
      {tokenData.map((t, idx) => (
        <mesh
          key={`token-${idx}`}
          ref={(el) => {
            if (el) tokenMeshesRef.current[idx] = el;
          }}
          visible={false}
        >
          <boxGeometry args={[t.size, t.size, t.size]} />
          <meshStandardMaterial
            color={t.color}
            roughness={0.1}
            metalness={0.9}
            emissive={t.color}
            emissiveIntensity={1.2}
          />
        </mesh>
      ))}
    </group>
  );
}
