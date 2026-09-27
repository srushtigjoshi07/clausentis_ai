'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { createAuthorityTenderAction } from '@/lib/actions/tenders';
import { CategoryChip, PageBody, PageHeader, cx } from '@/components/v2/ui';
import { categoryClass } from '@/components/v2/status';

type Category = 'Financial' | 'Experience' | 'Statutory' | 'Technical' | 'Legal' | 'Quality';

interface ClausePreview {
  clause: string;
  title: string;
  category: Category;
  rule: string;
  evidence: string;
  mandatory: boolean;
}

const CAT_FILL: Record<Category, string> = {
  Financial: '#1E40AF',
  Experience: '#C2410C',
  Statutory: '#6D28D9',
  Technical: '#0E7490',
  Legal: '#BE185D',
  Quality: '#4338CA',
};

/**
 * The bid compliance engine (lib/tender-discovery/bid-compliance-verifier) applies the same
 * rule set to every tender; the thresholds below are what the officer enters here.
 */
function buildClauses(f: { minTurnover: string; minExperience: string; localContent: string }): ClausePreview[] {
  const t = f.minTurnover.trim();
  const e = f.minExperience.trim();
  const l = f.localContent.trim();
  return [
    { clause: 'NIT 3.1', title: t ? `Average annual turnover ≥ ₹${t} Cr` : 'Average annual turnover (enter a minimum)', category: 'Financial', rule: 'MINIMUM_VALUE', evidence: 'Audited financial statements', mandatory: true },
    { clause: 'NIT 3.3', title: 'Positive net worth', category: 'Financial', rule: 'MINIMUM_VALUE', evidence: 'Audited balance sheet', mandatory: true },
    { clause: 'BQC 4.1', title: e ? `Similar experience ≥ ${e} years` : 'Similar experience (enter a minimum)', category: 'Experience', rule: 'YEARS_EXPERIENCE', evidence: 'Work orders / completion certificates', mandatory: true },
    { clause: 'BQC 4.2', title: 'Completed similar work orders', category: 'Experience', rule: 'COUNT_THRESHOLD', evidence: 'Completion certificates', mandatory: true },
    { clause: 'Tech 2', title: 'Technical specification conformance', category: 'Technical', rule: 'DOCUMENT_REQUIRED', evidence: 'Technical datasheet', mandatory: true },
    { clause: 'Tech OEM', title: 'OEM manufacturer authorization', category: 'Technical', rule: 'DOCUMENT_REQUIRED', evidence: 'Manufacturer authorization form', mandatory: true },
    { clause: 'NIT 2.1', title: 'GST registration and return filing', category: 'Statutory', rule: 'DOCUMENT_REQUIRED', evidence: 'GST REG-06', mandatory: true },
    { clause: 'NIT 2.2', title: 'Permanent Account Number (PAN)', category: 'Statutory', rule: 'DOCUMENT_REQUIRED', evidence: 'PAN card', mandatory: true },
    { clause: 'MII', title: l ? `Local content ≥ ${l}% (Make in India)` : 'Local content declaration', category: 'Statutory', rule: 'PERCENTAGE_THRESHOLD', evidence: 'Local content declaration', mandatory: false },
    { clause: 'Annex B', title: 'Non-blacklisting / debarment undertaking', category: 'Legal', rule: 'DOCUMENT_REQUIRED', evidence: 'Notarised affidavit', mandatory: true },
  ];
}

const inputs = [
  { id: 'title', label: 'Tender title', span: true, required: true },
  { id: 'reference', label: 'Reference number', mono: true, required: true },
  { id: 'category', label: 'Category', select: ['Goods', 'Services', 'Works', 'Consultancy', 'Turnkey / EPC', 'Maintenance'] },
  { id: 'estimatedValue', label: 'Estimated value (e.g. ₹14.50 Crore)', required: true },
  { id: 'emd', label: 'EMD amount' },
  { id: 'publishedDate', label: 'Published on', type: 'date', required: true },
  { id: 'closingDate', label: 'Closing date', type: 'date', required: true },
  { id: 'validity', label: 'Bid validity (days)', type: 'number' },
  { id: 'minTurnover', label: 'Minimum average turnover (₹ Cr)', type: 'number', mono: true, required: true },
  { id: 'minExperience', label: 'Minimum experience (years)', type: 'number', mono: true, required: true },
  { id: 'localContent', label: 'Minimum local content (%)', type: 'number', mono: true },
] as const;

type FormKey = (typeof inputs)[number]['id'] | 'description';

export default function PublishTenderPage() {
  const router = useRouter();
  const [form, setForm] = useState<Record<FormKey, string>>({
    title: '',
    reference: '',
    category: 'Goods',
    estimatedValue: '',
    emd: '',
    publishedDate: new Date().toISOString().slice(0, 10),
    closingDate: '',
    validity: '180',
    minTurnover: '',
    minExperience: '',
    localContent: '50',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clauses = useMemo(() => buildClauses(form), [form]);
  const cats = useMemo(() => {
    const counts = new Map<Category, number>();
    clauses.forEach((c) => counts.set(c.category, (counts.get(c.category) ?? 0) + 1));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [clauses]);
  const maxCat = Math.max(...cats.map(([, n]) => n), 1);
  const detailsDone = Boolean(form.title && form.reference && form.closingDate && form.minTurnover && form.minExperience && form.estimatedValue);

  const set = (k: FormKey) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await createAuthorityTenderAction({
        title: form.title,
        reference: form.reference,
        category: form.category,
        description: form.description,
        publishedDate: form.publishedDate,
        closingDate: form.closingDate,
        emd: form.emd,
        estimatedValue: form.estimatedValue,
        validity: form.validity,
        minTurnover: form.minTurnover,
        minExperience: form.minExperience,
        localContent: form.localContent,
      });
      if (res.success && res.tenderId) {
        router.push(`/authority/tenders/${res.tenderId}`);
        return;
      }
      setError(res.error || 'The tender could not be published.');
    } catch {
      setError('The tender could not be published. Please try again.');
    }
    setSubmitting(false);
  }

  const steps = [
    { n: 1, t: 'Enter tender details', d: detailsDone ? 'Required fields complete' : 'Title, reference, dates and thresholds', done: detailsDone, current: !detailsDone },
    { n: 2, t: 'Confirm the checks', d: `${clauses.length} checks will run on every bid`, done: false, current: detailsDone },
    { n: 3, t: 'Publish & open for bids', d: 'Bidders can start checking', done: false, current: false },
  ];

  return (
    <PageBody>
      <PageHeader back={{ href: '/authority/tenders', label: 'Tenders' }} title="Publish a tender" />

      <ol aria-label="Steps" className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-3">
        {steps.map((s) => (
          <li
            key={s.n}
            aria-current={s.current ? 'step' : undefined}
            className={cx('flex items-center gap-2.5 border-t-2 px-3.5 py-3', s.done || s.current ? 'border-mark' : 'border-line', s.current && 'bg-white')}
          >
            <span
              className={cx(
                'mono inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                s.done ? 'bg-mark text-white' : s.current ? 'border-[1.5px] border-mark' : 'border-[1.5px] border-line-2 text-fg-3'
              )}
            >
              {s.done ? <Check className="h-3 w-3" aria-label="Done" /> : s.n}
            </span>
            <span className="flex flex-col">
              <span className={cx('text-[13px] font-semibold', !s.done && !s.current && 'text-fg-2')}>{s.t}</span>
              <span className="text-[11px] text-fg-3">{s.d}</span>
            </span>
          </li>
        ))}
      </ol>

      <form onSubmit={onSubmit} className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section aria-label="Tender details" className="card flex flex-col gap-4 p-5">
            <h2 className="h2">Tender details</h2>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              {inputs.map((f) => (
                <div key={f.id} className={cx('flex flex-col gap-1.5', 'span' in f && f.span && 'sm:col-span-2')}>
                  <label htmlFor={`t-${f.id}`} className="label">
                    {f.label}
                    {'required' in f && f.required ? <span className="text-fail"> *</span> : null}
                  </label>
                  {'select' in f ? (
                    <select id={`t-${f.id}`} className="input" value={form[f.id]} onChange={set(f.id)}>
                      {f.select.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`t-${f.id}`}
                      className={cx('input', 'mono' in f && f.mono && 'mono')}
                      type={'type' in f ? f.type : 'text'}
                      step={'type' in f && f.type === 'number' ? 'any' : undefined}
                      min={'type' in f && f.type === 'number' ? 0 : undefined}
                      required={'required' in f && f.required}
                      value={form[f.id]}
                      onChange={set(f.id)}
                    />
                  )}
                </div>
              ))}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="t-description" className="label">Scope summary</label>
                <textarea id="t-description" className="input" rows={3} value={form.description} onChange={set('description')} />
              </div>
            </div>
          </section>

          <section aria-label="Checks applied to every bid" className="card overflow-hidden">
            <div className="flex flex-col gap-1 px-5 py-4">
              <h2 className="h2">Check each clause before publishing</h2>
              <span className="text-xs text-fg-3">
                These are the rules the compliance engine applies to every bid on this tender. Thresholds come from the values you entered above.
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-xs">
                <thead>
                  <tr className="border-y border-line bg-page text-left">
                    <th scope="col" className="th px-5 py-2.5">Clause</th>
                    <th scope="col" className="th px-3 py-2.5">Requirement</th>
                    <th scope="col" className="th px-3 py-2.5">Category</th>
                    <th scope="col" className="th px-3 py-2.5">Rule</th>
                    <th scope="col" className="th px-3 py-2.5">Evidence expected</th>
                    <th scope="col" className="th px-5 py-2.5">Mandatory</th>
                  </tr>
                </thead>
                <tbody>
                  {clauses.map((c) => (
                    <tr key={c.clause} className="tr">
                      <td className="mono px-5 py-2.5 text-fg-2">{c.clause}</td>
                      <td className="px-3 py-2.5 text-[13px] font-semibold">{c.title}</td>
                      <td className="px-3 py-2.5"><CategoryChip category={c.category} /></td>
                      <td className="mono px-3 py-2.5 text-[11px]">{c.rule}</td>
                      <td className="px-3 py-2.5 text-fg-2">{c.evidence}</td>
                      <td className="px-5 py-2.5">{c.mandatory ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <section aria-label="Clauses by category" className="card flex flex-col gap-3 p-[18px]">
            <h2 className="h2 text-sm">Clauses by category</h2>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0" aria-label="Number of clauses per category">
              {cats.map(([name, n]) => (
                <li key={name} className="grid grid-cols-[96px_minmax(0,1fr)_20px] items-center gap-2.5 text-xs">
                  <span className={cx('cat', categoryClass(name))}>{name}</span>
                  <span className="block h-2.5">
                    <span className="mark block h-2.5 rounded-r" title={`${name}: ${n} clauses`} style={{ width: `${(n / maxCat) * 100}%`, background: CAT_FILL[name] }} />
                  </span>
                  <span className="mono text-right font-semibold">{n}</span>
                </li>
              ))}
            </ul>
          </section>
          <section aria-label="Summary" className="panel flex flex-col gap-2.5 p-[18px] text-xs">
            <h2 className="h2 text-sm">Summary</h2>
            <dl className="m-0 grid grid-cols-[88px_minmax(0,1fr)] gap-2">
              <dt className="text-fg-3">Reference</dt>
              <dd className="mono m-0 break-words">{form.reference || '—'}</dd>
              <dt className="text-fg-3">Closes</dt>
              <dd className="m-0">{form.closingDate || '—'}</dd>
              <dt className="text-fg-3">Estimate</dt>
              <dd className="m-0">{form.estimatedValue || '—'}</dd>
              <dt className="text-fg-3">EMD</dt>
              <dd className="m-0">{form.emd || '—'}</dd>
            </dl>
          </section>
          {error ? (
            <p role="alert" className="m-0 rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-3 text-[13px] text-[#991B1B]">{error}</p>
          ) : null}
          <div className="flex gap-2">
            <Link href="/authority/tenders" className="btn btn-secondary flex-1">Cancel</Link>
            <button type="submit" className="btn btn-primary flex-1" disabled={submitting || !detailsDone}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Publish tender
            </button>
          </div>
          {!detailsDone ? <span className="text-[11px] text-fg-3">Fill the required fields (*) to publish.</span> : null}
        </aside>
      </form>
    </PageBody>
  );
}
