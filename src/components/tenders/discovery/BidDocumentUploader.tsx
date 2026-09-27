'use client';

/**
 * Bid document intake (v2).
 *
 * Each file is processed by processBidderDocumentAction on the server, which extracts
 * facts, runs forensics and HMAC-seals the evidence. The sealed document is kept in the
 * parent's state and sent back to the server for checks and submission, where the seal
 * is verified again. Sample packages are replaced by the server's own copies.
 */

import { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { getDemoPassingDocuments, getDemoFlawedDocuments } from '@/lib/tender-discovery/bid-compliance-verifier';
import { processBidderDocumentAction } from '@/lib/actions/bid-document-processor';
import type { BidUploadedDocument, DiscoveredTender } from '@/types/tender-discovery';
import { getBidUploadGuidance } from '@/lib/tender-discovery/bid-upload-guidance';
import { GovernmentVerificationCard } from '@/components/compliance/GovernmentVerificationCard';
import { ForensicReportCard } from '@/components/forensics/ForensicReportCard';
import type { GovernmentRecordComparisonResult } from '@/lib/providers/types';

interface BidDocumentUploaderProps {
  documents: BidUploadedDocument[];
  onDocumentsChange: (docs: BidUploadedDocument[]) => void;
  onProceedToVerification?: () => void;
  isVerifying?: boolean;
  tender?: DiscoveredTender | null;
}

export const DOCUMENT_TYPE_OPTIONS: { id: BidUploadedDocument['documentType']; label: string }[] = [
  { id: 'gst_certificate', label: 'GST registration certificate (REG-06)' },
  { id: 'pan_card', label: 'Company PAN card' },
  { id: 'audited_financials', label: 'Audited balance sheets & CA turnover certificate' },
  { id: 'experience_certificate', label: 'Work orders & completion certificates' },
  { id: 'non_blacklisting_declaration', label: 'Non-blacklisting affidavit (Annexure-B)' },
  { id: 'local_content_declaration', label: 'Local content (Make in India) declaration' },
  { id: 'technical_compliance', label: 'Technical datasheet & deviation statement' },
  { id: 'emd_proof', label: 'EMD receipt or Udyam exemption' },
  { id: 'udyam_certificate', label: 'Udyam / MSME registration' },
  { id: 'oem_authorization', label: 'OEM manufacturer authorization' },
  { id: 'other', label: 'Other supporting document' },
];

function isProcessing(doc: BidUploadedDocument) {
  return doc.status === 'processing' || ['PROCESSING', 'EXTRACTING', 'FORENSIC_ANALYSIS'].includes(doc.lifecycleStatus || '');
}
function isFailed(doc: BidUploadedDocument) {
  return doc.status === 'failed' || ['PROCESSING_FAILED', 'EXTRACTION_FAILED'].includes(doc.lifecycleStatus || '');
}

function factChips(doc: BidUploadedDocument): string[] {
  const f = doc.extractedFacts || {};
  const chips: string[] = [];
  if (typeof f.turnover === 'number') chips.push(`Turnover ₹${f.turnover.toFixed(2)} Cr${f.turnoverPage ? ` (p.${f.turnoverPage})` : ''}`);
  if (typeof f.experienceYears === 'number') chips.push(`Experience ${f.experienceYears.toFixed(1)} yrs${f.experiencePage ? ` (p.${f.experiencePage})` : ''}`);
  if (typeof f.localContentPercentage === 'number') chips.push(`Local content ${f.localContentPercentage}%`);
  if (typeof f.gstin === 'string') chips.push(`GSTIN ${f.gstin}`);
  if (typeof f.pan === 'string') chips.push(`PAN ${f.pan}`);
  if (typeof f.udyamNumber === 'string') chips.push(`Udyam ${f.udyamNumber}`);
  if (f.isNonDebarred !== undefined) chips.push('Non-debarment declared');
  if (typeof f.deviationsCount === 'number') chips.push(f.deviationsCount === 0 ? 'Nil deviations' : `${f.deviationsCount} deviation(s)`);
  return chips;
}

export function BidDocumentUploader({ documents, onDocumentsChange, onProceedToVerification, isVerifying = false, tender = null }: BidDocumentUploaderProps) {
  const [selectedType, setSelectedType] = useState<BidUploadedDocument['documentType']>('audited_financials');
  const [dragActive, setDragActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, 'govt' | 'forensic' | undefined>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const guidance = getBidUploadGuidance(selectedType, tender);

  const handleFiles = async (fileList: FileList) => {
    const rawFiles = Array.from(fileList);
    if (rawFiles.length === 0) return;
    setBusy(true);

    const placeholders: BidUploadedDocument[] = rawFiles.map((file, idx) => ({
      id: `doc-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      fileName: file.name,
      documentType: selectedType,
      displayName: DOCUMENT_TYPE_OPTIONS.find((o) => o.id === selectedType)?.label || file.name,
      fileSizeBytes: file.size,
      status: 'processing' as const,
      uploadedAt: new Date().toISOString(),
    }));

    let current = [...documents, ...placeholders];
    onDocumentsChange(current);

    for (let i = 0; i < rawFiles.length; i++) {
      const placeholder = placeholders[i];
      try {
        const formData = new FormData();
        formData.append('file', rawFiles[i]);
        formData.append('userTag', selectedType);
        const res = await processBidderDocumentAction(formData);
        current = current.map((d) =>
          d.id === placeholder.id ? (res.success && res.doc ? { ...res.doc, id: placeholder.id } : { ...d, status: 'failed' as const }) : d
        );
      } catch (err) {
        console.warn(`[BidDocumentUploader] Processing error on ${rawFiles[i].name}:`, err);
        current = current.map((d) => (d.id === placeholder.id ? { ...d, status: 'failed' as const } : d));
      }
      onDocumentsChange([...current]);
    }
    setBusy(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const updateType = (id: string, newType: BidUploadedDocument['documentType']) =>
    onDocumentsChange(
      documents.map((d) => (d.id === id ? { ...d, documentType: newType, displayName: DOCUMENT_TYPE_OPTIONS.find((o) => o.id === newType)?.label || d.fileName } : d))
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="bid-doc-type" className="label">What are you uploading?</label>
        <select id="bid-doc-type" className="input" value={selectedType} onChange={(e) => setSelectedType(e.target.value as BidUploadedDocument['documentType'])}>
          {DOCUMENT_TYPE_OPTIONS.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </div>

      <label
        htmlFor="bid-doc-file"
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files) void handleFiles(e.dataTransfer.files);
        }}
        className={`flex min-h-[150px] cursor-pointer has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-mark flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed p-4 text-center text-[13px] text-fg-2 ${
          dragActive ? 'border-mark bg-[#EFF6FF]' : 'border-line-2 bg-page hover:border-mark'
        }`}
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin text-fg" aria-hidden="true" /> : <Upload className="h-5 w-5 text-fg" aria-hidden="true" />}
        <span>
          Drop files or <strong className="text-fg">browse</strong>
        </span>
        <span className="text-[11px] text-fg-3">PDF, DOCX, XLSX, PNG or JPG · tagged as the type above</span>
        <input
          id="bid-doc-file"
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.xlsx,.png,.jpg"
          className="sr-only-v2"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
          }}
        />
      </label>

      {guidance ? (
        <details className="panel p-3 text-xs">
          <summary className="cursor-pointer font-semibold text-fg">
            What to submit: {guidance.title}
            {guidance.clauseRef ? <span className="mono ml-1.5 font-normal text-fg-3">{guidance.clauseRef}</span> : null}
          </summary>
          <div className="mt-2 flex flex-col gap-1.5 text-fg-4">
            {guidance.purpose ? <span>{guidance.purpose}</span> : null}
            <span>{guidance.whatToSubmit}</span>
            {guidance.expectedEvidence?.length ? (
              <ul className="m-0 pl-4">
                {guidance.expectedEvidence.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </details>
      ) : null}

      <span className="text-xs text-fg-2">Values are read from the file itself. Anything that can&apos;t be read goes to the officer as &ldquo;review&rdquo;, never guessed.</span>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-fg-3">Sandbox sample packages:</span>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onDocumentsChange(getDemoFlawedDocuments())}>
          With issues
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onDocumentsChange(getDemoPassingDocuments())}>
          Compliant
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="th">Uploaded ({documents.length})</span>
        {documents.length === 0 ? (
          <span className="text-xs text-fg-2">No documents yet.</span>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {documents.map((doc) => {
              const govt = doc.extractedFacts?.governmentVerification as GovernmentRecordComparisonResult | undefined;
              const chips = factChips(doc);
              return (
                <li key={doc.id} className="rounded-lg border border-line bg-white p-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-fg-2" aria-hidden="true" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="mono break-all font-semibold">{doc.fileName}</span>
                      <label className="flex items-center gap-1.5 text-[11px] text-fg-3">
                        <span>Type</span>
                        <select
                          className="rounded border border-line-2 bg-white px-1.5 py-1 text-[11px] text-fg"
                          value={doc.documentType}
                          onChange={(e) => updateType(doc.id, e.target.value as BidUploadedDocument['documentType'])}
                        >
                          {DOCUMENT_TYPE_OPTIONS.map((o) => (
                            <option key={o.id} value={o.id}>{o.label}</option>
                          ))}
                        </select>
                      </label>
                      {chips.length ? (
                        <span className="flex flex-wrap gap-1">
                          {chips.map((c) => (
                            <span key={c} className="mono rounded border border-line bg-page px-1.5 py-0.5 text-[10px]">{c}</span>
                          ))}
                        </span>
                      ) : null}
                      <span className="flex flex-wrap gap-1.5">
                        {isProcessing(doc) ? (
                          <span className="pill pill-neutral"><Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> Reading</span>
                        ) : isFailed(doc) ? (
                          <span className="pill pill-fail"><AlertTriangle className="h-3 w-3" aria-hidden="true" /> Could not read</span>
                        ) : (
                          <span className="pill pill-pass"><CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Evidence ready</span>
                        )}
                        {govt ? (
                          <button
                            type="button"
                            className={`pill ${govt.status === 'MATCH' ? 'pill-pass' : govt.status === 'MISMATCH' ? 'pill-review' : 'pill-fail'}`}
                            aria-expanded={expanded[doc.id] === 'govt'}
                            onClick={() => setExpanded((p) => ({ ...p, [doc.id]: p[doc.id] === 'govt' ? undefined : 'govt' }))}
                          >
                            Registry (sandbox): {govt.status}
                          </button>
                        ) : null}
                        {doc.forensicReport ? (
                          <button
                            type="button"
                            className={`pill ${doc.forensicReport.overallStatus === 'PASS' ? 'pill-neutral' : doc.forensicReport.overallStatus === 'SUSPICIOUS' ? 'pill-review' : 'pill-fail'}`}
                            aria-expanded={expanded[doc.id] === 'forensic'}
                            onClick={() => setExpanded((p) => ({ ...p, [doc.id]: p[doc.id] === 'forensic' ? undefined : 'forensic' }))}
                          >
                            Forensics: {doc.forensicReport.overallStatus}
                          </button>
                        ) : null}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDocumentsChange(documents.filter((d) => d.id !== doc.id))}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-fg-2 hover:bg-page hover:text-fail"
                      aria-label={`Remove ${doc.fileName}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  {govt && expanded[doc.id] === 'govt' ? (
                    <div className="mt-2 border-t border-line-3 pt-2">
                      <GovernmentVerificationCard verification={govt} />
                    </div>
                  ) : null}
                  {doc.forensicReport && expanded[doc.id] === 'forensic' ? (
                    <div className="mt-2 border-t border-line-3 pt-2">
                      <ForensicReportCard report={doc.forensicReport} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {onProceedToVerification ? (
        <button type="button" className="btn btn-primary" disabled={documents.length === 0 || isVerifying || busy} onClick={onProceedToVerification}>
          Run the check
        </button>
      ) : null}
    </div>
  );
}
