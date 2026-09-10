'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StageProgresses } from '@/hooks/useLandingScroll';

interface KnowledgeGraphProps {
  progresses: StageProgresses;
  nodeCountMultiplier: number;
  reducedMotion: boolean;
}

interface GraphNode {
  id: string;
  pos: THREE.Vector3;
  basePos: THREE.Vector3;
  color: string;
  size: number;
  category: 'financial' | 'technical' | 'experience' | 'legal' | 'doc' | 'general';
  isKeyNode?: boolean;
  label?: string;
  page?: string;
  metric?: string;
}

export function KnowledgeGraph({ progresses, nodeCountMultiplier, reducedMotion }: KnowledgeGraphProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cardGroupsRef = useRef<THREE.Group[]>([]);

  const totalNodes = Math.floor(40 * nodeCountMultiplier);

  const { graphNodes, linePairs } = useMemo(() => {
    const nodes: GraphNode[] = [];
    const colors = ['#2563eb', '#38bdf8', '#4f46e5', '#06b6d4', '#60a5fa'];

    // 3 Key requirement anchor nodes
    nodes.push({
      id: 'req-fin',
      pos: new THREE.Vector3(-1.8, 0.85, 0.6),
      basePos: new THREE.Vector3(-1.8, 0.85, 0.6),
      color: '#38bdf8',
      size: 0.22,
      category: 'financial',
      isKeyNode: true,
      label: 'FINANCIAL ELIGIBILITY',
      metric: 'Turnover >= ₹15.00 Cr',
      page: 'Page 18, Clause 4.2',
    });

    nodes.push({
      id: 'req-tech',
      pos: new THREE.Vector3(1.75, 0.75, 0.4),
      basePos: new THREE.Vector3(1.75, 0.75, 0.4),
      color: '#06b6d4',
      size: 0.22,
      category: 'technical',
      isKeyNode: true,
      label: 'TECHNICAL CRITERIA',
      metric: 'ISO 9001 & 27001 Certified',
      page: 'Page 31, Sec 8',
    });

    nodes.push({
      id: 'req-exp',
      pos: new THREE.Vector3(0.0, -1.05, 0.8),
      basePos: new THREE.Vector3(0.0, -1.05, 0.8),
      color: '#6366f1',
      size: 0.22,
      category: 'experience',
      isKeyNode: true,
      label: 'PAST EXPERIENCE',
      metric: '3 Railway Software Executions',
      page: 'Page 24, Clause 5.1',
    });

    // Surrounding structured nodes
    for (let i = 3; i < totalNodes; i++) {
      const angle = (i / totalNodes) * Math.PI * 2 + Math.sin(i);
      const dist = 1.2 + (i % 4) * 0.65;
      const x = Math.cos(angle) * dist * 1.3;
      const y = Math.sin(angle) * dist * 0.85 + (i % 3 === 0 ? 0.4 : -0.3);
      const z = (Math.sin(i * 3.5) * 1.8);

      nodes.push({
        id: `node-${i}`,
        pos: new THREE.Vector3(x, y, z),
        basePos: new THREE.Vector3(x, y, z),
        color: colors[i % colors.length],
        size: 0.08 + (i % 3 === 0 ? 0.06 : 0.02),
        category: 'general',
      });
    }

    // Build connections
    const lines: [THREE.Vector3, THREE.Vector3][] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = nodes[i].basePos.distanceTo(nodes[j].basePos);
        if (d < 1.75 && lines.length < 55) {
          lines.push([nodes[i].basePos, nodes[j].basePos]);
        }
      }
    }

    return { graphNodes: nodes, linePairs: lines };
  }, [totalNodes]);

  const linePositions = useMemo(() => {
    const coords: number[] = [];
    linePairs.forEach(([p1, p2]) => {
      coords.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
    });
    return new Float32Array(coords);
  }, [linePairs]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    const { graph, evidence, compliance } = progresses;

    // Active during graph (0 to 1) and evidence matching
    const isVisible = graph > 0.02 && compliance < 0.9;
    groupRef.current.visible = isVisible;
    if (!isVisible) return;

    // Graph scale expansion from data tokens
    const enterScale = THREE.MathUtils.lerp(0.2, 1.0, Math.min(graph * 1.5, 1.0));
    const exitShift = evidence * 0.5;
    
    groupRef.current.position.set(-exitShift, 0, 0);
    groupRef.current.scale.setScalar(enterScale);

    if (!reducedMotion) {
      groupRef.current.rotation.y = Math.sin(time * 0.15) * 0.08;
      groupRef.current.rotation.x = Math.cos(time * 0.12) * 0.05;
    }

    // Animate Key Node Requirement Badges emergence
    const keyNodes = graphNodes.filter((n) => n.isKeyNode);
    keyNodes.forEach((_, idx) => {
      const card = cardGroupsRef.current[idx];
      if (!card) return;

      const cardProgress = Math.max(0, Math.min((graph - 0.45) * 2.5, 1.0));
      card.scale.setScalar(cardProgress);
      card.visible = cardProgress > 0.01;
    });
  });

  const keyNodes = graphNodes.filter((n) => n.isKeyNode);

  return (
    <group ref={groupRef}>
      {/* 3D Knowledge Graph Connecting Lines */}
      {linePositions.length > 0 && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[linePositions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#2563eb"
            transparent
            opacity={0.45}
            linewidth={1}
          />
        </lineSegments>
      )}

      {/* Graph Nodes */}
      {graphNodes.map((n) => (
        <group key={n.id} position={n.basePos}>
          <mesh>
            <sphereGeometry args={[n.size, 16, 16]} />
            <meshStandardMaterial
              color={n.color}
              roughness={0.1}
              metalness={0.8}
              emissive={n.color}
              emissiveIntensity={n.isKeyNode ? 1.4 : 0.6}
            />
          </mesh>

          {/* Key Node Outer Pulsing Aura Ring */}
          {n.isKeyNode && (
            <mesh rotation={[Math.PI / 4, 0, 0]}>
              <ringGeometry args={[n.size * 1.3, n.size * 1.6, 24]} />
              <meshBasicMaterial
                color="#38bdf8"
                transparent
                opacity={0.85}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </group>
      ))}

      {/* Floating 3D Requirement Micro-Cards attached to Key Nodes (Dark Glass) */}
      {keyNodes.map((kn, idx) => (
        <group
          key={`card-${kn.id}`}
          position={[kn.basePos.x, kn.basePos.y + 0.42, kn.basePos.z + 0.15]}
          ref={(el) => {
            if (el) cardGroupsRef.current[idx] = el;
          }}
          visible={false}
        >
          {/* Card Dark Glass Surface */}
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[1.55, 0.65]} />
            <meshStandardMaterial
              color="#0b1329"
              roughness={0.2}
              metalness={0.5}
              transparent
              opacity={0.92}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Card Glowing Border */}
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(1.55, 0.65)]} />
            <lineBasicMaterial color="#38bdf8" linewidth={2} />
          </lineSegments>

          {/* Card Header Pill */}
          <mesh position={[-0.32, 0.18, 0.01]}>
            <planeGeometry args={[0.75, 0.12]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>

          {/* Card Data Bar */}
          <mesh position={[0, -0.02, 0.01]}>
            <planeGeometry args={[1.35, 0.08]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>

          {/* Citation Bar */}
          <mesh position={[-0.15, -0.18, 0.01]}>
            <planeGeometry args={[1.05, 0.06]} />
            <meshBasicMaterial color="#64748b" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
