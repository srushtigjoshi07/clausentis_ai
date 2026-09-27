import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service - Clausentis',
  description: 'Terms and Conditions of the Clausentis Procurement Intelligence Platform',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-fg font-sans antialiased">
      <header className="border-b border-line px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] font-semibold text-fg">
          <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
          <span>CLAUSENTIS</span>
        </Link>
        <span className="text-[11px] font-mono text-fg-3 uppercase">Terms of Service</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
        <div className="space-y-2 border-b border-line pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAFAFA] border border-line text-[11px] font-mono text-fg-2">
            <Shield className="w-3.5 h-3.5 text-fg" />
            <span>Statutory Compliance & Legal Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-fg">
            Terms of Service
          </h1>
          <p className="text-sm text-fg-2">
            Effective Date: September 2026 &bull; Clausentis Procurement Intelligence Platform
          </p>
        </div>

        <section className="space-y-4 text-sm leading-relaxed text-fg-4">
          <h2 className="text-lg font-semibold text-fg">1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Clausentis application, you agree to comply with and be bound by these Terms of Service. If you are using Clausentis on behalf of an enterprise bidder or a government procurement authority, you represent that you possess lawful authorization to bind that organization.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-fg-4">
          <h2 className="text-lg font-semibold text-fg">2. Role-Based Integrity and Audit Logging</h2>
          <p>
            Clausentis maintains immutable SHA-256 cryptographic audit logs for all procurement evaluations, bid submissions, and committee verdicts. Users agree that all actions performed under authenticated sessions constitute binding representations for statutory tender qualification purposes.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-fg-4">
          <h2 className="text-lg font-semibold text-fg">3. Data Verification & Evidence Submission</h2>
          <p>
            Bidders are responsible for the authenticity and accuracy of all statutory credentials, audited balance sheets, and certificates submitted to the platform. Falsification of statutory documents may result in immediate disqualification and debarment under relevant public procurement rules.
          </p>
        </section>

        <section className="space-y-4 text-sm leading-relaxed text-fg-4">
          <h2 className="text-lg font-semibold text-fg">4. Limitation of Liability</h2>
          <p>
            Clausentis provides deterministic AI evaluation support to procurement committees. Final procurement decisions remain the sole statutory prerogative of authorized procurement officers.
          </p>
        </section>

        <div className="pt-6 border-t border-line flex items-center justify-between text-xs text-fg-3">
          <span>Clausentis Inc. &copy; {new Date().getFullYear()}</span>
          <Link href="/privacy" className="text-fg underline underline-offset-4 hover:text-fg-2">
            Privacy Policy
          </Link>
        </div>
      </main>
    </div>
  );
}
