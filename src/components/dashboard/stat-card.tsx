'use client';

import { useEffect, useState, useRef } from 'react';
import { FileText, Percent, AlertTriangle, Files } from 'lucide-react';
import { motion, useInView } from 'framer-motion';

export type StatIconType = 'tenders' | 'compliance' | 'issues' | 'documents';

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  iconType: StatIconType;
  suffix?: string;
  delayIndex?: number;
}

const iconMap = {
  tenders: FileText,
  compliance: Percent,
  issues: AlertTriangle,
  documents: Files,
};

export function StatCard({ 
  title, 
  value, 
  description, 
  iconType,
  suffix = '',
  delayIndex = 0 
}: StatCardProps) {
  const Icon = iconMap[iconType] || FileText;
  const cardRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(cardRef, { once: true, amount: 0.25 });

  const [count, setCount] = useState(0);

  const isNumeric = value !== '—' && value !== '-' && value !== '0';
  const targetNumber = isNumeric ? parseInt(value.replace(/[^0-9]/g, ''), 10) : 0;

  useEffect(() => {
    if (!isInView || !isNumeric || isNaN(targetNumber) || targetNumber === 0) {
      return;
    }

    let start = 0;
    const duration = 850; // ms
    const stepTime = 25;
    const steps = duration / stepTime;
    const increment = targetNumber / steps;

    const startTimeout = setTimeout(() => {
      const timer = setInterval(() => {
        start += increment;
        if (start >= targetNumber) {
          setCount(targetNumber);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, stepTime);
    }, delayIndex * 180);

    return () => clearTimeout(startTimeout);
  }, [isInView, isNumeric, targetNumber, delayIndex]);

  const displayString = (value === '—' || value === '-')
    ? '—'
    : value === '0'
    ? '0'
    : isInView
    ? `${count}${suffix}`
    : `0${suffix}`;

  const staggerDelay = delayIndex * 0.18; // 0ms, 180ms, 360ms, 540ms

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 35, scale: 0.98 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 35, scale: 0.98 }}
      transition={{
        duration: 0.85,
        delay: staggerDelay,
        ease: [0.22, 1, 0.36, 1], // cubic-bezier(0.22, 1, 0.36, 1)
      }}
      className="group relative rounded-xl border border-[rgba(100,160,230,0.18)] bg-[rgba(8,18,35,0.28)] backdrop-blur-md p-5 sm:p-6 shadow-sm overflow-hidden flex flex-col justify-between h-full transition-colors duration-300"
    >
      {/* 1. One-Time Reveal Light Sweep */}
      {isInView && (
        <motion.div
          initial={{ x: '-150%', opacity: 0 }}
          animate={{ x: '200%', opacity: [0, 0.6, 0.6, 0] }}
          transition={{
            duration: 0.9,
            delay: staggerDelay + 0.1,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute inset-0 pointer-events-none w-[60%] bg-gradient-to-r from-transparent via-[rgba(56,189,248,0.18)] to-transparent -skew-x-12 z-0"
        />
      )}

      {/* 2. One-Time Brief Border Illumination during reveal */}
      {isInView && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{
            duration: 1.0,
            delay: staggerDelay,
            ease: 'easeOut',
          }}
          className="absolute inset-0 rounded-xl border border-blue-400/40 pointer-events-none z-0"
        />
      )}

      {/* 3. Card Content */}
      <div className="relative z-10">
        {/* Thin System Label & Staggered Animated Icon */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[11px] font-normal uppercase tracking-[0.12em] text-[#8FA7C5]">
            {title}
          </h3>
          <motion.div 
            initial={{ opacity: 0, scale: 0.85 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{
              duration: 0.45,
              delay: staggerDelay + 0.15,
              ease: 'easeOut',
            }}
            className="flex h-6 w-6 items-center justify-center rounded text-[#718096] group-hover:text-blue-400 transition-colors"
          >
            <Icon className="h-3.5 w-3.5 stroke-[1.5]" />
          </motion.div>
        </div>

        {/* Thin, Elegant Large Stat Number */}
        <div className="text-5xl sm:text-6xl font-light tracking-[-0.05em] text-[#F5F7FA] my-1 font-sans">
          {displayString}
        </div>
      </div>

      {/* Quiet Technical Description */}
      <div className="relative z-10 mt-2">
        <p className="text-[13px] font-light text-[#64748B] leading-[1.5]">
          {description}
        </p>
      </div>
    </motion.div>
  );
}
