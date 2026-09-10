'use client';

import { User } from '@supabase/supabase-js';
import { usePathname } from 'next/navigation';
import { LanguageSelector } from '@/components/layout/language-selector';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { Menu } from 'lucide-react';
import Link from 'next/link';

export function Topbar({ user, onMenuToggle }: { user: User | null; onMenuToggle?: () => void }) {
  const pathname = usePathname();
  const isBidder = pathname.startsWith('/bidder');
  const isAuthority = pathname.startsWith('/authority');

  const email = user?.email;
  const fullName = user?.user_metadata?.full_name;
  const displayName = fullName || (isBidder ? 'Apex Bid Lead' : isAuthority ? 'Command Officer' : 'Procurement Officer');
  const initial = displayName.charAt(0).toUpperCase();

  const settingsHref = isBidder ? '/bidder/settings' : '/settings';
  const homeHref = isBidder ? '/bidder/dashboard' : isAuthority ? '/authority/dashboard' : '/dashboard';

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#E5E5E5] bg-white px-4 sm:px-6 sticky top-0 z-30 select-none font-sans">
      
      {/* Left Title & Breadcrumb Status */}
      <div className="flex items-center gap-2.5 text-xs sm:text-sm">
        {/* Mobile hamburger */}
        {onMenuToggle && (
          <button 
            onClick={onMenuToggle}
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg text-[#555555] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors -ml-1 mr-1"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5 stroke-[1.5]" />
          </button>
        )}

        {/* Mobile Brand Wordmark (hidden on desktop because sidebar already displays CLAUSENTIS) */}
        <Link href={homeHref} className="md:hidden flex items-center text-[#111111] hover:opacity-80 transition-opacity">
          <span className="text-xs font-semibold tracking-[0.2em] uppercase font-sans">
            CLAUSENTIS
          </span>
        </Link>

        {/* Desktop Breadcrumb Workspace Label (replaces duplicate CLAUSENTIS branding) */}
        <div className="hidden md:flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#777777]">
            {isBidder ? 'BIDDER WORKSPACE' : isAuthority ? 'AUTHORITY PORTAL' : 'PROCUREMENT COMMAND'}
          </span>
          <span className="text-[#E5E5E5]">&bull;</span>
          <span className="text-xs text-[#555555] font-light tracking-wide">
            {isBidder ? 'Apex Heavy Engineering Pvt Ltd' : isAuthority ? 'CPCL Procurement Cell' : 'Clausentis Platform'}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Real-time Notifications */}
        <NotificationDropdown />

        {/* Dark / Light Theme Toggle */}
        <ThemeToggle />

        {/* Global Language Selector */}
        <LanguageSelector />

        {/* User Profile Badge */}
        <Link href={settingsHref} className="flex items-center gap-3 pl-3 border-l border-[#E5E5E5] group">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[13px] font-normal leading-none text-[#111111]">
              {displayName}
            </span>
            <span className="text-xs font-light text-[#555555] mt-1 max-w-[150px] truncate">
              {email}
            </span>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F5] text-[#111111] font-medium text-xs border border-[#E5E5E5] group-hover:border-[#999999] transition-colors">
            {initial}
          </div>
        </Link>
      </div>

    </header>
  );
}