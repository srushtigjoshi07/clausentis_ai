'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

export function MarkdownRenderer({ content, className, isUser = false }: MarkdownRendererProps) {
  if (!content) return null;

  return (
    <div className={cn("text-xs leading-relaxed space-y-2", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className={cn("text-base font-semibold tracking-tight mt-3 mb-1.5 first:mt-0", isUser ? "text-white" : "text-[#111111]")}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={cn("text-sm font-semibold tracking-tight mt-2.5 mb-1 first:mt-0", isUser ? "text-white" : "text-[#111111]")}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={cn("text-xs font-semibold uppercase tracking-wider mt-2 mb-1 first:mt-0", isUser ? "text-white/90" : "text-[#111111]")}>
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className={cn("text-xs font-semibold mt-1.5 mb-0.5 first:mt-0", isUser ? "text-white/90" : "text-[#111111]")}>
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className={cn("leading-relaxed my-1.5 first:mt-0 last:mb-0", isUser ? "text-white" : "text-[#333333]")}>
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className={cn("font-semibold", isUser ? "text-white" : "text-[#111111]")}>
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className={cn("list-disc pl-4 space-y-1 my-1.5", isUser ? "text-white/90" : "text-[#444444]")}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className={cn("list-decimal pl-4 space-y-1 my-1.5", isUser ? "text-white/90" : "text-[#444444]")}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className={cn(
              "border-l-2 pl-3 py-0.5 my-2 italic text-[11px]",
              isUser ? "border-white/40 text-white/80" : "border-[#111111] text-[#555555] bg-[#F9F9F9] rounded-r"
            )}>
              {children}
            </blockquote>
          ),
          code: ({ inline, className: codeClassName, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) => {
            if (inline) {
              return (
                <code
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[11px] font-mono",
                    isUser ? "bg-white/20 text-white" : "bg-[#F3F3F3] text-[#111111] border border-[#E5E5E5]",
                    codeClassName
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-3 rounded-lg bg-[#111111] text-white text-[11px] font-mono overflow-x-auto my-2.5 border border-[#333333]">
                <code {...props}>{children}</code>
              </pre>
            );
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 border border-[#E5E5E5] rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#F7F7F7] border-b border-[#E5E5E5] font-mono text-[10px] uppercase text-[#777777]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[#E5E5E5]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-[#FAFAFA] transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-semibold text-[#111111]">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-[#444444]">{children}</td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn("underline underline-offset-2 font-medium hover:opacity-85", isUser ? "text-white" : "text-[#111111]")}
            >
              {children}
            </a>
          ),
          hr: () => (
            <hr className={cn("my-3 border-t", isUser ? "border-white/20" : "border-[#E5E5E5]")} />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
