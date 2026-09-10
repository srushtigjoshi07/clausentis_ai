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

export default function BidderAssistantPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AssistantChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to **Clausentis Bidder AI Assistant**. I am your specialized procurement co-pilot for Indian public procurement (CPPP, GeM, Central PSUs).

I can help you:
- **Interpret RFP Clauses**: Understand technical specs (e.g. API 618 compressor requirements, SIL ratings).
- **Evaluate Pre-Qualification Criteria**: Check if your turnover and experience satisfy mandatory minimums.
- **Verify Exemption Rules**: Claim MSME/MSE turnover and EMD fee exemptions under public procurement policy.
- **Draft Statutory Undertakings**: Generate compliant declarations for Make-in-India (Class-I local supplier) and non-blacklisting.

How can I assist your bid preparation today?`,
      timestamp: 'Ready'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'How do I claim MSME exemption for turnover & EMD?',
    'What are the mandatory clauses in CPCL Gas Compressor tender?',
    'Format for Make-in-India local content declaration',
    'Explain API 618 5th Edition compressor requirements',
    'What happens if our ISO 9001 certificate is under renewal?'
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
      content: text.trim(),
      timestamp: getFormattedTime()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await askClausentisAssistant(
        'bidder',
        text.trim(),
        history,
        {
          pageContext: '/bidder/assistant'
        }
      );

      setMessages(prev => [...prev, response]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: createMessageId('err'),
          role: 'assistant',
          content: 'I encountered an issue processing your query against the procurement knowledgebase. Please try again.',
          timestamp: 'Now'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto pb-4 font-sans bg-white">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] pb-4 pt-1 shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#111111] bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E5E5E5]">
            PROCUREMENT CO-PILOT
          </span>
          <span className="text-[#777777] text-xs">&bull;</span>
          <span className="text-[#555555] text-xs font-mono">Groq LLaMA 3.3 70B</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#111111]">
          Clausentis Bidder Assistant
        </h1>
        <p className="text-xs text-[#555555] mt-0.5">
          Autonomous procurement intelligence, clause analysis, and bid qualification guidance.
        </p>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 text-xs leading-relaxed ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-[#111111] text-white flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div className={`max-w-2xl rounded-xl p-4 border ${
              msg.role === 'user'
                ? 'bg-[#111111] text-white border-[#111111]'
                : 'bg-white text-[#111111] border-[#E5E5E5] shadow-2xs'
            }`}>
              <MarkdownRenderer
                content={msg.content}
                isUser={msg.role === 'user'}
              />

              {/* Citations if any */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[#E5E5E5] space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-[#777777] font-semibold">Regulatory Citations</span>
                  <div className="space-y-1">
                    {msg.citations.map((c, idx) => (
                      <div key={idx} className="p-2 rounded bg-[#F7F7F7] border border-[#E5E5E5] text-[11px] text-[#555555]">
                        <span className="font-semibold text-[#111111]">{c.documentName}{c.page ? ` (p. ${c.page})` : ''}:</span> {c.snippet}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={`text-[10px] font-mono mt-2 text-right ${msg.role === 'user' ? 'text-white/60' : 'text-[#777777]'}`}>
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 text-xs items-center text-[#777777]">
            <div className="w-7 h-7 rounded-lg bg-[#111111] text-white flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="p-3 rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#111111]" />
              <span>Analyzing procurement guidelines and tender database...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="py-2 shrink-0 border-t border-[#E5E5E5]">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 text-xs">
          <span className="text-[10px] font-mono uppercase text-[#777777] shrink-0">Prompts:</span>
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="whitespace-nowrap px-2.5 py-1 rounded-md bg-[#F7F7F7] hover:bg-[#E5E5E5] border border-[#E5E5E5] text-[11px] text-[#111111] transition-colors cursor-pointer shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="shrink-0 pt-1">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-white border border-[#E5E5E5] rounded-xl p-1.5 shadow-2xs focus-within:border-[#111111] transition-colors"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about qualification criteria, EMD exemptions, clause requirements..."
            disabled={loading}
            className="flex-1 px-3 py-2 text-xs text-[#111111] placeholder:text-[#777777] focus:outline-none bg-transparent"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!input.trim() || loading}
            className="h-8 px-3 bg-[#111111] hover:bg-[#222222] text-white text-xs gap-1.5 shrink-0"
          >
            <span>Send</span>
            <Send className="w-3 h-3" />
          </Button>
        </form>
      </div>
    </div>
  );
}
