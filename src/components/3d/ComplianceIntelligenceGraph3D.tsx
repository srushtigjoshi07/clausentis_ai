'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Layers, 
  Eye, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RequirementEvidenceEvaluation, ContradictionIssue } from '@/lib/ai/contradiction-engine';

interface ComplianceIntelligenceGraph3DProps {
  tenderTitle: string;
  evaluations: RequirementEvidenceEvaluation[];
  contradictions: ContradictionIssue[];
  onOpenExplain?: (evaluation: RequirementEvidenceEvaluation) => void;
  onOpenEvidence?: (evaluation: RequirementEvidenceEvaluation) => void;
}

export interface Node3D {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  type: 'tender' | 'category' | 'requirement' | 'document' | 'contradiction';
  category?: string;
  status?: string;
  rawEvaluation?: RequirementEvidenceEvaluation;
  rawContradiction?: ContradictionIssue;
}

export interface Edge3D {
  sourceId: string;
  targetId: string;
  status?: string;
}

export function ComplianceIntelligenceGraph3D({
  tenderTitle,
  evaluations,
  contradictions,
  onOpenExplain,
  onOpenEvidence
}: ComplianceIntelligenceGraph3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [cameraDistance, setCameraDistance] = useState<number>(550);

  // Rotation angles
  const rotRef = useRef<{ x: number; y: number }>({ x: 0.2, y: 0 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. Build Spatial 3D Node Mesh
  const { nodes, edges } = useMemo(() => {
    const nList: Node3D[] = [];
    const eList: Edge3D[] = [];

    // Root Tender
    nList.push({
      id: 'root-tender',
      label: tenderTitle.length > 20 ? `${tenderTitle.substring(0, 20)}...` : tenderTitle,
      x: 0,
      y: 0,
      z: 0,
      type: 'tender',
    });

    // Categories Ring in 3D
    const categories = ['financial', 'legal', 'technical', 'experience'];
    const catRadius = 140;

    categories.forEach((cat, idx) => {
      const angle = (idx / categories.length) * Math.PI * 2;
      const catId = `cat-${cat}`;
      nList.push({
        id: catId,
        label: cat.toUpperCase(),
        x: Math.cos(angle) * catRadius,
        y: Math.sin(angle) * catRadius * 0.75,
        z: Math.sin(angle) * 60,
        type: 'category',
        category: cat,
      });

      eList.push({
        sourceId: 'root-tender',
        targetId: catId,
      });
    });

    // Requirements Ring in 3D
    const reqRadius = 260;
    evaluations.forEach((ev, idx) => {
      const angle = (idx / Math.max(1, evaluations.length)) * Math.PI * 2;
      const reqId = `req-${ev.requirementId}`;

      nList.push({
        id: reqId,
        label: ev.requirementName.length > 18 ? `${ev.requirementName.substring(0, 18)}...` : ev.requirementName,
        x: Math.cos(angle) * reqRadius,
        y: Math.sin(angle) * reqRadius * 0.75,
        z: Math.sin(angle * 2) * 90,
        type: 'requirement',
        category: ev.category,
        status: ev.status,
        rawEvaluation: ev,
      });

      const parentCatId = `cat-${ev.category}`;
      eList.push({
        sourceId: parentCatId,
        targetId: reqId,
        status: ev.status,
      });

      // Supporting Document Node in Outer Orbit
      if (ev.matchedDocumentName) {
        const docId = `doc-${ev.requirementId}`;
        const docRadius = 350;
        nList.push({
          id: docId,
          label: ev.matchedDocumentName.length > 16 ? `${ev.matchedDocumentName.substring(0, 16)}...` : ev.matchedDocumentName,
          x: Math.cos(angle + 0.15) * docRadius,
          y: Math.sin(angle + 0.15) * docRadius * 0.75,
          z: Math.cos(angle) * 110,
          type: 'document',
          status: ev.status,
          rawEvaluation: ev,
        });

        eList.push({
          sourceId: reqId,
          targetId: docId,
          status: ev.status,
        });
      }
    });

    // Contradictions
    contradictions.forEach((con, idx) => {
      const conId = `con-${con.id}`;
      const angle = (idx / Math.max(1, contradictions.length)) * Math.PI + Math.PI / 4;
      nList.push({
        id: conId,
        label: con.title.length > 18 ? `${con.title.substring(0, 18)}...` : con.title,
        x: Math.cos(angle) * 380,
        y: Math.sin(angle) * 280,
        z: 140,
        type: 'contradiction',
        status: con.severity,
        rawContradiction: con,
      });
    });

    return { nodes: nList, edges: eList };
  }, [tenderTitle, evaluations, contradictions]);

  // Selected node details
  const activeNode = nodes.find((n) => n.id === selectedNodeId) || null;

  // 2. 3D Canvas Rendering
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    const height = (canvas.height = 600);

    ctx.fillStyle = '#F7F7F7';
    ctx.fillRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;
    const fov = 480;

    // Project Nodes
    const projected = nodes.map((node) => {
      const cosY = Math.cos(rotRef.current.y);
      const sinY = Math.sin(rotRef.current.y);
      const x1 = node.x * cosY + node.z * sinY;
      const z1 = -node.x * sinY + node.z * cosY;

      const cosX = Math.cos(rotRef.current.x);
      const sinX = Math.sin(rotRef.current.x);
      const y2 = node.y * cosX - z1 * sinX;
      const z2 = node.y * sinX + z1 * cosX;

      const scale = fov / (fov + z2 + cameraDistance);
      const px = cx + x1 * scale;
      const py = cy + y2 * scale;

      return {
        node,
        px,
        py,
        scale,
        z: z2,
      };
    });

    // 3. Draw Spatial Connection Lines
    edges.forEach((edge) => {
      const src = projected.find((p) => p.node.id === edge.sourceId);
      const tgt = projected.find((p) => p.node.id === edge.targetId);

      if (src && tgt) {
        const isSelectedPath =
          selectedNodeId &&
          (edge.sourceId === selectedNodeId || edge.targetId === selectedNodeId);

        ctx.strokeStyle = isSelectedPath ? '#111111' : '#CCCCCC';
        ctx.lineWidth = isSelectedPath ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(src.px, src.py);
        ctx.lineTo(tgt.px, tgt.py);
        ctx.stroke();
      }
    });

    // Sort by Z for realistic depth occlusion
    projected.sort((a, b) => b.z - a.z);

    // 4. Draw Projected Nodes (clean enterprise monochrome)
    projected.forEach(({ node, px, py, scale }) => {
      const isSelected = node.id === selectedNodeId;
      const radius = Math.max(4, (node.type === 'tender' ? 8 : node.type === 'category' ? 6 : 5) * scale * 2);

      // Core fill
      ctx.fillStyle = isSelected ? '#111111' : '#FFFFFF';
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      // Stroke border
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#111111';
      ctx.font = `${isSelected ? 'bold ' : ''}${Math.max(10, Math.floor(11 * scale))}px sans-serif`;
      ctx.fillText(node.label, px + radius + 5, py + 4);
    });
  };

  useEffect(() => {
    renderCanvas();
    const handleResize = () => {
      renderCanvas();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [nodes, edges, selectedNodeId, cameraDistance]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    rotRef.current.y += dx * 0.005;
    rotRef.current.x += dy * 0.005;
    renderCanvas();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const fov = 480;

    let closestNode: Node3D | null = null;
    let minDist = 30;

    nodes.forEach((node) => {
      const cosY = Math.cos(rotRef.current.y);
      const sinY = Math.sin(rotRef.current.y);
      const x1 = node.x * cosY + node.z * sinY;
      const z1 = -node.x * sinY + node.z * cosY;

      const cosX = Math.cos(rotRef.current.x);
      const sinX = Math.sin(rotRef.current.x);
      const y2 = node.y * cosX - z1 * sinX;
      const z2 = node.y * sinX + z1 * cosX;

      const scale = fov / (fov + z2 + cameraDistance);
      const px = cx + x1 * scale;
      const py = cy + y2 * scale;

      const d = Math.sqrt((px - clickX) ** 2 + (py - clickY) ** 2);
      if (d < minDist) {
        minDist = d;
        closestNode = node;
      }
    });

    if (closestNode) {
      setSelectedNodeId((closestNode as Node3D).id);
    }
  };

  return (
    <div className="flex flex-col gap-4 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#111111]">
            SPATIAL EVIDENCE NETWORK
          </span>
          <span className="text-xs text-[#777777]">• Drag to navigate spatial view</span>
        </div>

        <div className="flex items-center gap-1.5 bg-[#F7F7F7] p-1 rounded-lg border border-[#E5E5E5]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCameraDistance((prev) => Math.max(300, prev - 60))}
            className="h-7 w-7 text-[#555555] hover:text-[#111111] hover:bg-white"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCameraDistance((prev) => Math.min(800, prev + 60))}
            className="h-7 w-7 text-[#555555] hover:text-[#111111] hover:bg-white"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              rotRef.current = { x: 0.2, y: 0 };
              setCameraDistance(550);
            }}
            className="h-7 w-7 text-[#555555] hover:text-[#111111] hover:bg-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div
          className="lg:col-span-8 relative h-[600px] rounded-xl border border-[#E5E5E5] bg-[#F7F7F7] overflow-hidden cursor-grab active:cursor-grabbing shadow-inner"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
        >
          <canvas ref={canvasRef} className="w-full h-full select-none" />

          <div className="absolute bottom-3 left-3 bg-white/95 p-2.5 rounded-lg border border-[#E5E5E5] flex items-center gap-4 text-[10px] text-[#555555] shadow-xs">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border border-[#111111] bg-white" /> Node
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#111111]" /> Selected Node
            </span>
          </div>
        </div>

        <div className="lg:col-span-4 rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm min-h-[600px] flex flex-col justify-between">
          {activeNode ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-[#E5E5E5] pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-[#777777] tracking-wider">
                    NODE INSPECTOR • {activeNode.type}
                  </span>
                  <h3 className="text-base sm:text-lg font-semibold text-[#111111] leading-snug">
                    {activeNode.label}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="text-[#777777] hover:text-[#111111]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {activeNode.rawEvaluation && (
                <div className="space-y-4 text-xs">
                  <div className="bg-[#F7F7F7] p-3 rounded-lg border border-[#E5E5E5] space-y-1">
                    <span className="text-[10px] text-[#777777] uppercase tracking-wider block">
                      Grounding Excerpt
                    </span>
                    <p className="text-[#111111] italic leading-relaxed">
                      &ldquo;{activeNode.rawEvaluation.sourceExcerpt}&rdquo;
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#F7F7F7] p-2.5 rounded-lg border border-[#E5E5E5] space-y-1">
                      <span className="text-[10px] text-[#777777] block">Detected Metric</span>
                      <span className="text-[#111111] font-medium block truncate">
                        {activeNode.rawEvaluation.detectedValue}
                      </span>
                    </div>
                    <div className="bg-[#F7F7F7] p-2.5 rounded-lg border border-[#E5E5E5] space-y-1">
                      <span className="text-[10px] text-[#777777] block">Confidence</span>
                      <span className="text-[#111111] font-mono font-medium block">
                        {Math.round(activeNode.rawEvaluation.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    {onOpenEvidence && (
                      <Button
                        onClick={() => onOpenEvidence(activeNode.rawEvaluation!)}
                        className="w-full bg-[#111111] hover:bg-[#222222] text-white text-xs font-medium h-9 gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Grounded Evidence
                      </Button>
                    )}

                    {onOpenExplain && (
                      <Button
                        variant="outline"
                        onClick={() => onOpenExplain(activeNode.rawEvaluation!)}
                        className="w-full bg-white border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] text-xs font-normal h-9 gap-1.5"
                      >
                        Explain Decision (WHY?)
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {activeNode.rawContradiction && (
                <div className="space-y-4 text-xs">
                  <div className="bg-[#F7F7F7] p-3.5 rounded-lg border border-[#E5E5E5] space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-[#111111] tracking-wider block">
                      Conflict Analysis
                    </span>
                    <p className="text-[#555555] leading-relaxed">
                      {activeNode.rawContradiction.explanation}
                    </p>
                  </div>
                  <div className="bg-[#F7F7F7] p-3 rounded-lg border border-[#E5E5E5] space-y-1">
                    <span className="text-[10px] text-[#777777] uppercase tracking-wider block">
                      Remediation Action
                    </span>
                    <p className="text-[#111111]">
                      {activeNode.rawContradiction.recommendation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#777777] space-y-2">
              <Layers className="h-10 w-10 text-[#777777] stroke-[1.5]" />
              <h4 className="text-sm font-semibold text-[#111111]">Spatial Inspector</h4>
              <p className="text-xs text-[#555555]">
                Click any node to inspect its evidentiary trace and confidence metrics.
              </p>
            </div>
          )}

          <div className="border-t border-[#E5E5E5] pt-3 text-[10px] text-[#777777] font-mono flex items-center justify-between">
            <span>Clausentis Spatial Engine v6.0</span>
            <span>{nodes.length} Nodes • {edges.length} Links</span>
          </div>
        </div>
      </div>
    </div>
  );
}
