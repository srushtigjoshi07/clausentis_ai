'use client';

import { useEffect, useRef } from 'react';

export function GlobalIntelligenceBackground() {
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

    // Node & line model with depth (Z axis)
    const NODE_COUNT = Math.min(38, Math.floor(width / 35));
    interface Node3D {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      vz: number;
      radius: number;
      alpha: number;
    }

    const nodes: Node3D[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 500 + 100, // Z depth from 100 to 600
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        vz: (Math.random() - 0.5) * 0.15,
        radius: Math.random() * 1.5 + 1,
        alpha: Math.random() * 0.4 + 0.15,
      });
    }

    // Energy pulses traveling along connections
    interface Pulse {
      fromIndex: number;
      toIndex: number;
      progress: number;
      speed: number;
    }
    const pulses: Pulse[] = [];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Subtle spatial coordinate grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.12)';
      ctx.lineWidth = 1;
      const gridSize = 120;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Update and project nodes
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;
        node.z += node.vz;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
        if (node.z < 80 || node.z > 600) node.vz *= -1;
      });

      // 3. Draw inter-node connection lines based on 3D distance
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dz = nodes[i].z - nodes[j].z;
          const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist3D < 160) {
            const opacity = (1 - dist3D / 160) * 0.18;
            ctx.strokeStyle = `rgba(56, 189, 248, ${opacity})`;
            ctx.lineWidth = 0.75;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();

            // Occasionally spawn a subtle energy pulse
            if (Math.random() < 0.0006 && pulses.length < 5) {
              pulses.push({
                fromIndex: i,
                toIndex: j,
                progress: 0,
                speed: 0.008 + Math.random() * 0.006,
              });
            }
          }
        }
      }

      // 4. Render and update energy pulses
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed;

        const from = nodes[pulse.fromIndex];
        const to = nodes[pulse.toIndex];

        if (from && to && pulse.progress <= 1) {
          const px = from.x + (to.x - from.x) * pulse.progress;
          const py = from.y + (to.y - from.y) * pulse.progress;

          ctx.fillStyle = 'rgba(56, 189, 248, 0.7)';
          ctx.beginPath();
          ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fill();

          // Subtle pulse glow
          ctx.fillStyle = 'rgba(37, 99, 235, 0.25)';
          ctx.beginPath();
          ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          pulses.splice(p, 1);
        }
      }

      // 5. Render luminous nodes
      nodes.forEach((node) => {
        const depthScale = 300 / node.z;
        const radius = Math.max(1, node.radius * depthScale);
        const alpha = Math.min(0.6, node.alpha * depthScale);

        // Ambient node glow
        ctx.fillStyle = `rgba(37, 99, 235, ${alpha * 0.3})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Node core
        ctx.fillStyle = `rgba(186, 230, 253, ${alpha})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
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
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60">
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Subtle radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.08),rgba(6,9,15,0.85))]" />
    </div>
  );
}
