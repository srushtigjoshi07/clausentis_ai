'use client';

import { useEffect, useRef } from 'react';

export function HeroIntelligenceStructure() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Scroll tracker
    let scrollProgress = 0;
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress = totalScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / totalScroll)) : 0;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // 3D Polyhedron / Intelligence Nodes Definition
    interface Point3D {
      x: number;
      y: number;
      z: number;
      baseX: number;
      baseY: number;
      baseZ: number;
      targetX: number;
      targetY: number;
      targetZ: number;
      type: 'core' | 'requirement' | 'document' | 'evidence';
    }

    const points: Point3D[] = [];
    const POINT_COUNT = 24;

    // Create structured dual-shell geometry
    for (let i = 0; i < POINT_COUNT; i++) {
      const phi = Math.acos(-1 + (2 * i) / POINT_COUNT);
      const theta = Math.sqrt(POINT_COUNT * Math.PI) * phi;
      const r = 160;

      const x = r * Math.cos(theta) * Math.sin(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(phi);

      // Random loose dispersion for State 1
      const looseX = (Math.random() - 0.5) * 450;
      const looseY = (Math.random() - 0.5) * 450;
      const looseZ = (Math.random() - 0.5) * 450;

      let type: 'core' | 'requirement' | 'document' | 'evidence' = 'requirement';
      if (i % 4 === 0) type = 'core';
      else if (i % 3 === 0) type = 'document';
      else if (i % 2 === 0) type = 'evidence';

      points.push({
        x: looseX,
        y: looseY,
        z: looseZ,
        baseX: looseX,
        baseY: looseY,
        baseZ: looseZ,
        targetX: x,
        targetY: y,
        targetZ: z,
        type,
      });
    }

    let rotX = 0;
    let rotY = 0;

    const render = () => {
      rotX += 0.003;
      rotY += 0.005;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const fov = 380;

      // Scroll stage interpolation (0 = loose, 1 = crystallized intelligence sphere)
      // Ease transition based on scroll
      const stageFactor = Math.min(1, Math.max(0.15, scrollProgress * 2.2));

      // 1. Calculate 3D rotations and projections
      const projected = points.map((p) => {
        // Interpolate between loose positions and structured polyhedron
        const currX = p.baseX + (p.targetX - p.baseX) * stageFactor;
        const currY = p.baseY + (p.targetY - p.baseY) * stageFactor;
        const currZ = p.baseZ + (p.targetZ - p.baseZ) * stageFactor;

        // Rotate around Y axis
        const x1 = currX * Math.cos(rotY) + currZ * Math.sin(rotY);
        const z1 = -currX * Math.sin(rotY) + currZ * Math.cos(rotY);

        // Rotate around X axis
        const y2 = currY * Math.cos(rotX) - z1 * Math.sin(rotX);
        const z2 = currY * Math.sin(rotX) + z1 * Math.cos(rotX);

        // Perspective Projection
        const scale = fov / (fov + z2 + 300);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        return { px, py, scale, z: z2, type: p.type };
      });

      // Sort by Z for realistic depth layering
      projected.sort((a, b) => b.z - a.z);

      // 2. Draw Wireframe Connection Lines with Depth
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].px - projected[j].px;
          const dy = projected[i].py - projected[j].py;
          const dist2D = Math.sqrt(dx * dx + dy * dy);

          if (dist2D < 130 * stageFactor) {
            const alpha = (1 - dist2D / (130 * stageFactor)) * 0.35 * stageFactor;
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(projected[i].px, projected[i].py);
            ctx.lineTo(projected[j].px, projected[j].py);
            ctx.stroke();
          }
        }
      }

      // 3. Draw Document Facets / Planes
      for (let i = 0; i < projected.length - 2; i += 3) {
        if (stageFactor > 0.4) {
          const p1 = projected[i];
          const p2 = projected[i + 1];
          const p3 = projected[i + 2];

          ctx.fillStyle = `rgba(37, 99, 235, ${0.04 * stageFactor})`;
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.lineTo(p3.px, p3.py);
          ctx.closePath();
          ctx.fill();
        }
      }

      // 4. Draw Luminous 3D Nodes
      projected.forEach((p) => {
        const radius = Math.max(1.5, 3.5 * p.scale);
        const isCore = p.type === 'core';
        const isDoc = p.type === 'document';

        // Outer glow
        ctx.fillStyle = isCore
          ? 'rgba(56, 189, 248, 0.3)'
          : isDoc
          ? 'rgba(96, 165, 250, 0.2)'
          : 'rgba(37, 99, 235, 0.15)';
        ctx.beginPath();
        ctx.arc(p.px, p.py, radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Solid Core
        ctx.fillStyle = isCore
          ? '#e0f2fe'
          : isDoc
          ? '#93c5fd'
          : '#38bdf8';
        ctx.beginPath();
        ctx.arc(p.px, p.py, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-[420px] sm:h-[500px] flex items-center justify-center pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full max-w-[600px] max-h-[600px]" />
    </div>
  );
}
