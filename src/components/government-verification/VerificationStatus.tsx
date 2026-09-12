'use client';

import React from 'react';
import { GovVerificationStatus } from '@/lib/verification/types';
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';

interface VerificationStatusProps {
  status: GovVerificationStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VerificationStatus({ status, size = 'md', className = '' }: VerificationStatusProps) {
  let Icon = HelpCircle;
  let colorClass = '';
  let label = '';

  switch (status) {
    case 'VERIFIED':
      Icon = CheckCircle2;
      colorClass = 'text-green-700 bg-green-50 border-green-200';
      label = 'VERIFIED';
      break;
    case 'MISMATCH':
      Icon = XCircle;
      colorClass = 'text-red-700 bg-red-50 border-red-200';
      label = 'CRITICAL MISMATCH';
      break;
    case 'NOT_FOUND':
      Icon = XCircle;
      colorClass = 'text-red-700 bg-red-50 border-red-200';
      label = 'NOT VERIFIED';
      break;
    case 'INACTIVE':
      Icon = XCircle;
      colorClass = 'text-red-700 bg-red-50 border-red-200';
      label = 'NON-COMPLIANT';
      break;
    case 'EXPIRED':
      Icon = XCircle;
      colorClass = 'text-red-700 bg-red-50 border-red-200';
      label = 'EXPIRED';
      break;
    case 'UNAVAILABLE':
      Icon = HelpCircle;
      colorClass = 'text-gray-500 bg-gray-50 border-gray-200';
      label = 'UNAVAILABLE';
      break;
    case 'REQUIRES_REVIEW':
      Icon = AlertTriangle;
      colorClass = 'text-amber-700 bg-amber-50 border-amber-200';
      label = 'REQUIRES REVIEW';
      break;
    default:
      Icon = HelpCircle;
      colorClass = 'text-gray-500 bg-gray-50 border-gray-200';
      label = String(status);
      break;
  }

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[9px] gap-1',
    md: 'px-2 py-1 text-[10px] gap-1.5',
    lg: 'px-3 py-1.5 text-xs gap-2',
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14,
  };

  return (
    <span className={`inline-flex items-center font-mono uppercase tracking-wider border rounded-md ${colorClass} ${sizeClasses[size]} ${className}`}>
      <Icon size={iconSizes[size]} className="shrink-0" />
      {label}
    </span>
  );
}
