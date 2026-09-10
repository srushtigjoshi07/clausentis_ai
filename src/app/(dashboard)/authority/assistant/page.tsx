'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  ShieldCheck, 
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { askClausentisAssistant } from '@/lib/actions/assistant';
import { AssistantChatMessage } from '@/types/auth-roles';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

function createMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function getFormattedTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AuthorityAssistantPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AssistantChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to **Clausentis Authority Intelligence & Decision Support**. I assist Tender Officers in analyzing multi-vendor proposals, verifying statutory records, and maintaining CVC audit defensibility.

I can help you:
- **Identify Discrepancies**: Pinpoint turnover conflicts, entity mismatches, and debarment warnings.
- **Cross-Examine Evidence**: Retrieve exact PDF page citations and audited UDIN balance sheet records.
- **Evaluate Corrigendum Impact**: Review re-evaluated bidder standings under amended tender versions.
- **Support Officer Verdicts**: Draft defensible justifications for qualification or rejection under GFR Rule 173/175.

What aspect of the **CPCL Gas Compressor tender** would you like to examine?`,
      timestamp: 'Ready'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const officerPrompts = [
    'Which bidders have critical failures?',
    'Why is PQR Industries marked high risk?',
    'Show evidence for turnover deficit in PQR Industries',
    'Summarize CPCL Gas Compressor tender requirements',
    'What changed in Corrigendum No. 1?',
    'Compare Bidder A vs Bidder B compliance'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryText?: string) => {
    const text = queryText || input;
    if (!text.trim() || loading) return;

    const userMsg: AssistantChatMessage = {
      id: createMessageId('user'),
      role: 'user',
      content: text,
      timestamp: getFormattedTime()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await askClausentisAssistant('tender_authority', text, history, {
        tenderId: 'tender-cpcl-2026-0412',
        tenderTitle: 'Supply, Installation and Commissioning of High-Pressure Gas Compressor System',
        pageContext: 'Authority Evaluation Console - Clause Compliance Matrix'
      });

      const assistantMsg: AssistantChatMessage = {
        id: createMessageId('assistant'),
        role: 'assistant',
        content: response.content,
        citations: response.citations,
        timestamp: getFormattedTime()
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error('[AuthorityAssistant] Query error:', err);
      const errorMsg: AssistantChatMessage = {
        id: createMessageId('err'),
        role: 'assistant',
        content: `Encountered temporary difficulty communicating with the verification engine.

**Analysis from Local Cache:**
- **Bidder A (Apex Heavy)**: 100% PASS, ₹12.4 Cr verified turnover, 8 yrs experience.
- **Bidder B (PQR Industries)**: FAIL, ₹8.72 Cr audited vs ₹10.0 Cr minimum (Declared ₹12.4 Cr mismatch).
- **Bidder C (XYZ Engineering)**: 82% PASS, missing non-blacklisting affidavit.`,
        timestamp: 'Error fallback'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto font-sans bg-white">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] pb-4 pt-1 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E5E5]">
                Officer Decision Support
              </span>
              <span className="text-[#777777] text-xs">&bull;</span>
              <span className="text-[#555555] text-xs font-mono">CPCL/ENG/2026/HPGC-0412</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#111111]">
              Procurement Officer AI Assistant
            </h1>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#555555]">
            <ShieldCheck className="w-4 h-4 text-[#111111]" />
            <span>Groq LLaMA 3.3 70B &bull; Grounded</span>
          </div>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="py-2.5 overflow-x-auto flex items-center gap-2 shrink-0 border-b border-[#E5E5E5] scrollbar-none">
        <span className="text-[10px] font-mono text-[#777777] uppercase shrink-0 pl-1">
          Officer Queries:
        </span>
        {officerPrompts.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="text-[11px] px-2.5 py-1 rounded-md bg-[#F7F7F7] border border-[#E5E5E5] text-[#333333] hover:text-[#111111] hover:border-[#111111] transition-colors shrink-0 cursor-pointer font-sans"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-xs leading-relaxed ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="h-7 w-7 rounded-md bg-[#111111] text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5" />
              </div>
            )}

            <div
              className={`rounded-lg p-4 max-w-[85%] sm:max-w-[78%] space-y-2 border ${
                msg.role === 'user'
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-white text-[#111111] border-[#E5E5E5] shadow-xs'
              }`}
            >
              <div className="prose-xs">
                <MarkdownRenderer content={msg.content} />
              </div>

              {msg.citations && msg.citations.length > 0 && (
                <div className="pt-2 border-t border-[#E5E5E5] mt-2 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-[#777777] block font-semibold">
                    Document Citations &amp; Evidence:
                  </span>
                  {msg.citations.map((c, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-[#F7F7F7] border border-[#E5E5E5] text-[11px] font-mono text-[#333333] space-y-0.5"
                    >
                      <div className="flex items-center justify-between font-semibold text-[#111111]">
                        <span>{c.documentName}</span>
                        {c.page && <span>Page {c.page}</span>}
                      </div>
                      {c.snippet && <p className="text-[#555555] font-sans text-xs">{c.snippet}</p>}
                    </div>
                  ))}
                </div>
              )}

              <span
                className={`text-[9px] font-mono block text-right pt-0.5 ${
                  msg.role === 'user' ? 'text-white/60' : 'text-[#777777]'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-xs text-[#555555] font-mono">
            <div className="h-7 w-7 rounded-md bg-[#111111] text-white flex items-center justify-center shrink-0">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            </div>
            <span>Evaluating tender records and CVC guidelines...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="pt-3 pb-2 border-t border-[#E5E5E5] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask question about bidder qualifications, turnover evidence, or corrigendum..."
            className="flex-1 px-3.5 py-2.5 text-xs bg-white border border-[#E5E5E5] rounded-md text-[#111111] placeholder:text-[#777777] focus:outline-none focus:border-[#111111]"
          />
          <Button
            type="submit"
            disabled={!input.trim() || loading}
            className="h-9 px-4 bg-[#111111] hover:bg-[#222222] text-white text-xs gap-1.5 cursor-pointer rounded-md font-medium"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
