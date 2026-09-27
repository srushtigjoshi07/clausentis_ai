import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - Clausentis',
  description: 'Privacy Policy and Data Protection Standards of Clausentis',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white text-fg font-sans antialiased">
      <header className="border-b border-line px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] font-semibold text-fg">
          <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
          <span>CLAUSENTIS</span>
        </Link>
        <span className="text-[11px] font-mono text-fg-3 uppercase">Privacy Policy</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <div className="space-y-2 border-b border-line pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAFAFA] border border-line text-[11px] font-mono text-fg-2">
            <Lock className="w-3.5 h-3.5 text-fg" />
            <span>Enterprise Data Security & Confidentiality</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-fg">
            Privacy Policy
          </h1>
          <p className="text-sm text-fg-2">
            Effective Date: September 2026 &bull; Clausentis Procurement Intelligence Platform
          </p>
        </div>

        <section className="space-y-4 text-sm leading-relaxed text-fg-4">
          <h2 className="text-lg font-semibold text-fg">1. Scope & Confidentiality</h2>
          <p>
            Clausentis processes procurement documents, financial balance sheets, statutory certificates, and evaluation outcomes. We enforce strict enterprise-grade isolation between competing bidders. No bidder data or confidential pricing strategy is ever shared with other vendors.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-fg-4">
          <h2 className="text-lg font-semibold text-fg">2. Data Storage & Cryptographic Verification</h2>
          <p>
            Submitted bid packages and tender requirements are verified and sealed using SHA-256 cryptographic digests. Document contents stored in our encrypted document vault are accessible only to the authenticated organization and authorized procurement evaluation committees.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-fg-4">
          <h2 className="text-lg font-semibold text-fg">3. Statutory Audit Requirements</h2>
          <p>
            In accordance with public procurement guidelines and government vigilance norms, audit trail entries (including timestamps, evaluator IDs, and digital verdict seals) are preserved immutably for compliance reporting and dispute resolution.
          </p>
        </section>

        <div className="pt-6 border-t border-line flex items-center justify-between text-xs text-fg-3">
          <span>Clausentis Inc. &copy; {new Date().getFullYear()}</span>
          <Link href="/terms" className="text-fg underline underline-offset-4 hover:text-fg-2">
            Terms of Service
          </Link>
        </div>
      </main>
    </div>
  );
}
