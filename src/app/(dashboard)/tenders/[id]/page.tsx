import { getTenderById, getTenderComplianceData } from '@/lib/actions/tenders';
import { getCrossDocumentSummary, getCrossDocumentFindings } from '@/lib/actions/cross-document';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Calendar, HardDrive, BrainCircuit, AlertTriangle } from 'lucide-react';
import { AnalyzeButton } from '@/components/tenders/analyze-button';
import { AnalysisWorkspace } from '@/components/tenders/analysis-workspace';

export default async function TenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tender = await getTenderById(id);
  
  if (!tender) {
    notFound();
  }

  const uploadDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(tender.created_at));

  const size = tender.file_size || tender.file_size_bytes;
  const sizeMB = size ? (size / 1024 / 1024).toFixed(2) : '0.00';

  // If already analyzed, fetch requirements, compliance results, and cross-doc intelligence, then render the Analysis Workspace
  if (tender.status === 'analyzed') {
    const [complianceData, crossDocSummary, crossDocFindings] = await Promise.all([
      getTenderComplianceData(tender.id),
      getCrossDocumentSummary(tender.id),
      getCrossDocumentFindings(tender.id),
    ]);
    const { requirements, complianceResults } = complianceData;

    return (
      <div className="flex flex-col gap-4 max-w-7xl mx-auto h-full pb-12 font-sans">
        <div>
          <Link href="/authority/tenders" className="inline-flex items-center text-xs sm:text-sm text-[#555555] hover:text-[#111111] mb-2 transition-colors">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5 stroke-[1.5]" />
            Back to Tenders
          </Link>
        </div>
        <AnalysisWorkspace
          tender={tender}
          requirements={requirements}
          complianceResults={complianceResults}
          crossDocSummary={crossDocSummary}
          crossDocFindings={crossDocFindings}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-12 font-sans">
      <div>
        <Link href="/authority/tenders" className="inline-flex items-center text-xs sm:text-sm text-[#555555] hover:text-[#111111] mb-4 transition-colors">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5 stroke-[1.5]" />
          Back to Tenders
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-b border-[#E5E5E5] pb-6 pt-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777777]">
                01. TENDER INTAKE
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight text-[#111111]">{tender.title}</h1>
          </div>
          <span className="inline-flex items-center rounded border border-[#E5E5E5] bg-[#F7F7F7] px-3 py-1 text-xs font-mono font-medium uppercase tracking-wider text-[#111111]">
            {tender.status === 'failed' ? 'FAILED' : 'INTAKE READY'}
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border border-[#E5E5E5] bg-white shadow-sm p-8 sm:p-12 flex flex-col items-center justify-center text-center min-h-[380px]">
            {tender.status === 'failed' ? (
              <>
                <div className="h-14 w-14 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-center text-[#111111] mb-4">
                  <AlertTriangle className="h-7 w-7 stroke-[1.5]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-[#111111] mb-2 tracking-tight">Analysis Failed</h3>
                <p className="text-sm text-[#555555] max-w-md mb-6 leading-relaxed">
                  {tender.description || 'Failed to extract requirements. If this tender is a scanned image, OCR will be needed.'}
                </p>
                <AnalyzeButton tenderId={tender.id} status={tender.status} isReanalyze={true} />
              </>
            ) : (
              <>
                <div className="h-14 w-14 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-center text-[#111111] mb-4 shadow-sm">
                  <BrainCircuit className="h-7 w-7 stroke-[1.5]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-[#111111] mb-2 tracking-tight">Ready for Procurement Intelligence</h3>
                <p className="text-sm text-[#555555] max-w-md mb-6 leading-relaxed">
                  Clausentis will parse your document, identify statutory, financial, technical, and experience criteria, and establish verifiable citations for officer review.
                </p>
                <AnalyzeButton tenderId={tender.id} status={tender.status} />
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-[#E5E5E5] bg-white shadow-sm p-6">
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#777777] mb-4 border-b border-[#E5E5E5] pb-2">
              Document Metadata
            </h3>
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-[#777777] flex items-center gap-1.5 font-medium">
                  <FileText className="h-3.5 w-3.5 text-[#111111] stroke-[1.5]" /> Original Filename
                </span>
                <span className="font-medium text-[#111111] truncate" title={tender.original_filename}>
                  {tender.original_filename || 'Unknown'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[#777777] flex items-center gap-1.5 font-medium">
                  <Calendar className="h-3.5 w-3.5 text-[#111111] stroke-[1.5]" /> Uploaded On
                </span>
                <span className="font-medium text-[#111111]">{uploadDate}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[#777777] flex items-center gap-1.5 font-medium">
                  <HardDrive className="h-3.5 w-3.5 text-[#111111] stroke-[1.5]" /> File Size
                </span>
                <span className="font-medium text-[#111111] font-mono">{sizeMB} MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}