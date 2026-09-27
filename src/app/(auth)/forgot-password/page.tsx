import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandMark } from '@/components/v2/ui';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'Reset your password · Clausentis',
  description: 'Request a password reset link.',
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-4 py-12">
      <section aria-label="Reset password" className="card flex w-full max-w-[440px] flex-col gap-5 p-8" style={{ boxShadow: '0 12px 32px rgba(15,23,42,0.06)' }}>
        <Link href="/" className="self-start" aria-label="Clausentis home">
          <BrandMark />
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="h1" style={{ fontSize: 26 }}>Reset your password</h1>
          <p className="sub">Enter your account email and we&apos;ll send a reset link.</p>
        </div>
        <ForgotPasswordForm />
        <Link href="/login" className="text-center text-[13px] text-fg-2 hover:text-brand hover:underline">← Back to sign in</Link>
      </section>
    </main>
  );
}
