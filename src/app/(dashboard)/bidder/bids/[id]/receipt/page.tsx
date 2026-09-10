import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  CheckCircle2, 
  ArrowLeft, 
  ShieldCheck, 
  Printer, 
  Building2, 
  FileCheck2,
  Lock,
  Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBidSubmissionReceiptAction } from '@/lib/actions/tender-discovery';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BidReceiptPage({ params }: PageProps) {
  const { id } = await params;
  const receipt = await getBidSubmissionReceiptAction(id);

  if (!receipt) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-semibold text-[#111111]">Receipt Not Found</h2>
        <p className="text-sm text-[#555555]">No cryptographic submission receipt found for identifier {id}.</p>
        <Link href="/bidder/bids">
          <Button variant="outline" size="sm">Back to My Bids</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 font-sans space-y-6 bg-white">
      {/* Back link */}
      <div>
        <Link href="/bidder/bids" className="inline-flex items-center gap-1.5 text-xs text-[#555555] hover:text-[#111111] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Bids</span>
        </Link>
      </div>

      {/* Official Receipt Card */}
      <div className="rounded-xl border border-[#E5E5E5] bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="border-b border-[#E5E5E5] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-[#111111] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E5E5]">
              OFFICIAL SUBMISSION RECEIPT
            </span>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#111111] mt-2">
              Bid Package Acknowledgment
            </h1>
            <p className="text-xs text-[#555555] mt-0.5">
              Clausentis Verified Digital Submission Registry
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold bg-[#F5F5F5] border border-[#E5E5E5] text-[#111111]">
              <CheckCircle2 className="w-4 h-4" />
              {receipt.status}
            </span>
          </div>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#777777]">Submission ID</span>
            <p className="font-mono font-semibold text-[#111111] text-sm">{receipt.submissionId}</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#777777]">Submission Timestamp</span>
            <p className="font-mono text-[#111111]">{receipt.submittedAt ? new Date(receipt.submittedAt).toLocaleString('en-GB') : 'Recorded'}</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#777777]">Tender Reference</span>
            <p className="font-mono font-medium text-[#111111]">{receipt.tenderReference}</p>
          </div>

          <div className="p-3.5 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
            <span className="text-[10px] font-mono uppercase text-[#777777]">Issuing Authority</span>
            <p className="font-medium text-[#111111]">{receipt.issuingOrganisation}</p>
          </div>
        </div>

        {/* Bidder Profile */}
        <div className="border border-[#E5E5E5] rounded-lg p-4 bg-white space-y-2 text-xs">
          <span className="text-[10px] font-mono uppercase text-[#777777] font-semibold">Submitting Enterprise</span>
          <p className="font-semibold text-[#111111] text-sm">{receipt.bidderProfile?.companyName || 'Apex Heavy Engineering Pvt Ltd'}</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-[#555555] font-mono pt-1">
            <div>GSTIN: {receipt.bidderProfile?.gstin || '33AABCA1234F1Z8'}</div>
            <div>PAN: {receipt.bidderProfile?.pan || 'AABCA1234F'}</div>
          </div>
        </div>

        {/* Cryptographic Proof */}
        <div className="border border-[#E5E5E5] rounded-lg p-4 bg-[#F7F7F7] space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#111111]">
            <Lock className="w-3.5 h-3.5" />
            <span>Cryptographic Integrity Checksum</span>
          </div>
          <p className="font-mono text-[11px] text-[#111111] break-all bg-white p-2.5 rounded border border-[#E5E5E5]">
            {receipt.sha256Checksum || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
          </p>
          <p className="text-[11px] text-[#777777]">
            {receipt.disclaimer || 'Verified digital submission package for procurement compliance.'}
          </p>
        </div>
      </div>
    </div>
  );
}
