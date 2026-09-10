'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, FileText } from 'lucide-react';
import { UserRole, AssistantChatMessage } from '@/types/auth-roles';
import { askClausentisAssistant } from '@/lib/actions/assistant';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

function createMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function getFormattedTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface ClausentisAssistantProps {
  role: UserRole;
  tenderId?: string;
  tenderTitle?: string;
}

export function ClausentisAssistant({ role, tenderId, tenderTitle }: ClausentisAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const initialGreeting: AssistantChatMessage = {
    id: 'welcome',
    role: 'assistant',
    content: role === 'bidder'
      ? `Welcome to **Clausentis Bidder Intelligence**. I can verify your company's eligibility against tender requirements, explain missing documents, or analyze recent corrigendums. How can I assist your bid preparation today?`
      : `Welcome to **Clausentis Authority Decision Support**. I can analyze cross-bidder compliance, evaluate disqualification grounds, or verify CVC audit defensibility across submitted tender dossiers. What would you like to review?`,
    timestamp: 'Just now'
  };

  const [messages, setMessages] = useState<AssistantChatMessage[]>([initialGreeting]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const bidderPrompts = [
    'Am I eligible for this tender?',
    'What documents are missing from my vault?',
    'Explain the turnover requirement in simple terms',
    'How do I claim MSME fee exemption?'
  ];

  const authorityPrompts = [
    'Which bidders have critical non-compliances?',
    'Show all bidders with debarment or blacklist flags',
    'Generate tender compliance summary',
    'Compare Bidder A vs Bidder B experience scores'
  ];

  const activePrompts = role === 'bidder' ? bidderPrompts : authorityPrompts;
  const chips = activePrompts;

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: AssistantChatMessage = {
      id: createMessageId('user'),
      role: 'user',
      content: textToSend.trim(),
      timestamp: getFormattedTime()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await askClausentisAssistant(
        role,
        textToSend,
        history,
        {
          tenderId,
          tenderTitle,
          pageContext: typeof window !== 'undefined' ? window.location.pathname : undefined
        }
      );
      setMessages(prev => [...prev, response]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: createMessageId('err'),
          role: 'assistant',
          content: 'I encountered an issue connecting to the AI inference service. Please verify your connection or try again shortly.',
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-lg border border-[#333333] bg-[#111111] text-white hover:bg-[#222222] transition-colors cursor-pointer"
          aria-label="Open Clausentis AI Assistant"
        >
          <span className="h-2 w-2 rounded-full bg-white" />
          <Bot className="w-4 h-4 text-white" />
          <span className="font-semibold text-xs tracking-wider uppercase">
            Clausentis Assistant
          </span>
        </button>
      )}

      {/* Slide-out / Floating Intelligence Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[460px] h-[620px] max-h-[85vh] bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-border flex items-center justify-between bg-[#111111] text-white">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-white/10">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Clausentis Assistant</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-white/20 text-white font-medium">
                    {role === 'bidder' ? 'Bidder AI' : 'Authority AI'}
                  </span>
                </div>
                <p className="text-[10px] text-white/70 font-mono">
                  Llama-3.3-70B • Statutory Bid Intelligence
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close Assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[88%] space-y-1.5 text-xs leading-relaxed",
                  msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                <div
                  className={cn(
                    "p-3.5 rounded-xl",
                    msg.role === 'user'
                      ? "bg-[#111111] text-white rounded-br-none"
                      : "bg-surface border border-border text-foreground rounded-bl-none shadow-sm"
                  )}
                >
                  <MarkdownRenderer
                    content={msg.content}
                    isUser={msg.role === 'user'}
                  />

                  {/* Citations Attached */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-border space-y-1.5">
                      <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                        <FileText className="w-3 h-3 text-foreground" />
                        Verified Document Citations:
                      </p>
                      <div className="grid gap-1.5">
                        {msg.citations.map((cit, cIdx) => (
                          <div
                            key={cIdx}
                            className="text-[10px] bg-background p-2 rounded border border-border flex flex-col gap-0.5"
                          >
                            <div className="flex items-center justify-between font-mono text-foreground font-medium">
                              <span>{cit.documentName}</span>
                              {cit.page && <span>Page {cit.page}</span>}
                            </div>
                            {cit.snippet && (
                              <p className="text-muted-foreground italic line-clamp-2">
                                &ldquo;{cit.snippet}&rdquo;
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[9px] font-mono text-muted-foreground px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-surface p-3 rounded-xl rounded-bl-none border border-border w-fit">
                <Bot className="w-3.5 h-3.5 text-foreground" />
                <span>Clausentis is analyzing statutory clauses...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="px-3 py-2 bg-surface border-t border-border flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {chips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                disabled={loading}
                className="shrink-0 px-2.5 py-1 rounded-full text-[10px] bg-background hover:bg-muted/10 border border-border hover:border-foreground text-muted-foreground hover:text-foreground transition-colors cursor-pointer truncate max-w-[200px]"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-border bg-background flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={role === 'bidder' ? 'Ask about eligibility, documents, clauses...' : 'Ask about bidder disqualifications, audit trails...'}
              className="flex-1 bg-surface border border-border rounded-lg px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors"
              disabled={loading}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || loading}
              className="h-8 w-8 p-0 rounded-lg shrink-0 cursor-pointer bg-[#111111] hover:bg-[#222222] dark:bg-white dark:hover:bg-[#EEEEEE] text-white dark:text-[#111111]"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
