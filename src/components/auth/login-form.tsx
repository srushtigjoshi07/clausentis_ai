'use client';

import { useState } from 'react';
import Link from 'next/link';
import { login, type AuthActionResult } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, Building2, Briefcase, CheckCircle2, ShieldAlert } from 'lucide-react';
import { GoogleAuthButton } from './google-auth-button';
import type { UserRole } from '@/types/auth-roles';

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('bidder');

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    setDetails(null);
    formData.set('role', selectedRole);

    const result = (await login(formData)) as AuthActionResult | void;

    if (result && 'error' in result && result.error) {
      setError(result.error);
      setDetails(result.details || null);
      setIsLoading(false);
    }
  }

  const fillDemoAuthority = () => {
    setEmail('tester@tenderai.com');
    setPassword('password123');
    setSelectedRole('tender_authority');
    setError(null);
    setDetails(null);
  };

  const fillDemoBidder = () => {
    setEmail('tester@tenderai.com');
    setPassword('password123');
    setSelectedRole('bidder');
    setError(null);
    setDetails(null);
  };

  return (
    <div className="grid gap-6">
      {/* Role Selection Tabs */}
      <div className="space-y-2">
        <label className="text-xs uppercase font-mono tracking-widest text-[#777777]">
          I Am A:
        </label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl">
          <button
            type="button"
            onClick={() => setSelectedRole('tender_authority')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedRole === 'tender_authority'
                ? 'bg-[#111111] text-white shadow-sm'
                : 'text-[#555555] hover:text-[#111111] hover:bg-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Tender Authority</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('bidder')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              selectedRole === 'bidder'
                ? 'bg-[#111111] text-white shadow-sm'
                : 'text-[#555555] hover:text-[#111111] hover:bg-white'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Bidder / Vendor</span>
          </button>
        </div>
      </div>

      {/* Fast Demo Persona Quick-Fill Banner */}
      <div className="p-3.5 rounded-xl border border-[#E5E5E5] bg-[#F7F7F7] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#111111] font-medium">
            <Shield className="h-3.5 w-3.5 text-[#555555]" />
            <span>Fast Demo Persona Fill</span>
          </div>
          <span className="text-[10px] text-[#777777] font-mono">Pre-Configured</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={fillDemoAuthority}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white hover:bg-[#F5F5F5] border border-[#E5E5E5] text-xs text-[#111111] transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Authority Demo</span>
          </button>
          <button
            type="button"
            onClick={fillDemoBidder}
            className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white hover:bg-[#F5F5F5] border border-[#E5E5E5] text-xs text-[#111111] transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Bidder Demo</span>
          </button>
        </div>
      </div>

      <form action={onSubmit}>
        <input type="hidden" name="role" value={selectedRole} />

        <div className="grid gap-4">
          {/* Email */}
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-medium text-[#111111]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@cpcl.gov.in"
              required
              autoComplete="email"
              className="flex h-10 w-full rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#111111] placeholder:text-[#777777] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            />
          </div>

          {/* Password */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-[#111111]">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#555555] hover:text-[#111111] underline underline-offset-4 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="flex h-10 w-full rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#111111] placeholder:text-[#777777] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            />
          </div>

          {/* User-Friendly Error Alert */}
          {error && (
            <div className="p-3.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] text-[#991B1B] text-xs leading-relaxed space-y-1.5">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-[#DC2626]" />
                <div className="space-y-1 flex-1">
                  <div className="font-semibold">{error}</div>
                  {details && (
                    <div className="text-[10px] font-mono opacity-70 pt-1 border-t border-red-200">
                      Technical info: {details}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sign In Button */}
          <Button
            type="submit"
            className="w-full h-10 bg-[#111111] hover:bg-[#222222] text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading
              ? 'Signing in...'
              : `Sign in as ${selectedRole === 'tender_authority' ? 'Tender Authority' : 'Bidder / Vendor'}`}
          </Button>
        </div>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#E5E5E5]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-[#777777] font-medium tracking-wider">
            Or continue with
          </span>
        </div>
      </div>

      <GoogleAuthButton />

      {/* Sign Up Link */}
      <div className="text-center text-sm text-[#555555]">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="text-[#111111] font-semibold hover:underline underline-offset-4 transition-colors"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
