'use client';

import { useState, useRef, useMemo } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  AlertOctagon,
  Eye,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RequirementEvidenceEvaluation, ContradictionIssue } from '@/lib/ai/contradiction-engine';

export interface GraphNode {
  id: string;
  type: 'tender' | 'category' | 'requirement' | 'document' | 'evidence' | 'contradiction';
  label: string;
  category?: string;
  status?: 'compliant' | 'non_compliant' | 'partially_compliant' | 'missing_evidence' | 'needs_review' | 'not_verified' | 'critical' | 'warning' | 'info';
  data: Record<string, unknown>;
  x: number;
  y: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  status?: string;
  label?: string;
}

interface ComplianceIntelligenceGraphProps {
  tenderTitle: string;
  evaluations: RequirementEvidenceEvaluation[];
  contradictions: ContradictionIssue[];
  onOpenExplain?: (evaluation: RequirementEvidenceEvaluation) => void;
  onOpenEvidence?: (evaluation: RequirementEvidenceEvaluation) => void;
}

export function ComplianceIntelligenceGraph({
  tenderTitle,
  evaluations,
  contradictions,
  onOpenExplain,
  onOpenEvidence
}: ComplianceIntelligenceGraphProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 1. Construct Graph Nodes and Directed Flow
  const { nodes, edges } = useMemo(() => {
    const nList: GraphNode[] = [];
    const eList: GraphEdge[] = [];

    // Root Tender Node
    const rootX = 60;
    const rootY = 280;
    nList.push({
      id: 'node-tender-root',
      type: 'tender',
      label: tenderTitle.length > 22 ? `${tenderTitle.substring(0, 22)}...` : tenderTitle,
      x: rootX,
      y: rootY,
      data: { title: tenderTitle, type: 'Tender Dossier' }
    });

    // Categories Level
    const rawCategories = Array.from(new Set(evaluations.map(e => e.category)));
    const categories = rawCategories.length > 0 ? rawCategories : ['financial', 'legal', 'technical', 'experience'];
    
    const catX = 260;
    const catSpacing = 105;
    const catStartY = rootY - ((categories.length - 1) * catSpacing) / 2;

    categories.forEach((cat, idx) => {
      const catId = `node-cat-${cat}`;
      const cy = catStartY + idx * catSpacing;
      
      nList.push({
        id: catId,
        type: 'category',
        label: cat.toUpperCase(),
        category: cat,
        x: catX,
        y: cy,
        data: { category: cat }
      });

      eList.push({
        id: `edge-root-${catId}`,
        source: 'node-tender-root',
        target: catId
      });
    });

    // Requirements Level
    const reqX = 490;
    const filteredEvals = evaluations.filter(e => {
      const matchesCat = selectedCategory === 'all' || e.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchesCat;
    });

    const displayEvals = filteredEvals.length > 0 ? filteredEvals : evaluations;
    const reqSpacing = 95;
    const reqStartY = Math.max(50, rootY - ((displayEvals.length - 1) * reqSpacing) / 2);

    displayEvals.forEach((ev, idx) => {
      const reqId = `node-req-${ev.requirementId}`;
      const ry = reqStartY + idx * reqSpacing;

      nList.push({
        id: reqId,
        type: 'requirement',
        label: ev.requirementName.length > 20 ? `${ev.requirementName.substring(0, 20)}...` : ev.requirementName,
        category: ev.category,
        status: ev.status,
        x: reqX,
        y: ry,
        data: ev as unknown as Record<string, unknown>
      });

      // Connect from Category
      const catId = `node-cat-${ev.category}`;
      if (nList.some(n => n.id === catId)) {
        eList.push({
          id: `edge-${catId}-${reqId}`,
          source: catId,
          target: reqId,
          status: ev.status
        });
      }

      // Matched Document / Vault Evidence Node
      if (ev.matchedDocumentName) {
        const docNodeId = `node-doc-${ev.matchedDocumentId || ev.requirementId}`;
        const docX = 740;
        const docY = ry;

        if (!nList.some(n => n.id === docNodeId)) {
          nList.push({
            id: docNodeId,
            type: 'document',
            label: ev.matchedDocumentName.length > 18 ? `${ev.matchedDocumentName.substring(0, 18)}...` : ev.matchedDocumentName,
            status: ev.status,
            x: docX,
            y: docY,
            data: {
              name: ev.matchedDocumentName,
              page: ev.sourcePage,
              excerpt: ev.sourceExcerpt,
              detected: ev.detectedValue,
              rawEvaluation: ev
            }
          });
        }

        eList.push({
          id: `edge-${reqId}-${docNodeId}`,
          source: reqId,
          target: docNodeId,
          status: ev.status
        });
      }
    });

    // Contradictions Level
    const conX = 990;
    contradictions.forEach((con, idx) => {
      const conId = `node-con-${con.id}`;
      const conY = rootY - 110 + idx * 125;

      nList.push({
        id: conId,
        type: 'contradiction',
        label: con.title.length > 20 ? `${con.title.substring(0, 20)}...` : con.title,
        status: con.severity,
        x: conX,
        y: conY,
        data: con as unknown as Record<string, unknown>
      });

      // Link to affected documents
      con.affectedDocuments.forEach(aff => {
        const targetDocId = `node-doc-${aff.documentId}`;
        if (nList.some(n => n.id === targetDocId)) {
          eList.push({
            id: `edge-${targetDocId}-${conId}`,
            source: targetDocId,
            target: conId,
            status: con.severity
          });
        }
      });
    });

    return { nodes: nList, edges: eList };
  }, [tenderTitle, evaluations, contradictions, selectedCategory]);

  // Selected Active Node Details
  const activeNode = nodes.find(n => n.id === activeNodeId) || null;

  // Selected evaluation for panel triggers
  const activeEvaluation: RequirementEvidenceEvaluation | null = useMemo(() => {
    if (!activeNode) return null;
    if (activeNode.type === 'requirement') {
      return activeNode.data as unknown as RequirementEvidenceEvaluation;
    }
    if (activeNode.type === 'document') {
      return ((activeNode.data as Record<string, unknown>).rawEvaluation as RequirementEvidenceEvaluation) || null;
    }
    return null;
  }, [activeNode]);

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="flex flex-col gap-4 font-sans">
      {/* 1. Category Filter & Zoom Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-[#E5E5E5] bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777] mr-1">
            FILTER BY DOMAIN:
          </span>
          {['all', 'financial', 'legal', 'technical', 'experience'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs transition-colors uppercase tracking-wider border ${
                selectedCategory === cat
                  ? 'bg-[#111111] text-white border-[#111111] font-medium'
                  : 'bg-[#F7F7F7] text-[#555555] border-[#E5E5E5] hover:text-[#111111] hover:bg-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-[#F7F7F7] p-1 rounded-lg border border-[#E5E5E5]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(prev => Math.min(prev + 0.15, 1.8))}
            className="h-7 w-7 text-[#555555] hover:text-[#111111] hover:bg-white"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.6))}
            className="h-7 w-7 text-[#555555] hover:text-[#111111] hover:bg-white"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="h-7 w-7 text-[#555555] hover:text-[#111111] hover:bg-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 2. Interactive SVG Canvas & Evidence Inspector Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Canvas Area */}
        <div 
          className="lg:col-span-8 relative h-[620px] rounded-xl border border-[#E5E5E5] bg-[#F7F7F7] overflow-hidden cursor-grab active:cursor-grabbing shadow-inner"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#d4d4d4_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

          {/* SVG Canvas */}
          <svg className="w-full h-full select-none">
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Directed Relationship Edges */}
              {edges.map(edge => {
                const src = nodes.find(n => n.id === edge.source);
                const tgt = nodes.find(n => n.id === edge.target);
                if (!src || !tgt) return null;

                const isConnected = activeNodeId && (edge.source === activeNodeId || edge.target === activeNodeId);

                const strokeColor = isConnected
                  ? '#111111'
                  : '#A3A3A3';

                const midX = (src.x + tgt.x) / 2;
                const path = `M ${src.x + 80} ${src.y + 22} C ${midX} ${src.y + 22}, ${midX} ${tgt.y + 22}, ${tgt.x} ${tgt.y + 22}`;

                return (
                  <g key={edge.id}>
                    <path
                      d={path}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isConnected ? 2 : 1}
                      strokeDasharray={edge.status === 'missing_evidence' ? '4,4' : undefined}
                      opacity={isConnected ? 1 : 0.6}
                    />
                  </g>
                );
              })}

              {/* Graph Nodes */}
              {nodes.map(node => {
                const isActive = activeNodeId === node.id;
                const isCompliant = node.status === 'compliant';
                const isNonCompliant = node.status === 'non_compliant' || node.status === 'critical';
                const isMissing = node.status === 'missing_evidence';

                const borderColor = isActive ? 'border-[#111111] ring-1 ring-[#111111]' : 'border-[#E5E5E5]';
                const bgColor = isActive ? 'bg-[#F7F7F7]' : 'bg-white';
                const textColor = 'text-[#111111]';

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveNodeId(node.id);
                    }}
                    className="cursor-pointer group"
                  >
                    <foreignObject width="150" height="55">
                      <div className={`w-full h-full rounded-lg border p-2 flex flex-col justify-center transition-all ${borderColor} ${bgColor} shadow-xs`}>
                        <div className="flex items-center gap-1.5 truncate">
                          {node.type === 'tender' && <FileText className="h-3.5 w-3.5 text-[#111111] shrink-0" />}
                          {node.type === 'category' && <Layers className="h-3.5 w-3.5 text-[#555555] shrink-0" />}
                          {node.type === 'requirement' && isCompliant && <CheckCircle2 className="h-3.5 w-3.5 text-[#111111] shrink-0" />}
                          {node.type === 'requirement' && isNonCompliant && <XCircle className="h-3.5 w-3.5 text-[#111111] shrink-0" />}
                          {node.type === 'requirement' && isMissing && <HelpCircle className="h-3.5 w-3.5 text-[#777777] shrink-0" />}
                          {node.type === 'document' && <FileText className="h-3.5 w-3.5 text-[#555555] shrink-0" />}
                          {node.type === 'contradiction' && <AlertOctagon className="h-3.5 w-3.5 text-[#111111] shrink-0" />}
                          
                          <span className={`text-xs font-medium truncate ${textColor}`}>
                            {node.label}
                          </span>
                        </div>
                        <span className="text-[9px] text-[#777777] uppercase font-mono truncate mt-0.5">
                          {node.type}
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Canvas Helper Legend */}
          <div className="absolute bottom-3 left-3 bg-white/95 p-2.5 rounded-lg border border-[#E5E5E5] flex items-center gap-4 text-[10px] text-[#555555] shadow-xs">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#111111]" /> Compliant</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#555555]" /> Discrepancy / Fail</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#888888]" /> Missing Proof</span>
          </div>
        </div>

        {/* 3. Right-Side Evidence Detail Panel */}
        <div className="lg:col-span-4 rounded-xl border border-[#E5E5E5] bg-white p-6 shadow-sm min-h-[620px] flex flex-col justify-between">
          {activeNode ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-[#E5E5E5] pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-[#777777] tracking-wider">
                    EVIDENCE TRACE PANEL • {activeNode.type}
                  </span>
                  <h3 className="text-base sm:text-lg font-semibold text-[#111111] leading-snug">
                    {activeNode.label}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveNodeId(null)}
                  className="text-[#777777] hover:text-[#111111] transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Requirement Section */}
              {activeNode.type === 'requirement' && activeEvaluation && (
                <div className="space-y-4 text-xs">
                  {/* Decision Badge */}
                  <div className="flex items-center justify-between bg-[#F7F7F7] p-3 rounded-lg border border-[#E5E5E5]">
                    <span className="text-[10px] text-[#777777] uppercase tracking-wider font-semibold">DECISION</span>
                    <span className="px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider bg-white text-[#111111] border border-[#E5E5E5]">
                      {activeEvaluation.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Requirement Text */}
                  <div className="space-y-1 bg-[#F7F7F7] p-3 rounded-lg border border-[#E5E5E5]">
                    <span className="text-[10px] text-[#777777] uppercase tracking-wider block">REQUIREMENT</span>
                    <p className="text-[#111111] leading-relaxed font-medium">
                      {activeEvaluation.requirementName}
                    </p>
                  </div>

                  {/* Required Value vs Evidence Found */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#F7F7F7] p-2.5 rounded-lg border border-[#E5E5E5] space-y-1">
                      <span className="text-[10px] text-[#777777] block">REQUIRED VALUE</span>
                      <span className="text-[#111111] font-medium block truncate">
                        {activeEvaluation.requiredValue ? String(activeEvaluation.requiredValue) : 'Standard Rule'}
                      </span>
                    </div>
                    <div className="bg-[#F7F7F7] p-2.5 rounded-lg border border-[#E5E5E5] space-y-1">
                      <span className="text-[10px] text-[#777777] block">EVIDENCE FOUND</span>
                      <span className="text-[#111111] font-medium block truncate">
                        {activeEvaluation.detectedValue ? String(activeEvaluation.detectedValue) : 'Grounded'}
                      </span>
                    </div>
                  </div>

                  {/* Source Document & Page */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#F7F7F7] p-2.5 rounded-lg border border-[#E5E5E5] space-y-1">
                      <span className="text-[10px] text-[#777777] block">SOURCE DOCUMENT</span>
                      <span className="text-[#111111] font-medium truncate block">
                        {activeEvaluation.matchedDocumentName || 'Tender Dossier'}
                      </span>
                    </div>
                    <div className="bg-[#F7F7F7] p-2.5 rounded-lg border border-[#E5E5E5] space-y-1">
                      <span className="text-[10px] text-[#777777] block">PAGE</span>
                      <span className="text-[#111111] font-medium block font-mono">
                        Page {activeEvaluation.sourcePage || 1}
                      </span>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="flex items-center justify-between text-xs text-[#555555] border-t border-[#E5E5E5] pt-2">
                    <span>Deterministic Confidence</span>
                    <span className="font-mono text-[#111111] font-semibold">{Math.round(activeEvaluation.confidence * 100)}%</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    {onOpenEvidence && (
                      <Button
                        onClick={() => onOpenEvidence(activeEvaluation)}
                        className="w-full bg-[#111111] hover:bg-[#222222] text-white text-xs font-medium h-9 gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" /> View Evidence
                      </Button>
                    )}

                    {onOpenExplain && (
                      <Button
                        variant="outline"
                        onClick={() => onOpenExplain(activeEvaluation)}
                        className="w-full bg-white border-[#E5E5E5] text-[#111111] hover:bg-[#F7F7F7] text-xs font-normal h-9 gap-1.5"
                      >
                        Why this decision?
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Document Node View */}
              {activeNode.type === 'document' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-[#F7F7F7] p-3.5 rounded-lg border border-[#E5E5E5] space-y-1">
                    <span className="text-[10px] text-[#777777] uppercase tracking-wider block">Grounded Excerpt</span>
                    <p className="text-[#111111] italic leading-relaxed">
                      &ldquo;{String((activeNode.data as Record<string, unknown>).excerpt || '')}&rdquo;
                    </p>
                  </div>

                  <div className="bg-[#F7F7F7] p-3 rounded-lg border border-[#E5E5E5]">
                    <span className="text-[10px] text-[#777777] block mb-1">Source Page</span>
                    <span className="text-[#111111] font-medium font-mono">Page {String((activeNode.data as Record<string, unknown>).page || 1)}</span>
                  </div>

                  {activeEvaluation && onOpenEvidence && (
                    <Button
                      onClick={() => onOpenEvidence(activeEvaluation)}
                      className="w-full bg-[#111111] hover:bg-[#222222] text-white text-xs font-medium h-9 gap-1.5"
                    >
                      <Eye className="h-3.5 w-3.5" /> Open Document Evidence
                    </Button>
                  )}
                </div>
              )}

              {/* Contradiction Node View */}
              {activeNode.type === 'contradiction' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-[#F7F7F7] p-3.5 rounded-lg border border-[#E5E5E5] space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-[#111111] tracking-wider block">Conflict Explanation</span>
                    <p className="text-[#555555] leading-relaxed">
                      {String((activeNode.data as Record<string, unknown>).explanation || '')}
                    </p>
                  </div>
                  <div className="bg-[#F7F7F7] p-3 rounded-lg border border-[#E5E5E5] space-y-1">
                    <span className="text-[10px] text-[#777777] uppercase tracking-wider block">Recommended Action</span>
                    <p className="text-[#111111] leading-relaxed">
                      {String((activeNode.data as Record<string, unknown>).recommendation || '')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#777777] space-y-2">
              <Layers className="h-10 w-10 text-[#777777] stroke-[1.5]" />
              <h4 className="text-sm font-semibold text-[#111111]">Interactive Evidence Trace</h4>
              <p className="text-xs text-[#555555]">
                Click any node in the graph to trace its underlying proof, page citation, and decision rationale.
              </p>
            </div>
          )}

          <div className="border-t border-[#E5E5E5] pt-3 text-[10px] text-[#777777] font-mono flex items-center justify-between">
            <span>Clausentis Evidence Graph v5.0</span>
            <span>{nodes.length} Nodes • {edges.length} Connections</span>
          </div>
        </div>
      </div>
    </div>
  );
}
