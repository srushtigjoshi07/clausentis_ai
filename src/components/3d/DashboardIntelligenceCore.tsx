'use client';

import { useEffect, useRef } from 'react';

export function DashboardIntelligenceCore() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 280);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 280);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // 3D Core geometry
    interface Node3D {
      x: number;
      y: number;
      z: number;
      targetX: number;
      targetY: number;
      targetZ: number;
      radius: number;
    }

    const nodes: Node3D[] = [];
    const NODE_COUNT = 16;
    const R = 75;

    // Structured icosahedron-like ring coordinates
    for (let i = 0; i < NODE_COUNT; i++) {
      const phi = Math.acos(-1 + (2 * i) / NODE_COUNT);
      const theta = Math.sqrt(NODE_COUNT * Math.PI) * phi;

      const tx = R * Math.cos(theta) * Math.sin(phi);
      const ty = R * Math.sin(theta) * Math.sin(phi);
      const tz = R * Math.cos(phi);

      // Start dispersed for self-assembly on load
      const startX = (Math.random() - 0.5) * 300;
      const startY = (Math.random() - 0.5) * 300;
      const startZ = (Math.random() - 0.5) * 300;

      nodes.push({
        x: startX,
        y: startY,
        z: startZ,
        targetX: tx,
        targetY: ty,
        targetZ: tz,
        radius: (i % 3 === 0 ? 3 : 2),
      });
    }

    // Orbiting data particles
    const orbits = [
      { radius: 105, speed: 0.025, angle: 0, tilt: 0.4 },
      { radius: 90, speed: -0.018, angle: Math.PI / 2, tilt: -0.6 },
    ];

    let assembly = 0;
    let rotX = 0.2;
    let rotY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Progressively assemble core over first 1.5 seconds
      if (assembly < 1) {
        assembly += 0.015;
      }

      rotY += 0.008;
      rotX += 0.004;

      const cx = width / 2;
      const cy = height / 2;
      const fov = 300;

      // Update positions towards structured core
      nodes.forEach((n) => {
        n.x += (n.targetX - n.x) * (0.04 * assembly);
        n.y += (n.targetY - n.y) * (0.04 * assembly);
        n.z += (n.targetZ - n.z) * (0.04 * assembly);
      });

      // 1. Project nodes to 2D screen with 3D rotation
      const projected = nodes.map((node) => {
        // Rotate Y
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const x1 = node.x * cosY + node.z * sinY;
        const z1 = -node.x * sinY + node.z * cosY;

        // Rotate X
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const y2 = node.y * cosX - z1 * sinX;
        const z2 = node.y * sinX + z1 * cosX;

        const scale = fov / (fov + z2 + 250);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        return { node, px, py, scale, z: z2 };
      });

      // 2. Draw wireframe connection lines
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].px - projected[j].px;
          const dy = projected[i].py - projected[j].py;
          const dist2D = Math.sqrt(dx * dx + dy * dy);

          if (dist2D < 65) {
            const alpha = (1 - dist2D / 65) * 0.4 * Math.min(1, assembly * 1.5);
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(projected[i].px, projected[i].py);
            ctx.lineTo(projected[j].px, projected[j].py);
            ctx.stroke();
          }
        }
      }

      // Sort by depth
      projected.sort((a, b) => b.z - a.z);

      // 3. Draw Orbiting Data Points
      orbits.forEach((orb) => {
        orb.angle += orb.speed;
        const ox = Math.cos(orb.angle) * orb.radius;
        const oy = Math.sin(orb.angle) * orb.radius * Math.cos(orb.tilt);
        const oz = Math.sin(orb.angle) * orb.radius * Math.sin(orb.tilt);

        const cosY = Math.cos(rotY * 0.5);
        const sinY = Math.sin(rotY * 0.5);
        const x1 = ox * cosY + oz * sinY;
        const z1 = -ox * sinY + oz * cosY;

        const scale = fov / (fov + z1 + 250);
        const px = cx + x1 * scale;
        const py = cy + oy * scale;

        // Draw particle trail & glow
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#bae6fd';
        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Draw Core Luminous Nodes
      projected.forEach(({ node, px, py, scale }) => {
        const r = node.radius * scale;

        // Ambient glow
        ctx.fillStyle = 'rgba(37, 99, 235, 0.25)';
        ctx.beginPath();
        ctx.arc(px, py, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Solid Node Core
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-48 h-48 sm:w-56 sm:h-56 pointer-events-none flex items-center justify-center">
      {/* Soft blue volumetric aura behind core */}
      <div className="absolute inset-0 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
      <canvas ref={canvasRef} className="w-full h-full select-none" />
    </div>
  );
}
