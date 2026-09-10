'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { StageProgresses } from '@/hooks/useLandingScroll';

interface SceneCameraProps {
  progresses: StageProgresses;
  reducedMotion: boolean;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export function SceneCamera({ progresses, reducedMotion }: SceneCameraProps) {
  const { camera } = useThree();
  const currentPos = useRef(new THREE.Vector3(0.0, 0.0, 7.0));
  const currentLookAt = useRef(new THREE.Vector3(0.0, 0.0, 0.0));

  useFrame(() => {
    const rawP =
      typeof window !== 'undefined' &&
      (window as unknown as { __landingScrollProgress?: number }).__landingScrollProgress !== undefined
        ? (window as unknown as { __landingScrollProgress: number }).__landingScrollProgress
        : progresses.global;

    const global = Math.min(Math.max(rawP, 0), 1);
    const mouse =
      typeof window !== 'undefined' &&
      (window as unknown as { __landingMouse?: { x: number; y: number } }).__landingMouse !== undefined
        ? (window as unknown as { __landingMouse: { x: number; y: number } }).__landingMouse
        : progresses.mouse;

    let targetX = 0.0;
    let targetY = 0.0;
    let targetZ = 7.0;
    let lookAtX = 0.0;
    let lookAtY = 0.0;
    let lookAtZ = 0.0;

    // =======================================================================
    // CINEMATOGRAPHIC CAMERA DIRECTION ACROSS GLOBAL SCROLL
    // =======================================================================

    // SCENE 01: HERO (0.000 - 0.125) — Preserved 100%
    if (global <= 0.125) {
      const t = easeInOutCubic(global / 0.125);
      targetZ = THREE.MathUtils.lerp(7.0, 6.2, t);
      targetX = THREE.MathUtils.lerp(0.0, 0.12, t);
      targetY = 0.0;
      lookAtX = 0.0;
      lookAtY = 0.0;
      lookAtZ = 0.0;
    }
    // SCENE 02: ARCHIVE → EXTRACTION → ESSENCE (0.125 - 0.250)
    else if (global <= 0.250) {
      const s2 = (global - 0.125) / 0.125;

      if (s2 < 0.30) {
        // Quiet entry: camera glides slowly through massive negative space
        const t = easeInOutCubic(s2 / 0.30);
        targetZ = THREE.MathUtils.lerp(6.2, 4.0, t);
        targetX = THREE.MathUtils.lerp(0.12, -0.45, t);
        targetY = THREE.MathUtils.lerp(0.0, 0.12, t);
        lookAtX = -0.1;
        lookAtY = 0.0;
        lookAtZ = -1.5;
      } else if (s2 < 0.65) {
        // Deep spatial travel: gliding past close documents, camera gently banks right
        const t = easeOutQuart((s2 - 0.30) / 0.35);
        targetZ = THREE.MathUtils.lerp(4.0, 1.9, t);
        targetX = THREE.MathUtils.lerp(-0.45, 0.40, t);
        targetY = THREE.MathUtils.lerp(0.12, -0.18, t);
        lookAtX = 0.08;
        lookAtY = -0.04;
        lookAtZ = -1.5;
      } else if (s2 < 0.85) {
        // Alignment with converging silk streams: camera moves into center
        const t = easeInOutCubic((s2 - 0.65) / 0.20);
        targetZ = THREE.MathUtils.lerp(1.9, 0.7, t);
        targetX = THREE.MathUtils.lerp(0.40, 0.0, t);
        targetY = THREE.MathUtils.lerp(-0.18, 0.0, t);
        lookAtX = 0.0;
        lookAtY = 0.0;
        lookAtZ = -1.5;
      } else {
        // Climax convergence dive: accelerates directly toward the single concentrated point
        const t = easeInOutCubic((s2 - 0.85) / 0.15);
        targetZ = THREE.MathUtils.lerp(0.7, -1.2, t);
        targetX = 0.0;
        targetY = 0.0;
        lookAtX = 0.0;
        lookAtY = 0.0;
        lookAtZ = -2.2;
      }
    }
    // SCENE 03: ARCHITECTURE → VERIFICATION → RESOLUTION (0.250 - 0.375)
    else if (global <= 0.375) {
      const s3 = (global - 0.250) / 0.125;

      if (s3 < 0.25) {
        // Emerge from point: slow pull-back revealing delicate structural growth
        const t = easeInOutCubic(s3 / 0.25);
        targetZ = THREE.MathUtils.lerp(0.8, 2.8, t);
        targetX = 0.0;
        targetY = THREE.MathUtils.lerp(0.0, 0.15, t);
        lookAtX = 0.0;
        lookAtY = 0.0;
        lookAtZ = 0.0;
      } else if (s3 < 0.60) {
        // Interior spatial traversal: camera moves INSIDE the structure, looking slightly upward
        const t = easeInOutSine((s3 - 0.25) / 0.35);
        const orbitAngle = (t - 0.5) * Math.PI * 0.45;
        targetX = Math.sin(orbitAngle) * 1.8;
        targetZ = Math.cos(orbitAngle) * 1.6 + 0.4;
        targetY = 0.15 + Math.sin(t * Math.PI) * 0.2;
        lookAtX = 0.0;
        lookAtY = 0.1;
        lookAtZ = 0.0;
      } else if (s3 < 0.82) {
        // Majestic architectural reveal during surgical verification wave
        const t = easeInOutCubic((s3 - 0.60) / 0.22);
        targetX = THREE.MathUtils.lerp(0.6, 0.0, t);
        targetY = THREE.MathUtils.lerp(0.2, 0.05, t);
        targetZ = THREE.MathUtils.lerp(2.2, 3.8, t);
        lookAtX = 0.0;
        lookAtY = 0.0;
        lookAtZ = 0.0;
      } else {
        // Compression follow: as structure folds inward into core, camera pushes in with it
        const t = easeInOutCubic((s3 - 0.82) / 0.18);
        targetX = 0.0;
        targetY = 0.0;
        targetZ = THREE.MathUtils.lerp(3.8, 1.4, t);
        lookAtX = 0.0;
        lookAtY = 0.0;
        lookAtZ = 0.0;
      }
    }
    // SCENE 04: PATHWAYS → DECISIONS → CLARITY (0.375 - 0.500)
    else if (global <= 0.500) {
      const s4 = (global - 0.375) / 0.125;

      if (s4 < 0.25) {
        // Release: moving forward alongside the first deliberate paths
        const t = easeInOutCubic(s4 / 0.25);
        targetZ = THREE.MathUtils.lerp(1.4, 2.0, t);
        targetX = THREE.MathUtils.lerp(0.0, -0.28, t);
        targetY = THREE.MathUtils.lerp(0.0, 0.12, t);
        lookAtX = -0.08;
        lookAtY = 0.0;
        lookAtZ = 0.0;
      } else if (s4 < 0.60) {
        // Physical travel with information: banking into decision turns
        const t = easeInOutCubic((s4 - 0.25) / 0.35);
        targetZ = THREE.MathUtils.lerp(2.0, 2.6, t);
        targetX = Math.sin(t * Math.PI * 1.4) * 0.35;
        targetY = Math.cos(t * Math.PI) * 0.15;
        lookAtX = targetX * 0.3;
        lookAtY = targetY * 0.3;
        lookAtZ = 0.0;
      } else if (s4 < 0.82) {
        // THE GRAND CINEMATIC PULL-BACK: vast scale reveal
        const t = easeOutQuart((s4 - 0.60) / 0.22);
        targetX = THREE.MathUtils.lerp(targetX, 0.0, t);
        targetY = THREE.MathUtils.lerp(targetY, 0.0, t);
        targetZ = THREE.MathUtils.lerp(2.6, 7.2, t);
        lookAtX = 0.0;
        lookAtY = 0.0;
        lookAtZ = 0.0;
      } else {
        // Breathing pause & clarity: minimal, pristine, quiet hold
        targetX = 0.0;
        targetY = 0.0;
        targetZ = 7.2;
        lookAtX = 0.0;
        lookAtY = 0.0;
        lookAtZ = 0.0;
      }
    }
    // SCENES 05 - 08: Preserved
    else if (global <= 0.625) {
      const t = (global - 0.500) / 0.125;
      targetZ = THREE.MathUtils.lerp(7.2, 5.4, t);
      targetX = THREE.MathUtils.lerp(0.0, -0.2, t);
      targetY = THREE.MathUtils.lerp(0.0, 0.1, t);
    } else if (global <= 0.750) {
      const t = (global - 0.625) / 0.125;
      targetZ = THREE.MathUtils.lerp(5.4, 5.0, t);
      targetX = THREE.MathUtils.lerp(-0.2, 0.2, t);
      targetY = THREE.MathUtils.lerp(0.1, -0.1, t);
    } else if (global <= 0.875) {
      const t = (global - 0.750) / 0.125;
      targetZ = THREE.MathUtils.lerp(5.0, 5.8, t);
      targetX = THREE.MathUtils.lerp(0.2, -0.1, t);
      targetY = THREE.MathUtils.lerp(-0.1, 0.1, t);
    } else {
      const t = (global - 0.875) / 0.125;
      targetZ = THREE.MathUtils.lerp(5.8, 6.8, t);
      targetX = THREE.MathUtils.lerp(-0.1, 0.0, t);
      targetY = THREE.MathUtils.lerp(0.1, -0.05, t);
      lookAtY = THREE.MathUtils.lerp(0.0, -0.2, t);
    }

    // Subtle natural mouse parallax
    const mouseMult = reducedMotion ? 0.0 : 0.22;
    const finalTargetX = targetX + mouse.x * mouseMult;
    const finalTargetY = targetY + mouse.y * mouseMult;

    currentPos.current.x += (finalTargetX - currentPos.current.x) * 0.065;
    currentPos.current.y += (finalTargetY - currentPos.current.y) * 0.065;
    currentPos.current.z += (targetZ - currentPos.current.z) * 0.065;

    currentLookAt.current.x += (lookAtX - currentLookAt.current.x) * 0.065;
    currentLookAt.current.y += (lookAtY - currentLookAt.current.y) * 0.065;
    currentLookAt.current.z += (lookAtZ - currentLookAt.current.z) * 0.065;


    camera.position.copy(currentPos.current);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}
