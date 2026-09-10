'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StageProgresses } from '@/hooks/useLandingScroll';

interface EvidenceConnectionsProps {
  progresses: StageProgresses;
  reducedMotion: boolean;
}

interface EvidencePair {
  id: string;
  reqTitle: string;
  reqPos: THREE.Vector3;
  docTitle: string;
  docPos: THREE.Vector3;
  curve: THREE.QuadraticBezierCurve3;
  curvePoints: Float32Array;
  status: 'PASS';
}

export function EvidenceConnections({ progresses, reducedMotion }: EvidenceConnectionsProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseMeshesRef = useRef<THREE.Mesh[]>([]);

  const pairs: EvidencePair[] = useMemo(() => {
    const rawPairs = [
      {
        id: 'ev-1',
        reqTitle: 'Turnover >= ₹15 Cr',
        reqPos: new THREE.Vector3(-2.4, 1.1, 0.4),
        docTitle: 'CA Audited Balance Sheet',
        docPos: new THREE.Vector3(2.4, 1.0, 0.2),
        controlPos: new THREE.Vector3(0.0, 1.8, 1.4),
        status: 'PASS' as const,
      },
      {
        id: 'ev-2',
        reqTitle: 'ISO 9001:2015 Cert',
        reqPos: new THREE.Vector3(-2.4, 0.0, 0.3),
        docTitle: 'TUV Nord ISO 9001 & 27001',
        docPos: new THREE.Vector3(2.4, 0.05, 0.4),
        controlPos: new THREE.Vector3(0.0, 0.3, 1.2),
        status: 'PASS' as const,
      },
      {
        id: 'ev-3',
        reqTitle: '3 Railway Executions',
        reqPos: new THREE.Vector3(-2.4, -1.1, 0.5),
        docTitle: 'RailTel Completion Certs',
        docPos: new THREE.Vector3(2.4, -1.0, 0.3),
        controlPos: new THREE.Vector3(0.0, -1.8, 1.3),
        status: 'PASS' as const,
      },
    ];

    return rawPairs.map((p) => {
      const curve = new THREE.QuadraticBezierCurve3(p.reqPos, p.controlPos, p.docPos);
      const points = curve.getPoints(36);
      const coords: number[] = [];
      points.forEach((pt) => coords.push(pt.x, pt.y, pt.z));
      return {
        ...p,
        curve,
        curvePoints: new Float32Array(coords),
      };
    });
  }, []);

  const pulseData = useRef([
    { progress: 0.1, speed: 0.016 },
    { progress: 0.45, speed: 0.018 },
    { progress: 0.75, speed: 0.015 },
  ]);

  useFrame(() => {
    if (!groupRef.current) return;
    const { evidence, compliance, global } = progresses;

    const isVisible = evidence > 0.02 && compliance < 0.85;
    groupRef.current.visible = isVisible;
    if (!isVisible) return;

    const scale = THREE.MathUtils.lerp(0.3, 1.0, Math.min(evidence * 1.8, 1.0));
    groupRef.current.scale.setScalar(scale);

    const energyMult = 1.0 + global * 1.5;

    if (!reducedMotion) {
      pulseData.current.forEach((pulse, idx) => {
        const mesh = pulseMeshesRef.current[idx];
        if (!mesh) return;

        pulse.progress += pulse.speed * energyMult;
        if (pulse.progress >= 1.0) pulse.progress = 0.0;

        const curve = pairs[idx].curve;
        const currentPt = curve.getPoint(pulse.progress);
        mesh.position.copy(currentPt);

        const pulseScale = (Math.sin(pulse.progress * Math.PI) * 0.6 + 0.6) * (1.0 + evidence * 0.5);
        mesh.scale.setScalar(pulseScale);
      });
    }
  });

  return (
    <group ref={groupRef}>
      {pairs.map((pair, idx) => (
        <group key={pair.id}>
          {/* Left Requirement Node */}
          <group position={pair.reqPos}>
            <mesh>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial
                color="#38bdf8"
                emissive="#38bdf8"
                emissiveIntensity={1.4}
                roughness={0.1}
              />
            </mesh>

            <mesh position={[-0.45, 0.3, 0]}>
              <planeGeometry args={[1.2, 0.35]} />
              <meshStandardMaterial color="#07111f" transparent opacity={0.9} />
            </mesh>
            <mesh position={[-0.45, 0.3, 0.01]}>
              <planeGeometry args={[1.1, 0.06]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </group>

          {/* Right Company Document Match Node */}
          <group position={pair.docPos}>
            <mesh>
              <boxGeometry args={[0.3, 0.38, 0.08]} />
              <meshStandardMaterial
                color="#2496ff"
                emissive="#2496ff"
                emissiveIntensity={1.2}
                roughness={0.15}
              />
            </mesh>

            <mesh position={[0.45, 0.3, 0]}>
              <planeGeometry args={[1.2, 0.35]} />
              <meshStandardMaterial color="#07111f" transparent opacity={0.9} />
            </mesh>
            <mesh position={[0.45, 0.3, 0.01]}>
              <planeGeometry args={[1.1, 0.06]} />
              <meshBasicMaterial color="#10b981" />
            </mesh>
          </group>

          {/* High-Energy Curved Electrical Connection Arc */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[pair.curvePoints, 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.95}
              linewidth={2}
            />
          </line>

          {/* Traveling Bright Electric Energy Pulse Mesh */}
          <mesh
            ref={(el) => {
              if (el) pulseMeshesRef.current[idx] = el;
            }}
          >
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  );
}
