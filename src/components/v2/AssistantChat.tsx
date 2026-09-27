'use client';

import { useRef, useState, type FormEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Loader2 } from 'lucide-react';
import { askClausentisAssistant } from '@/lib/actions/assistant';
import type { AssistantChatMessage } from '@/types/auth-roles';

export interface AssistantContextProps {
  tenderId?: string;
  tenderTitle?: string;
  bidId?: string;
  pageContext?: string;
}

export function AssistantChat({
  eyebrow,
  title,
  placeholder,
  suggestions,
  scopeNote,
  context,
}: {
  eyebrow: string;
  title: string;
  placeholder: string;
  suggestions: string[];
  scopeNote: string;
  context?: AssistantContextProps;
}) {
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setError(null);
    const userMsg: AssistantChatMessage = { id: `u-${Date.now()}`, role: 'user', content: q, timestamp: new Date().toISOString() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const reply = await askClausentisAssistant(
        q,
        messages.map((m) => ({ role: m.role, content: m.content })),
        context
      );
      setMessages([...next, reply]);
    } catch {
      setError('The assistant could not answer just now. Try again.');
    } finally {
      setBusy(false);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: 'end' }));
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(input);
  }

  return (
    <div className="-mx-4 -my-6 grid min-h-[calc(100vh-4rem)] grid-cols-1 sm:-mx-6 lg:-mx-10 lg:-my-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section aria-label="Conversation" className="flex min-w-0 flex-col gap-[18px] border-line px-4 py-6 sm:px-6 lg:border-r lg:px-10 lg:py-8">
        <header className="flex flex-col gap-2">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="h1" style={{ fontSize: 26 }}>{title}</h1>
        </header>

        <div className="flex flex-1 flex-col gap-4" aria-live="polite" aria-busy={busy}>
          {messages.length === 0 ? (
            <p className="m-0 max-w-[620px] text-sm text-fg-2">Ask a question or pick a suggestion. Answers cite the records the assistant was given and are advice only.</p>
          ) : null}
          {messages.map((m) =>
            m.role === 'user' ? (
              <div key={m.id} className="max-w-[560px] self-end rounded-lg bg-mark px-3.5 py-3 text-sm text-white">
                <span className="sr-only-v2">You asked: </span>
                {m.content}
              </div>
            ) : (
              <div key={m.id} className="flex max-w-[720px] flex-col gap-2.5">
                <div className="card flex flex-col gap-2.5 p-4 text-sm leading-relaxed [&_li]:my-0.5 [&_ol]:m-0 [&_ol]:pl-5 [&_p]:m-0 [&_table]:text-xs [&_ul]:m-0 [&_ul]:pl-[18px]">
                  <span className="sr-only-v2">Assistant: </span>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
                {m.citations && m.citations.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    <span className="self-center text-[11px] text-fg-3">Cited:</span>
                    {m.citations.map((c, i) => (
                      <span key={i} className="pill pill-neutral" title={c.snippet}>
                        {c.documentName}
                        {c.page ? ` · p.${c.page}` : ''}
                      </span>
                    ))}
                  </div>
                ) : null}
                <span className="text-[11px] text-fg-3">Advice only. The decision stays with the procurement officer.</span>
              </div>
            )
          )}
          {busy ? (
            <span className="inline-flex items-center gap-2 text-[13px] text-fg-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Thinking…
            </span>
          ) : null}
          {error ? <p role="alert" className="m-0 text-[13px] text-[#991B1B]">{error}</p> : null}
          <div ref={endRef} />
        </div>

        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <label htmlFor="ask" className="sr-only-v2">Ask the assistant</label>
          <input id="ask" className="input" style={{ minHeight: 44 }} placeholder={placeholder} value={input} onChange={(e) => setInput(e.target.value)} />
          <button type="submit" className="btn btn-primary" style={{ minHeight: 44 }} disabled={busy || !input.trim()}>
            Ask
          </button>
        </form>
      </section>

      <aside className="flex flex-col gap-4 bg-page px-4 py-6 sm:px-6 lg:py-8">
        <span className="eyebrow">Suggested</span>
        <div className="flex flex-col gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="btn btn-secondary justify-start whitespace-normal py-2.5 text-left font-medium"
              style={{ minHeight: 44 }}
              onClick={() => void ask(s)}
              disabled={busy}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="card flex flex-col gap-1.5 p-3.5 text-xs text-fg-2">
          <span className="label">What the assistant can see</span>
          <span>{scopeNote}</span>
        </div>
      </aside>
    </div>
  );
}
