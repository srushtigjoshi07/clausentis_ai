'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StageProgresses } from '@/hooks/useLandingScroll';

interface NeuralCoreProps {
  progresses: StageProgresses;
  nodeCountMultiplier: number;
  reducedMotion: boolean;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function NeuralCore({ progresses, nodeCountMultiplier, reducedMotion }: NeuralCoreProps) {
  const groupRef = useRef<THREE.Group>(null);
  const leftHemiRef = useRef<THREE.Group>(null);
  const rightHemiRef = useRef<THREE.Group>(null);
  const coreMeshRef = useRef<THREE.Mesh>(null);
  const innerMeshRef = useRef<THREE.Mesh>(null);
  const nucleusRef = useRef<THREE.Mesh>(null);
  const sparkLinesRef = useRef<THREE.LineSegments>(null);
  const orbitalRingsRef = useRef<THREE.Group>(null);

  const totalNodes = Math.floor(48 * nodeCountMultiplier);
  const { nodeData, linePositions, sparkPositions } = useMemo(() => {
    const nodes: {
      pos: THREE.Vector3;
      basePos: THREE.Vector3;
      hemi: 'left' | 'right' | 'center';
      color: string;
      size: number;
      speed: number;
      phase: number;
    }[] = [];

    const colors = ['#2496ff', '#38bdf8', '#1683ff', '#4f46e5', '#6366f1', '#06b6d4'];

    for (let i = 0; i < totalNodes; i++) {
      const isLeft = i % 2 === 0;
      const hemi = i < 6 ? 'center' : isLeft ? 'left' : 'right';

      const hemiOffset = hemi === 'left' ? -0.9 : hemi === 'right' ? 0.9 : 0;
      const angle = pseudoRandom(i * 1.1) * Math.PI * 2;
      const radius = 0.5 + pseudoRandom(i * 2.3) * 1.6;
      const elevation = (pseudoRandom(i * 3.7) - 0.5) * 2.2;
      const zDepth = (pseudoRandom(i * 4.9) - 0.5) * 2.4;

      const x = hemiOffset + Math.cos(angle) * radius * (hemi === 'center' ? 0.6 : 0.85);
      const y = elevation * 0.9;
      const z = zDepth;

      const pos = new THREE.Vector3(x, y, z);
      nodes.push({
        pos: pos.clone(),
        basePos: pos.clone(),
        hemi,
        color: colors[i % colors.length],
        size: 0.08 + pseudoRandom(i * 5.5) * 0.12,
        speed: 0.4 + pseudoRandom(i * 6.2) * 0.8,
        phase: pseudoRandom(i * 7.1) * Math.PI * 2,
      });
    }

    // Interconnecting Neural Lines
    const lineCoords: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = nodes[i].basePos.distanceTo(nodes[j].basePos);
        if (d < 1.45) {
          lineCoords.push(
            nodes[i].basePos.x, nodes[i].basePos.y, nodes[i].basePos.z,
            nodes[j].basePos.x, nodes[j].basePos.y, nodes[j].basePos.z
          );
        }
      }
    }

    // Dynamic Electric Core Arcs / Sparks shooting from center to nearby nodes
    const sparkCoords: number[] = [];
    nodes.slice(0, 14).forEach((n) => {
      sparkCoords.push(0, 0, 0, n.basePos.x, n.basePos.y, n.basePos.z);
    });

    return {
      nodeData: nodes,
      linePositions: new Float32Array(lineCoords),
      sparkPositions: new Float32Array(sparkCoords),
    };
  }, [totalNodes]);

  const packetCount = Math.floor(22 * nodeCountMultiplier);
  const packetData = useMemo(() => {
    return Array.from({ length: packetCount }).map((_, i) => ({
      fromIdx: Math.floor(pseudoRandom(i * 8.1) * nodeData.length),
      toIdx: Math.floor(pseudoRandom(i * 9.3) * nodeData.length),
      progress: pseudoRandom(i * 10.5),
      speed: 0.008 + pseudoRandom(i * 11.7) * 0.012,
      color: i % 2 === 0 ? '#38bdf8' : '#ffffff',
    }));
  }, [packetCount, nodeData]);

  const packetMeshesRef = useRef<THREE.Mesh[]>([]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    const { ingestion, graph, global } = progresses;

    const activeVisibility = Math.max(0, 1 - (graph * 1.5));
    groupRef.current.visible = activeVisibility > 0.01;
    if (!groupRef.current.visible) return;

    const openProgress = ingestion;
    const energyLevel = 0.6 + global * 1.8;

    const targetX = THREE.MathUtils.lerp(1.35, 0.0, openProgress);
    const targetY = THREE.MathUtils.lerp(0.0, 0.2, openProgress);
    const targetScale = THREE.MathUtils.lerp(1.0, 1.25, openProgress) * activeVisibility;

    groupRef.current.position.set(targetX, targetY, 0);
    groupRef.current.scale.setScalar(targetScale);

    if (!reducedMotion) {
      groupRef.current.rotation.y = time * 0.15 + openProgress * 0.6;
      groupRef.current.rotation.x = Math.sin(time * 0.1) * 0.08;
    }

    if (leftHemiRef.current && rightHemiRef.current) {
      const separation = openProgress * 1.4;
      leftHemiRef.current.position.x = -separation;
      rightHemiRef.current.position.x = separation;

      leftHemiRef.current.rotation.y = -openProgress * 0.4;
      rightHemiRef.current.rotation.y = openProgress * 0.4;
    }

    // Energetic core current rotation & pulsing
    if (coreMeshRef.current && innerMeshRef.current && nucleusRef.current) {
      const coreScale = THREE.MathUtils.lerp(1.0, 1.8, openProgress);
      coreMeshRef.current.scale.setScalar(coreScale);
      coreMeshRef.current.rotation.y = time * (0.35 * energyLevel);
      coreMeshRef.current.rotation.z = time * 0.2;

      const innerScale = THREE.MathUtils.lerp(1.0, 2.2, openProgress);
      innerMeshRef.current.scale.setScalar(innerScale);
      innerMeshRef.current.rotation.y = -time * (0.45 * energyLevel);

      const nucPulse = Math.sin(time * (4.0 * energyLevel)) * 0.15 + 0.95;
      nucleusRef.current.scale.setScalar(nucPulse);
    }

    if (orbitalRingsRef.current) {
      orbitalRingsRef.current.rotation.z = time * (0.15 * energyLevel);
      orbitalRingsRef.current.rotation.x = THREE.MathUtils.lerp(Math.PI / 3, Math.PI / 2, openProgress);
    }

    // Animate data packets
    if (!reducedMotion && packetMeshesRef.current.length > 0) {
      packetData.forEach((packet, i) => {
        const mesh = packetMeshesRef.current[i];
        if (!mesh) return;

        packet.progress += packet.speed * energyLevel;
        if (packet.progress >= 1) {
          packet.progress = 0;
          packet.fromIdx = (packet.fromIdx + 1) % nodeData.length;
          packet.toIdx = (packet.toIdx + 2) % nodeData.length;
        }

        const p1 = nodeData[packet.fromIdx]?.basePos;
        const p2 = nodeData[packet.toIdx]?.basePos;
        if (p1 && p2) {
          mesh.position.lerpVectors(p1, p2, packet.progress);
          const pulse = Math.sin(packet.progress * Math.PI) * 0.8 + 0.3;
          mesh.scale.setScalar(pulse);
        }
      });
    }
  });

  return (
    <group ref={groupRef} position={[1.35, 0, 0]}>
      {/* Central Abstract Electrical Neural Intelligence Core */}
      <mesh ref={coreMeshRef}>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial
          color="#1683ff"
          wireframe
          transparent
          opacity={0.7}
          roughness={0.1}
          metalness={0.9}
          emissive="#1683ff"
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Inner Glowing Holographic Dodecahedron */}
      <mesh ref={innerMeshRef}>
        <dodecahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial
          color="#38bdf8"
          wireframe
          transparent
          opacity={0.85}
          roughness={0.05}
          metalness={0.95}
          emissive="#38bdf8"
          emissiveIntensity={0.8}
        />
      </mesh>

      {/* Electric Energy Nucleus */}
      <mesh ref={nucleusRef}>
        <sphereGeometry args={[0.32, 24, 24]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.42, 20, 20]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.45}
        />
      </mesh>

      {/* Dynamic Electric Arcs Shooting Out from Core */}
      {sparkPositions.length > 0 && (
        <lineSegments ref={sparkLinesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[sparkPositions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.65}
            linewidth={1.5}
          />
        </lineSegments>
      )}

      {/* Orbital Electric Blue Rings */}
      <group ref={orbitalRingsRef}>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[2.2, 0.015, 16, 80]} />
          <meshBasicMaterial color="#2496ff" transparent opacity={0.6} />
        </mesh>
        <mesh rotation={[-Math.PI / 4, Math.PI / 6, 0]}>
          <torusGeometry args={[2.6, 0.01, 16, 80]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Left Neural Hemisphere Cluster */}
      <group ref={leftHemiRef}>
        {nodeData
          .filter((n) => n.hemi === 'left' || n.hemi === 'center')
          .map((n, i) => (
            <mesh key={`l-${i}`} position={n.basePos}>
              <sphereGeometry args={[n.size, 16, 16]} />
              <meshStandardMaterial
                color={n.color}
                roughness={0.1}
                metalness={0.8}
                emissive={n.color}
                emissiveIntensity={0.8}
              />
            </mesh>
          ))}
      </group>

      {/* Right Neural Hemisphere Cluster */}
      <group ref={rightHemiRef}>
        {nodeData
          .filter((n) => n.hemi === 'right')
          .map((n, i) => (
            <mesh key={`r-${i}`} position={n.basePos}>
              <sphereGeometry args={[n.size, 16, 16]} />
              <meshStandardMaterial
                color={n.color}
                roughness={0.1}
                metalness={0.8}
                emissive={n.color}
                emissiveIntensity={0.8}
              />
            </mesh>
          ))}
      </group>

      {/* Interconnecting Neural Lines */}
      {linePositions.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[linePositions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#2496ff"
            transparent
            opacity={0.35}
            linewidth={1}
          />
        </lineSegments>
      )}

      {/* High-Speed Blue/White Energy Packets */}
      {packetData.map((p, idx) => (
        <mesh
          key={`pkt-${idx}`}
          ref={(el) => {
            if (el) packetMeshesRef.current[idx] = el;
          }}
        >
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshBasicMaterial color={p.color} />
        </mesh>
      ))}
    </group>
  );
}
