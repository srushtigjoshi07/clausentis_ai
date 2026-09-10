'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StageProgresses } from '@/hooks/useLandingScroll';

interface DocumentFieldProps {
  progresses: StageProgresses;
  reducedMotion: boolean;
}

interface DocPlaneConfig {
  id: string;
  targetPos: [number, number, number];
  targetRot: [number, number, number];
  width: number;
  height: number;
  label: string;
  tag: string;
  lineCount: number;
}

const DOC_CONFIGS: DocPlaneConfig[] = [
  {
    id: 'doc-1',
    targetPos: [-1.85, 0.2, 0.4],
    targetRot: [0.1, 0.35, -0.05],
    width: 1.45,
    height: 1.9,
    label: 'NIT_NOTICE_INVITING_TENDER.PDF',
    tag: 'GENERAL_ELIGIBILITY',
    lineCount: 8,
  },
  {
    id: 'doc-2',
    targetPos: [0.0, 0.35, 0.9],
    targetRot: [-0.05, 0.0, 0.0],
    width: 1.6,
    height: 2.1,
    label: 'TECHNICAL_SPECIFICATIONS_VOL_2.PDF',
    tag: 'ISO_STANDARDS',
    lineCount: 10,
  },
  {
    id: 'doc-3',
    targetPos: [1.85, 0.1, 0.3],
    targetRot: [0.1, -0.35, 0.05],
    width: 1.45,
    height: 1.9,
    label: 'FINANCIAL_BOQ_SCHEDULE.PDF',
    tag: 'TURNOVER_CRITERIA',
    lineCount: 8,
  },
];

export function DocumentField({ progresses, reducedMotion }: DocumentFieldProps) {
  const groupRef = useRef<THREE.Group>(null);
  const docGroupsRef = useRef<THREE.Group[]>([]);

  // Grounding electric arcs connecting neural network to document corners
  const cornerArcs = useMemo(() => {
    return DOC_CONFIGS.map((cfg) => {
      const w = cfg.width;
      const h = cfg.height;
      const corners = [
        [-w / 2, h / 2, 0.02],
        [w / 2, h / 2, 0.02],
        [-w / 2, -h / 2, 0.02],
        [w / 2, -h / 2, 0.02],
      ];
      return corners;
    });
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    const { ingestion, graph } = progresses;

    const appearProgress = ingestion;
    const exitProgress = Math.max(0, graph * 1.5);
    const visibility = Math.max(0, appearProgress - exitProgress);

    groupRef.current.visible = visibility > 0.01;
    if (!groupRef.current.visible) return;

    DOC_CONFIGS.forEach((cfg, idx) => {
      const docGroup = docGroupsRef.current[idx];
      if (!docGroup) return;

      const p = appearProgress;
      const curX = THREE.MathUtils.lerp(0, cfg.targetPos[0], p);
      const curY = THREE.MathUtils.lerp(0, cfg.targetPos[1], p) + (reducedMotion ? 0 : Math.sin(time * 1.2 + idx) * 0.04);
      const curZ = THREE.MathUtils.lerp(-1.5, cfg.targetPos[2], p);

      docGroup.position.set(curX, curY, curZ);

      const rotX = THREE.MathUtils.lerp(0, cfg.targetRot[0], p);
      const rotY = THREE.MathUtils.lerp(0, cfg.targetRot[1], p);
      const rotZ = THREE.MathUtils.lerp(0, cfg.targetRot[2], p);
      docGroup.rotation.set(rotX, rotY, rotZ);

      const scale = THREE.MathUtils.lerp(0.1, 1.0, p) * (1 - exitProgress * 0.8);
      docGroup.scale.setScalar(scale);
    });
  });

  return (
    <group ref={groupRef}>
      {DOC_CONFIGS.map((cfg, idx) => (
        <group
          key={cfg.id}
          ref={(el) => {
            if (el) docGroupsRef.current[idx] = el;
          }}
        >
          {/* Main Dark Translucent Glass Document Plane */}
          <mesh>
            <planeGeometry args={[cfg.width, cfg.height]} />
            <meshStandardMaterial
              color="#07111f"
              roughness={0.2}
              metalness={0.5}
              transparent
              opacity={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Luminous Electric Blue Document Edge Border with High-Energy Current */}
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(cfg.width, cfg.height)]} />
            <lineBasicMaterial color="#38bdf8" linewidth={2} transparent opacity={0.95} />
          </lineSegments>

          {/* Glowing Corner Contact Sparks */}
          {cornerArcs[idx].map((c, cIdx) => (
            <mesh key={`corner-${cIdx}`} position={[c[0], c[1], c[2]]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}

          {/* Top Document Header Bar */}
          <mesh position={[0, cfg.height / 2 - 0.18, 0.01]}>
            <planeGeometry args={[cfg.width * 0.88, 0.16]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>

          {/* Header Electric Blue Accent Pill */}
          <mesh position={[-cfg.width * 0.32, cfg.height / 2 - 0.18, 0.02]}>
            <planeGeometry args={[0.25, 0.07]} />
            <meshBasicMaterial color="#2496ff" />
          </mesh>

          {/* Luminous Document Text Wireframe Lines Charged with Energy */}
          {Array.from({ length: cfg.lineCount }).map((_, lineIdx) => {
            const lineY = cfg.height / 2 - 0.45 - lineIdx * 0.14;
            const isHighlight = lineIdx === 1 || lineIdx === 4;
            const isShort = lineIdx % 3 === 2;
            const lineWidth = cfg.width * (isShort ? 0.55 : 0.82);
            return (
              <mesh key={`line-${lineIdx}`} position={[-(cfg.width * 0.82 - lineWidth) / 2, lineY, 0.01]}>
                <planeGeometry args={[lineWidth, 0.035]} />
                <meshBasicMaterial
                  color={isHighlight ? '#38bdf8' : '#334155'}
                  transparent
                  opacity={isHighlight ? 0.95 : 0.6}
                />
              </mesh>
            );
          })}

          {/* Bottom Verified Cyan Seal */}
          <mesh position={[cfg.width * 0.3, -cfg.height / 2 + 0.22, 0.02]}>
            <circleGeometry args={[0.12, 16]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
