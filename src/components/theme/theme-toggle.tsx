'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
        theme === 'dark'
          ? 'bg-neutral-900/90 text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-white'
          : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100 hover:text-neutral-900 shadow-sm'
      } ${className}`}
      title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <>
          <Moon className="w-3.5 h-3.5 text-neutral-400 stroke-[2]" />
          <span>☾ Dark</span>
        </>
      ) : (
        <>
          <Sun className="w-3.5 h-3.5 text-neutral-500 stroke-[2]" />
          <span>☀ Light</span>
        </>
      )}
    </button>
  );
}
