'use client';

import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Info } from 'lucide-react';

/* =========================================================================
   1. RADAR / SPIDER CHART
   Compares multidimensional performance across statutory bid criteria.
   ========================================================================= */

export interface RadarMetric {
  dimension: string;
  maxScore: number;
  bidders: {
    bidderId: string;
    name: string;
    score: number;
    color: string;
  }[];
}

interface RadarChartProps {
  data: RadarMetric[];
  title?: string;
  subtitle?: string;
  width?: number;
  height?: number;
}

export function RadarSpiderChart({
  data,
  title = "Multidimensional Bidder Competency Radar",
  subtitle = "Evaluation across 6 key statutory and technical qualification dimensions",
  width = 440,
  height = 360
}: RadarChartProps) {
  const [activeBidder, setActiveBidder] = useState<string | null>(null);
  const [hoveredDimension, setHoveredDimension] = useState<string | null>(null);

  const centerX = width / 2;
  const centerY = height / 2 + 10;
  const radius = Math.min(centerX, centerY) - 55;
  const numAxes = data.length;
  const angleStep = (Math.PI * 2) / numAxes;

  // Concentric levels (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Extract unique bidders from data
  const biddersMap = new Map<string, { name: string; color: string }>();
  data.forEach(metric => {
    metric.bidders.forEach(b => {
      if (!biddersMap.has(b.bidderId)) {
        biddersMap.set(b.bidderId, { name: b.name, color: b.color });
      }
    });
  });
  const biddersList = Array.from(biddersMap.entries());

  // Function to calculate polygon points for a specific bidder
  const getBidderPolygonPoints = (bidderId: string) => {
    return data.map((metric, i) => {
      const bidderData = metric.bidders.find(b => b.bidderId === bidderId);
      const score = bidderData ? bidderData.score : 0;
      const normalizedScore = Math.min(Math.max(score / metric.maxScore, 0.05), 1.0);
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + radius * normalizedScore * Math.cos(angle);
      const y = centerY + radius * normalizedScore * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5E5E5] gap-2">
        <div>
          <h4 className="text-sm font-semibold text-[#111111]">{title}</h4>
          <p className="text-[11px] text-[#777777]">{subtitle}</p>
        </div>
        
        {/* Bidder selector toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveBidder(null)}
            className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors ${
              activeBidder === null 
                ? 'bg-[#111111] text-white font-bold' 
                : 'bg-[#F5F5F5] text-[#555555] hover:bg-[#EAEAEA]'
            }`}
          >
            All Bidders
          </button>
          {biddersList.map(([id, info]) => (
            <button
              key={id}
              onClick={() => setActiveBidder(id === activeBidder ? null : id)}
              className={`px-2 py-0.5 text-[10px] font-mono rounded flex items-center gap-1 transition-colors border ${
                activeBidder === id
                  ? 'border-[#111111] bg-[#111111] text-white font-bold'
                  : 'border-[#E5E5E5] bg-white text-[#555555] hover:bg-[#FAFAFA]'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info.color }} />
              {info.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center pt-3">
        <svg width={width} height={height} className="overflow-visible select-none max-w-full">
          <defs>
            {biddersList.map(([id, info]) => (
              <radialGradient key={id} id={`radar-grad-${id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={info.color} stopOpacity="0.35" />
                <stop offset="100%" stopColor={info.color} stopOpacity="0.08" />
              </radialGradient>
            ))}
          </defs>

          {/* Concentric circular rings */}
          {levels.map((lvl, idx) => (
            <g key={idx}>
              <circle
                cx={centerX}
                cy={centerY}
                r={radius * lvl}
                fill="none"
                stroke="#E5E5E5"
                strokeDasharray={idx === levels.length - 1 ? 'none' : '3 3'}
                strokeWidth={idx === levels.length - 1 ? '1.5' : '1'}
              />
              <text
                x={centerX + 4}
                y={centerY - radius * lvl + 10}
                className="text-[9px] font-mono fill-[#999999]"
              >
                {Math.round(lvl * 100)}%
              </text>
            </g>
          ))}

          {/* Axes from center to outer points */}
          {data.map((metric, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            const labelX = centerX + (radius + 28) * Math.cos(angle);
            const labelY = centerY + (radius + 20) * Math.sin(angle);
            const isHovered = hoveredDimension === metric.dimension;

            return (
              <g 
                key={i} 
                onMouseEnter={() => setHoveredDimension(metric.dimension)}
                onMouseLeave={() => setHoveredDimension(null)}
                className="cursor-pointer"
              >
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={x}
                  y2={y}
                  stroke={isHovered ? '#111111' : '#E0E0E0'}
                  strokeWidth={isHovered ? '2' : '1'}
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`text-[10px] font-medium transition-all ${
                    isHovered ? 'fill-[#111111] font-bold text-[11px]' : 'fill-[#666666]'
                  }`}
                >
                  {metric.dimension}
                </text>
              </g>
            );
          })}

          {/* Render Polygons for Bidders */}
          {biddersList.map(([id, info]) => {
            const isSelected = activeBidder === null || activeBidder === id;
            if (!isSelected) return null;
            const points = getBidderPolygonPoints(id);

            return (
              <g key={id} className="transition-opacity duration-300">
                <polygon
                  points={points}
                  fill={`url(#radar-grad-${id})`}
                  stroke={info.color}
                  strokeWidth={activeBidder === id ? '2.5' : '1.8'}
                  strokeLinejoin="round"
                  opacity={activeBidder !== null && activeBidder !== id ? 0.2 : 0.85}
                />
                {/* Vertex points */}
                {data.map((metric, i) => {
                  const bidderData = metric.bidders.find(b => b.bidderId === id);
                  const score = bidderData ? bidderData.score : 0;
                  const normalizedScore = Math.min(Math.max(score / metric.maxScore, 0.05), 1.0);
                  const angle = i * angleStep - Math.PI / 2;
                  const x = centerX + radius * normalizedScore * Math.cos(angle);
                  const y = centerY + radius * normalizedScore * Math.sin(angle);

                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={activeBidder === id ? 4 : 3}
                      fill={info.color}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2 pt-2 border-t border-[#F0F0F0] w-full text-xs">
          {biddersList.map(([id, info]) => (
            <div 
              key={id} 
              className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded ${
                activeBidder === id ? 'bg-[#F5F5F5] font-semibold' : 'text-[#666666]'
              }`}
              onClick={() => setActiveBidder(activeBidder === id ? null : id)}
            >
              <span className="w-3 h-1.5 rounded-sm" style={{ backgroundColor: info.color }} />
              <span className="text-[11px]">{info.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   2. DONUT & RADIAL GAUGE CHART
   Displays overall compliance percentage and risk distribution slices.
   ========================================================================= */

export interface DonutSlice {
  label: string;
  count: number;
  percentage: number;
  color: string;
  description: string;
}

interface DonutGaugeChartProps {
  slices: DonutSlice[];
  totalScore: number;
  totalLabel?: string;
  title?: string;
  subtitle?: string;
}

export function DonutGaugeChart({
  slices,
  totalScore,
  totalLabel = "Overall Compliance",
  title = "Portfolio Risk & Compliance Distribution",
  subtitle = "Breakdown of active participating bids by statutory risk categorization"
}: DonutGaugeChartProps) {
  const [hoveredSlice, setHoveredSlice] = useState<DonutSlice | null>(null);

  const size = 240;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate cumulative offsets
  let accumulatedPercent = 0;

  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-2xs">
      <div className="pb-3 border-b border-[#E5E5E5]">
        <h4 className="text-sm font-semibold text-[#111111]">{title}</h4>
        <p className="text-[11px] text-[#777777]">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-4">
        {/* SVG Donut */}
        <div className="md:col-span-6 flex flex-col items-center justify-center relative">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#F3F4F6"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {slices.map((slice, i) => {
              const dashArray = (slice.percentage / 100) * circumference;
              const dashOffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += slice.percentage;
              const isHovered = hoveredSlice?.label === slice.label;

              return (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${dashArray} ${circumference}`}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredSlice(slice)}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              );
            })}
          </svg>

          {/* Central KPI readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            {hoveredSlice ? (
              <>
                <span className="text-2xl font-bold font-mono text-[#111111]">
                  {hoveredSlice.percentage}%
                </span>
                <span className="text-[11px] font-medium text-[#555555] max-w-[100px] truncate">
                  {hoveredSlice.label}
                </span>
                <span className="text-[10px] font-mono text-[#777777]">
                  {hoveredSlice.count} Bids
                </span>
              </>
            ) : (
              <>
                <span className="text-3xl font-extrabold font-mono text-[#111111]">
                  {totalScore}%
                </span>
                <span className="text-[11px] font-medium text-[#777777] uppercase tracking-wider font-mono">
                  {totalLabel}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend and details */}
        <div className="md:col-span-6 space-y-2.5">
          {slices.map((slice, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHoveredSlice(slice)}
              onMouseLeave={() => setHoveredSlice(null)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                hoveredSlice?.label === slice.label
                  ? 'bg-[#F9FAFB] border-[#111111] shadow-2xs'
                  : 'bg-white border-[#E5E5E5] hover:border-[#CCCCCC]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                  <span className="text-xs font-semibold text-[#111111]">{slice.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-[#777777]">{slice.count} bids</span>
                  <span className="font-bold text-[#111111]">{slice.percentage}%</span>
                </div>
              </div>
              <p className="text-[10px] text-[#666666] line-clamp-1 ml-4.5">
                {slice.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   3. GROUPED BAR CHART
   Comparative visualization across Compliance, Risk, and Gov Verification.
   ========================================================================= */

export interface GroupedBarItem {
  id: string;
  name: string;
  metrics: {
    label: string;
    value: number;
    color: string;
  }[];
  qualificationStatus: 'QUALIFIED' | 'REVIEW' | 'DISQUALIFIED';
}

interface GroupedBarChartProps {
  items: GroupedBarItem[];
  title?: string;
  subtitle?: string;
}

export function GroupedBarChart({
  items,
  title = "Bidder Multi-Metric Comparative Performance",
  subtitle = "Direct comparison of Compliance Score, Risk Level (Inverted), and Gateway Verification %"
}: GroupedBarChartProps) {
  const [hoveredItem, setHoveredItem] = useState<{ bidder: string; metric: string; val: number } | null>(null);

  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E5E5E5] gap-2">
        <div>
          <h4 className="text-sm font-semibold text-[#111111]">{title}</h4>
          <p className="text-[11px] text-[#777777]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#059669]" />
            <span className="text-[11px] text-[#555555]">Compliance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" />
            <span className="text-[11px] text-[#555555]">Verification</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]" />
            <span className="text-[11px] text-[#555555]">Risk</span>
          </div>
        </div>
      </div>

      <div className="pt-4 space-y-5">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#111111]">{item.name}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                  item.qualificationStatus === 'QUALIFIED'
                    ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]'
                    : item.qualificationStatus === 'REVIEW'
                    ? 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]'
                    : 'bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]'
                }`}>
                  {item.qualificationStatus}
                </span>
              </div>
            </div>

            {/* Tri-metric grouped bars */}
            <div className="grid grid-cols-3 gap-2">
              {item.metrics.map((m, mIdx) => (
                <div 
                  key={mIdx}
                  className="space-y-1 group cursor-pointer"
                  onMouseEnter={() => setHoveredItem({ bidder: item.name, metric: m.label, val: m.value })}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#777777]">{m.label}</span>
                    <span className="font-bold text-[#111111]">{m.value}%</span>
                  </div>
                  <div className="w-full bg-[#F3F4F6] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${m.value}%`,
                        backgroundColor: m.color 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   4. WATERFALL DELTA VARIANCE CHART
   Shows where points were gained or lost from Pre-Bid (Phase 1) to Verified (Phase 2).
   ========================================================================= */

export interface WaterfallStep {
  name: string;
  delta: number; // e.g. +5, -5, or absolute
  cumulative: number;
  category: 'START' | 'DEDUCTION' | 'ADDITION' | 'FINAL';
  reason: string;
}

interface WaterfallDeltaChartProps {
  steps: WaterfallStep[];
  title?: string;
  subtitle?: string;
}

export function WaterfallDeltaChart({
  steps,
  title = "Pre-Bid vs Post-Verification Score Variance Waterfall",
  subtitle = "Audit reconciliation explaining the variance between claimed pre-bid self-assessment and final verified scores"
}: WaterfallDeltaChartProps) {
  const [selectedStep, setSelectedStep] = useState<WaterfallStep | null>(null);

  const maxVal = 100;
  const chartHeight = 150;

  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-2xs">
      <div className="pb-3 border-b border-[#E5E5E5]">
        <h4 className="text-sm font-semibold text-[#111111]">{title}</h4>
        <p className="text-[11px] text-[#777777]">{subtitle}</p>
      </div>

      <div className="pt-4 overflow-x-auto">
        <div className="min-w-[500px] flex items-end justify-between h-[180px] pb-6 relative border-b border-[#E5E5E5]">
          {/* Horizontal guideline lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
            <div className="border-b border-dashed border-[#E0E0E0] w-full text-[9px] font-mono text-[#999999] pl-1">100%</div>
            <div className="border-b border-dashed border-[#E0E0E0] w-full text-[9px] font-mono text-[#999999] pl-1">75%</div>
            <div className="border-b border-dashed border-[#E0E0E0] w-full text-[9px] font-mono text-[#999999] pl-1">50%</div>
            <div className="border-b border-dashed border-[#E0E0E0] w-full text-[9px] font-mono text-[#999999] pl-1">25%</div>
            <div className="border-b border-solid border-[#111111] w-full" />
          </div>

          {/* Steps */}
          {steps.map((st, i) => {
            const heightPx = (st.cumulative / maxVal) * chartHeight;
            const isStart = st.category === 'START';
            const isFinal = st.category === 'FINAL';
            const isDeduction = st.category === 'DEDUCTION';

            let bgColor = '#111111';
            if (isStart) bgColor = '#2563EB';
            else if (isFinal) bgColor = '#059669';
            else if (isDeduction) bgColor = '#DC2626';
            else bgColor = '#10B981';

            return (
              <div
                key={i}
                onClick={() => setSelectedStep(st)}
                className="flex-1 flex flex-col items-center justify-end h-full px-1.5 cursor-pointer z-10 group"
              >
                {/* Score badge on top */}
                <span className={`text-[10px] font-mono font-bold mb-1 transition-transform group-hover:scale-110 ${
                  isDeduction ? 'text-[#DC2626]' : isFinal ? 'text-[#059669]' : 'text-[#111111]'
                }`}>
                  {isStart || isFinal ? `${st.cumulative}%` : `${st.delta > 0 ? '+' : ''}${st.delta}%`}
                </span>

                {/* Column Bar */}
                <div
                  className="w-full rounded-t-md transition-all duration-300 group-hover:opacity-90 shadow-2xs"
                  style={{
                    height: `${Math.max(heightPx, 12)}px`,
                    backgroundColor: bgColor
                  }}
                />

                {/* Step label */}
                <span className="text-[10px] font-medium text-[#555555] mt-2 text-center line-clamp-1 w-full">
                  {st.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail explanation callout */}
      {selectedStep && (
        <div className="mt-4 p-3 bg-[#F9FAFB] rounded-lg border border-[#E5E5E5] flex items-start gap-2.5 text-xs">
          <Info className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#111111]">{selectedStep.name}: </span>
            <span className="text-[#555555]">{selectedStep.reason}</span>
            <span className="ml-2 font-mono font-bold text-[#111111]">(Running Cumulative: {selectedStep.cumulative}%)</span>
          </div>
        </div>
      )}
    </div>
  );
}
