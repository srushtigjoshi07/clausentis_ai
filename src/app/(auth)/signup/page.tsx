import type { Metadata } from 'next';
import Link from 'next/link';
import { SignupForm } from '@/components/auth/signup-form';
import { BrandMark } from '@/components/v2/ui';

export const metadata: Metadata = {
  title: 'Register your company · Clausentis',
  description: 'Create a bidder account on Clausentis.',
};

const NEXT_STEPS = [
  ['01', 'Confirm your email', 'We send a link to verify it.'],
  ['02', 'Complete your profile', 'PAN, Udyam and declared capability.'],
  ['03', 'Upload to your vault', 'Reuse documents across bids.'],
];

export default function SignupPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(360px,600px)]">
      <main className="flex flex-col justify-center gap-6 px-4 py-12 sm:px-12 lg:px-[120px]">
        <Link href="/" className="flex items-center gap-2.5 self-start text-fg no-underline">
          <BrandMark />
          <span className="font-display text-[15px] font-bold tracking-[.06em]">CLAUSENTIS</span>
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="h1">Register your company</h1>
          <p className="sub">For bidders. Procurement officer accounts are created by your organisation&apos;s administrator.</p>
        </div>
        <SignupForm />
      </main>
      <aside aria-label="What happens next" className="flex flex-col justify-center gap-5 border-t border-line bg-page px-4 py-12 sm:px-14 lg:border-l lg:border-t-0">
        <span className="eyebrow">After you register</span>
        <ol className="m-0 flex list-none flex-col gap-[18px] p-0">
          {NEXT_STEPS.map(([n, t, d]) => (
            <li key={n} className="grid grid-cols-[28px_minmax(0,1fr)] gap-3">
              <span className="mono font-bold">{n}</span>
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold">{t}</span>
                <span className="text-[13px] text-fg-2">{d}</span>
              </span>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
