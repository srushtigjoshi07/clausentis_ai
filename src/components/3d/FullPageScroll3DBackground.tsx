'use client';

import { useEffect, useRef } from 'react';

export function FullPageScroll3DBackground() {
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

    // Scroll state with smooth lerping
    let currentScroll = 0;
    let targetScroll = 0;

    const handleScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      targetScroll = Math.min(1, Math.max(0, window.scrollY / maxScroll));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Mouse parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 40;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 40;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // 1. Core 3D Node Constellation
    interface SpatialNode {
      baseX: number;
      baseY: number;
      baseZ: number;
      clusterIndex: number; // 0 to 4 for the 5 compliance domains
      type: 'sparse' | 'data' | 'requirement' | 'evidence' | 'core';
      pulsePhase: number;
    }

    const NODE_COUNT = Math.min(52, Math.floor(width / 26));
    const nodes: SpatialNode[] = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        baseX: (Math.random() - 0.5) * (width * 1.2),
        baseY: (Math.random() - 0.5) * (height * 1.2),
        baseZ: Math.random() * 400 + 50,
        clusterIndex: i % 5,
        type: i % 4 === 0 ? 'core' : i % 3 === 0 ? 'requirement' : i % 2 === 0 ? 'evidence' : 'data',
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // 2. Document Planes Data
    const docPlanes = [
      { x: -width * 0.28, y: -height * 0.15, z: 220, rotZ: 0.15 },
      { x: width * 0.32, y: height * 0.18, z: 280, rotZ: -0.22 },
      { x: -width * 0.22, y: height * 0.25, z: 320, rotZ: 0.08 },
    ];

    // 3. Cluster centers for Compliance stage (Section 6)
    const clusterCenters = [
      { x: -width * 0.28, y: -height * 0.2 }, // Financial
      { x: width * 0.28, y: -height * 0.18 },  // Legal
      { x: -width * 0.32, y: height * 0.18 },  // Technical
      { x: width * 0.3, y: height * 0.22 },   // Experience
      { x: 0, y: height * 0.3 },              // Documentation
    ];

    let time = 0;

    const render = () => {
      time += 0.01;

      // Smooth scroll lerping for liquid fluidity
      currentScroll += (targetScroll - currentScroll) * 0.08;
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const p = currentScroll; // Progress 0 to 1

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2 + mouseX;
      const cy = height / 2 + mouseY;

      // Dynamic Camera Z and Yaw based on scroll progress
      const camZ = 350 - p * 120;
      const camRotY = (p - 0.5) * 0.45;
      const camRotX = (p - 0.5) * 0.25;

      // 1. Atmospheric Deep Background Grid (faint technical spatial coordinates)
      const gridAlpha = Math.max(0.02, 0.06 * (1 - Math.abs(p - 0.5) * 0.8));
      ctx.strokeStyle = `rgba(56, 189, 248, ${gridAlpha})`;
      ctx.lineWidth = 0.5;

      const gridSize = 100;
      const gridOffset = (p * 180) % gridSize;

      for (let x = -gridOffset; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = -gridOffset; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Project Nodes dynamically according to 10-stage scroll trajectory
      interface ProjectedNode {
        px: number;
        py: number;
        scale: number;
        z: number;
        alpha: number;
        type: string;
        clusterIndex: number;
      }

      const projectedNodes: ProjectedNode[] = [];

      nodes.forEach((node, idx) => {
        let x = node.baseX;
        let y = node.baseY;
        let z = node.baseZ;

        // Stage 1-2 (0.0 to 0.25): Sparse -> Gathering
        if (p < 0.25) {
          const sFactor = p / 0.25;
          x += Math.sin(time + idx) * 15 * (1 - sFactor);
          y += Math.cos(time + idx) * 15 * (1 - sFactor);
        }
        // Stage 3-5 (0.25 to 0.55): Structured Extraction & Energy Paths
        else if (p < 0.55) {
          const sFactor = (p - 0.25) / 0.3;
          // Align in structured geometric matrix
          const col = idx % 6;
          const row = Math.floor(idx / 6);
          const targetMatrixX = (col - 2.5) * (width * 0.16);
          const targetMatrixY = (row - 3.5) * (height * 0.14);

          x = x * (1 - sFactor) + targetMatrixX * sFactor;
          y = y * (1 - sFactor) + targetMatrixY * sFactor;
        }
        // Stage 6-7 (0.55 to 0.78): 5 Spatial Compliance Constellations & Verification
        else if (p < 0.78) {
          const sFactor = (p - 0.55) / 0.23;
          const center = clusterCenters[node.clusterIndex];
          const clusterAngle = (idx / 10) * Math.PI * 2;
          const clusterRadius = 45 + (idx % 3) * 15;

          const targetClusterX = center.x + Math.cos(clusterAngle + time * 0.2) * clusterRadius;
          const targetClusterY = center.y + Math.sin(clusterAngle + time * 0.2) * clusterRadius;

          x = x * (1 - sFactor) + targetClusterX * sFactor;
          y = y * (1 - sFactor) + targetClusterY * sFactor;
        }
        // Stage 8-9 (0.78 to 0.94): Convergence into Central Intelligence Core
        else if (p < 0.94) {
          const sFactor = (p - 0.78) / 0.16;
          const phi = Math.acos(-1 + (2 * idx) / NODE_COUNT);
          const theta = Math.sqrt(NODE_COUNT * Math.PI) * phi + time * 0.8;
          const coreR = 85;

          const targetCoreX = coreR * Math.cos(theta) * Math.sin(phi);
          const targetCoreY = coreR * Math.sin(theta) * Math.sin(phi);
          const targetCoreZ = coreR * Math.cos(phi) + 120;

          x = x * (1 - sFactor) + targetCoreX * sFactor;
          y = y * (1 - sFactor) + targetCoreY * sFactor;
          z = z * (1 - sFactor) + targetCoreZ * sFactor;
        }
        // Stage 10 (0.94 to 1.0): Footer calm dispersion
        else {
          const sFactor = (p - 0.94) / 0.06;
          x = x * (1 + sFactor * 1.5);
          y = y * (1 + sFactor * 1.5);
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

        // Perspective
        const scale = 360 / (360 + z2 + camZ);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        // Calculate dynamic alpha: Keep center darker for maximum text readability
        const distFromCenter = Math.sqrt((px - width / 2) ** 2 + (py - height / 2) ** 2);
        const centerFalloff = Math.min(1, distFromCenter / (width * 0.28));
        const alpha = Math.min(0.7, Math.max(0.08, scale * 0.6 * (0.35 + centerFalloff * 0.65)));

        projectedNodes.push({
          px,
          py,
          scale,
          z: z2,
          alpha,
          type: node.type,
          clusterIndex: node.clusterIndex,
        });
      });

      // 3. Draw Document Planes in Stage 4 (0.32 to 0.58)
      if (p > 0.28 && p < 0.62) {
        const docAlpha = Math.sin(((p - 0.28) / 0.34) * Math.PI) * 0.22;

        docPlanes.forEach((doc) => {
          ctx.save();
          ctx.translate(cx + doc.x, cy + doc.y);
          ctx.rotate(doc.rotZ + (p - 0.3) * 0.4);

          ctx.fillStyle = `rgba(15, 23, 42, ${docAlpha})`;
          ctx.strokeStyle = `rgba(56, 189, 248, ${docAlpha * 1.5})`;
          ctx.lineWidth = 1;
          ctx.fillRect(-35, -50, 70, 100);
          ctx.strokeRect(-35, -50, 70, 100);

          // Subtle text line mockups on floating plane
          ctx.fillStyle = `rgba(56, 189, 248, ${docAlpha * 0.8})`;
          for (let l = 0; l < 4; l++) {
            ctx.fillRect(-24, -30 + l * 14, 48, 2);
          }

          ctx.restore();
        });
      }

      // 4. Draw 3D Connection Lines & Travelling Electric Blue Pulses
      const maxConnectDist = p > 0.75 ? 85 : p > 0.4 ? 120 : 95;

      for (let i = 0; i < projectedNodes.length; i++) {
        for (let j = i + 1; j < projectedNodes.length; j++) {
          const n1 = projectedNodes[i];
          const n2 = projectedNodes[j];

          const dx = n1.px - n2.px;
          const dy = n1.py - n2.py;
          const dist2D = Math.sqrt(dx * dx + dy * dy);

          if (dist2D < maxConnectDist) {
            const lineAlpha = (1 - dist2D / maxConnectDist) * Math.min(n1.alpha, n2.alpha) * 0.6;
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
            ctx.lineWidth = p > 0.65 ? 1.2 : 0.75;
            ctx.beginPath();
            ctx.moveTo(n1.px, n1.py);
            ctx.lineTo(n2.px, n2.py);
            ctx.stroke();

            // Scroll-Driven Electric Energy Pulse (Section 5, 7, 8)
            if (p > 0.45 && p < 0.95 && (i + j) % 3 === 0) {
              const pulsePos = (p * 4 + time * 0.4) % 1;
              const pulseX = n1.px + (n2.px - n1.px) * pulsePos;
              const pulseY = n1.py + (n2.py - n1.py) * pulsePos;

              ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
              ctx.beginPath();
              ctx.arc(pulseX, pulseY, 2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // 5. Draw 3D Luminous Nodes
      projectedNodes.sort((a, b) => b.z - a.z);

      projectedNodes.forEach((node) => {
        const radius = Math.max(1.2, (node.type === 'core' ? 3.5 : 2.2) * node.scale);

        // Ambient glow
        ctx.fillStyle = `rgba(37, 99, 235, ${node.alpha * 0.35})`;
        ctx.beginPath();
        ctx.arc(node.px, node.py, radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Node core
        ctx.fillStyle = `rgba(224, 242, 254, ${node.alpha})`;
        ctx.beginPath();
        ctx.arc(node.px, node.py, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Subtle vignette layer ensuring center text clarity */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_65%_at_50%_40%,transparent_0%,rgba(5,7,11,0.5)_60%,rgba(5,7,11,0.92)_100%)]" />
    </div>
  );
}
