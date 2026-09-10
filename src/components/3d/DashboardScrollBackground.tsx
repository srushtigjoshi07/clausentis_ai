'use client';

import { useEffect, useRef } from 'react';

export function DashboardScrollBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Scroll state tracking with smooth lerp
    let currentScroll = 0;
    let targetScroll = 0;

    const updateScrollProgress = () => {
      const scrollEl = document.getElementById('dashboard-main-scroll');
      if (scrollEl) {
        const maxScroll = Math.max(1, scrollEl.scrollHeight - scrollEl.clientHeight);
        targetScroll = Math.min(1, Math.max(0, scrollEl.scrollTop / maxScroll));
      } else {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        targetScroll = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      }
    };

    const scrollEl = document.getElementById('dashboard-main-scroll');
    if (scrollEl) {
      scrollEl.addEventListener('scroll', updateScrollProgress, { passive: true });
    }
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    updateScrollProgress();

    // Subtle mouse parallax (5-10px equivalent)
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 12;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 12;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Refined Node count for optimal spatial clarity without clutter
    const NODE_COUNT = 110;
    interface Node3D {
      baseX: number;
      baseY: number;
      baseZ: number;
      clusterId: number; // 0: Top-Left, 1: Top-Right, 2: Mid-Left, 3: Mid-Right, 4: Bottom-Center
      isAnchor: boolean;
    }

    const nodes: Node3D[] = [];

    // Distribute nodes across the full canvas viewport and 3D depth
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        baseX: (Math.random() - 0.5) * (width * 1.35),
        baseY: (Math.random() - 0.5) * (height * 1.35),
        baseZ: Math.random() * 450 + 60,
        clusterId: i % 5,
        isAnchor: i % 6 === 0,
      });
    }

    // 5 Distributed Spatial Anchor Centers (Wide layout across full viewport)
    const clusterCenters = [
      { x: -width * 0.32, y: -height * 0.28 }, // Top-Left (Financial / System)
      { x: width * 0.32, y: -height * 0.26 },  // Top-Right (Legal / Compliance)
      { x: -width * 0.35, y: height * 0.15 },  // Mid-Left (Technical)
      { x: width * 0.35, y: height * 0.18 },   // Mid-Right (Experience)
      { x: 0, y: height * 0.34 },              // Bottom-Center (Verification)
    ];

    let time = 0;

    const render = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      time += prefersReducedMotion ? 0 : 0.008;

      // Smooth scroll interpolation (scrubbed smoothly in both directions)
      currentScroll += (targetScroll - currentScroll) * 0.08;
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const p = currentScroll; // 0.0 (Top) to 1.0 (Bottom)

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2 + mouseX;
      const cy = height / 2 + mouseY;

      // 1. FULL-SCREEN SOFT ATMOSPHERIC BLUE LIGHT (No solid boxes, only soft volumetric ambient field)
      const field1X = cx + Math.sin(time * 0.2) * (width * 0.28) + width * 0.18;
      const field1Y = cy + Math.cos(time * 0.18) * (height * 0.22) - height * 0.15;
      const grad1 = ctx.createRadialGradient(field1X, field1Y, 15, field1X, field1Y, width * 0.48);
      grad1.addColorStop(0, 'rgba(37, 99, 235, 0.07)');
      grad1.addColorStop(0.55, 'rgba(56, 189, 248, 0.02)');
      grad1.addColorStop(1, 'transparent');
      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const field2X = cx - Math.cos(time * 0.15) * (width * 0.28) - width * 0.18;
      const field2Y = cy + Math.sin(time * 0.22) * (height * 0.22) + height * 0.18;
      const grad2 = ctx.createRadialGradient(field2X, field2Y, 15, field2X, field2Y, width * 0.48);
      grad2.addColorStop(0, 'rgba(59, 130, 246, 0.055)');
      grad2.addColorStop(0.55, 'rgba(37, 99, 235, 0.015)');
      grad2.addColorStop(1, 'transparent');
      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      // 2. FAR BACKGROUND LAYER — Subtle 3D Coordinate Grid with Perspective (Continuous lines, no box frames)
      const camZ = 350 - p * 110;
      const camRotY = (p - 0.5) * 0.35;
      const camRotX = (p - 0.5) * 0.18;

      const gridAlpha = Math.max(0.02, 0.055 * (1 - Math.abs(p - 0.5) * 0.4));
      ctx.strokeStyle = `rgba(56, 189, 248, ${gridAlpha})`;
      ctx.lineWidth = 0.5;

      const gridSize = 120;
      const gridShiftY = (p * 160 + time * 3.5) % gridSize;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = -gridShiftY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 3. MIDDLE LAYER — Dynamic 3D Spatial Nodes Transformation
      interface ProjectedNode {
        px: number;
        py: number;
        scale: number;
        z: number;
        alpha: number;
        isAnchor: boolean;
      }

      const projected: ProjectedNode[] = [];

      nodes.forEach((node, idx) => {
        // Continuous organic ambient drift
        let x = node.baseX + Math.sin(time + idx * 0.6) * 14;
        let y = node.baseY + Math.cos(time + idx * 0.6) * 14;
        let z = node.baseZ;

        // SCROLL 0–20%: Sparse spatial network
        if (p < 0.2) {
          const s = p / 0.2;
          x *= (1 - s * 0.08);
          y *= (1 - s * 0.08);
        }
        // SCROLL 20–40%: More data movement / structured matrix alignment
        else if (p < 0.4) {
          const s = (p - 0.2) / 0.2;
          const col = idx % 9;
          const row = Math.floor(idx / 9);
          const matrixX = (col - 4) * (width * 0.11);
          const matrixY = (row - 6) * (height * 0.09);

          x = x * (1 - s) + matrixX * s;
          y = y * (1 - s) + matrixY * s;
        }
        // SCROLL 40–75%: 5 Distributed Spatial Intelligence Clusters (Wide spread, no center blob)
        else if (p < 0.75) {
          const s = (p - 0.4) / 0.35;
          const center = clusterCenters[node.clusterId];
          const angle = (idx / 12) * Math.PI * 2 + time * 0.2;
          const clusterRadius = 45 + (idx % 3) * 16;

          const targetX = center.x + Math.cos(angle) * clusterRadius;
          const targetY = center.y + Math.sin(angle) * clusterRadius;

          x = x * (1 - s) + targetX * s;
          y = y * (1 - s) + targetY * s;
        }
        // SCROLL 75–90%: Blue energy travels between clusters; elegant balanced flow
        else if (p < 0.9) {
          const s = (p - 0.75) / 0.15;
          const center = clusterCenters[node.clusterId];
          const angle = (idx / 12) * Math.PI * 2 + time * 0.15;
          const clusterRadius = 55 + (idx % 3) * 20;

          const targetX = center.x + Math.cos(angle) * clusterRadius;
          const targetY = center.y + Math.sin(angle) * clusterRadius;

          // Gentle expansive organization rather than single collision
          x = x * (1 - s) + targetX * s;
          y = y * (1 - s) + targetY * s;
        }
        // SCROLL 90–100%: System STABILIZES — Calmer, more spacious, clean open constellation
        else {
          const center = clusterCenters[node.clusterId];
          const angle = (idx / 12) * Math.PI * 2 + time * 0.1;
          const clusterRadius = 65 + (idx % 4) * 22;

          x = center.x + Math.cos(angle) * clusterRadius;
          y = center.y + Math.sin(angle) * clusterRadius;
          z = node.baseZ + 30;
        }

        // Apply 3D Camera Rotation
        const cosY = Math.cos(camRotY);
        const sinY = Math.sin(camRotY);
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;

        const cosX = Math.cos(camRotX);
        const sinX = Math.sin(camRotX);
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        // Perspective projection
        const scale = 380 / (380 + z2 + camZ);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        // Dynamic node luminance (reduced at bottom stage for spacious calm clarity)
        const distCenter = Math.sqrt((px - width / 2) ** 2 + (py - height / 2) ** 2);
        const centerFalloff = Math.min(1, distCenter / (width * 0.28));
        const baseAlpha = p > 0.9 ? 0.45 : p > 0.4 ? 0.65 : 0.55;
        const alpha = Math.min(0.75, Math.max(0.08, scale * baseAlpha * (0.35 + centerFalloff * 0.65)));

        projected.push({
          px,
          py,
          scale,
          z: z2,
          alpha,
          isAnchor: node.isAnchor,
        });
      });

      // 4. NEAR LAYER — Draw Organic Flowing Lines & Refined Electric Blue Signal Pulses
      // Controlled connection threshold to avoid dense wire clumps
      const maxDist = p > 0.85 ? 90 : p > 0.35 ? 105 : 80;
      const connectionProb = p > 0.85 ? 0.45 : p > 0.35 ? 0.65 : 0.35;

      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          if ((i * 5 + j) % 10 > connectionProb * 10) continue;

          const n1 = projected[i];
          const n2 = projected[j];

          const dx = n1.px - n2.px;
          const dy = n1.py - n2.py;
          const dist2D = Math.sqrt(dx * dx + dy * dy);

          if (dist2D < maxDist) {
            const lineAlpha = (1 - dist2D / maxDist) * Math.min(n1.alpha, n2.alpha) * 0.55;
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
            ctx.lineWidth = p > 0.5 && p < 0.9 ? 1.0 : 0.65;
            ctx.beginPath();
            ctx.moveTo(n1.px, n1.py);
            ctx.lineTo(n2.px, n2.py);
            ctx.stroke();

            // Refined Electric Blue Signal Pulse (Travels smoothly along connection)
            if (p > 0.15 && (i + j) % 5 === 0) {
              const pulsePos = (p * 3.5 + time * 0.45) % 1;
              const px = n1.px + (n2.px - n1.px) * pulsePos;
              const py = n1.py + (n2.py - n1.py) * pulsePos;

              ctx.fillStyle = '#38bdf8';
              ctx.beginPath();
              ctx.arc(px, py, 1.8, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // 5. Draw 3D Nodes (Refined, no giant glowing balls)
      projected.sort((a, b) => b.z - a.z);

      projected.forEach((node) => {
        const radius = Math.max(1.2, (node.isAnchor ? 2.6 : 1.7) * node.scale);

        // Soft ambient aura
        ctx.fillStyle = `rgba(37, 99, 235, ${node.alpha * 0.35})`;
        ctx.beginPath();
        ctx.arc(node.px, node.py, radius * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Node core
        ctx.fillStyle = node.isAnchor ? '#e0f2fe' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(node.px, node.py, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (scrollEl) {
        scrollEl.removeEventListener('scroll', updateScrollProgress);
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#03060E]">
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Soft atmospheric gradient ensuring crisp foreground contrast */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_65%_at_50%_45%,transparent_0%,rgba(3,6,14,0.35)_60%,rgba(3,6,14,0.8)_100%)] pointer-events-none" />
    </div>
  );
}
