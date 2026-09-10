import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Forgot Password - Clausentis',
  description: 'Reset your password',
};

export default function ForgotPasswordPage() {
  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <Link href="/" className="lg:hidden mx-auto mb-4 flex items-center">
          <span className="text-sm font-semibold tracking-[0.2em] uppercase text-white font-sans">
            CLAUSENTIS
          </span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Forgot password
        </h1>
        <p className="text-sm text-[#AAB4C3]">
          Enter your email to receive a password reset link
        </p>
      </div>

      <div className="grid gap-6">
        <form>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium text-white">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                required
                className="flex h-10 w-full rounded-md border border-[#667085] bg-[#0B0F17] px-3 py-2 text-sm text-white placeholder:text-[#718096] focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              />
            </div>
            <Button type="button" className="w-full h-10 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-600/30">
              Send Reset Link
            </Button>
          </div>
        </form>

        <div className="text-center text-sm text-[#AAB4C3]">
          Remember your password?{' '}
          <Link href="/login" className="text-blue-400 font-semibold hover:text-blue-300 underline underline-offset-4 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </>
  );
}
