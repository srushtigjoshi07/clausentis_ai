'use client';

import React from 'react';
import { GovVerificationSource } from '@/lib/verification/types';

interface SourceBadgeProps {
  sourceType: GovVerificationSource;
  className?: string;
}

export function SourceBadge({ sourceType, className = '' }: SourceBadgeProps) {
  let bg = '';
  let text = '';
  let border = '';
  let label = '';

  switch (sourceType) {
    case 'GOVERNMENT_API':
      bg = 'bg-[#ECFDF5]';
      text = 'text-[#065F46]';
      border = 'border-[#A7F3D0]';
      label = 'GOVERNMENT API';
      break;
    case 'GOVERNMENT_PORTAL':
      bg = 'bg-[#EFF6FF]';
      text = 'text-[#1E40AF]';
      border = 'border-[#BFDBFE]';
      label = 'GOVERNMENT PORTAL';
      break;
    case 'DIGILOCKER':
      bg = 'bg-[#F5F3FF]';
      text = 'text-[#5B21B6]';
      border = 'border-[#DDD6FE]';
      label = 'DIGILOCKER';
      break;
    case 'MOCK_GOVERNMENT':
      bg = 'bg-[#FFFBEB]';
      text = 'text-[#92400E]';
      border = 'border-[#FDE68A]';
      label = 'DEMO / SANDBOX';
      break;
    case 'MANUAL':
    default:
      bg = 'bg-[#F7F7F7]';
      text = 'text-[#555555]';
      border = 'border-[#E5E5E5]';
      label = sourceType === 'MANUAL' ? 'MANUAL VERIFICATION' : String(sourceType);
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase border ${bg} ${text} ${border} ${className}`}>
      {label}
    </span>
  );
}
