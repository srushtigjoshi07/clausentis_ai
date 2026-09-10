'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { StageProgresses } from '@/hooks/useLandingScroll';

interface MorphingIntelligenceCoreProps {
  progresses: StageProgresses;
  reducedMotion: boolean;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function smoothStep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

export function MorphingIntelligenceCore({ progresses, reducedMotion }: MorphingIntelligenceCoreProps) {
  const mainGroupRef = useRef<THREE.Group>(null);

  // Scene 1: Hero Intelligence Core (Preserved 100%)
  const scene1Ref = useRef<THREE.Group>(null);
  const scene1NucleusRef = useRef<THREE.Mesh>(null);
  const scene1OrbitRef = useRef<THREE.Group>(null);

  // Scene 2: The Silent Monolithic Archive & Silk Convergence
  const scene2Ref = useRef<THREE.Group>(null);
  const scene2ArchiveGroupRef = useRef<THREE.Group>(null);
  const scene2SurgicalLightRef = useRef<THREE.Mesh>(null);
  const scene2SilkStreamsRef = useRef<THREE.Group>(null);
  const scene2CorePointRef = useRef<THREE.Mesh>(null);

  // Scene 3: Architectural Information Sculpture & Resolution
  const scene3Ref = useRef<THREE.Group>(null);
  const scene3SculptureGroupRef = useRef<THREE.Group>(null);
  const scene3NodesGroupRef = useRef<THREE.Group>(null);
  const scene3VerifPlaneRef = useRef<THREE.Mesh>(null);
  const scene3CollapsePointRef = useRef<THREE.Mesh>(null);

  // Scene 4: Intentional Decision Pathways & Grand Pull-Back
  const scene4Ref = useRef<THREE.Group>(null);
  const scene4CoreRef = useRef<THREE.Mesh>(null);
  const scene4PathwaysGroupRef = useRef<THREE.Group>(null);
  const scene4PulsesGroupRef = useRef<THREE.Group>(null);
  const scene4MacroConstellationRef = useRef<THREE.Group>(null);

  // Preserved Scenes 5-8
  const scene5Ref = useRef<THREE.Group>(null);
  const scene5PulseRef = useRef<THREE.Mesh>(null);
  const scene6Ref = useRef<THREE.Group>(null);
  const scene7Ref = useRef<THREE.Group>(null);
  const scene8Ref = useRef<THREE.Group>(null);

  // Deep Starlight Parallax (Subtle & Restrained)
  const bgLayer1Ref = useRef<THREE.Points>(null);

  // =========================================================================
  // 1. DEEP STARLIGHT PARALLAX (RESTRAINED & MINIMAL)
  // =========================================================================
  const backgroundLayers = useMemo(() => {
    const count = 180;
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (pseudoRandom(i * 1.7) - 0.5) * 36;
      pos[i * 3 + 1] = (pseudoRandom(i * 2.9) - 0.5) * 26;
      pos[i * 3 + 2] = -12.0 - pseudoRandom(i * 4.1) * 20;
      vel[i * 3] = (pseudoRandom(i * 5.3) - 0.5) * 0.001;
      vel[i * 3 + 1] = (pseudoRandom(i * 6.7) - 0.5) * 0.001;
      vel[i * 3 + 2] = 0.0005;
    }
    return { count, pos, vel };
  }, []);

  // =========================================================================
  // 2. SCENE 02: THE MONOLITHIC ARCHIVE (14 Thin Smoked-Glass Sheets)
  // Wide spatial depth: Extreme Foreground (+1.2) to Deep Silence (-18.0)
  // =========================================================================
  const scene2Data = useMemo(() => {
    const sheets = [];
    // 14 carefully composed sheets with vast negative space
    const configs = [
      // Extreme foreground: passes right beside lens
      { x: -1.6, y: 0.3, z: 1.2, w: 1.15, h: 1.65, rotY: 0.18, rotX: 0.05 },
      { x: 1.9, y: -0.4, z: -0.5, w: 1.05, h: 1.50, rotY: -0.22, rotX: -0.04 },
      // Foreground
      { x: -2.4, y: -0.2, z: -2.2, w: 0.95, h: 1.35, rotY: 0.28, rotX: 0.06 },
      { x: 2.2, y: 0.5, z: -3.4, w: 0.90, h: 1.30, rotY: -0.25, rotX: -0.05 },
      // Midground
      { x: -1.8, y: 0.7, z: -5.5, w: 0.82, h: 1.18, rotY: 0.15, rotX: 0.03 },
      { x: 2.6, y: -0.6, z: -7.0, w: 0.80, h: 1.15, rotY: -0.30, rotX: 0.04 },
      { x: -2.8, y: -0.5, z: -9.0, w: 0.75, h: 1.08, rotY: 0.20, rotX: -0.05 },
      { x: 1.5, y: 0.6, z: -11.0, w: 0.70, h: 1.00, rotY: -0.18, rotX: 0.02 },
      // Deep silence
      { x: -2.0, y: 0.2, z: -13.5, w: 0.65, h: 0.92, rotY: 0.12, rotX: 0.03 },
      { x: 2.4, y: -0.3, z: -15.5, w: 0.60, h: 0.85, rotY: -0.22, rotX: -0.02 },
      { x: -1.2, y: -0.6, z: -17.0, w: 0.55, h: 0.78, rotY: 0.15, rotX: 0.01 },
      { x: 1.8, y: 0.4, z: -18.5, w: 0.50, h: 0.72, rotY: -0.16, rotX: 0.02 },
      { x: -2.5, y: 0.5, z: -20.0, w: 0.45, h: 0.65, rotY: 0.10, rotX: 0.01 },
      { x: 2.1, y: -0.2, z: -22.0, w: 0.42, h: 0.60, rotY: -0.14, rotX: -0.01 },
    ];

    for (let i = 0; i < configs.length; i++) {
      const c = configs[i];
      const halfW = c.w * 0.5;
      const halfH = c.h * 0.5;

      // Extremely subtle, razor-thin hairline markings (quiet, architectural)
      const edgeCoords = new Float32Array([
        // Outer boundary
        -halfW, -halfH, 0.002,  halfW, -halfH, 0.002,
         halfW, -halfH, 0.002,  halfW,  halfH, 0.002,
         halfW,  halfH, 0.002, -halfW,  halfH, 0.002,
        -halfW,  halfH, 0.002, -halfW, -halfH, 0.002,
        // Single minimal header rule
        -halfW * 0.85, halfH * 0.75, 0.002, halfW * 0.85, halfH * 0.75, 0.002,
        // Micro alignment tick
        -halfW * 0.85, halfH * 0.65, 0.002, -halfW * 0.5, halfH * 0.65, 0.002,
        // Two delicate clause rules
        -halfW * 0.85, 0.0, 0.002, halfW * 0.6, 0.0, 0.002,
        -halfW * 0.85, -halfH * 0.4, 0.002, halfW * 0.4, -halfH * 0.4, 0.002,
      ]);

      sheets.push({
        id: `monolith-sheet-${i}`,
        basePos: [c.x, c.y, c.z] as [number, number, number],
        baseRot: [c.rotX, c.rotY, 0] as [number, number, number],
        w: c.w,
        h: c.h,
        edgeCoords,
        index: i,
      });
    }

    // 4 Silk Extraction Streams (Curved 3D filaments converging into center)
    const silkCurves = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.6, 0.3, 1.2),
        new THREE.Vector3(-1.0, 0.1, 0.2),
        new THREE.Vector3(-0.4, -0.1, -0.8),
        new THREE.Vector3(0.0, 0.0, -1.5),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.9, -0.4, -0.5),
        new THREE.Vector3(1.1, -0.2, -1.0),
        new THREE.Vector3(0.4, 0.1, -1.3),
        new THREE.Vector3(0.0, 0.0, -1.5),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.4, -0.2, -2.2),
        new THREE.Vector3(-1.4, 0.2, -1.8),
        new THREE.Vector3(-0.5, 0.1, -1.6),
        new THREE.Vector3(0.0, 0.0, -1.5),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(2.2, 0.5, -3.4),
        new THREE.Vector3(1.2, 0.3, -2.4),
        new THREE.Vector3(0.5, -0.1, -1.8),
        new THREE.Vector3(0.0, 0.0, -1.5),
      ]),
    ];

    const silkStreamArrays = silkCurves.map((c) => {
      const pts = c.getPoints(60);
      const arr = new Float32Array(pts.length * 3);
      pts.forEach((pt, idx) => {
        arr[idx * 3] = pt.x;
        arr[idx * 3 + 1] = pt.y;
        arr[idx * 3 + 2] = pt.z;
      });
      return arr;
    });

    return { sheets, silkStreamArrays };
  }, []);

  // =========================================================================
  // 3. SCENE 03: ARCHITECTURAL INFORMATION SCULPTURE
  // High-precision kinetic structure: 18 structural nodes & cantilevered beams
  // =========================================================================
  const scene3Data = useMemo(() => {
    // 18 deliberate architectural nodes forming a spatial blueprint
    const nodes = [
      // Core spine (vertical foundation)
      { id: 'n0', pos: [0.0, -1.1, 0.0], isMajor: true },
      { id: 'n1', pos: [0.0, 0.0, 0.0], isMajor: true },
      { id: 'n2', pos: [0.0, 1.1, 0.0], isMajor: true },
      // Left primary cantilever
      { id: 'n3', pos: [-1.4, 0.6, 0.2], isMajor: true },
      { id: 'n4', pos: [-2.1, 0.2, 0.5], isMajor: false },
      { id: 'n5', pos: [-1.2, -0.7, -0.3], isMajor: false },
      // Right primary cantilever
      { id: 'n6', pos: [1.5, -0.5, 0.3], isMajor: true },
      { id: 'n7', pos: [2.2, -0.1, 0.6], isMajor: false },
      { id: 'n8', pos: [1.3, 0.8, -0.4], isMajor: false },
      // Spatial depth anchors (front & back)
      { id: 'n9', pos: [0.3, 0.9, 1.0], isMajor: true },
      { id: 'n10', pos: [-0.4, -0.8, 0.9], isMajor: false },
      { id: 'n11', pos: [0.5, -0.3, -1.1], isMajor: true },
      { id: 'n12', pos: [-0.6, 0.5, -1.0], isMajor: false },
      // Tertiary balance points
      { id: 'n13', pos: [-1.6, 1.2, 0.0], isMajor: false },
      { id: 'n14', pos: [1.7, 1.1, 0.1], isMajor: false },
      { id: 'n15', pos: [1.8, -1.0, -0.2], isMajor: false },
      { id: 'n16', pos: [-1.7, -1.2, 0.1], isMajor: false },
      { id: 'n17', pos: [0.0, 0.0, 1.4], isMajor: true },
    ];

    // Structural connecting beams (clean, deliberate connections)
    const beamIndices = [
      [0, 1], [1, 2], // Spine
      [1, 3], [3, 4], [0, 5], [5, 3], // Left wing
      [1, 6], [6, 7], [2, 8], [8, 6], // Right wing
      [2, 9], [9, 17], [0, 10], [10, 17], // Front envelope
      [2, 12], [12, 11], [0, 11], [1, 11], // Depth envelope
      [3, 13], [8, 14], [6, 15], [5, 16], // Cantilevers
    ];

    const beamCoords: number[] = [];
    beamIndices.forEach(([i1, i2]) => {
      const p1 = nodes[i1].pos;
      const p2 = nodes[i2].pos;
      beamCoords.push(...p1, ...p2);
    });

    const beamPositions = new Float32Array(beamCoords);

    return { nodes, beamPositions };
  }, []);

  // =========================================================================
  // 4. SCENE 04: INTENTIONAL DECISION PATHWAYS
  // 3 Fluid, purposeful trajectories framing negative space with grand reveal
  // =========================================================================
  const scene4Data = useMemo(() => {
    // 3 Curated 3D Splines that frame typography with massive negative space
    const curve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.6, -1.4, -1.0),
      new THREE.Vector3(-1.8, -0.2, 0.6),
      new THREE.Vector3(-0.4, 0.8, 1.0),
      new THREE.Vector3(1.6, 1.2, 0.4),
      new THREE.Vector3(3.8, 1.5, -0.8),
    ]);

    const curve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.8, 1.5, -0.8),
      new THREE.Vector3(-1.6, 0.9, 0.7),
      new THREE.Vector3(0.2, 0.1, 0.9),
      new THREE.Vector3(1.9, -0.8, 0.3),
      new THREE.Vector3(3.6, -1.4, -1.0),
    ]);

    const curve3 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.8, -0.3, 0.9),
      new THREE.Vector3(-0.9, 0.4, 1.2),
      new THREE.Vector3(1.0, -0.3, 1.1),
      new THREE.Vector3(2.8, 0.4, 0.5),
    ]);

    const curves = [curve1, curve2, curve3];
    const curveArrays = curves.map((c) => {
      const pts = c.getPoints(80);
      const arr = new Float32Array(pts.length * 3);
      pts.forEach((pt, i) => {
        arr[i * 3] = pt.x;
        arr[i * 3 + 1] = pt.y;
        arr[i * 3 + 2] = pt.z;
      });
      return arr;
    });

    // Deep Background Constellation (revealed only in the Grand Pull-Back)
    const constellation = [
      [-4.5, 2.2, -6.0], [4.2, 1.8, -7.0], [-3.8, -2.0, -6.5], [3.9, -1.9, -8.0],
      [-1.8, 3.2, -9.0], [2.1, 3.0, -8.5], [-0.5, -3.1, -7.5], [0.8, -2.8, -9.5],
      [-5.5, 0.2, -11.0], [5.2, -0.4, -10.5], [0.0, 4.0, -12.0], [0.0, -4.0, -11.5],
    ];

    return { curves, curveArrays, constellation };
  }, []);

  // Preserved Scene 05 Line
  const evidenceCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.8, 0.8, 0.2),
      new THREE.Vector3(-0.6, 0.3, 0.7),
      new THREE.Vector3(0.6, -0.2, 0.5),
      new THREE.Vector3(1.6, -0.6, 0.1),
    ]);
  }, []);

  const evidenceLinePos = useMemo(() => {
    const pts = evidenceCurve.getPoints(50);
    const arr = new Float32Array(pts.length * 3);
    pts.forEach((pt, i) => {
      arr[i * 3] = pt.x;
      arr[i * 3 + 1] = pt.y;
      arr[i * 3 + 2] = pt.z;
    });
    return arr;
  }, [evidenceCurve]);

  // =========================================================================
  // 60FPS ART-DIRECTED RENDER LOOP
  // =========================================================================
  useFrame(({ clock }) => {
    const rawP =
      typeof window !== 'undefined' &&
      (window as unknown as { __landingScrollProgress?: number }).__landingScrollProgress !== undefined
        ? (window as unknown as { __landingScrollProgress: number }).__landingScrollProgress
        : progresses.global;

    const global = Math.min(Math.max(rawP, 0), 1);
    const time = reducedMotion ? 0 : clock.getElapsedTime();

    // Scene Visibility Windows
    const a1 = global < 0.14 ? Math.max(0, 1 - global / 0.14) : 0;
    const a2 = (global >= 0.11 && global <= 0.27) ? Math.sin(Math.min(Math.max((global - 0.11) / 0.16, 0), 1) * Math.PI) : 0;
    const a3 = (global >= 0.23 && global <= 0.39) ? Math.sin(Math.min(Math.max((global - 0.23) / 0.16, 0), 1) * Math.PI) : 0;
    const a4 = (global >= 0.35 && global <= 0.52) ? Math.sin(Math.min(Math.max((global - 0.35) / 0.17, 0), 1) * Math.PI) : 0;
    const a5 = (global >= 0.48 && global <= 0.64) ? Math.sin(Math.min(Math.max((global - 0.48) / 0.16, 0), 1) * Math.PI) : 0;
    const a6 = (global >= 0.60 && global <= 0.77) ? Math.sin(Math.min(Math.max((global - 0.60) / 0.17, 0), 1) * Math.PI) : 0;
    const a7 = (global >= 0.73 && global <= 0.89) ? Math.sin(Math.min(Math.max((global - 0.73) / 0.16, 0), 1) * Math.PI) : 0;
    const a8 = global >= 0.85 ? Math.min((global - 0.85) / 0.15, 1) : 0;

    // Starlight drift
    if (bgLayer1Ref.current) {
      const geom = bgLayer1Ref.current.geometry;
      const posAttr = geom.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < backgroundLayers.count; i++) {
        let x = posAttr.getX(i) + backgroundLayers.vel[i * 3];
        let y = posAttr.getY(i) + backgroundLayers.vel[i * 3 + 1];
        const z = posAttr.getZ(i) + backgroundLayers.vel[i * 3 + 2];
        if (x > 18) x = -18;
        if (x < -18) x = 18;
        if (y > 13) y = -13;
        if (y < -13) y = 13;
        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;
    }

    // =======================================================================
    // SCENE 01: HERO INTELLIGENCE CORE (100% UNTOUCHED)
    // =======================================================================
    if (scene1Ref.current) {
      scene1Ref.current.visible = a1 > 0.005;
      scene1Ref.current.scale.setScalar(Math.max(0.01, a1));
      if (scene1NucleusRef.current) {
        scene1NucleusRef.current.rotation.y = time * 0.35;
        scene1NucleusRef.current.rotation.x = time * 0.18;
      }
      if (scene1OrbitRef.current) {
        scene1OrbitRef.current.rotation.z = time * 0.22;
        scene1OrbitRef.current.rotation.y = -time * 0.28;
      }
    }

    // =======================================================================
    // SCENE 02: THE MONOLITHIC ARCHIVE (ARCHIVE → EXTRACTION → ESSENCE)
    // =======================================================================
    if (scene2Ref.current) {
      scene2Ref.current.visible = a2 > 0.005;
      scene2Ref.current.scale.setScalar(Math.max(0.01, a2));

      // Normalized Progress for Scene 02: 0.0 to 1.0 across [0.125, 0.250]
      const s2 = Math.min(Math.max((global - 0.125) / 0.125, 0), 1);

      // A. Smoked Glass Sheets with Razor-Thin Markings
      if (scene2ArchiveGroupRef.current) {
        scene2ArchiveGroupRef.current.children.forEach((child, idx) => {
          const s = scene2Data.sheets[idx];
          if (s) {
            // Emergence from darkness (0.05 -> 0.35)
            const emergeAlpha = smoothStep(0.05 + idx * 0.015, 0.35 + idx * 0.015, s2);
            // Dissolve into essence (0.65 -> 0.88)
            const dissolveAlpha = smoothStep(0.65, 0.88, s2);

            child.position.set(
              s.basePos[0] + Math.sin(time * 0.15 + idx) * 0.015,
              s.basePos[1] + Math.cos(time * 0.12 + idx) * 0.015,
              s.basePos[2] + s2 * 0.6
            );

            child.children.forEach((meshChild) => {
              const m = meshChild as THREE.Mesh;
              if (m.material) {
                if (m.geometry instanceof THREE.PlaneGeometry) {
                  const sm = m.material as THREE.MeshStandardMaterial;
                  sm.opacity = emergeAlpha * (1 - dissolveAlpha) * 0.22;
                } else {
                  const lm = m.material as THREE.LineBasicMaterial;
                  lm.opacity = emergeAlpha * (1 - dissolveAlpha) * 0.45;
                }
              }
            });
          }
        });
      }

      // B. Surgical Vertical Light Slit (0.28 -> 0.70)
      if (scene2SurgicalLightRef.current) {
        if (s2 >= 0.26 && s2 <= 0.72) {
          scene2SurgicalLightRef.current.visible = true;
          const sweepX = THREE.MathUtils.lerp(-2.8, 2.8, (s2 - 0.26) / 0.46);
          scene2SurgicalLightRef.current.position.set(sweepX, 0, -1.0);
          if (scene2SurgicalLightRef.current.material) {
            const lightAlpha = Math.sin(((s2 - 0.26) / 0.46) * Math.PI) * 0.75;
            (scene2SurgicalLightRef.current.material as THREE.MeshBasicMaterial).opacity = lightAlpha;
          }
        } else {
          scene2SurgicalLightRef.current.visible = false;
        }
      }

      // C. Silk Extraction Streams (0.60 -> 0.95)
      if (scene2SilkStreamsRef.current) {
        if (s2 >= 0.58 && s2 <= 0.96) {
          scene2SilkStreamsRef.current.visible = true;
          const streamAlpha = Math.sin(smoothStep(0.58, 0.92, s2) * Math.PI) * 0.85;
          scene2SilkStreamsRef.current.children.forEach((line) => {
            const lm = line as THREE.Line;
            if (lm.material) {
              (lm.material as THREE.LineBasicMaterial).opacity = streamAlpha;
            }
          });
        } else {
          scene2SilkStreamsRef.current.visible = false;
        }
      }

      // D. Climax Convergence Core Point (0.78 -> 1.00)
      if (scene2CorePointRef.current) {
        if (s2 >= 0.76) {
          scene2CorePointRef.current.visible = true;
          const coreP = (s2 - 0.76) / 0.24;
          const scale = s2 > 0.92 ? THREE.MathUtils.lerp(0.12, 3.2, (s2 - 0.92) / 0.08) : coreP * 0.12;
          scene2CorePointRef.current.scale.setScalar(scale);
          scene2CorePointRef.current.position.set(0, 0, -1.5);
        } else {
          scene2CorePointRef.current.visible = false;
        }
      }
    }

    // =======================================================================
    // SCENE 03: ARCHITECTURAL INFORMATION SCULPTURE
    // =======================================================================
    if (scene3Ref.current) {
      scene3Ref.current.visible = a3 > 0.005;
      scene3Ref.current.scale.setScalar(Math.max(0.01, a3));

      // Normalized Progress for Scene 03: 0.0 to 1.0 across [0.250, 0.375]
      const s3 = Math.min(Math.max((global - 0.250) / 0.125, 0), 1);
      const isCollapsing = s3 > 0.80;
      const collapseFactor = smoothStep(0.80, 0.98, s3);

      // A. Organic Blueprint Growth (0.00 -> 0.35)
      const buildAlpha = smoothStep(0.05, 0.35, s3);

      if (scene3SculptureGroupRef.current) {
        scene3SculptureGroupRef.current.children.forEach((child) => {
          const l = child as THREE.LineSegments;
          if (l.material) {
            (l.material as THREE.LineBasicMaterial).opacity = buildAlpha * (1 - collapseFactor) * 0.6;
          }
        });
      }

      if (scene3NodesGroupRef.current) {
        scene3NodesGroupRef.current.children.forEach((child, idx) => {
          const n = scene3Data.nodes[idx];
          if (n) {
            let curX = n.pos[0] * buildAlpha;
            let curY = n.pos[1] * buildAlpha;
            let curZ = n.pos[2] * buildAlpha;

            if (isCollapsing) {
              curX = THREE.MathUtils.lerp(curX, 0, collapseFactor);
              curY = THREE.MathUtils.lerp(curY, 0, collapseFactor);
              curZ = THREE.MathUtils.lerp(curZ, 0, collapseFactor);
            }

            child.position.set(curX, curY, curZ);

            // Surgical Verification Wave (0.45 -> 0.78)
            const isWave = s3 >= 0.45 && s3 <= 0.78;
            const waveX = THREE.MathUtils.lerp(-2.5, 2.5, (s3 - 0.45) / 0.33);
            const isVerified = isWave && Math.abs(n.pos[0] - waveX) < 0.6;

            const m = child as THREE.Mesh;
            if (m.material) {
              const sm = m.material as THREE.MeshStandardMaterial;
              if (isVerified) {
                sm.color.set('#ffffff');
                sm.emissive.set('#38bdf8');
                sm.emissiveIntensity = 1.8;
              } else {
                sm.color.set(n.isMajor ? '#38bdf8' : '#64748b');
                sm.emissive.set(n.isMajor ? '#1d4ed8' : '#0f172a');
                sm.emissiveIntensity = n.isMajor ? 0.6 : 0.15;
              }
            }
          }
        });
      }

      // B. Surgical Verification Wave Plane (0.45 -> 0.78)
      if (scene3VerifPlaneRef.current) {
        if (s3 >= 0.43 && s3 <= 0.78) {
          scene3VerifPlaneRef.current.visible = true;
          const waveX = THREE.MathUtils.lerp(-2.8, 2.8, (s3 - 0.43) / 0.35);
          scene3VerifPlaneRef.current.position.set(waveX, 0, 0);
          if (scene3VerifPlaneRef.current.material) {
            (scene3VerifPlaneRef.current.material as THREE.MeshBasicMaterial).opacity = Math.sin(((s3 - 0.43) / 0.35) * Math.PI) * 0.6;
          }
        } else {
          scene3VerifPlaneRef.current.visible = false;
        }
      }

      // C. Climax Compressed Intelligence Core (0.84 -> 1.00)
      if (scene3CollapsePointRef.current) {
        if (isCollapsing) {
          scene3CollapsePointRef.current.visible = true;
          const p = (s3 - 0.84) / 0.16;
          scene3CollapsePointRef.current.scale.setScalar(p * 0.18);
        } else {
          scene3CollapsePointRef.current.visible = false;
        }
      }
    }

    // =======================================================================
    // SCENE 04: INTENTIONAL DECISION PATHWAYS & GRAND REVEAL
    // =======================================================================
    if (scene4Ref.current) {
      scene4Ref.current.visible = a4 > 0.005;
      scene4Ref.current.scale.setScalar(Math.max(0.01, a4));

      // Normalized Progress for Scene 04: 0.0 to 1.0 across [0.375, 0.500]
      const s4 = Math.min(Math.max((global - 0.375) / 0.125, 0), 1);

      // A. Center Floating Core at Entry (0.00 -> 0.25)
      if (scene4CoreRef.current) {
        const coreAlpha = s4 < 0.25 ? 1 - s4 / 0.25 : 0;
        scene4CoreRef.current.visible = coreAlpha > 0.02;
        scene4CoreRef.current.scale.setScalar(coreAlpha * 0.15);
      }

      // B. 3 Fluid Decision Pathways
      if (scene4PathwaysGroupRef.current) {
        scene4PathwaysGroupRef.current.children.forEach((line, idx) => {
          const l = line as THREE.Line;
          if (l.material) {
            // Route 0 is dominant; routes 1 & 2 simplify out during clarity hold (s4 > 0.75)
            const isPrimary = idx === 0;
            const simplifyFactor = isPrimary ? 0.9 : Math.max(0.12, 1 - (s4 - 0.75) * 2.5);
            const pathAlpha = smoothStep(0.08, 0.30, s4) * simplifyFactor;
            (l.material as THREE.LineBasicMaterial).opacity = pathAlpha * 0.75;
          }
        });
      }

      // C. 3 Travelling Photon Pulses (deliberate, long intervals)
      if (scene4PulsesGroupRef.current) {
        scene4PulsesGroupRef.current.children.forEach((pulse, idx) => {
          const curve = scene4Data.curves[idx % scene4Data.curves.length];
          const speed = 0.22 + idx * 0.04;
          const t = (time * speed + idx * 0.3) % 1.0;
          const pt = curve.getPoint(t);
          pulse.position.copy(pt);

          const pulseAlpha = smoothStep(0.12, 0.35, s4);
          pulse.scale.setScalar(pulseAlpha * 0.045);
        });
      }

      // D. Deep Background Macro Constellation (Grand Reveal: 0.65 -> 1.00)
      if (scene4MacroConstellationRef.current) {
        const revealAlpha = smoothStep(0.62, 0.85, s4);
        scene4MacroConstellationRef.current.visible = revealAlpha > 0.02;
        scene4MacroConstellationRef.current.children.forEach((child) => {
          const m = child as THREE.Mesh;
          if (m.material) {
            (m.material as THREE.MeshStandardMaterial).opacity = revealAlpha * 0.45;
          }
        });
      }
    }

    // =======================================================================
    // SCENES 05 - 08: PRESERVED
    // =======================================================================
    if (scene5Ref.current) {
      scene5Ref.current.visible = a5 > 0.005;
      scene5Ref.current.scale.setScalar(Math.max(0.01, a5));
      if (scene5PulseRef.current) {
        const pulseT = (time * 0.75) % 1.0;
        const pt = evidenceCurve.getPoint(pulseT);
        scene5PulseRef.current.position.copy(pt);
      }
    }

    if (scene6Ref.current) {
      scene6Ref.current.visible = a6 > 0.005;
      scene6Ref.current.scale.setScalar(Math.max(0.01, a6));
      scene6Ref.current.rotation.y = time * 0.25 + global * 0.7;
    }

    if (scene7Ref.current) {
      scene7Ref.current.visible = a7 > 0.005;
      scene7Ref.current.scale.setScalar(Math.max(0.01, a7));
      scene7Ref.current.rotation.y = -time * 0.3;
    }

    if (scene8Ref.current) {
      scene8Ref.current.visible = a8 > 0.005;
      scene8Ref.current.scale.setScalar(Math.max(0.01, a8));
      scene8Ref.current.rotation.y = time * 0.15;
    }
  });

  return (
    <group ref={mainGroupRef}>
      {/* 1. DEEP STARLIGHT PARALLAX (RESTRAINED & MINIMAL) */}
      <points ref={bgLayer1Ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[backgroundLayers.pos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.025} color="#525252" transparent opacity={0.35} sizeAttenuation />
      </points>

      {/* =================================================================== */}
      {/* =================================================================== */}
      {/* SCENE 01: HERO INTELLIGENCE CORE (MONOCHROME VISUALIZATION) */}
      {/* =================================================================== */}
      <group ref={scene1Ref}>
        <mesh ref={scene1NucleusRef}>
          <icosahedronGeometry args={[1.0, 2]} />
          <meshStandardMaterial
            color="#262626"
            wireframe
            transparent
            opacity={0.6}
            emissive="#171717"
            emissiveIntensity={0.25}
          />
        </mesh>
        <group ref={scene1OrbitRef}>
          <mesh rotation={[Math.PI / 3, 0, 0]}>
            <ringGeometry args={[1.4, 1.43, 64]} />
            <meshBasicMaterial color="#525252" transparent opacity={0.65} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
            <ringGeometry args={[1.7, 1.73, 64]} />
            <meshBasicMaterial color="#737373" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>

      {/* =================================================================== */}
      {/* SCENE 02: THE MONOLITHIC ARCHIVE (ARCHIVE → EXTRACTION → ESSENCE) */}
      {/* =================================================================== */}
      <group ref={scene2Ref} visible={false}>
        {/* 14 Monolithic Smoked-Glass Sheets */}
        <group ref={scene2ArchiveGroupRef}>
          {scene2Data.sheets.map((s) => (
            <group key={s.id} position={new THREE.Vector3(...s.basePos)} rotation={new THREE.Euler(...s.baseRot)}>
              {/* Semi-transparent architectural plane */}
              <mesh>
                <planeGeometry args={[s.w, s.h]} />
                <meshStandardMaterial
                  color="#e5e5e5"
                  transparent
                  opacity={0.35}
                  emissive="#d4d4d4"
                  emissiveIntensity={0.15}
                  roughness={0.2}
                  metalness={0.1}
                  side={THREE.DoubleSide}
                />
              </mesh>

              {/* Razor-thin architectural rules */}
              <lineSegments>
                <bufferGeometry>
                  <bufferAttribute attach="attributes-position" args={[s.edgeCoords, 3]} />
                </bufferGeometry>
                <lineBasicMaterial color="#262626" transparent opacity={0.75} />
              </lineSegments>
            </group>
          ))}
        </group>

        {/* Surgical Vertical Slit of Light */}
        <mesh ref={scene2SurgicalLightRef} visible={false}>
          <planeGeometry args={[0.02, 5.0]} />
          <meshBasicMaterial color="#171717" transparent opacity={0.0} side={THREE.DoubleSide} />
        </mesh>

        {/* 4 Silk Extraction Streams (Curved 3D Filaments) */}
        <group ref={scene2SilkStreamsRef} visible={false}>
          {scene2Data.silkStreamArrays.map((arr, idx) => (
            <line key={idx}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[arr, 3]} />
              </bufferGeometry>
              <lineBasicMaterial color={idx === 0 ? '#171717' : '#525252'} transparent opacity={0.0} />
            </line>
          ))}
        </group>

        {/* Climax Convergence Core Point */}
        <mesh ref={scene2CorePointRef} visible={false}>
          <sphereGeometry args={[0.08, 24, 24]} />
          <meshBasicMaterial color="#171717" />
        </mesh>
      </group>

      {/* =================================================================== */}
      {/* SCENE 03: ARCHITECTURAL INFORMATION SCULPTURE */}
      {/* =================================================================== */}
      <group ref={scene3Ref} visible={false}>
        {/* Kinetic Blueprint Struts */}
        <group ref={scene3SculptureGroupRef}>
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[scene3Data.beamPositions, 3]} />
            </bufferGeometry>
            <lineBasicMaterial color="#404040" transparent opacity={0.7} />
          </lineSegments>
        </group>

        {/* Precision Spatial Nodes */}
        <group ref={scene3NodesGroupRef}>
          {scene3Data.nodes.map((n) => (
            <mesh key={n.id} position={new THREE.Vector3(...n.pos)}>
              <sphereGeometry args={[n.isMajor ? 0.035 : 0.022, 12, 12]} />
              <meshStandardMaterial
                color={n.isMajor ? '#171717' : '#525252'}
                emissive={n.isMajor ? '#262626' : '#404040'}
                emissiveIntensity={n.isMajor ? 0.3 : 0.15}
              />
            </mesh>
          ))}
        </group>

        {/* Surgical Verification Wave Plane */}
        <mesh ref={scene3VerifPlaneRef} visible={false}>
          <planeGeometry args={[0.03, 4.0]} />
          <meshBasicMaterial color="#525252" transparent opacity={0.0} side={THREE.DoubleSide} />
        </mesh>

        {/* Climax Compressed Point */}
        <mesh ref={scene3CollapsePointRef} visible={false}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#171717" />
        </mesh>
      </group>

      {/* =================================================================== */}
      {/* SCENE 04: INTENTIONAL DECISION PATHWAYS */}
      {/* =================================================================== */}
      <group ref={scene4Ref} visible={false}>
        {/* Center Floating Core Point */}
        <mesh ref={scene4CoreRef} visible={false}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#171717" />
        </mesh>

        {/* 3 Fluid Decision Pathways */}
        <group ref={scene4PathwaysGroupRef}>
          {scene4Data.curveArrays.map((arr, idx) => (
            <line key={idx}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[arr, 3]} />
              </bufferGeometry>
              <lineBasicMaterial
                color={idx === 0 ? '#171717' : '#525252'}
                transparent
                opacity={0.8}
              />
            </line>
          ))}
        </group>

        {/* 3 Travelling Pulses */}
        <group ref={scene4PulsesGroupRef}>
          {[0, 1, 2].map((idx) => (
            <mesh key={idx}>
              <sphereGeometry args={[1.0, 12, 12]} />
              <meshBasicMaterial color="#262626" />
            </mesh>
          ))}
        </group>

        {/* Deep Macro Constellation (Grand Reveal) */}
        <group ref={scene4MacroConstellationRef} visible={false}>
          {scene4Data.constellation.map((pos, idx) => (
            <mesh key={idx} position={new THREE.Vector3(...pos)}>
              <octahedronGeometry args={[0.07, 0]} />
              <meshStandardMaterial color="#525252" wireframe transparent opacity={0.0} emissive="#262626" emissiveIntensity={0.2} />
            </mesh>
          ))}
        </group>
      </group>

      {/* =================================================================== */}
      {/* SCENES 05 - 08: PRESERVED (MONOCHROME CONVERSION) */}
      {/* =================================================================== */}
      <group ref={scene5Ref} visible={false}>
        <mesh position={[-1.8, 0.8, 0.2]}>
          <boxGeometry args={[0.55, 0.55, 0.55]} />
          <meshStandardMaterial color="#404040" wireframe emissive="#262626" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[1.6, -0.6, 0.1]}>
          <planeGeometry args={[1.0, 1.3]} />
          <meshStandardMaterial color="#e5e5e5" side={THREE.DoubleSide} transparent opacity={0.4} />
        </mesh>
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[evidenceLinePos, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color="#262626" transparent opacity={0.95} linewidth={2} />
        </lineSegments>
        <mesh ref={scene5PulseRef}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#171717" emissive="#404040" emissiveIntensity={0.5} />
        </mesh>
      </group>

      <group ref={scene6Ref} visible={false}>
        {[-1.3, 0, 1.3].map((xOff, colIdx) => (
          <group key={colIdx} position={[xOff, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.35, 0.35, 2.4, 8]} />
              <meshStandardMaterial
                color="#737373"
                wireframe
                transparent
                opacity={0.65}
                emissive="#404040"
                emissiveIntensity={0.2}
              />
            </mesh>
            {[-0.7, 0, 0.7].map((yOff, bIdx) => (
              <mesh key={bIdx} position={[0, yOff, 0.4]}>
                <sphereGeometry args={[0.09, 12, 12]} />
                <meshStandardMaterial
                  color="#262626"
                  emissive="#171717"
                  emissiveIntensity={0.4}
                />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      <group ref={scene7Ref} visible={false}>
        <mesh>
          <dodecahedronGeometry args={[1.6, 1]} />
          <meshStandardMaterial color="#404040" wireframe transparent opacity={0.6} emissive="#262626" emissiveIntensity={0.3} />
        </mesh>
        <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <torusGeometry args={[2.0, 0.03, 16, 64]} />
          <meshBasicMaterial color="#737373" transparent opacity={0.6} />
        </mesh>
      </group>

      <group ref={scene8Ref} visible={false}>
        <mesh>
          <octahedronGeometry args={[1.2, 0]} />
          <meshStandardMaterial color="#404040" wireframe transparent opacity={0.6} emissive="#262626" emissiveIntensity={0.3} />
        </mesh>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <ringGeometry args={[1.7, 1.74, 64]} />
          <meshBasicMaterial color="#525252" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
