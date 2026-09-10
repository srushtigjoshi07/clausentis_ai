'use client';

import { useState, useEffect, useRef } from 'react';

export interface StageProgresses {
  global: number;
  hero: number;
  ingestion: number;
  extraction: number;
  graph: number;
  evidence: number;
  compliance: number;
  readiness: number;
  product: number;
  cta: number;
  mouse: { x: number; y: number };
}

export function calcNormalizedProgress(val: number, start: number, end: number): number {
  if (val <= start) return 0;
  if (val >= end) return 1;
  return (val - start) / (end - start);
}

export function useLandingScroll(): StageProgresses {
  const [progresses, setProgresses] = useState<StageProgresses>({
    global: 0,
    hero: 1,
    ingestion: 0,
    extraction: 0,
    graph: 0,
    evidence: 0,
    compliance: 0,
    readiness: 0,
    product: 0,
    cta: 0,
    mouse: { x: 0, y: 0 },
  });

  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      mouseRef.current.targetX = (e.clientX / w) * 2 - 1;
      mouseRef.current.targetY = -((e.clientY / h) * 2 - 1);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const updateScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY || window.pageYOffset || 0;
      const global = maxScroll > 0 ? Math.min(Math.max(currentScroll / maxScroll, 0), 1) : 0;

      // Mouse damping
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;

      const hero = 1 - calcNormalizedProgress(global, 0.0, 0.12);
      const ingestion = calcNormalizedProgress(global, 0.08, 0.23);
      const extraction = calcNormalizedProgress(global, 0.20, 0.36);
      const graph = calcNormalizedProgress(global, 0.33, 0.50);
      const evidence = calcNormalizedProgress(global, 0.47, 0.64);
      const compliance = calcNormalizedProgress(global, 0.61, 0.77);
      const readiness = calcNormalizedProgress(global, 0.74, 0.87);
      const product = calcNormalizedProgress(global, 0.85, 0.94);
      const cta = calcNormalizedProgress(global, 0.92, 1.0);

      setProgresses({
        global,
        hero,
        ingestion,
        extraction,
        graph,
        evidence,
        compliance,
        readiness,
        product,
        cta,
        mouse: { x: mouseRef.current.x, y: mouseRef.current.y },
      });

      animId = requestAnimationFrame(updateScroll);
    };

    animId = requestAnimationFrame(updateScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return progresses;
}
