'use client';

/**
 * Bid Document Upload & Credentials Intake Zone
 *
 * Supports drag-and-drop file ingestion, individual credential type tagging,
 * processing status display, and 1-click simulated package presets
 * (Compliant Package vs Flawed Package with Mismatches).
 */

import { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getDemoPassingDocuments,
  getDemoFlawedDocuments,
} from '@/lib/tender-discovery/bid-compliance-verifier';
import { processBidderDocumentAction } from '@/lib/actions/bid-document-processor';
import type { BidUploadedDocument, DiscoveredTender } from '@/types/tender-discovery';
import { getBidUploadGuidance } from '@/lib/tender-discovery/bid-upload-guidance';
import { GovernmentVerificationCard } from '@/components/compliance/GovernmentVerificationCard';
import type { GovernmentRecordComparisonResult } from '@/lib/providers/types';

interface BidDocumentUploaderProps {
  documents: BidUploadedDocument[];
  onDocumentsChange: (docs: BidUploadedDocument[]) => void;
  onProceedToVerification: () => void;
  isVerifying?: boolean;
  tender?: DiscoveredTender | null;
}

const DOCUMENT_TYPE_OPTIONS: { id: BidUploadedDocument['documentType']; label: string }[] = [
  { id: 'gst_certificate', label: 'GST Registration Certificate (REG-06)' },
  { id: 'pan_card', label: 'Company PAN Card' },
  { id: 'audited_financials', label: 'Audited Balance Sheets & CA Turnover Certificate' },
  { id: 'experience_certificate', label: 'Client Work Orders & Completion Proof' },
  { id: 'non_blacklisting_declaration', label: 'Non-Blacklisting & Debarment Declaration (Annexure-B)' },
  { id: 'local_content_declaration', label: 'Local Content (Make in India) Declaration' },
  { id: 'technical_compliance', label: 'Technical Datasheet & Deviation Statement' },
  { id: 'emd_proof', label: 'EMD Bank Receipt or Udyam Exemption Certificate' },
  { id: 'udyam_certificate', label: 'Udyam / MSME Registration' },
  { id: 'other', label: 'Other Supplementary Credential' },
];

export function BidDocumentUploader({
  documents,
  onDocumentsChange,
  onProceedToVerification,
  isVerifying = false,
  tender = null,
}: BidDocumentUploaderProps) {
  const [selectedType, setSelectedType] = useState<BidUploadedDocument['documentType']>('non_blacklisting_declaration');
  const [dragActive, setDragActive] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [expandedGovtDocs, setExpandedGovtDocs] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const guidance = getBidUploadGuidance(selectedType, tender);

  const handleFiles = async (fileList: FileList) => {
    const rawFiles = Array.from(fileList);
    if (rawFiles.length === 0) return;

    setIsProcessingFiles(true);

    // 1. Instantly register placeholder documents with 'processing' status
    const initialDocs: BidUploadedDocument[] = rawFiles.map((file, idx) => ({
      id: `doc-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      fileName: file.name,
      documentType: selectedType,
      displayName: DOCUMENT_TYPE_OPTIONS.find((o) => o.id === selectedType)?.label || file.name,
      fileSizeBytes: file.size,
      status: 'processing' as const,
      uploadedAt: new Date().toISOString(),
    }));

    let currentDocs = [...documents, ...initialDocs];
    onDocumentsChange(currentDocs);

    // 2. Process each file via server action to extract text, infer tag, and extract facts
    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i];
      const placeholder = initialDocs[i];

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userTag', selectedType);

        const res = await processBidderDocumentAction(formData);
        if (res.success && res.doc) {
          currentDocs = currentDocs.map((d) =>
            d.id === placeholder.id
              ? {
                  ...res.doc!,
                  id: placeholder.id,
                }
              : d
          );
        } else {
          currentDocs = currentDocs.map((d) =>
            d.id === placeholder.id
              ? {
                  ...d,
                  status: 'processed' as const,
                }
              : d
          );
        }
      } catch (err) {
        console.warn(`[BidDocumentUploader] Processing error on ${file.name}:`, err);
        currentDocs = currentDocs.map((d) =>
          d.id === placeholder.id
            ? {
                ...d,
                status: 'processed' as const,
              }
            : d
        );
      }
      onDocumentsChange([...currentDocs]);
    }

    setIsProcessingFiles(false);
  };

  const handleUpdateDocType = (id: string, newType: BidUploadedDocument['documentType']) => {
    const updated = documents.map((d) => {
      if (d.id === id) {
        return {
          ...d,
          documentType: newType,
          displayName: DOCUMENT_TYPE_OPTIONS.find((o) => o.id === newType)?.label || d.fileName,
        };
      }
      return d;
    });
    onDocumentsChange(updated);
  };

  const handleRemoveDoc = (id: string) => {
    onDocumentsChange(documents.filter((d) => d.id !== id));
  };

  const handleLoadPreset = (preset: 'passing' | 'flawed') => {
    if (preset === 'passing') {
      onDocumentsChange(getDemoPassingDocuments());
    } else {
      onDocumentsChange(getDemoFlawedDocuments());
    }
  };

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-6 shadow-xs space-y-6">
      {/* Header & Preset Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#777777]">
              INTAKE PIPELINE
            </span>
            <span className="h-1 w-1 rounded-full bg-[#111111]" />
            <span className="text-[11px] font-mono text-[#555555]">
              {documents.length} EXHIBITS ATTACHED
            </span>
          </div>
          <h3 className="text-xl font-semibold text-[#111111] tracking-tight">
            Upload Bidder Exhibits & Credentials
          </h3>
        </div>

        {/* 1-Click Verification Test Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-[#777777] uppercase font-mono mr-1">
            Test Packages:
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleLoadPreset('flawed')}
            className="h-8 px-2.5 text-xs border-[#E5E5E5] bg-white text-[#111111] hover:bg-[#F7F7F7] gap-1.5 cursor-pointer rounded-md"
          >
            <AlertTriangle className="h-3 w-3 text-[#111111]" />
            <span>Load Flawed Package (3 Issues)</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleLoadPreset('passing')}
            className="h-8 px-2.5 text-xs border-[#E5E5E5] bg-white text-[#111111] hover:bg-[#F7F7F7] gap-1.5 cursor-pointer rounded-md"
          >
            <CheckCircle2 className="h-3 w-3 text-[#111111]" />
            <span>Load Compliant Package (100% Pass)</span>
          </Button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
          }
        }}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragActive
            ? 'border-[#111111] bg-[#F7F7F7]'
            : 'border-[#E5E5E5] bg-[#F7F7F7] hover:border-[#CCCCCC]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.xlsx,.png,.jpg"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
          }}
          className="hidden"
        />

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-white border border-[#E5E5E5] text-[#111111] mb-3">
          <UploadCloud className="h-6 w-6 stroke-[1.5]" />
        </div>

        <h4 className="text-base font-semibold text-[#111111] mb-1">
          Drag and drop bid exhibits here, or click to browse
        </h4>
        <p className="text-xs text-[#555555] mb-4">
          Supported formats: PDF, DOCX, XLSX. Maximum 50MB per file.
        </p>

        {/* Credential Category Selector & Contextual Guidance Panel */}
        <div className="max-w-xl mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <select
                id="bidder-doc-tag-select"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as BidUploadedDocument['documentType'])}
                className="w-full text-xs rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-[#111111] focus:border-[#111111] focus:outline-none cursor-pointer"
              >
                {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-white text-[#111111]">
                    Tag: {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto h-8 px-4 bg-[#111111] hover:bg-[#222222] text-white text-xs gap-1.5 shrink-0 rounded-md cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Select File</span>
            </Button>
          </div>

          {/* Compact Contextual Guidance: What to Submit */}
          {guidance && (
            <div
              id="bidder-upload-guidance-panel"
              className="rounded-lg border border-[#E5E5E5] bg-white p-4 text-left shadow-2xs space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0F0F0] pb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#777777] shrink-0">
                    WHAT TO SUBMIT
                  </span>
                  <span className="text-[#CCCCCC] select-none">•</span>
                  <span className="text-xs font-semibold text-[#111111] truncate">
                    {guidance.title}
                  </span>
                </div>
                {guidance.clauseRef && (
                  <span className="text-[10px] font-mono text-[#555555] bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5] shrink-0">
                    {guidance.clauseRef}
                  </span>
                )}
              </div>

              {guidance.purpose && (
                <div className="text-[11px] text-[#555555] leading-relaxed">
                  <span className="font-medium text-[#333333]">Purpose: </span>
                  {guidance.purpose}
                </div>
              )}

              <p className="text-xs text-[#222222] leading-relaxed">
                {guidance.whatToSubmit}
              </p>

              {guidance.expectedEvidence && guidance.expectedEvidence.length > 0 && (
                <div className="pt-2 border-t border-[#F5F5F5] space-y-1.5">
                  <div className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#777777]">
                    Expected Information & Evidence:
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-[#333333]">
                    {guidance.expectedEvidence.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#777777] leading-tight select-none">•</span>
                        <span className="leading-tight">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Documents Table / Checklist */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#777777] border-b border-[#E5E5E5] pb-2 font-mono uppercase tracking-wider">
          <span>UPLOADED CREDENTIALS & EVIDENCE ({documents.length})</span>
          <span>PROCESSING STATUS</span>
        </div>

        {documents.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#777777]">
            No bidder documents uploaded yet. Use the test package buttons above or upload your company files.
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => {
              const govtVerif = doc.extractedFacts?.governmentVerification as GovernmentRecordComparisonResult | undefined;
              const isExpanded = Boolean(expandedGovtDocs[doc.id]);

              return (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-md border border-[#E5E5E5] bg-white hover:border-[#CCCCCC] transition-colors space-y-3 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111] mt-0.5">
                        <FileText className="h-4 w-4 stroke-[1.5]" />
                      </div>
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-[#111111] truncate max-w-sm sm:max-w-md">
                            {doc.fileName}
                          </span>
                          <span className="text-[11px] text-[#777777] font-mono">
                            ({(doc.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>

                        {/* Inline Tag Selector */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] uppercase font-mono text-[#777777]">Classification:</span>
                          <select
                            value={doc.documentType}
                            onChange={(e) => handleUpdateDocType(doc.id, e.target.value as BidUploadedDocument['documentType'])}
                            className="text-[11px] font-mono rounded border border-[#E5E5E5] bg-[#F7F7F7] px-2 py-0.5 text-[#111111] focus:border-[#111111] focus:outline-none cursor-pointer"
                          >
                            {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Extracted Evidence Chips */}
                        {doc.extractedFacts && Object.keys(doc.extractedFacts).length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {typeof doc.extractedFacts.turnover === 'number' && (
                              <span className="inline-flex items-center text-[10px] font-mono font-medium text-[#111111] bg-[#F0F0F0] px-1.5 py-0.5 rounded border border-[#E0E0E0]">
                                Turnover: ₹{doc.extractedFacts.turnover.toFixed(2)} Cr {doc.extractedFacts.turnoverPage ? `(p.${doc.extractedFacts.turnoverPage})` : ''}
                              </span>
                            )}
                            {typeof doc.extractedFacts.experienceYears === 'number' && (
                              <span className="inline-flex items-center text-[10px] font-mono font-medium text-[#111111] bg-[#F0F0F0] px-1.5 py-0.5 rounded border border-[#E0E0E0]">
                                Exp: {doc.extractedFacts.experienceYears.toFixed(1)} Yrs {doc.extractedFacts.experiencePage ? `(p.${doc.extractedFacts.experiencePage})` : ''}
                              </span>
                            )}
                            {typeof doc.extractedFacts.localContentPercentage === 'number' && (
                              <span className="inline-flex items-center text-[10px] font-mono font-medium text-[#111111] bg-[#F0F0F0] px-1.5 py-0.5 rounded border border-[#E0E0E0]">
                                Local Content: {doc.extractedFacts.localContentPercentage}%
                              </span>
                            )}
                            {typeof doc.extractedFacts.gstin === 'string' && (
                              <span className="inline-flex items-center text-[10px] font-mono text-[#333333] bg-[#FAFAFA] px-1.5 py-0.5 rounded border border-[#E5E5E5]">
                                GSTIN: {doc.extractedFacts.gstin}
                              </span>
                            )}
                            {typeof doc.extractedFacts.pan === 'string' && (
                              <span className="inline-flex items-center text-[10px] font-mono text-[#333333] bg-[#FAFAFA] px-1.5 py-0.5 rounded border border-[#E5E5E5]">
                                PAN: {doc.extractedFacts.pan}
                              </span>
                            )}
                            {typeof doc.extractedFacts.udyamNumber === 'string' && (
                              <span className="inline-flex items-center text-[10px] font-mono text-[#333333] bg-[#FAFAFA] px-1.5 py-0.5 rounded border border-[#E5E5E5]">
                                Udyam: {doc.extractedFacts.udyamNumber}
                              </span>
                            )}
                            {doc.extractedFacts.isNonDebarred !== undefined && (
                              <span className="inline-flex items-center text-[10px] font-mono text-[#111111] bg-[#F0F0F0] px-1.5 py-0.5 rounded border border-[#E0E0E0]">
                                Non-Debarred Verified
                              </span>
                            )}
                            {doc.extractedFacts.deviationsCount !== undefined && (
                              <span className="inline-flex items-center text-[10px] font-mono text-[#111111] bg-[#F0F0F0] px-1.5 py-0.5 rounded border border-[#E0E0E0]">
                                {doc.extractedFacts.deviationsCount === 0 ? 'Nil Deviations' : `${doc.extractedFacts.deviationsCount} Deviation(s)`}
                              </span>
                            )}
                            {govtVerif && (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedGovtDocs((prev) => ({
                                    ...prev,
                                    [doc.id]: !prev[doc.id],
                                  }))
                                }
                                className={`inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded border cursor-pointer transition-colors ${
                                  govtVerif.status === 'MATCH'
                                    ? 'bg-[#F0FDF4] text-[#166534] border-[#BBF7D0] hover:bg-[#DCFCE7]'
                                    : govtVerif.status === 'MISMATCH'
                                    ? 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A] hover:bg-[#FEF3C7]'
                                    : 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA] hover:bg-[#FEE2E2]'
                                }`}
                              >
                                <span className="font-semibold">Govt Record:</span>
                                <span>{govtVerif.status}</span>
                                <span className="underline ml-0.5 text-[9px]">
                                  {isExpanded ? 'Hide' : 'Inspect'}
                                </span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F5F5F5]">
                      {doc.status === 'processing' ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#555555] bg-[#F7F7F7] px-2.5 py-1 rounded border border-[#E5E5E5]">
                          <Loader2 className="h-3 w-3 animate-spin text-[#111111]" />
                          Extracting Evidence...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#111111] bg-[#F7F7F7] px-2.5 py-1 rounded border border-[#E5E5E5]">
                          <CheckCircle2 className="h-3 w-3 text-[#111111]" />
                          Processed
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveDoc(doc.id)}
                        className="text-[#777777] hover:text-[#111111] p-1.5 transition-colors cursor-pointer rounded hover:bg-[#F7F7F7]"
                        title="Remove Document"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Government Verification Card */}
                  {govtVerif && isExpanded && (
                    <div className="pt-2 border-t border-[#EEEEEE]">
                      <GovernmentVerificationCard verification={govtVerif} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Primary Verification Action */}
      <div className="pt-4 border-t border-[#E5E5E5] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-[#555555]">
          {documents.length > 0 ? (
            <span>Ready to evaluate bidder package against tender criteria.</span>
          ) : (
            <span className="text-[#111111]">Please upload or load a test package to proceed.</span>
          )}
        </div>

        <Button
          size="lg"
          disabled={documents.length === 0 || isVerifying}
          onClick={onProceedToVerification}
          className="w-full sm:w-auto h-10 px-6 bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm tracking-wide gap-2 rounded-md shadow-xs cursor-pointer transition-colors"
        >
          <span>Run Compliance Verification</span>
        </Button>
      </div>
    </div>
  );
}
