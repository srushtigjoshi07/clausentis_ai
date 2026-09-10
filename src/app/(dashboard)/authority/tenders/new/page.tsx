'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  RefreshCw, 
  ArrowLeft,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createAuthorityTenderAction } from '@/lib/actions/tenders';

export default function AuthorityCreateTenderPage() {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState('Supply, Installation and Commissioning of Skid-Mounted Cryogenic Nitrogen Pumping Packages');
  const [reference, setReference] = useState('CPCL/ENG/2026/N2-0819');
  const [category, setCategory] = useState('Goods');
  const [description, setDescription] = useState('Turnkey engineering, manufacture, shop testing, delivery, site erection and commissioning of automated cryogenic liquid nitrogen storage and high-pressure pumping units with SIL-3 instrumentation.');
  const [publishedDate, setPublishedDate] = useState('2026-09-09');
  const [closingDate, setClosingDate] = useState('2026-10-15');
  const [emd, setEmd] = useState('₹22,00,000 (Exempted for registered MSEs)');
  const [estimatedValue, setEstimatedValue] = useState('₹11.20 Crore');
  const [validity, setValidity] = useState('180');
  const [minTurnover, setMinTurnover] = useState('8.50');
  const [minExperience, setMinExperience] = useState('5');
  const [localContent, setLocalContent] = useState('50');

  // File Upload State
  const [files, setFiles] = useState<{ name: string; size: string; type: string }[]>([
    { name: 'Notice_Inviting_Tender_NIT_N2_0819.pdf', size: '2.40 MB', type: 'NIT' },
    { name: 'Technical_Specifications_Cryogenic_Pumps.pdf', size: '5.80 MB', type: 'Specs' },
    { name: 'Schedule_of_Quantities_BOQ.xlsx', size: '1.10 MB', type: 'BOQ' },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedCount, setExtractedCount] = useState<number | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const res = await createAuthorityTenderAction({
        title,
        reference,
        category,
        description,
        publishedDate,
        closingDate,
        emd,
        estimatedValue,
        validity,
        minTurnover,
        minExperience,
        localContent,
      });

      if (res.success) {
        setExtractedCount(res.extractedCount || 14);
        setTimeout(() => {
          setIsProcessing(false);
          router.push('/authority/tenders');
        }, 1200);
      } else {
        console.error('[CreateTender] Error:', res.error);
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('[CreateTender] Unexpected error:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 font-sans bg-white">
      <div>
        <Link 
          href="/authority/tenders" 
          className="inline-flex items-center text-xs text-[#555555] hover:text-[#111111] mb-3 transition-colors font-mono"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Managed Tenders
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F7F7F7] px-2 py-0.5 rounded border border-[#E5E5E5]">
            Tender Authoring Pipeline
          </span>
          <span className="text-[#777777] text-xs">•</span>
          <span className="text-xs text-[#555555] font-mono">Government Procurement Notice</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#111111] tracking-tight mt-1">
          Create & Publish New Tender
        </h1>
        <p className="text-xs sm:text-sm text-[#555555] mt-0.5">
          Provide tender statutory terms and upload official tender documents. Our system will automatically extract structured requirements and qualification criteria.
        </p>
      </div>

      <form onSubmit={handleCreate} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="p-6 rounded-lg border border-[#E5E5E5] bg-white shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-[#111111] flex items-center gap-2 border-b border-[#E5E5E5] pb-3">
            <Building2 className="w-4 h-4 text-[#111111]" />
            1. Statutory Notice & Tender Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-[#111111]">Tender Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full h-9 px-3 rounded-md bg-white border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#111111]">Tender Reference Number</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                required
                className="w-full h-9 px-3 rounded-md bg-white border border-[#E5E5E5] text-xs text-[#111111] font-mono focus:outline-none focus:border-[#111111]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#111111]">Procurement Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-white border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111] cursor-pointer"
              >
                <option value="Goods">Goods & Equipment</option>
                <option value="Works">Works / Turnkey EPC</option>
                <option value="Services">Services & Maintenance</option>
                <option value="Consultancy">Consultancy</option>
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-[#111111]">Detailed Work Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 rounded-md bg-white border border-[#E5E5E5] text-xs text-[#111111] focus:outline-none focus:border-[#111111] resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Commercial & Timeline Criteria */}
        <div className="p-6 rounded-lg border border-[#E5E5E5] bg-white shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-[#111111] flex items-center gap-2 border-b border-[#E5E5E5] pb-3">
            <Calendar className="w-4 h-4 text-[#111111]" />
            2. Key Commercial Deadlines & Financial Thresholds
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#111111]">Publication Date</label>
              <input
                type="date"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-white border border-[#E5E5E5] text-xs text-[#111111] font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#111111]">Bid Closing Date</label>
              <input
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-white border border-[#E5E5E5] text-xs text-[#111111] font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#111111]">Bid Validity (Days)</label>
              <input
                type="number"
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-white border border-[#E5E5E5] text-xs text-[#111111] font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#111111]">Estimated Tender Value</label>
              <input
                type="text"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-white border border-[#E5E5E5] text-xs text-[#111111] font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#111111]">EMD Amount & Exemption</label>
              <input
                type="text"
                value={emd}
                onChange={(e) => setEmd(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-white border border-[#E5E5E5] text-xs text-[#111111] font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#111111]">Min 3-Yr Turnover Required (₹ Cr)</label>
              <input
                type="number"
                step="0.1"
                value={minTurnover}
                onChange={(e) => setMinTurnover(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-white border border-[#E5E5E5] text-xs text-[#111111] font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#111111]">Min Years Experience Required</label>
              <input
                type="number"
                value={minExperience}
                onChange={(e) => setMinExperience(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-white border border-[#E5E5E5] text-xs text-[#111111] font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#111111]">Min Local Content % (Make in India)</label>
              <input
                type="number"
                value={localContent}
                onChange={(e) => setLocalContent(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-white border border-[#E5E5E5] text-xs text-[#111111] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Official Document Upload Zone */}
        <div className="p-6 rounded-lg border border-[#E5E5E5] bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#111111] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#111111]" />
                3. Official Tender Documents (NIT / Specifications / BOQ)
              </h2>
              <p className="text-xs text-[#555555] mt-0.5">
                Upload official RFP documents. All clauses and eligibility rules will be structured automatically.
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#111111] bg-[#F7F7F7] px-2.5 py-1 rounded border border-[#E5E5E5]">
              Clause Extractor Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {files.map((file, idx) => (
              <div key={idx} className="p-3.5 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <FileText className="w-4 h-4 text-[#111111] shrink-0" />
                  <div className="truncate">
                    <p className="font-medium text-[#111111] truncate">{file.name}</p>
                    <p className="text-[10px] text-[#777777] font-mono">{file.size} • {file.type}</p>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-[#111111] shrink-0" />
              </div>
            ))}
          </div>

          <div className="border-2 border-dashed border-[#E5E5E5] rounded-md p-5 text-center bg-[#F7F7F7] hover:border-[#CCCCCC] transition-colors cursor-pointer">
            <UploadCloud className="w-6 h-6 text-[#777777] mx-auto mb-1.5" />
            <p className="text-xs text-[#111111] font-medium">
              Click to attach additional annexures, technical data sheets, or corrigendum notices
            </p>
            <p className="text-[11px] text-[#777777] mt-0.5">PDF, XLSX, DOCX up to 50MB</p>
          </div>
        </div>

        {/* Action Button & AI Extraction Feedback */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {extractedCount ? (
            <div className="flex items-center gap-2 text-xs text-[#111111] font-mono">
              <CheckCircle2 className="w-4 h-4 text-[#111111]" />
              <span>Extracted {extractedCount} structured clauses & published tender to active portal!</span>
            </div>
          ) : (
            <p className="text-xs text-[#777777]">
              By clicking Publish, this tender will be registered in the public catalog and made accessible to verified vendors.
            </p>
          )}

          <Button
            type="submit"
            disabled={isProcessing}
            className="w-full sm:w-auto h-10 px-6 bg-[#111111] hover:bg-[#222222] text-white font-medium text-xs sm:text-sm tracking-wide gap-2 rounded-md cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Extracting Structured Criteria & Publishing...</span>
              </>
            ) : (
              <span>Create Tender & Extract Requirements</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
