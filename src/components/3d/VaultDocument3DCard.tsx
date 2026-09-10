'use client';

import { useState, useRef } from 'react';
import { FileText, CheckCircle2, Clock, HelpCircle, Eye } from 'lucide-react';

export interface VaultDocumentItem {
  id: string;
  name: string;
  document_type: string;
  storage_path?: string;
  original_filename?: string;
  file_size?: number | null;
  status: string;
  created_at: string;
  valid_until?: string;
}

interface VaultDocument3DCardProps {
  doc: VaultDocumentItem;
  onView?: (doc: VaultDocumentItem) => void;
}

export function VaultDocument3DCard({ doc, onView }: VaultDocument3DCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [rotX, setRotX] = useState<number>(0);
  const [rotY, setRotY] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rX = ((y - centerY) / centerY) * -10;
    const rY = ((x - centerX) / centerX) * 10;

    setRotX(rX);
    setRotY(rY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotX(0);
    setRotY(0);
  };

  const isVerified = doc.status === 'verified' || doc.status === 'valid';
  const isExpiring = doc.status === 'expiring' || doc.status === 'review';

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) ${isHovered ? 'scale3d(1.02, 1.02, 1.02)' : 'scale3d(1, 1, 1)'}`,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
      }}
      className={`relative rounded-xl border p-5 bg-[#0B111C] shadow-lg transition-shadow cursor-pointer ${
        isHovered
          ? 'border-blue-500/60 shadow-[0_10px_30px_rgba(37,99,235,0.25)]'
          : 'border-white/10 hover:border-white/20'
      }`}
    >
      {/* 3D Rim Lighting Layer */}
      <div 
        className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.15), transparent 70%)',
        }}
      />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="h-10 w-10 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <FileText className="h-5 w-5 stroke-[1.5]" />
        </div>

        <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
          isVerified ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
          isExpiring ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
          'bg-slate-800 text-[#94A3B8] border border-white/10'
        }`}>
          {isVerified && <CheckCircle2 className="h-3 w-3" />}
          {isExpiring && <Clock className="h-3 w-3" />}
          {!isVerified && !isExpiring && <HelpCircle className="h-3 w-3" />}
          <span>{isVerified ? '✓ VERIFIED' : isExpiring ? '⚠ EXPIRING' : '○ MISSING'}</span>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-[10px] uppercase font-semibold text-[#8FA7C5] tracking-wider block">
          {doc.document_type || 'CREDENTIAL'}
        </span>
        <h4 className="text-sm font-normal text-white truncate leading-snug">
          {doc.name}
        </h4>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-[#94A3B8] font-light border-t border-white/5 pt-3">
        <span>{doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : 'PDF'}</span>
        {onView && (
          <button
            onClick={() => onView(doc)}
            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-normal"
          >
            <Eye className="h-3.5 w-3.5" /> Inspect &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
