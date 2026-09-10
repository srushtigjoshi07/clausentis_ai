import { Metadata } from 'next';
import { SignupForm } from '@/components/auth/signup-form';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sign Up - Clausentis',
  description: 'Create a new account',
};

export default function SignupPage() {
  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <Link href="/" className="lg:hidden mx-auto mb-4 flex items-center">
          <span className="text-sm font-semibold tracking-[0.2em] uppercase text-[#111111] font-sans">
            CLAUSENTIS
          </span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
          Create an account
        </h1>
        <p className="text-sm text-[#555555]">
          Enter your details below to create your account
        </p>
      </div>

      <SignupForm />

      <p className="px-6 text-center text-xs text-[#777777] leading-relaxed">
        By clicking continue, you agree to our{' '}
        <Link href="/terms" className="text-[#111111] underline underline-offset-4 hover:text-[#555555] transition-colors">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-[#111111] underline underline-offset-4 hover:text-[#555555] transition-colors">
          Privacy Policy
        </Link>
        .
      </p>
    </>
  );
}
