'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, FileText } from 'lucide-react';

interface DocumentScanner3DProps {
  fileName?: string;
  isProcessing?: boolean;
  onScanComplete?: () => void;
}

export function DocumentScanner3D({
  fileName = 'tender_rfp_specification.pdf',
  isProcessing = true,
}: DocumentScanner3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [activeStage, setActiveStage] = useState<string>('Document Ingestion');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 500);
    let height = (canvas.height = 340);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 340;
    };
    window.addEventListener('resize', handleResize);

    let progress = 0;
    interface Particle {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      speed: number;
      alpha: number;
      label: string;
    }

    const particles: Particle[] = [];
    const keywords = ['Turnover ≥ ₹15 Cr', 'ISO 9001:2015', 'EMD Bank Guarantee', 'Solvency Cert', 'GST Compliance', 'Past 3Y Experience'];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Advance scan line
      if (isProcessing) {
        progress = (progress + 0.005) % 1;
        setScanProgress(Math.floor(progress * 100));

        if (progress < 0.25) setActiveStage('Text Extraction & Tokenization');
        else if (progress < 0.55) setActiveStage('Criteria Chunking & Threshold Parsing');
        else if (progress < 0.85) setActiveStage('Vault Cross-Referencing & Grounding');
        else setActiveStage('Compliance Verdict Compilation');

        // Spawn extracted data particle when scan line hits sections
        if (Math.random() < 0.08 && particles.length < 12) {
          const spawnY = 80 + progress * 160;
          particles.push({
            x: width * 0.35 + (Math.random() - 0.5) * 80,
            y: spawnY,
            targetX: width * 0.75 + (Math.random() - 0.5) * 40,
            targetY: 60 + Math.random() * 200,
            speed: 0.015 + Math.random() * 0.01,
            alpha: 1,
            label: keywords[Math.floor(Math.random() * keywords.length)],
          });
        }
      }

      const docX = width * 0.22;
      const docY = 60;
      const docW = width * 0.32;
      const docH = 200;

      // 1. Draw 3D Document Plane (Isometric-like tilt)
      ctx.save();
      // Document drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillRect(docX + 8, docY + 8, docW, docH);

      // Document background
      ctx.fillStyle = '#0F172A';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(docX, docY, docW, docH, 8);
      ctx.fill();
      ctx.stroke();

      // Document wireframe text lines
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      for (let i = 0; i < 8; i++) {
        const lineY = docY + 30 + i * 20;
        const lineW = (i % 2 === 0 ? docW * 0.75 : docW * 0.55);
        ctx.fillRect(docX + 16, lineY, lineW, 4);
      }

      // 2. Draw Moving Electric-Blue Laser Scan Beam
      const scanY = docY + progress * docH;

      // Laser horizontal line
      const grad = ctx.createLinearGradient(docX - 20, scanY, docX + docW + 20, scanY);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      grad.addColorStop(0.5, 'rgba(56, 189, 248, 1)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(docX - 20, scanY);
      ctx.lineTo(docX + docW + 20, scanY);
      ctx.stroke();

      // Laser aura / ambient glow
      ctx.fillStyle = 'rgba(37, 99, 235, 0.12)';
      ctx.fillRect(docX, docY, docW, scanY - docY);

      ctx.restore();

      // 3. Update & Draw Data Particles Traveling to Structured Nodes
      for (let p = particles.length - 1; p >= 0; p--) {
        const part = particles[p];
        part.x += (part.targetX - part.x) * part.speed;
        part.y += (part.targetY - part.y) * part.speed;
        part.alpha -= 0.006;

        if (part.alpha > 0) {
          // Connection trail
          ctx.strokeStyle = `rgba(56, 189, 248, ${part.alpha * 0.4})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(part.x, part.y);
          ctx.lineTo(part.targetX, part.targetY);
          ctx.stroke();

          // Particle point
          ctx.fillStyle = `rgba(224, 242, 254, ${part.alpha})`;
          ctx.beginPath();
          ctx.arc(part.x, part.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          particles.splice(p, 1);
        }
      }

      // 4. Structured Requirement Nodes Column on Right
      const rightX = width * 0.78;
      const nodeCount = 4;
      for (let n = 0; n < nodeCount; n++) {
        const ny = docY + 20 + n * 48;
        const isActivated = progress > n * 0.22;

        ctx.fillStyle = isActivated ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 0.6)';
        ctx.strokeStyle = isActivated ? 'rgba(56, 189, 248, 0.6)' : 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(rightX - 60, ny, 110, 32, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isActivated ? '#38bdf8' : '#64748B';
        ctx.font = '10px sans-serif';
        ctx.fillText(`Criterion 0${n + 1}`, rightX - 48, ny + 20);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isProcessing]);

  return (
    <div className="rounded-xl border border-white/10 bg-[#060A12] p-5 shadow-2xl space-y-4 font-sans">
      {/* Scanner Header Status Bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-400" />
          <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[240px]">
            {fileName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
          <span className="text-[11px] font-mono uppercase text-blue-400 tracking-wider">
            ANALYSIS ENGINE {isProcessing ? '● PROCESSING' : '● COMPLETE'}
          </span>
        </div>
      </div>

      {/* 3D Canvas Scanner */}
      <div className="relative w-full h-[320px] flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Live Ingestion Pipeline Stage */}
      <div className="flex items-center justify-between bg-[#0B111C] p-3 rounded-lg border border-white/10 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-[#94A3B8] font-light">Active Subsystem:</span>
          <span className="text-white font-medium">{activeStage}</span>
        </div>
        <span className="font-mono text-blue-400">{scanProgress}%</span>
      </div>
    </div>
  );
}
