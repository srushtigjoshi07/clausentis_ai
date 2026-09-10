'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'border-b border-[#E5E5E5] bg-white/90 backdrop-blur-md shadow-sm' 
        : 'border-b border-[#E5E5E5]/60 bg-white/75 backdrop-blur-md'
    }`}>
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 sm:px-8">
        
        {/* Restrained Editorial Wordmark */}
        <Link href="/" className="flex items-center group">
          <span className="text-sm font-semibold tracking-[0.2em] uppercase text-[#111111] font-sans">
            CLAUSENTIS
          </span>
        </Link>

        {/* Minimal Nav Links */}
        <div className="flex items-center gap-6 text-xs font-normal text-[#555555]">
          <a href="#workspace" className="hover:text-[#111111] transition-colors duration-200">
            Workspace
          </a>
          <a href="#benefits" className="hover:text-[#111111] transition-colors duration-200">
            Benefits
          </a>
        </div>

        {/* Minimal Actions */}
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs text-[#111111] hover:bg-[#F5F5F5] h-8 px-3 transition-colors duration-200">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="text-xs font-medium bg-[#111111] text-white hover:bg-[#222222] h-8 px-3.5 transition-all duration-200 shadow-sm">
              Get Started
            </Button>
          </Link>
        </div>

      </nav>
    </header>
  );
}