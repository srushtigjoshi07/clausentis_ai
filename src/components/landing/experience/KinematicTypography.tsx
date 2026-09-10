'use client';

interface KinematicTypographyProps {
  dampedProgress: number;
}

const STAGE_WORDS = [
  { id: 'hero', word: 'INTELLIGENCE', start: 0.0, end: 0.14 },
  { id: 'ingest', word: 'INGEST', start: 0.14, end: 0.28 },
  { id: 'extract', word: 'EXTRACT', start: 0.28, end: 0.42 },
  { id: 'connect', word: 'CONNECT', start: 0.42, end: 0.56 },
  { id: 'match', word: 'MATCH', start: 0.56, end: 0.70 },
  { id: 'evaluate', word: 'EVALUATE', start: 0.70, end: 0.84 },
  { id: 'decide', word: 'DECIDE', start: 0.84, end: 1.00 },
];

export function KinematicTypography({ dampedProgress }: KinematicTypographyProps) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none flex items-center justify-center -z-5">
      {STAGE_WORDS.map((item) => {
        const range = item.end - item.start;
        const localP = (dampedProgress - item.start) / range;
        
        const isVisible = dampedProgress >= item.start - 0.05 && dampedProgress <= item.end + 0.05;
        if (!isVisible) return null;

        const opacity = localP < 0.2 
          ? (localP / 0.2) * 0.12 
          : localP > 0.8 
          ? ((1 - localP) / 0.2) * 0.12 
          : 0.12;

        const translateX = (0.5 - localP) * 180;
        const scale = 0.95 + localP * 0.15;

        return (
          <div
            key={item.id}
            className="absolute font-black tracking-tighter text-[#3b82f6] uppercase whitespace-nowrap text-[18vw] sm:text-[22vw] leading-none select-none blur-[0.5px]"
            style={{
              opacity: Math.max(0, opacity),
              transform: `translate3d(${translateX}px, 0, 0) scale(${scale})`,
              transition: 'opacity 0.1s ease-out',
              willChange: 'transform, opacity',
              textShadow: '0 0 80px rgba(37,99,235,0.4)',
            }}
          >
            {item.word}
          </div>
        );
      })}
    </div>
  );
}
