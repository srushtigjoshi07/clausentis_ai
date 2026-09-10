'use client';

import { useEffect, useRef } from 'react';

export function CinematicAuthPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const startTime = performance.now();
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      mouse.targetX = nx * 8;
      mouse.targetY = ny * 8;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Document Text Wireframe Lines Configuration
    const docLines = [
      { yOffset: -80, width: 140, isKey: false },
      { yOffset: -55, width: 180, isKey: true },
      { yOffset: -30, width: 160, isKey: false },
      { yOffset: -5, width: 190, isKey: true },
      { yOffset: 20, width: 130, isKey: false },
      { yOffset: 45, width: 170, isKey: false },
      { yOffset: 70, width: 110, isKey: true },
    ];

    // Neural Nodes (12 geometric nodes for sparse elegance)
    const neuralNodes = [
      { baseAngle: 0, r: 85, color: '#38bdf8' },
      { baseAngle: Math.PI / 3, r: 100, color: '#60a5fa' },
      { baseAngle: (2 * Math.PI) / 3, r: 80, color: '#38bdf8' },
      { baseAngle: Math.PI, r: 95, color: '#93c5fd' },
      { baseAngle: (4 * Math.PI) / 3, r: 85, color: '#38bdf8' },
      { baseAngle: (5 * Math.PI) / 3, r: 105, color: '#60a5fa' },
      { baseAngle: Math.PI / 6, r: 45, color: '#ffffff' },
      { baseAngle: (5 * Math.PI) / 6, r: 50, color: '#38bdf8' },
      { baseAngle: (3 * Math.PI) / 2, r: 55, color: '#60a5fa' },
      { baseAngle: 0, r: 0, color: '#ffffff' },
    ];

    // Foreground subtle floating dust particles
    const particles = Array.from({ length: 14 }).map((_, i) => ({
      x: (Math.sin(i * 1.7) * 0.5 + 0.5),
      y: (Math.cos(i * 2.3) * 0.5 + 0.5),
      speed: 0.0003 + (i % 3) * 0.0002,
      size: 1 + (i % 2) * 1.2,
      phase: i * 0.8,
    }));

    const LOOP_DURATION = 24000;

    const render = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width === 0 || height === 0) return;

      const elapsed = now - startTime;
      const loopTime = elapsed % LOOP_DURATION;
      const progress = loopTime / LOOP_DURATION;

      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 + 10;

      // 1. BACKGROUND DEPTH LAYER: Subtle Moving Lighting & Technical Grid
      const lightAngle = progress * Math.PI * 2;
      const lightX = cx + Math.cos(lightAngle) * 160 + mouse.x * 0.3;
      const lightY = cy + Math.sin(lightAngle) * 100 + mouse.y * 0.3;

      const bgGlow = ctx.createRadialGradient(lightX, lightY, 10, lightX, lightY, 280);
      bgGlow.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
      bgGlow.addColorStop(0.5, 'rgba(37, 99, 235, 0.12)');
      bgGlow.addColorStop(1, 'rgba(30, 64, 175, 0.0)');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // Subtle technical grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      const gridOffsetX = (mouse.x * 0.2) % gridSize;
      const gridOffsetY = (mouse.y * 0.2) % gridSize;

      ctx.beginPath();
      for (let x = gridOffsetX; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = gridOffsetY; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // 2. MIDGROUND LAYER: Central AI Journey Morphing
      const docOpacity = 
        progress < 0.35 ? 1 :
        progress < 0.50 ? 1 - ((progress - 0.35) / 0.15) :
        progress > 0.88 ? (progress - 0.88) / 0.12 : 0;

      const neuralOpacity = 
        progress < 0.45 ? 0 :
        progress < 0.55 ? (progress - 0.45) / 0.10 :
        progress < 0.85 ? 1 :
        1 - ((progress - 0.85) / 0.12);

      const objX = cx + mouse.x * 0.8;
      const objY = cy + mouse.y * 0.8;

      ctx.save();
      ctx.translate(objX, objY);

      // Subtle slow 3D rotation perspective
      const rotY = Math.sin(now * 0.0008) * 0.08;
      ctx.scale(1 + rotY * 0.1, 1);

      // A. DOCUMENT & SCAN RENDERING
      if (docOpacity > 0.01) {
        ctx.save();
        ctx.globalAlpha = docOpacity;

        const docW = 220;
        const docH = 290;
        const docR = 12;

        // Document Glass Surface
        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.roundRect(-docW / 2, -docH / 2, docW, docH, docR);
        ctx.fill();
        ctx.stroke();

        // Top Header Bar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(-docW / 2 + 20, -docH / 2 + 22, docW - 40, 16);

        // Header Accent Pill
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-docW / 2 + 20, -docH / 2 + 22, 35, 16);

        // Document Text Wireframe Lines
        const isScanning = progress >= 0.18 && progress < 0.35;
        const scanNorm = isScanning ? (progress - 0.18) / 0.17 : 0;
        const scanY = -docH / 2 + 20 + scanNorm * (docH - 40);

        docLines.forEach((line) => {
          const lineY = line.yOffset;
          const isPassed = isScanning && scanY >= lineY - 10 && scanY <= lineY + 25;

          ctx.fillStyle = isPassed
            ? 'rgba(56, 189, 248, 0.95)'
            : line.isKey
            ? 'rgba(255, 255, 255, 0.5)'
            : 'rgba(255, 255, 255, 0.2)';

          const extractP = progress >= 0.35 && progress < 0.50 ? (progress - 0.35) / 0.15 : 0;
          const shiftX = Math.sin(lineY) * extractP * 50;
          const shiftY = lineY + Math.cos(lineY) * extractP * 30;

          ctx.fillRect(-line.width / 2 + shiftX, shiftY, line.width, 6);
        });

        // Laser Scan Bar
        if (isScanning) {
          const laserGrad = ctx.createLinearGradient(-docW / 2, scanY, docW / 2, scanY);
          laserGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
          laserGrad.addColorStop(0.5, '#ffffff');
          laserGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

          ctx.strokeStyle = laserGrad;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-docW / 2 - 10, scanY);
          ctx.lineTo(docW / 2 + 10, scanY);
          ctx.stroke();

          const curtainGrad = ctx.createLinearGradient(0, scanY - 25, 0, scanY);
          curtainGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
          curtainGrad.addColorStop(1, 'rgba(56, 189, 248, 0.25)');
          ctx.fillStyle = curtainGrad;
          ctx.fillRect(-docW / 2, scanY - 25, docW, 25);
        }

        ctx.restore();
      }

      // B. NEURAL STRUCTURE & EVIDENCE VERIFICATION RENDERING
      if (neuralOpacity > 0.01) {
        ctx.save();
        ctx.globalAlpha = neuralOpacity;

        const nodePositions = neuralNodes.map((n, i) => {
          const angle = n.baseAngle + now * 0.0003;
          return {
            x: Math.cos(angle) * n.r,
            y: Math.sin(angle) * n.r * 0.75,
            color: n.color,
            idx: i,
          };
        });

        // Draw connections
        ctx.lineWidth = 1;
        for (let i = 0; i < nodePositions.length; i++) {
          for (let j = i + 1; j < nodePositions.length; j++) {
            const dx = nodePositions[i].x - nodePositions[j].x;
            const dy = nodePositions[i].y - nodePositions[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 110) {
              const isVerifiedPath = i === 0 && j === 6 && progress >= 0.70;
              ctx.strokeStyle = isVerifiedPath ? 'rgba(56, 189, 248, 0.95)' : 'rgba(96, 165, 250, 0.35)';
              ctx.lineWidth = isVerifiedPath ? 2 : 1;
              ctx.beginPath();
              ctx.moveTo(nodePositions[i].x, nodePositions[i].y);
              ctx.lineTo(nodePositions[j].x, nodePositions[j].y);
              ctx.stroke();
            }
          }
        }

        // Draw Nodes
        nodePositions.forEach((n) => {
          ctx.fillStyle = n.color;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.idx === 9 ? 6 : 3.5, 0, Math.PI * 2);
          ctx.fill();

          if (n.idx === 9) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(n.x, n.y, 14 + Math.sin(now * 0.004) * 3, 0, Math.PI * 2);
            ctx.stroke();
          }
        });

        // Traveling Energy Pulses
        const pulseProgress = (now * 0.001) % 1;
        if (nodePositions[0] && nodePositions[6]) {
          const px = nodePositions[0].x + (nodePositions[6].x - nodePositions[0].x) * pulseProgress;
          const py = nodePositions[0].y + (nodePositions[6].y - nodePositions[0].y) * pulseProgress;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // VERIFIED Badge (Stage 6: 0.72 - 0.86)
        if (progress >= 0.72 && progress < 0.86) {
          const badgeOpacity = 
            progress < 0.76 ? (progress - 0.72) / 0.04 :
            progress > 0.82 ? 1 - ((progress - 0.82) / 0.04) : 1;

          ctx.save();
          ctx.globalAlpha = neuralOpacity * badgeOpacity;
          ctx.translate(nodePositions[6].x + 35, nodePositions[6].y - 15);

          ctx.fillStyle = 'rgba(2, 132, 199, 0.9)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(-30, -12, 60, 24, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = '600 9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('VERIFIED', 0, 0);

          ctx.restore();
        }

        ctx.restore();
      }

      ctx.restore();

      // 3. FOREGROUND DUST & AMBIENT DATA PARTICLES
      particles.forEach((p) => {
        if (!prefersReducedMotion) {
          p.y -= p.speed * 16;
          if (p.y < 0) p.y = 1;
        }

        const px = p.x * width + mouse.x * 1.5;
        const py = p.y * height + mouse.y * 1.5;
        const alpha = Math.sin(now * 0.002 + p.phase) * 0.25 + 0.35;

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render(performance.now());

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10 select-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
