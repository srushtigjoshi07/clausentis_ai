'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { saveBidderProfileAction } from '@/lib/actions/tender-discovery';
import type { BidderProfile } from '@/types/tender-discovery';
import { cx } from '../ui';

type Values = Record<
  'companyName' | 'registrationNumber' | 'gstin' | 'pan' | 'udyamNumber' | 'registeredAddress' | 'contactPerson' | 'contactEmail' | 'contactPhone' | 'turnover' | 'experience' | 'localContent',
  string
>;

export function CompanyProfileForm({ initial, email }: { initial: BidderProfile | null; email: string }) {
  const router = useRouter();
  const [v, setV] = useState<Values>({
    companyName: initial?.companyName ?? '',
    registrationNumber: initial?.registrationNumber ?? '',
    gstin: initial?.gstin ?? '',
    pan: initial?.pan ?? '',
    udyamNumber: initial?.udyamNumber ?? '',
    registeredAddress: initial?.registeredAddress ?? '',
    contactPerson: initial?.contactPerson ?? '',
    contactEmail: initial?.contactEmail ?? email,
    contactPhone: initial?.contactPhone ?? '',
    turnover: initial?.annualTurnoverInCr !== undefined ? String(initial.annualTurnoverInCr) : '',
    experience: initial?.relevantExperienceYears !== undefined ? String(initial.relevantExperienceYears) : '',
    localContent: initial?.localContentPercent !== undefined ? String(initial.localContentPercent) : '',
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = (k: keyof Values) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }));
  const num = (s: string) => (s.trim() === '' ? undefined : Number(s));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await saveBidderProfileAction({
      companyName: v.companyName,
      registrationNumber: v.registrationNumber,
      gstin: v.gstin,
      pan: v.pan,
      udyamNumber: v.udyamNumber || undefined,
      registeredAddress: v.registeredAddress,
      contactPerson: v.contactPerson,
      contactEmail: v.contactEmail,
      contactPhone: v.contactPhone,
      entityType: initial?.entityType,
      annualTurnoverInCr: num(v.turnover),
      relevantExperienceYears: num(v.experience),
      localContentPercent: num(v.localContent),
    });
    setBusy(false);
    setMsg(res.success ? { ok: true, text: 'Profile saved.' } : { ok: false, text: res.error || 'Could not save the profile.' });
    if (res.success) router.refresh();
  }

  const field = (k: keyof Values, label: string, opts: { mono?: boolean; type?: string; hint?: string; span?: boolean; required?: boolean } = {}) => (
    <div className={cx('flex flex-col gap-1.5', opts.span && 'sm:col-span-2')}>
      <label htmlFor={`p-${k}`} className="label">
        {label}
        {opts.hint ? <span className="font-normal text-fg-3"> ({opts.hint})</span> : null}
      </label>
      <input
        id={`p-${k}`}
        className={cx('input', opts.mono && 'mono')}
        type={opts.type ?? 'text'}
        step={opts.type === 'number' ? 'any' : undefined}
        min={opts.type === 'number' ? 0 : undefined}
        required={opts.required}
        value={v[k]}
        onChange={set(k)}
      />
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <section aria-label="Registrations" className="card flex flex-col gap-3.5 p-5">
        <h2 className="h2">Registrations</h2>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {field('companyName', 'Legal name', { required: true })}
          {field('registrationNumber', 'CIN', { mono: true })}
          {field('gstin', 'GSTIN', { mono: true })}
          {field('pan', 'PAN', { mono: true })}
          {field('udyamNumber', 'Udyam number', { mono: true, hint: 'optional' })}
          {field('contactPhone', 'Contact phone')}
          {field('contactPerson', 'Authorised signatory')}
          {field('contactEmail', 'Contact email', { type: 'email' })}
          {field('registeredAddress', 'Registered address', { span: true })}
        </div>
      </section>

      <section aria-label="Declared capability" className="card flex flex-col gap-3.5 p-5">
        <div className="flex flex-col gap-1">
          <h2 className="h2">Declared capability</h2>
          <span className="text-xs text-fg-3">Used only to pre-check eligibility. The engine verifies every figure from your documents.</span>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {field('turnover', 'Average turnover (₹ Cr)', { mono: true, type: 'number' })}
          {field('experience', 'Similar experience (years)', { mono: true, type: 'number' })}
          {field('localContent', 'Local content (%)', { mono: true, type: 'number' })}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <span role="status" aria-live="polite" className={cx('text-[13px]', msg?.ok ? 'text-pass' : 'text-[#991B1B]')}>{msg?.text}</span>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Save profile
        </button>
      </div>
    </form>
  );
}
