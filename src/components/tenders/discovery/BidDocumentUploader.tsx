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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  getDemoPassingDocuments,
  getDemoFlawedDocuments,
} from '@/lib/tender-discovery/bid-compliance-verifier';
import type { BidUploadedDocument } from '@/types/tender-discovery';

interface BidDocumentUploaderProps {
  documents: BidUploadedDocument[];
  onDocumentsChange: (docs: BidUploadedDocument[]) => void;
  onProceedToVerification: () => void;
  isVerifying?: boolean;
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
}: BidDocumentUploaderProps) {
  const [selectedType, setSelectedType] = useState<BidUploadedDocument['documentType']>('non_blacklisting_declaration');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList) => {
    const newDocs: BidUploadedDocument[] = Array.from(fileList).map((file, idx) => ({
      id: `doc-${Date.now()}-${idx}`,
      fileName: file.name,
      documentType: selectedType,
      displayName: DOCUMENT_TYPE_OPTIONS.find((o) => o.id === selectedType)?.label || file.name,
      fileSizeBytes: file.size,
      status: 'processed',
      uploadedAt: new Date().toISOString(),
    }));

    onDocumentsChange([...documents, ...newDocs]);
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

        {/* Credential Category Selector for Manual File Additions */}
        <div className="max-w-md mx-auto flex flex-col sm:flex-row items-center gap-2">
          <select
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
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 rounded-md border border-[#E5E5E5] bg-white hover:border-[#CCCCCC] transition-colors text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#F7F7F7] border border-[#E5E5E5] text-[#111111]">
                    <FileText className="h-4 w-4 stroke-[1.5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-[#111111] truncate max-w-sm sm:max-w-md">
                      {doc.fileName}
                    </div>
                    <div className="text-[11px] text-[#555555] flex items-center gap-2">
                      <span className="font-mono">{doc.displayName}</span>
                      <span className="text-[#777777]">&bull;</span>
                      <span className="text-[#777777]">
                        {(doc.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#111111] bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5]">
                    <CheckCircle2 className="h-3 w-3 text-[#111111]" />
                    Processed
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveDoc(doc.id)}
                    className="text-[#777777] hover:text-[#111111] p-1 transition-colors cursor-pointer"
                    title="Remove Document"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
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
