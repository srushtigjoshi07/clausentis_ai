import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { BrandMark } from '@/components/v2/ui';

export const metadata: Metadata = {
  title: 'Sign in · Clausentis',
  description: 'Sign in to the Clausentis officer or bidder portal.',
};

export default function LoginPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(360px,600px)]">
      <main className="flex flex-col justify-center gap-7 px-4 py-12 sm:px-12 lg:px-[120px]">
        <Link href="/" className="flex items-center gap-2.5 self-start text-fg no-underline">
          <BrandMark />
          <span className="font-display text-[15px] font-bold tracking-[.06em]">CLAUSENTIS</span>
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="h1">Sign in</h1>
          <p className="sub">We&apos;ll take you to the officer or bidder portal based on your account.</p>
        </div>
        <LoginForm />
      </main>
      <aside aria-label="About Clausentis" className="hidden flex-col justify-end gap-4 bg-band px-14 py-16 text-white lg:flex">
        <span className="eyebrow" style={{ color: '#BFDBFE' }}>Decision support, not decision making</span>
        <p className="m-0 font-display text-[28px] font-semibold leading-[1.3] tracking-[-0.015em]">
          The engine checks the evidence. The procurement officer decides, and signs.
        </p>
        <span className="text-[13px]" style={{ color: '#BFDBFE' }}>Every check, recommendation and decision is written to a tamper-evident audit trail.</span>
      </aside>
    </div>
  );
}
