'use client';

/** Document vault actions: upload to the bidder's storage folder, open, delete. */
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createBidderDocument, deleteBidderDocument, getBidderDocumentSignedUrl, type BidderDocumentRow } from '@/lib/actions/documents';
import { EmptyState } from '../ui';

export const VAULT_CATEGORIES: Array<{ id: string; label: string }> = [
  { id: 'financial_statement', label: 'Audited financials & CA certificate' },
  { id: 'experience_certificate', label: 'Work orders & completion certificates' },
  { id: 'tax_document', label: 'GST, PAN, Udyam & tax registrations' },
  { id: 'quality_certification', label: 'ISO & quality certificates' },
  { id: 'affidavit', label: 'Affidavits & declarations' },
  { id: 'oem_authorization', label: 'OEM authorizations' },
  { id: 'other', label: 'Other' },
];

const ALLOWED = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];

export function VaultUpload() {
  const router = useRouter();
  const [category, setCategory] = useState('financial_statement');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);
    setDone(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED.includes(ext)) return setError('Upload a PDF, DOC, DOCX, PNG or JPG file.');
    if (file.size === 0) return setError('That file is empty.');
    if (file.size > 25 * 1024 * 1024) return setError('Files can be up to 25 MB.');
    setBusy(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in again to upload.');
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: storageError } = await supabase.storage.from('bidder-documents').upload(path, file);
      if (storageError) throw new Error(storageError.message || 'Upload failed.');
      await createBidderDocument({ file_name: file.name, document_type: category, file_path: path, file_size_bytes: file.size });
      setDone(`${file.name} added to your vault.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="vault-cat" className="label">Document type</label>
        <select id="vault-cat" className="input sm:w-[280px]" value={category} onChange={(e) => setCategory(e.target.value)}>
          {VAULT_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>
      <button type="button" className="btn btn-primary" disabled={busy} onClick={() => input.current?.click()}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        Upload document
      </button>
      <input
        id="vault-file"
        ref={input}
        type="file"
        aria-label="Choose a document to upload"
        tabIndex={-1}
        className="sr-only-v2"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
        disabled={busy}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
      <span role="status" aria-live="polite" className="text-xs">
        {error ? <span className="text-[#991B1B]">{error}</span> : done ? <span className="text-pass">{done}</span> : null}
      </span>
    </div>
  );
}

export function VaultTable({ docs }: { docs: BidderDocumentRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const label = (id: string) => VAULT_CATEGORIES.find((c) => c.id === id)?.label ?? id.replace(/_/g, ' ');

  if (!docs.length) {
    return (
      <div className="p-5">
        <EmptyState title="Your vault is empty">Upload registrations, financials and certificates once and reuse them in every bid.</EmptyState>
      </div>
    );
  }

  return (
    <>
      {error ? <p role="alert" className="m-0 px-5 pt-3 text-[13px] text-[#991B1B]">{error}</p> : null}
      <table className="w-full min-w-[760px] border-collapse text-xs">
        <thead>
          <tr className="border-b border-line bg-page text-left">
            <th scope="col" className="th px-5 py-3">Document</th>
            <th scope="col" className="th px-3 py-3">Type</th>
            <th scope="col" className="th px-3 py-3">Uploaded</th>
            <th scope="col" className="th px-3 py-3">Valid until</th>
            <th scope="col" className="th px-5 py-3"><span className="sr-only-v2">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id} className="tr">
              <td className="mono break-all px-5 py-2.5">{d.file_name}</td>
              <td className="px-3 py-2.5 text-fg-4">{label(d.document_type)}</td>
              <td className="px-3 py-2.5">{d.created_at ? new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
              <td className="px-3 py-2.5 text-fg-3">Not recorded</td>
              <td className="px-5 py-2.5">
                <span className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={async () => {
                      setError(null);
                      const url = await getBidderDocumentSignedUrl(d.file_path);
                      if (url) window.open(url, '_blank', 'noopener');
                      else setError('Could not open that document.');
                    }}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md text-fg-2 hover:bg-page hover:text-fail"
                    aria-label={`Delete ${d.file_name}`}
                    disabled={pending === d.id}
                    onClick={async () => {
                      if (!confirm(`Remove ${d.file_name} from your vault?`)) return;
                      setPending(d.id);
                      await deleteBidderDocument(d.id);
                      setPending(null);
                      router.refresh();
                    }}
                  >
                    {pending === d.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
