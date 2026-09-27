'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { signup, type AuthActionResult } from '@/app/auth/actions';

/** Bidder self-registration. There is no role picker: officer accounts are provisioned by an administrator. */
export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setError(null);
    setDetails(null);
    const email = ((formData.get('email') as string) || '').trim();
    const password = (formData.get('password') as string) || '';
    const confirm = (formData.get('confirm_password') as string) || '';
    const gstin = ((formData.get('gstin') as string) || '').trim();
    if (password !== confirm) return setError('The two passwords do not match.');
    if (password.length < 6) return setError('Use at least 6 characters for your password.');
    if (gstin && !/^[0-9A-Za-z]{15}$/.test(gstin)) return setError('GSTIN must be 15 letters and digits.');
    if (!formData.get('terms')) return setError('Please accept the terms to continue.');

    setIsLoading(true);
    const result = (await signup(formData)) as AuthActionResult | void;
    if (result && result.error) {
      setError(result.error);
      setDetails(result.details || null);
      setIsLoading(false);
      return;
    }
    if (result && result.requiresEmailVerification) {
      setSentTo(result.email || email);
    }
    setIsLoading(false);
  }

  if (sentTo) {
    return (
      <div role="status" className="card flex max-w-[560px] flex-col gap-3 p-6">
        <h2 className="h2 text-lg">Check your email</h2>
        <p className="m-0 text-sm text-fg-2">
          We sent a verification link to <strong className="text-fg">{sentTo}</strong>. Open it to activate your bidder account.
        </p>
        <Link href="/login" className="btn btn-primary self-start">Go to sign in</Link>
      </div>
    );
  }

  const field = (id: string, name: string, label: string, type: string, props: React.InputHTMLAttributes<HTMLInputElement>, mono = false) => (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} name={name} type={type} className={mono ? 'input mono' : 'input'} style={{ minHeight: 44 }} {...props} />
    </div>
  );

  return (
    <form action={onSubmit} className="flex max-w-[560px] flex-col gap-5">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {field('su-name', 'full_name', 'Your name', 'text', { required: true, autoComplete: 'name' })}
        {field('su-co', 'organisation_name', 'Company legal name', 'text', { required: true, autoComplete: 'organization' })}
        {field('su-gst', 'gstin', 'GSTIN', 'text', { placeholder: '15 characters', maxLength: 15 }, true)}
        {field('su-email', 'email', 'Work email', 'email', { required: true, autoComplete: 'email' })}
        {field('su-pw', 'password', 'Password', 'password', { required: true, autoComplete: 'new-password', minLength: 6 })}
        {field('su-pw2', 'confirm_password', 'Confirm password', 'password', { required: true, autoComplete: 'new-password' })}
      </div>
      <label className="flex items-start gap-2.5 text-[13px] text-fg-4">
        <input type="checkbox" name="terms" value="1" className="mt-0.5 h-4 w-4" />
        <span>
          I agree to the <Link href="/terms" className="link font-normal underline">terms</Link> and to Clausentis checking my registrations with government sources.
        </span>
      </label>
      {error ? (
        <div role="alert" className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 text-[13px] text-[#991B1B]">
          <p className="m-0 font-semibold">{error}</p>
          {details ? <p className="mono m-0 mt-1 text-[11px]">{details}</p> : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary btn-lg" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Create account
        </button>
        <span className="text-[13px] text-fg-2">
          Already registered? <Link href="/login" className="link">Sign in</Link>
        </span>
      </div>
    </form>
  );
}
