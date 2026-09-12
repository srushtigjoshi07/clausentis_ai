import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - Clausentis',
  description: 'Privacy Policy and Data Protection Standards of Clausentis',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-[#111111] font-sans antialiased">
      <header className="border-b border-[#E5E5E5] px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] font-semibold text-[#111111]">
          <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
          <span>CLAUSENTIS</span>
        </Link>
        <span className="text-[11px] font-mono text-[#777777] uppercase">Privacy Policy</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <div className="space-y-2 border-b border-[#E5E5E5] pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#E5E5E5] text-[11px] font-mono text-[#555555]">
            <Lock className="w-3.5 h-3.5 text-[#111111]" />
            <span>Enterprise Data Security & Confidentiality</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#111111]">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#555555]">
            Effective Date: September 2026 &bull; Clausentis Procurement Intelligence Platform
          </p>
        </div>

        <section className="space-y-4 text-sm leading-relaxed text-[#333333]">
          <h2 className="text-lg font-semibold text-[#111111]">1. Scope & Confidentiality</h2>
          <p>
            Clausentis processes procurement documents, financial balance sheets, statutory certificates, and evaluation outcomes. We enforce strict enterprise-grade isolation between competing bidders. No bidder data or confidential pricing strategy is ever shared with other vendors.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-[#333333]">
          <h2 className="text-lg font-semibold text-[#111111]">2. Data Storage & Cryptographic Verification</h2>
          <p>
            Submitted bid packages and tender requirements are verified and sealed using SHA-256 cryptographic digests. Document contents stored in our encrypted document vault are accessible only to the authenticated organization and authorized procurement evaluation committees.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-[#333333]">
          <h2 className="text-lg font-semibold text-[#111111]">3. Statutory Audit Requirements</h2>
          <p>
            In accordance with public procurement guidelines and government vigilance norms, audit trail entries (including timestamps, evaluator IDs, and digital verdict seals) are preserved immutably for compliance reporting and dispute resolution.
          </p>
        </section>

        <div className="pt-6 border-t border-[#E5E5E5] flex items-center justify-between text-xs text-[#777777]">
          <span>Clausentis Inc. &copy; {new Date().getFullYear()}</span>
          <Link href="/terms" className="text-[#111111] underline underline-offset-4 hover:text-[#555555]">
            Terms of Service
          </Link>
        </div>
      </main>
    </div>
  );
}
