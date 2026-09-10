'use client';

import { useState, useEffect, RefObject } from 'react';

export interface StoryProgress {
  raw: number;
  damped: number;
  stageIndex: number;
  stageProgress: number;
  mouse: { x: number; y: number };
}

export function useStoryScroll(containerRef: RefObject<HTMLElement | null>): StoryProgress {
  const [progress, setProgress] = useState<StoryProgress>({
    raw: 0,
    damped: 0,
    stageIndex: 0,
    stageProgress: 0,
    mouse: { x: 0, y: 0 },
  });

  useEffect(() => {
    let animId: number;
    let currentDamped = 0;
    let targetRaw = 0;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      targetMouseX = (e.clientX / w) * 2 - 1;
      targetMouseY = -((e.clientY / h) * 2 - 1);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const update = () => {
      const el = containerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const totalScrollable = rect.height - window.innerHeight;
        if (totalScrollable > 0) {
          const currentTop = -rect.top;
          targetRaw = Math.min(Math.max(currentTop / totalScrollable, 0), 1);
        }
      }

      // Smooth spring damping for cinematic feel
      currentDamped += (targetRaw - currentDamped) * 0.08;
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Calculate stage index (0 to 6)
      const stageCount = 7;
      const stageSegment = 1 / stageCount;
      const stageIndex = Math.min(Math.floor(currentDamped / stageSegment), stageCount - 1);
      const stageProgress = (currentDamped - stageIndex * stageSegment) / stageSegment;

      setProgress({
        raw: targetRaw,
        damped: currentDamped,
        stageIndex,
        stageProgress: Math.min(Math.max(stageProgress, 0), 1),
        mouse: { x: mouseX, y: mouseY },
      });

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [containerRef]);

  return progress;
}
