'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { login, type AuthActionResult } from '@/app/auth/actions';
import { GoogleAuthButton } from './google-auth-button';

/**
 * Sign-in form. There is deliberately no role picker: the portal is chosen by the
 * server from profiles.role after sign-in.
 */
export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function onSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    setDetails(null);
    const result = (await login(formData)) as AuthActionResult | void;
    if (result && 'error' in result && result.error) {
      setError(result.error);
      setDetails(result.details || null);
      setIsLoading(false);
    }
  }

  // Demo accounts: each has its own fixed role in profiles.role.
  const fillDemo = (who: 'officer' | 'bidder') => {
    setEmail(who === 'officer' ? 'tester@tenderai.com' : 'bidder@tenderai.com');
    setPassword('password123');
    setError(null);
    setDetails(null);
  };

  return (
    <div className="flex w-full max-w-[420px] flex-col gap-4">
      <form action={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="label">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            style={{ minHeight: 44 }}
            placeholder="name@organisation.gov.in"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center justify-between">
            <label htmlFor="password" className="label">Password</label>
            <Link href="/forgot-password" className="text-xs text-fg-2 hover:text-brand hover:underline">Forgot password?</Link>
          </span>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            style={{ minHeight: 44 }}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error ? (
          <div role="alert" className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2.5 text-[13px] text-[#991B1B]">
            <p className="m-0 font-semibold">{error}</p>
            {details ? <p className="mono m-0 mt-1 text-[11px]">{details}</p> : null}
          </div>
        ) : null}
        <button type="submit" className="btn btn-primary" style={{ minHeight: 46 }} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <span className="flex items-center gap-3 text-[11px] text-fg-3" aria-hidden="true">
        <span className="h-px flex-grow bg-line" />
        or
        <span className="h-px flex-grow bg-line" />
      </span>
      <GoogleAuthButton />

      <div className="panel flex flex-col gap-2 px-3.5 py-3">
        <span className="eyebrow" style={{ fontSize: 10 }}>Demo accounts</span>
        <span className="flex gap-2">
          <button type="button" className="btn btn-secondary btn-sm flex-1" style={{ minHeight: 40 }} onClick={() => fillDemo('officer')}>
            Procurement officer
          </button>
          <button type="button" className="btn btn-secondary btn-sm flex-1" style={{ minHeight: 40 }} onClick={() => fillDemo('bidder')}>
            Bidder
          </button>
        </span>
        <span className="text-[11px] text-fg-3">Fills the form with a demo login. The portal you land in comes from that account.</span>
      </div>

      <span className="text-[13px] text-fg-2">
        New bidder? <Link href="/signup" className="link">Register your company</Link>
      </span>
    </div>
  );
}
