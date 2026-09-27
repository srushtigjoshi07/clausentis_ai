'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { requestPasswordReset } from '@/app/auth/actions';

export function ForgotPasswordForm() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(formData: FormData) {
    setBusy(true);
    setMsg(null);
    const res = await requestPasswordReset(formData);
    setMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: res.message || 'Check your email for a reset link.' });
    setBusy(false);
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fp-email" className="label">Email</label>
        <input id="fp-email" name="email" type="email" required autoComplete="email" className="input" style={{ minHeight: 44 }} />
      </div>
      <button type="submit" className="btn btn-primary" style={{ minHeight: 46 }} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        Send reset link
      </button>
      <p role="status" aria-live="polite" className={`m-0 text-[13px] ${msg?.ok ? 'text-pass' : 'text-[#991B1B]'}`}>
        {msg?.text}
      </p>
    </form>
  );
}
