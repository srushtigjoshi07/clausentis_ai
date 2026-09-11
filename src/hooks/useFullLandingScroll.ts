'use client';

import { useState, useEffect } from 'react';

// Global shared mutable scroll state for instantaneous Three.js useFrame access (0% React overhead)
if (typeof window !== 'undefined') {
  (window as unknown as { __landingScrollProgress: number }).__landingScrollProgress = 0;
  (window as unknown as { __landingMouse: { x: number; y: number } }).__landingMouse = { x: 0, y: 0 };
}

export interface FullLandingProgress {
  raw: number;
  damped: number;
  mouse: { x: number; y: number };
}

// ============================================================================
// SINGLETON GLOBAL SCROLL STORE (ONE LISTENER, ONE RAF LOOP, ZERO CONFLICTS)
// ============================================================================

type Subscriber = (state: FullLandingProgress) => void;

const subscribers = new Set<Subscriber>();
let currentState: FullLandingProgress = {
  raw: 0,
  damped: 0,
  mouse: { x: 0, y: 0 },
};

let animId: number | null = null;
let isLoopRunning = false;

let targetRaw = 0;
let currentDamped = 0;
let targetMouseX = 0;
let targetMouseY = 0;
let mouseX = 0;
let mouseY = 0;
let isDirty = true;

function getScrollTop(): number {
  if (typeof window === 'undefined') return 0;
  return (
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    window.scrollY ||
    0
  );
}

function getScrollHeight(): number {
  if (typeof window === 'undefined') return 1;
  return Math.max(
    document.documentElement.scrollHeight || 0,
    document.body.scrollHeight || 0,
    document.documentElement.clientHeight || 0,
    1
  );
}

function getSectionProgress(scrollTop: number): number {
  if (typeof window === 'undefined') return 0;

  const doc = document.documentElement;
  const clientHeight = window.innerHeight || doc.clientHeight || 1;
  const scrollHeight = Math.max(
    doc.scrollHeight || 0,
    document.body.scrollHeight || 0,
    doc.clientHeight || 0,
    1
  );
  const maxScroll = Math.max(1, scrollHeight - clientHeight);
  if (scrollTop <= 0) return 0;
  if (scrollTop >= maxScroll) return 1;

  const secDocs = document.getElementById('chapter-documents');
  const secDecomp = document.getElementById('chapter-decomposition');
  const secPaths = document.getElementById('chapter-pathways');
  const secWork = document.getElementById('workspace');

  if (!secDocs || !secDecomp || !secPaths || !secWork) {
    return Math.min(Math.max(scrollTop / maxScroll, 0), 1);
  }

  const top2 = secDocs.offsetTop;
  const top3 = secDecomp.offsetTop;
  const top4 = secPaths.offsetTop;
  const top5 = secWork.offsetTop;

  // Scene 01: Hero (0.000 to 0.125)
  if (scrollTop < top2) {
    const t = scrollTop / Math.max(1, top2);
    return t * 0.125;
  }

  // Scene 02: Complex Documents (0.125 to 0.250)
  if (scrollTop < top3) {
    const t = (scrollTop - top2) / Math.max(1, top3 - top2);
    return 0.125 + t * 0.125;
  }

  // Scene 03: Autonomous Decomposition (0.250 to 0.375)
  if (scrollTop < top4) {
    const t = (scrollTop - top3) / Math.max(1, top4 - top3);
    return 0.250 + t * 0.125;
  }

  // Scene 04: Organized Intelligence Pathways (0.375 to 0.500)
  if (scrollTop < top5) {
    const t = (scrollTop - top4) / Math.max(1, top5 - top4);
    return 0.375 + t * 0.125;
  }

  // Scenes 05 - 08: Workspace through Footer (0.500 to 1.000)
  const remainingScroll = Math.max(1, maxScroll - top5);
  const t = Math.min(Math.max((scrollTop - top5) / remainingScroll, 0), 1);
  return 0.500 + t * 0.500;
}

function handleScrollEvent() {
  const scrollTop = getScrollTop();
  targetRaw = getSectionProgress(scrollTop);
  isDirty = true;
  startLoop();
}

function handleMouseMoveEvent(e: MouseEvent) {
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  targetMouseX = (e.clientX / w) * 2 - 1;
  targetMouseY = -((e.clientY / h) * 2 - 1);
  isDirty = true;
  startLoop();
}

function loop() {
  if (!isLoopRunning) return;

  const scrollDiff = targetRaw - currentDamped;
  const mouseXDiff = targetMouseX - mouseX;
  const mouseYDiff = targetMouseY - mouseY;

  const isMoving =
    Math.abs(scrollDiff) > 0.0001 ||
    Math.abs(mouseXDiff) > 0.001 ||
    Math.abs(mouseYDiff) > 0.001;

  if (isMoving || isDirty) {
    currentDamped += scrollDiff * 0.09;
    mouseX += mouseXDiff * 0.06;
    mouseY += mouseYDiff * 0.06;

    // Snap if very close
    if (Math.abs(targetRaw - currentDamped) < 0.00005) {
      currentDamped = targetRaw;
    }

    // Sync global mutable refs for Three.js useFrame
    if (typeof window !== 'undefined') {
      (window as unknown as { __landingScrollProgress: number }).__landingScrollProgress = currentDamped;
      (window as unknown as { __landingMouse: { x: number; y: number } }).__landingMouse = { x: mouseX, y: mouseY };
    }

    currentState = {
      raw: targetRaw,
      damped: currentDamped,
      mouse: { x: mouseX, y: mouseY },
    };

    // Notify React subscribers
    subscribers.forEach((fn) => fn(currentState));
    isDirty = false;
  }

  // Continue loop if active subscribers exist
  if (subscribers.size > 0) {
    animId = requestAnimationFrame(loop);
  } else {
    isLoopRunning = false;
    animId = null;
  }
}

function startLoop() {
  if (!isLoopRunning && typeof window !== 'undefined') {
    isLoopRunning = true;
    animId = requestAnimationFrame(loop);
  }
}

let listenersAttached = false;
function attachListeners() {
  if (listenersAttached || typeof window === 'undefined') return;
  listenersAttached = true;
  window.addEventListener('scroll', handleScrollEvent, { passive: true });
  window.addEventListener('mousemove', handleMouseMoveEvent, { passive: true });
  window.addEventListener('resize', handleScrollEvent, { passive: true });
  handleScrollEvent();
}

function detachListeners() {
  if (!listenersAttached || typeof window === 'undefined') return;
  if (subscribers.size === 0) {
    listenersAttached = false;
    window.removeEventListener('scroll', handleScrollEvent);
    window.removeEventListener('mousemove', handleMouseMoveEvent);
    window.removeEventListener('resize', handleScrollEvent);
    if (animId !== null) {
      cancelAnimationFrame(animId);
      animId = null;
    }
    isLoopRunning = false;
  }
}

export function useFullLandingScroll(): FullLandingProgress {
  const [state, setState] = useState<FullLandingProgress>(currentState);

  useEffect(() => {
    subscribers.add(setState);
    attachListeners();
    startLoop();



    return () => {
      subscribers.delete(setState);
      detachListeners();
    };
  }, []);

  return state;
}
