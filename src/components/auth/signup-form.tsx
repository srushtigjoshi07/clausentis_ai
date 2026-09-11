'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signup, type AuthActionResult } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';
import { Loader2, Building2, Briefcase, AlertCircle, Clock, MailCheck, ArrowRight, ShieldAlert } from 'lucide-react';
import { GoogleAuthButton } from './google-auth-button';
import type { UserRole } from '@/types/auth-roles';
import type { AuthErrorCode } from '@/lib/auth/errors';

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<AuthErrorCode | null>(null);
  const [technicalDetails, setTechnicalDetails] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('bidder');
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    setErrorCode(null);
    setTechnicalDetails(null);
    formData.set('role', selectedRole);

    const email = (formData.get('email') as string)?.trim() || '';
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm_password') as string;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Please enter a valid official email address (e.g. officer@organisation.gov.in).');
      setErrorCode('INVALID_EMAIL');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please ensure both entered passwords are identical.');
      setErrorCode('PASSWORD_MISMATCH');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters with a combination of letters and numbers.');
      setErrorCode('WEAK_PASSWORD');
      setIsLoading(false);
      return;
    }

    const result = (await signup(formData)) as AuthActionResult | void;

    if (result && 'error' in result && result.error) {
      setError(result.error);
      setErrorCode(result.errorCode || 'SUPABASE_ERROR');
      setTechnicalDetails(result.details || null);
      setIsLoading(false);
      return;
    }

    if (result && result.requiresEmailVerification) {
      setRegisteredEmail(result.email || email);
      setVerificationRequired(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
  }

  const inputClass =
    'flex h-10 w-full rounded-md border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#111111] placeholder:text-[#777777] focus:outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] disabled:cursor-not-allowed disabled:opacity-50 transition-colors';

  // State: Verification Email Sent
  if (verificationRequired) {
    return (
      <div className="p-6 border border-[#E5E5E5] rounded-2xl bg-white shadow-sm space-y-5 text-center">
        <div className="w-12 h-12 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center mx-auto text-[#16A34A]">
          <MailCheck className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-[#111111]">
            Account created. Please check your email to verify your account.
          </h3>
          <p className="text-sm text-[#555555] leading-relaxed">
            We have sent a verification link to{' '}
            <span className="font-semibold text-[#111111]">{registeredEmail}</span>.
            Please click the link in your email to activate your account.
          </p>
        </div>

        <div className="p-3 bg-[#F7F7F7] rounded-xl text-xs text-[#666666] leading-relaxed border border-[#E5E5E5]">
          Once verified, you will be redirected straight to your{' '}
          <span className="font-semibold text-[#111111]">
            {selectedRole === 'tender_authority' ? 'Tender Authority' : 'Bidder / Vendor'}
          </span>{' '}
          portal.
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full h-10 bg-[#111111] hover:bg-[#222222] text-white font-medium text-sm rounded-lg shadow-sm transition-all"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Role Selection Tabs */}
      <div className="space-y-2">
        <label className="text-xs uppercase font-mono tracking-widest text-[#777777]">
          Register As:
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

      <form action={onSubmit}>
        <input type="hidden" name="role" value={selectedRole} />

        <div className="grid gap-4">
          {/* Full Name */}
          <div className="grid gap-2">
            <label htmlFor="full_name" className="text-sm font-medium text-[#111111]">
              Full Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              placeholder={selectedRole === 'tender_authority' ? 'Dr. Rajesh Kumar (Chief Procurement Officer)' : 'Amit Verma (Head of Tendering)'}
              required
              className={inputClass}
            />
          </div>

          {/* Organisation / Company Name */}
          <div className="grid gap-2">
            <label htmlFor="organisation_name" className="text-sm font-medium text-[#111111]">
              {selectedRole === 'tender_authority' ? 'Authority / PSU Name' : 'Company / Enterprise Name'}
            </label>
            <input
              id="organisation_name"
              name="organisation_name"
              type="text"
              placeholder={
                selectedRole === 'tender_authority'
                  ? 'Chennai Petroleum Corporation Limited'
                  : 'Apex Heavy Engineering Pvt Ltd'
              }
              required
              className={inputClass}
            />
          </div>

          {/* Email */}
          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-medium text-[#111111]">
              Official Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder={selectedRole === 'tender_authority' ? 'officer@cpcl.gov.in' : 'contact@apexheavy.com'}
              required
              className={inputClass}
            />
          </div>

          {/* Password */}
          <div className="grid gap-2">
            <label htmlFor="password" className="text-sm font-medium text-[#111111]">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              className={inputClass}
            />
          </div>

          {/* Confirm Password */}
          <div className="grid gap-2">
            <label htmlFor="confirm_password" className="text-sm font-medium text-[#111111]">
              Confirm Password
            </label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              className={inputClass}
            />
          </div>

          {/* Categorized User-Friendly Error Alert */}
          {error && (
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1.5 ${
                errorCode === 'EMAIL_RATE_LIMITED'
                  ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                  : errorCode === 'EMAIL_ALREADY_REGISTERED'
                  ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1E40AF]'
                  : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
              }`}
            >
              <div className="flex items-start gap-2">
                {errorCode === 'EMAIL_RATE_LIMITED' ? (
                  <Clock className="w-4 h-4 mt-0.5 shrink-0 text-[#B45309]" />
                ) : errorCode === 'EMAIL_ALREADY_REGISTERED' ? (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#2563EB]" />
                ) : (
                  <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-[#DC2626]" />
                )}
                <div className="space-y-1 flex-1">
                  <div className="font-semibold">{error}</div>
                  {errorCode === 'EMAIL_RATE_LIMITED' && (
                    <div className="text-[11px] opacity-90">
                      The upstream mail verification service limits hourly dispatch. You can wait a moment or sign in to an existing account.
                    </div>
                  )}
                  {errorCode === 'EMAIL_ALREADY_REGISTERED' && (
                    <div>
                      <Link href="/login" className="underline font-semibold hover:opacity-80">
                        Click here to Sign In &rarr;
                      </Link>
                    </div>
                  )}
                  {technicalDetails && (
                    <div className="text-[10px] font-mono opacity-70 pt-1 border-t border-current/20">
                      Detail: {technicalDetails}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Create Account Button */}
          <Button
            type="submit"
            className="w-full h-10 bg-[#111111] hover:bg-[#222222] text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading
              ? 'Creating account...'
              : `Register as ${selectedRole === 'tender_authority' ? 'Tender Authority' : 'Bidder / Vendor'}`}
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

      {/* Sign In Link */}
      <div className="text-center text-sm text-[#555555]">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-[#111111] font-semibold hover:underline underline-offset-4 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
