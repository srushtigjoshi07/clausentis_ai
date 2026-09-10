'use client';

import { useEffect, useRef } from 'react';

export function ScrollIntelligenceBackground() {
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

    // Scroll state with smooth liquid lerping
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

    // 1. Initialize 260 3D Luminous Light Particles (Small Specks, Micro Data Particles, Glowing Dust)
    const PARTICLE_COUNT = 260;
    interface Particle3D {
      baseX: number;
      baseY: number;
      baseZ: number;
      vx: number;
      vy: number;
      vz: number;
      type: 'core' | 'luminous' | 'ambient';
      size: number;
    }

    const particles: Particle3D[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        baseX: (Math.random() - 0.5) * (width * 1.6),
        baseY: (Math.random() - 0.5) * (height * 1.6),
        baseZ: Math.random() * 550 + 30,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        vz: (Math.random() - 0.5) * 0.18,
        type: i % 8 === 0 ? 'core' : i % 3 === 0 ? 'luminous' : 'ambient',
        size: i % 8 === 0 ? 2.2 : i % 3 === 0 ? 1.5 : 0.9,
      });
    }

    let time = 0;

    const render = () => {
      time += 0.012;

      // Smooth scroll interpolation across full page (0.0 to 1.0)
      currentScroll += (targetScroll - currentScroll) * 0.08;
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const p = currentScroll; // 0.0 (Top) to 1.0 (Footer)

      ctx.clearRect(0, 0, width, height);

      // 3D PERSPECTIVE PROJECTION
      const fov = 460;
      const centerX = width / 2 + mouseX;
      const centerY = height / 2 + mouseY;

      const projected = particles.map((pt, i) => {
        const x = pt.baseX + Math.sin(time + i) * 16;
        const y = pt.baseY + Math.cos(time * 0.8 + i) * 16;
        let z = pt.baseZ;

        // Flowing forward motion based on scroll progress
        z = (z - p * 340 + 600) % 550 + 20;

        const scale = fov / (fov + z);
        const screenX = centerX + x * scale;
        const screenY = centerY + y * scale;

        return { screenX, screenY, scale, z, type: pt.type, size: pt.size };
      });

      // DRAW CONNECTING FLOWING DATA PATHWAYS
      ctx.lineWidth = 1;
      for (let i = 0; i < projected.length; i += 2) {
        for (let j = i + 1; j < Math.min(projected.length, i + 7); j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const distSq = (p1.screenX - p2.screenX) ** 2 + (p1.screenY - p2.screenY) ** 2;

          if (distSq < 13500) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist / 116) * 0.22 * Math.min(1, p1.scale * 1.4);

            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.screenX, p1.screenY);
            const midX = (p1.screenX + p2.screenX) / 2;
            const midY = (p1.screenY + p2.screenY) / 2;
            ctx.quadraticCurveTo(midX, midY, p2.screenX, p2.screenY);
            ctx.stroke();
          }
        }
      }

      // DRAW THOUSANDS OF SMALL LUMINOUS BLUE/CYAN LIGHT PARTICLES
      projected.forEach((pt) => {
        if (pt.screenX < -20 || pt.screenX > width + 20 || pt.screenY < -20 || pt.screenY > height + 20) return;

        const radius = pt.size * pt.scale;
        const alpha = Math.min(0.9, (0.35 + pt.scale * 0.55));

        if (pt.type === 'core') {
          ctx.fillStyle = `rgba(224, 242, 254, ${alpha})`;
        } else if (pt.type === 'luminous') {
          ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
        } else {
          ctx.fillStyle = `rgba(96, 165, 250, ${alpha * 0.8})`;
        }

        ctx.beginPath();
        ctx.arc(pt.screenX, pt.screenY, Math.max(0.6, radius), 0, Math.PI * 2);
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
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 w-full h-full"
      style={{ opacity: 0.95 }}
    />
  );
}
