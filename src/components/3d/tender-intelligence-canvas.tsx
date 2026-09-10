'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export function TenderIntelligenceCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!containerRef.current || reducedMotion) return;

    const container = containerRef.current;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || 450;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 8;
    camera.position.y = 0.5;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x3b82f6, 3, 20);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x10b981, 2, 20);
    pointLight2.position.set(-3, -2, 3);
    scene.add(pointLight2);

    // 4. Central Node (Tender Core)
    const group = new THREE.Group();
    scene.add(group);

    const coreGeometry = new THREE.IcosahedronGeometry(1.2, 1);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
      roughness: 0.2,
      metalness: 0.8
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(coreMesh);

    // Inner glowing sphere
    const innerGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: false,
      transparent: true,
      opacity: 0.3
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    group.add(innerMesh);

    // 5. Orbiting Nodes (Intelligence, Requirements, Company Docs, Compliance, Readiness)
    const nodeCount = 5;
    const nodeColors = [0x3b82f6, 0x10b981, 0x8b5cf6, 0xf59e0b, 0x06b6d4];
    const nodes: THREE.Mesh[] = [];
    const orbitRadius = 2.8;

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const nodeGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const nodeMat = new THREE.MeshStandardMaterial({
        color: nodeColors[i],
        roughness: 0.3,
        metalness: 0.7
      });
      const nodeMesh = new THREE.Mesh(nodeGeo, nodeMat);
      nodeMesh.position.set(
        Math.cos(angle) * orbitRadius,
        Math.sin(angle) * 0.8,
        Math.sin(angle) * orbitRadius * 0.7
      );
      group.add(nodeMesh);
      nodes.push(nodeMesh);
    }

    // 6. Orbital Rings
    const ringGeo = new THREE.TorusGeometry(orbitRadius, 0.015, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.25
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2.8;
    group.add(ringMesh);

    // 7. Connecting Lines
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.35
    });

    const lines: THREE.Line[] = [];
    for (let i = 0; i < nodeCount; i++) {
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        nodes[i].position
      ]);
      const line = new THREE.Line(lineGeo, lineMaterial);
      group.add(line);
      lines.push(line);
    }

    // 8. Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / width) * 2 - 1;
      mouseY = -(((event.clientY - rect.top) / height) * 2 - 1);
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 9. Resize handler
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth || 500;
      const newHeight = container.clientHeight || 450;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 10. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth parallax
      targetRotationY = mouseX * 0.4;
      targetRotationX = -mouseY * 0.3;

      group.rotation.y += (targetRotationY - group.rotation.y) * 0.05 + 0.003;
      group.rotation.x += (targetRotationX - group.rotation.x) * 0.05;

      coreMesh.rotation.y = elapsedTime * 0.2;
      coreMesh.rotation.x = elapsedTime * 0.15;

      // Update orbiting nodes
      for (let i = 0; i < nodeCount; i++) {
        const baseAngle = (i / nodeCount) * Math.PI * 2 + elapsedTime * 0.25;
        const x = Math.cos(baseAngle) * orbitRadius;
        const y = Math.sin(baseAngle * 2) * 0.4;
        const z = Math.sin(baseAngle * orbitRadius * 0.7);

        nodes[i].position.set(x, y, z);

        // Update line vertices
        const positions = lines[i].geometry.attributes.position as THREE.BufferAttribute;
        positions.setXYZ(1, x, y, z);
        positions.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [reducedMotion]);

  if (reducedMotion) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 text-center">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg mb-3">
            AI
          </div>
          <h4 className="font-semibold text-foreground">Tender Intelligence Graph</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Multi-stage document verification connecting tenders, requirements, and compliance proof.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="relative flex h-[380px] sm:h-[460px] w-full items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
      aria-label="Interactive 3D Tender Intelligence visualization"
    />
  );
}
