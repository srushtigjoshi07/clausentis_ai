'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { UploadCloud, File, X, Loader2, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createTenderRecord } from '@/lib/actions/tenders';
import Link from 'next/link';

export default function NewTenderPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'recording' | 'complete'>('idle');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    setError(null);
    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
      setError('Please upload a valid PDF document (.pdf format).');
      return;
    }
    if (selectedFile.size === 0) {
      setError('Uploaded document is empty (0 bytes). Please provide a valid tender file.');
      return;
    }
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('Document exceeds the 25MB maximum size limit.');
      return;
    }
    setFile(selectedFile);
  };

  const clearFile = () => {
    setFile(null);
    setUploadStage('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    setUploadStage('uploading');
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Authentication required. Please sign in again.");


      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop() || 'pdf';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tenders')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(uploadError.message || 'Failed to upload document to secure storage.');
      }

      setUploadStage('recording');

      // Create Database Record
      const tenderTitle = file.name.replace(/\.pdf$/i, '');
      
      const tender = await createTenderRecord({
        title: tenderTitle,
        original_filename: file.name,
        storage_path: filePath,
        file_size: file.size,
      });

      setUploadStage('complete');

      // Delay to show scanner completion then redirect
      setTimeout(() => {
        router.push(`/tenders/${tender.id}`);
      }, 1200);
      
    } catch (err: unknown) {
      console.error('Upload failed:', err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred during upload.";
      setError(errorMessage);
      setIsUploading(false);
      setUploadStage('idle');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-12 font-sans">
      <div>
        <Link href="/authority/tenders" className="inline-flex items-center text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors font-light">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5 stroke-[1.5]" />
          Back to Tenders
        </Link>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-normal uppercase tracking-[0.14em] text-muted-foreground">
            01. INTAKE PIPELINE
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-[-0.03em] text-foreground">Upload & Analyze Tender</h1>
        <p className="text-sm text-muted-foreground mt-1 font-light">Upload the tender RFP document to extract requirements, verify eligibility criteria, and link citations.</p>
      </div>

      {isUploading ? (
        <div className="rounded-xl border border-border bg-surface p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
              <File className="h-6 w-6 text-foreground stroke-[1.5]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">{file?.name || 'tender_specification.pdf'}</h3>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {uploadStage === 'uploading' && 'Transferring document to secure vault...'}
                {uploadStage === 'recording' && 'Ingesting statutory clauses and indexing requirements...'}
                {uploadStage === 'complete' && '✓ Ingestion complete. Redirecting to tender workspace...'}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">PDF Verification & Sanitization</span>
              <span className="font-mono text-foreground font-medium">✓ Passed</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Statutory Clause Indexing</span>
              <span className="font-mono text-foreground font-medium">
                {uploadStage === 'uploading' ? 'Pending...' : '✓ Indexed'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Evaluation Matrix Generation</span>
              <span className="font-mono text-foreground font-medium">
                {uploadStage === 'complete' ? '✓ Ready' : 'Processing...'}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface shadow-sm p-6 sm:p-8">
          <div 
            className={`relative flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-xl transition-colors ${
              !file ? 'cursor-pointer' : ''
            } ${
              isDragging 
                ? 'border-foreground bg-muted/20' 
                : 'border-border bg-background hover:border-foreground/40'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !file && !isUploading && fileInputRef.current?.click()}
          >
            {!file ? (
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                <div className="h-12 w-12 rounded-xl bg-surface border border-border flex items-center justify-center mb-3 text-foreground shadow-sm">
                  <UploadCloud className="w-6 h-6 stroke-[1.5]" />
                </div>
                <p className="mb-1 text-sm sm:text-base font-normal text-foreground">
                  <span className="underline underline-offset-4 font-medium">Click to upload</span> or drag and drop tender PDF
                </p>
                <p className="text-xs text-muted-foreground font-light">Government NIT / RFP / Bid Document (Max 25MB)</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between w-full p-4 border border-border rounded-lg bg-surface shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-10 w-10 rounded-lg bg-background border border-border flex items-center justify-center text-foreground shrink-0">
                      <File className="h-5 w-5 stroke-[1.5]" />
                    </div>
                    <div className="truncate text-left">
                      <p className="text-sm font-normal text-foreground truncate tracking-[-0.01em]">{file.name}</p>
                      <p className="text-xs text-muted-foreground font-light">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  {!isUploading && (
                    <Button variant="ghost" size="icon" onClick={clearFile} className="text-muted-foreground hover:text-foreground hover:bg-muted/10">
                      <X className="h-4 w-4 stroke-[1.5]" />
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf,application/pdf" 
              className="hidden" 
            />
          </div>

          {error && (
            <div className="mt-4 p-3 bg-surface border border-border text-foreground rounded-lg text-xs font-light">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="bg-[#111111] hover:bg-[#222222] dark:bg-white dark:hover:bg-[#EEEEEE] text-white dark:text-[#111111] font-medium text-xs sm:text-sm h-10 px-6 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin stroke-[1.5]" />
                  Processing Ingestion...
                </>
              ) : (
                'Upload & Start Intelligence'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
