'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StageProgresses } from '@/hooks/useLandingScroll';

interface ComplianceSystemProps {
  progresses: StageProgresses;
  reducedMotion: boolean;
}

interface ColumnConfig {
  id: string;
  name: string;
  x: number;
  nodes: { label: string; status: 'PASS' | 'REVIEW'; y: number }[];
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'col-legal',
    name: 'LEGAL',
    x: -2.4,
    nodes: [
      { label: 'Blacklisting Undertaking', status: 'PASS', y: 0.9 },
      { label: 'Power of Attorney', status: 'PASS', y: 0.2 },
      { label: 'JV Agreement Model', status: 'PASS', y: -0.5 },
    ],
  },
  {
    id: 'col-fin',
    name: 'FINANCIAL',
    x: -1.2,
    nodes: [
      { label: 'Annual Turnover', status: 'PASS', y: 0.9 },
      { label: 'Net Worth Proof', status: 'PASS', y: 0.2 },
      { label: 'Solvency Certificate', status: 'PASS', y: -0.5 },
    ],
  },
  {
    id: 'col-exp',
    name: 'EXPERIENCE',
    x: 0.0,
    nodes: [
      { label: '3 Sim Projects Executed', status: 'PASS', y: 0.9 },
      { label: 'Govt Client Credentials', status: 'PASS', y: 0.2 },
      { label: 'Completion Timing', status: 'REVIEW', y: -0.5 },
    ],
  },
  {
    id: 'col-tech',
    name: 'TECHNICAL',
    x: 1.2,
    nodes: [
      { label: 'ISO 9001:2015', status: 'PASS', y: 0.9 },
      { label: 'ISO 27001 Security', status: 'PASS', y: 0.2 },
      { label: 'OEM Authorization', status: 'REVIEW', y: -0.5 },
    ],
  },
  {
    id: 'col-doc',
    name: 'DOCUMENTS',
    x: 2.4,
    nodes: [
      { label: 'EMD Guarantee Deposit', status: 'PASS', y: 0.9 },
      { label: 'GST & PAN Filings', status: 'PASS', y: 0.2 },
      { label: 'Integrity Pact Form', status: 'PASS', y: -0.5 },
    ],
  },
];

export function ComplianceSystem({ progresses, reducedMotion }: ComplianceSystemProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    const { compliance, readiness } = progresses;

    // Active during compliance (0 to 1) and transitioning into readiness dial
    const isVisible = compliance > 0.02 && readiness < 0.85;
    groupRef.current.visible = isVisible;
    if (!isVisible) return;

    const organizeP = compliance;
    const exitConvergence = readiness;

    const scale = THREE.MathUtils.lerp(0.4, 1.0, Math.min(organizeP * 1.5, 1.0)) * (1 - exitConvergence * 0.7);
    groupRef.current.scale.setScalar(scale);

    if (!reducedMotion) {
      groupRef.current.rotation.y = Math.sin(time * 0.1) * 0.04;
    }
  });

  return (
    <group ref={groupRef}>
      {COLUMNS.map((col) => (
        <group key={col.id} position={[col.x, 0, 0]}>
          {/* Vertical Organizing Spine Line */}
          <mesh position={[0, 0.2, -0.05]}>
            <boxGeometry args={[0.02, 2.4, 0.02]} />
            <meshStandardMaterial color="#2563eb" emissive="#2563eb" emissiveIntensity={0.5} transparent opacity={0.6} />
          </mesh>

          {/* Column Top Header Plate (Dark Glass) */}
          <mesh position={[0, 1.45, 0]}>
            <planeGeometry args={[1.0, 0.24]} />
            <meshStandardMaterial color="#0b1329" roughness={0.1} />
          </mesh>
          <mesh position={[0, 1.45, 0.01]}>
            <planeGeometry args={[0.85, 0.06]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>

          {/* Status Nodes Along the Column */}
          {col.nodes.map((node, nodeIdx) => {
            const isPass = node.status === 'PASS';
            const statusColor = isPass ? '#10b981' : '#f59e0b';

            return (
              <group key={`cnode-${nodeIdx}`} position={[0, node.y, 0]}>
                {/* Node Core */}
                <mesh>
                  <sphereGeometry args={[0.12, 16, 16]} />
                  <meshStandardMaterial
                    color="#38bdf8"
                    emissive="#38bdf8"
                    emissiveIntensity={0.8}
                    roughness={0.1}
                  />
                </mesh>

                {/* Status Indicator Pill */}
                <mesh position={[0.22, 0, 0.02]}>
                  <boxGeometry args={[0.24, 0.09, 0.03]} />
                  <meshBasicMaterial color={statusColor} />
                </mesh>

                {/* Status Glow Aura */}
                <mesh position={[0, 0, -0.02]}>
                  <ringGeometry args={[0.13, 0.18, 16]} />
                  <meshBasicMaterial color={statusColor} transparent opacity={0.6} />
                </mesh>
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
}
