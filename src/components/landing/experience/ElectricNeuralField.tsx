'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StageProgresses } from '@/hooks/useLandingScroll';

interface ElectricNeuralFieldProps {
  progresses: StageProgresses;
  nodeCountMultiplier: number;
  reducedMotion: boolean;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

interface ElectricalBranch {
  id: string;
  points: Float32Array;
  curve: THREE.CatmullRomCurve3;
  level: number; // 0 = trunk, 1 = branch, 2 = capillary
  startNode: THREE.Vector3;
  endNode: THREE.Vector3;
  color: string;
  baseOpacity: number;
}

interface EnergyPulse {
  branchIdx: number;
  progress: number;
  speed: number;
  size: number;
  color: string;
}

export function ElectricNeuralField({ progresses, nodeCountMultiplier, reducedMotion }: ElectricNeuralFieldProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseMeshesRef = useRef<THREE.Mesh[]>([]);
  const nodeMeshesRef = useRef<THREE.Mesh[]>([]);

  const branchCount = Math.floor(36 * nodeCountMultiplier);
  const pulseCount = Math.floor(28 * nodeCountMultiplier);

  // Generate hierarchical branching electrical pathways
  const { branches, junctionNodes } = useMemo(() => {
    const branchList: ElectricalBranch[] = [];
    const nodes: { pos: THREE.Vector3; color: string; size: number; baseGlow: number }[] = [];

    const trunkColors = ['#2496ff', '#1683ff', '#38bdf8', '#4f46e5', '#6366f1'];

    // 1. Root nodes near the central core
    const rootPositions: THREE.Vector3[] = [];
    for (let r = 0; r < 8; r++) {
      const angle = (r / 8) * Math.PI * 2;
      const rad = 0.8 + pseudoRandom(r * 1.5) * 0.6;
      const rootPos = new THREE.Vector3(
        Math.cos(angle) * rad,
        Math.sin(angle) * rad * 0.8,
        (pseudoRandom(r * 2.1) - 0.5) * 1.2
      );
      rootPositions.push(rootPos);
      nodes.push({ pos: rootPos, color: '#38bdf8', size: 0.1, baseGlow: 0.8 });
    }

    // 2. Grow branching tree structures
    let branchIdx = 0;
    rootPositions.forEach((root, rootIdx) => {
      // Main trunk
      const trunkAngle = (rootIdx / rootPositions.length) * Math.PI * 2 + (pseudoRandom(rootIdx * 3.3) - 0.5) * 0.5;
      const trunkDist = 2.2 + pseudoRandom(rootIdx * 4.2) * 1.2;
      const trunkEnd = new THREE.Vector3(
        Math.cos(trunkAngle) * trunkDist,
        Math.sin(trunkAngle) * trunkDist * 0.75 + (pseudoRandom(rootIdx * 5.1) - 0.5) * 1.2,
        root.z + (pseudoRandom(rootIdx * 6.7) - 0.5) * 2.0
      );

      nodes.push({ pos: trunkEnd, color: '#2496ff', size: 0.08, baseGlow: 0.6 });

      // Mid-point curve for trunk
      const trunkMid = root.clone().lerp(trunkEnd, 0.5);
      trunkMid.x += (pseudoRandom(rootIdx * 7.9) - 0.5) * 0.8;
      trunkMid.y += (pseudoRandom(rootIdx * 8.3) - 0.5) * 0.8;
      trunkMid.z += (pseudoRandom(rootIdx * 9.1) - 0.5) * 0.8;

      const trunkCurve = new THREE.CatmullRomCurve3([root, trunkMid, trunkEnd]);
      const trunkPts = trunkCurve.getPoints(24);
      const trunkCoords: number[] = [];
      trunkPts.forEach((p) => trunkCoords.push(p.x, p.y, p.z));

      branchList.push({
        id: `trunk-${rootIdx}`,
        points: new Float32Array(trunkCoords),
        curve: trunkCurve,
        level: 0,
        startNode: root,
        endNode: trunkEnd,
        color: trunkColors[rootIdx % trunkColors.length],
        baseOpacity: 0.65,
      });
      branchIdx++;

      // Primary branches splitting off trunkEnd (2 splits per trunk)
      for (let b = 0; b < 2; b++) {
        if (branchList.length >= branchCount) break;

        const subAngle = trunkAngle + (b === 0 ? 0.45 : -0.45) + (pseudoRandom(branchIdx * 10.2) - 0.5) * 0.3;
        const subDist = trunkDist + 1.6 + pseudoRandom(branchIdx * 11.5) * 1.2;
        const branchEnd = new THREE.Vector3(
          Math.cos(subAngle) * subDist,
          Math.sin(subAngle) * subDist * 0.7 + (pseudoRandom(branchIdx * 12.1) - 0.5) * 1.5,
          trunkEnd.z + (pseudoRandom(branchIdx * 13.8) - 0.5) * 1.8
        );

        nodes.push({ pos: branchEnd, color: '#38bdf8', size: 0.06, baseGlow: 0.5 });

        const branchMid = trunkEnd.clone().lerp(branchEnd, 0.5);
        branchMid.x += (pseudoRandom(branchIdx * 14.3) - 0.5) * 0.6;
        branchMid.y += (pseudoRandom(branchIdx * 15.7) - 0.5) * 0.6;

        const branchCurve = new THREE.CatmullRomCurve3([trunkEnd, branchMid, branchEnd]);
        const branchPts = branchCurve.getPoints(20);
        const branchCoords: number[] = [];
        branchPts.forEach((p) => branchCoords.push(p.x, p.y, p.z));

        branchList.push({
          id: `branch-${branchIdx}`,
          points: new Float32Array(branchCoords),
          curve: branchCurve,
          level: 1,
          startNode: trunkEnd,
          endNode: branchEnd,
          color: '#38bdf8',
          baseOpacity: 0.45,
        });
        branchIdx++;

        // Secondary capillary
        if (branchList.length < branchCount && b === 1) {
          const capAngle = subAngle + 0.3;
          const capEnd = new THREE.Vector3(
            Math.cos(capAngle) * (subDist + 1.2),
            Math.sin(capAngle) * (subDist + 1.2) * 0.6,
            branchEnd.z + (pseudoRandom(branchIdx * 16.4) - 0.5) * 1.2
          );

          const capCurve = new THREE.CatmullRomCurve3([branchEnd, capEnd]);
          const capPts = capCurve.getPoints(12);
          const capCoords: number[] = [];
          capPts.forEach((p) => capCoords.push(p.x, p.y, p.z));

          branchList.push({
            id: `cap-${branchIdx}`,
            points: new Float32Array(capCoords),
            curve: capCurve,
            level: 2,
            startNode: branchEnd,
            endNode: capEnd,
            color: '#60a5fa',
            baseOpacity: 0.3,
          });
          branchIdx++;
        }
      }
    });

    return { branches: branchList, junctionNodes: nodes };
  }, [branchCount]);

  // Traveling Electric Energy Pulses along the branches
  const pulseData = useMemo(() => {
    const pulses: EnergyPulse[] = [];
    for (let p = 0; p < pulseCount; p++) {
      const bIdx = p % Math.max(1, branches.length);
      pulses.push({
        branchIdx: bIdx,
        progress: pseudoRandom(p * 17.2),
        speed: 0.008 + pseudoRandom(p * 18.9) * 0.014,
        size: 0.06 + pseudoRandom(p * 19.4) * 0.04,
        color: p % 3 === 0 ? '#ffffff' : p % 3 === 1 ? '#38bdf8' : '#2496ff',
      });
    }
    return pulses;
  }, [pulseCount, branches.length]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    const { global, mouse } = progresses;

    // Scroll Energy Intensity: increases from dormant (0.5) to highly active (2.5) on scroll
    const energyLevel = 0.5 + global * 1.8;

    // Subtle gentle ambient oscillation
    if (!reducedMotion) {
      groupRef.current.rotation.y = time * 0.04 + mouse.x * 0.1;
      groupRef.current.rotation.x = Math.sin(time * 0.03) * 0.03 + mouse.y * 0.08;
    }

    // Animate energy pulses traveling along pathways
    pulseData.forEach((pulse, idx) => {
      const mesh = pulseMeshesRef.current[idx];
      if (!mesh) return;

      const branch = branches[pulse.branchIdx];
      if (!branch) return;

      // Pulse speed scales with energy level
      pulse.progress += pulse.speed * energyLevel;
      if (pulse.progress >= 1.0) {
        pulse.progress = 0.0;
        // Jump to an adjacent or child branch
        pulse.branchIdx = (pulse.branchIdx + 1) % branches.length;
      }

      const point = branch.curve.getPoint(pulse.progress);
      mesh.position.copy(point);

      // Pulse glows brightest in the middle of its travel with high energy
      const intensity = Math.sin(pulse.progress * Math.PI) * 0.6 + 0.4;
      mesh.scale.setScalar(pulse.size * intensity * (1.0 + global * 0.6));
    });

    // Animate node pulsing
    junctionNodes.forEach((node, nIdx) => {
      const mesh = nodeMeshesRef.current[nIdx];
      if (!mesh) return;

      const pulseWave = Math.sin(time * 2.5 + nIdx * 1.2) * 0.3 + 0.7;
      const scale = (node.size * pulseWave) * (1.0 + global * 0.4);
      mesh.scale.setScalar(scale);
    });
  });

  return (
    <group ref={groupRef}>
      {/* 3D Branching Electric Neural Pathways */}
      {branches.map((b) => (
        <line key={b.id}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[b.points, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color={b.color}
            transparent
            opacity={b.baseOpacity * (0.6 + progresses.global * 0.6)}
            linewidth={b.level === 0 ? 2 : 1}
          />
        </line>
      ))}

      {/* Neural Junction Nodes */}
      {junctionNodes.map((node, idx) => (
        <mesh
          key={`jnode-${idx}`}
          position={node.pos}
          ref={(el) => {
            if (el) nodeMeshesRef.current[idx] = el;
          }}
        >
          <sphereGeometry args={[node.size, 12, 12]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={node.baseGlow * (1.0 + progresses.global * 1.5)}
            roughness={0.1}
          />
        </mesh>
      ))}

      {/* High-Speed Electric Energy Pulses */}
      {pulseData.map((p, idx) => (
        <mesh
          key={`pulse-${idx}`}
          ref={(el) => {
            if (el) pulseMeshesRef.current[idx] = el;
          }}
        >
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshBasicMaterial color={p.color} />
        </mesh>
      ))}
    </group>
  );
}
