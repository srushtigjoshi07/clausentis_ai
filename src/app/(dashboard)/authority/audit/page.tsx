'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Download, 
  Clock, 
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExportAuditPdfButton } from '@/components/audit/ExportAuditPdfButton';

interface AuditEvent {
  id: string;
  timestamp: string;
  category: 'TENDER_LIFECYCLE' | 'AI_VERIFICATION' | 'BID_SUBMISSION' | 'COMMITTEE_ACTION' | 'SECURITY';
  action: string;
  tenderRef: string;
  actor: string;
  actorRole: string;
  sha256Hash: string;
  status: 'SUCCESS' | 'FLAGGED' | 'COMPLETED';
  details: string;
}

const auditEvents: AuditEvent[] = [
  {
    id: 'AUD-90214',
    timestamp: '2026-09-08 17:42:10 IST',
    category: 'COMMITTEE_ACTION',
    action: 'Clarification Notice Generated',
    tenderRef: 'CPCL/ENG/2026/089',
    actor: 'Dr. R. Venkataraman',
    actorRole: 'Senior Procurement Officer',
    sha256Hash: '9a84b3d14e019f8481bc92e00810488219438290fbbd0291ec0981928490a012',
    status: 'FLAGGED',
    details: '48-Hour statutory clarification issued to Vertex Marine Infrastructure regarding expired ISO 45001 accreditation.'
  },
  {
    id: 'AUD-90213',
    timestamp: '2026-09-08 16:15:32 IST',
    category: 'AI_VERIFICATION',
    action: 'Cross-Document Intelligence Verification Completed',
    tenderRef: 'CPCL/ENG/2026/089',
    actor: 'Clausentis Engine v4.2',
    actorRole: 'Automated Verifier',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    status: 'SUCCESS',
    details: 'Verified 6 bid dossiers for Apex Heavy Engineering. Compliance score: 94.2%. 0 critical discrepancies.'
  },
  {
    id: 'AUD-90212',
    timestamp: '2026-09-08 15:40:04 IST',
    category: 'BID_SUBMISSION',
    action: 'Cryptographic Bid Vault Sealing (CL-2026-91C25F34)',
    tenderRef: 'CPCL/ENG/2026/089',
    actor: 'Apex Heavy Engineering',
    actorRole: 'Bidder / Vendor',
    sha256Hash: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    status: 'COMPLETED',
    details: 'Submitted Technical and Commercial covers. SHA-256 seal issued. EMD BG confirmed via SFMS code MT760COV.'
  },
  {
    id: 'AUD-90211',
    timestamp: '2026-09-04 11:30:00 IST',
    category: 'TENDER_LIFECYCLE',
    action: 'Corrigendum No. 1 Gazetted & Broadcast',
    tenderRef: 'CPCL/ENG/2026/089',
    actor: 'CPCL Tenders Directorate',
    actorRole: 'Tender Authority',
    sha256Hash: '8219488a104bcde9103857a1b0293481029481a029384bcda9019284091a1002',
    status: 'SUCCESS',
    details: 'Clause 7.1 amended: Mandatory SFMS verification for bank guarantees. Bid deadline extended to 18-Sep-2026.'
  },
  {
    id: 'AUD-90210',
    timestamp: '2026-09-01 09:15:22 IST',
    category: 'TENDER_LIFECYCLE',
    action: 'Tender Published & Encrypted (CPCL/ENG/2026/089)',
    tenderRef: 'CPCL/ENG/2026/089',
    actor: 'CPCL Tenders Directorate',
    actorRole: 'Tender Authority',
    sha256Hash: '38291048bc0192a038475819038291048bca0192837401928374019283740192',
    status: 'SUCCESS',
    details: 'Initial RFP published with 48 statutory eligibility clauses. Estimated value ₹145.00 Cr.'
  },
  {
    id: 'AUD-90209',
    timestamp: '2026-08-30 14:00:18 IST',
    category: 'SECURITY',
    action: 'CVC Audit Log Integrity Check',
    tenderRef: 'SYSTEM_WIDE',
    actor: 'Security Daemon',
    actorRole: 'System Monitor',
    sha256Hash: '7c918290ab102938471029384710293847102938471029384710293847102938',
    status: 'SUCCESS',
    details: 'Zero tamper anomalies detected in append-only cryptographic ledger.'
  }
];

export default function AuthorityAuditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredEvents = auditEvents.filter(event => {
    const matchesSearch = 
      event.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.tenderRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.sha256Hash.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || event.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans bg-white">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#111111] font-semibold mb-1">
            <ShieldCheck className="w-4 h-4 text-[#111111]" />
            Statutory Defensibility & CVC Audit Trail
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#111111]">
            Immutable Audit Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#555555] mt-1 max-w-2xl">
            Every tender action, AI compliance extraction, bidder submission, and committee intervention is signed with a SHA-256 cryptographic seal compliant with Central Vigilance Commission (CVC) digital audit guidelines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportAuditPdfButton
            tenderTitle="Central Vigilance Commission (CVC) Digital Audit Ledger"
            tenderRef="CPCL/ENG/2026/089"
            label="Export Audit PDF"
            className="gap-2 text-xs h-9 cursor-pointer border-[#E5E5E5] bg-white text-[#111111] hover:bg-[#F7F7F7] rounded-md"
          />
          <Button 
            variant="outline"
            className="gap-2 text-xs h-9 cursor-pointer border-[#E5E5E5] bg-white text-[#111111] hover:bg-[#F7F7F7] rounded-md"
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditEvents, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `clausentis_cvc_audit_ledger_${Date.now()}.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
          >
            <Download className="w-3.5 h-3.5" />
            Export Signed Ledger (.JSON)
          </Button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-white border border-[#E5E5E5]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777]">Total Ledger Records</span>
          <p className="text-xl font-bold font-mono text-[#111111] mt-0.5">1,492</p>
        </div>
        <div className="p-3.5 rounded-lg bg-white border border-[#E5E5E5]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777]">Tamper Integrity</span>
          <p className="text-xl font-bold font-mono text-[#111111] mt-0.5">100.0% Verified</p>
        </div>
        <div className="p-3.5 rounded-lg bg-white border border-[#E5E5E5]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777]">Cryptographic Algorithm</span>
          <p className="text-xl font-bold font-mono text-[#111111] mt-0.5">SHA-256 + HMAC</p>
        </div>
        <div className="p-3.5 rounded-lg bg-white border border-[#E5E5E5]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#777777]">Flagged Events</span>
          <p className="text-xl font-bold font-mono text-[#111111] mt-0.5">3 Active</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
          <input
            type="text"
            placeholder="Search by action, tender, actor, or hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#E5E5E5] rounded-md pl-9 pr-3 py-1.5 text-xs text-[#111111] placeholder:text-[#777777] focus:outline-none focus:border-[#111111] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'TENDER_LIFECYCLE', 'AI_VERIFICATION', 'BID_SUBMISSION', 'COMMITTEE_ACTION'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#111111] text-white font-semibold'
                  : 'text-[#555555] hover:bg-white hover:text-[#111111] border border-transparent'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-lg border border-[#E5E5E5] bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed border-collapse text-xs min-w-[1000px]">
            <colgroup>
              <col className="w-[16%]" />
              <col className="w-[14%]" />
              <col className="w-[30%]" />
              <col className="w-[14%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
            </colgroup>
            <thead className="bg-[#F7F7F7] border-b border-[#E5E5E5] text-[10px] font-mono uppercase tracking-wider text-[#777777]">
              <tr>
                <th className="py-3 px-3.5 font-semibold">Event ID &amp; Time</th>
                <th className="py-3 px-3.5 font-semibold">Category</th>
                <th className="py-3 px-3.5 font-semibold">Action &amp; Details</th>
                <th className="py-3 px-3.5 font-semibold">Tender Ref</th>
                <th className="py-3 px-3.5 font-semibold">Authorized Actor</th>
                <th className="py-3 px-3.5 font-semibold">SHA-256 Ledger Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                    <div className="font-mono font-bold text-[#111111]">{evt.id}</div>
                    <div className="text-[10px] text-[#777777] flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-[#777777] shrink-0" />
                      <span>{evt.timestamp}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-[#F7F7F7] text-[#111111] border border-[#E5E5E5] inline-block">
                      {evt.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                    <p className="font-semibold text-[#111111] text-xs leading-snug">{evt.action}</p>
                    <p className="text-[11px] text-[#555555] mt-1 leading-relaxed">{evt.details}</p>
                  </td>
                  <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                    <span className="font-mono text-[#111111] font-medium">{evt.tenderRef}</span>
                  </td>
                  <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                    <p className="font-medium text-[#111111] leading-snug">{evt.actor}</p>
                    <p className="text-[10px] text-[#777777] mt-0.5 font-mono">{evt.actorRole}</p>
                  </td>
                  <td className="py-3.5 px-3.5 align-top break-words overflow-wrap-anywhere">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#555555] bg-[#F7F7F7] px-2 py-1 rounded border border-[#E5E5E5]">
                      <Lock className="w-3 h-3 shrink-0 text-[#111111]" />
                      <span className="truncate" title={evt.sha256Hash}>{evt.sha256Hash.slice(0, 16)}...</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
