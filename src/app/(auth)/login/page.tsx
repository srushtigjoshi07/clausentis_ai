import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Login - Clausentis',
  description: 'Login to your account',
};

export default function LoginPage() {
  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <Link href="/" className="lg:hidden mx-auto mb-4 flex items-center">
          <span className="text-sm font-semibold tracking-[0.2em] uppercase text-[#111111] font-sans">
            CLAUSENTIS
          </span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
          Welcome back
        </h1>
        <p className="text-sm text-[#555555]">
          Enter your email to sign in to your account
        </p>
      </div>

      <LoginForm />
    </>
  );
}
