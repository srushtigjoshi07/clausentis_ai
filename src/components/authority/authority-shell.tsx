'use client';

import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { AuthoritySidebar, AuthoritySidebarContent } from './authority-sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { ClausentisAssistant } from '@/components/ai/ClausentisAssistant';

interface AuthorityShellProps {
  user: User | null;
  children: React.ReactNode;
}

export function AuthorityShell({ user, children }: AuthorityShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-white text-[#111111] overflow-hidden antialiased font-sans relative">
      {/* Desktop Sidebar */}
      <AuthoritySidebar />

      {/* Static Mobile Drawer (No decorative animations) */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className="fixed inset-y-0 left-0 w-72 flex flex-col bg-white border-r border-[#E5E5E5] z-50 md:hidden shadow-lg"
          >
            <AuthoritySidebarContent 
              pathname={typeof window !== 'undefined' ? window.location.pathname : '/authority/dashboard'} 
              onClose={() => setMobileMenuOpen(false)} 
            />
          </aside>
        </>
      )}

      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col overflow-hidden bg-transparent z-10">
        <Topbar user={user} onMenuToggle={() => setMobileMenuOpen(true)} />
        <main 
          id="authority-main-scroll"
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative bg-white"
        >
          {children}
        </main>
      </div>

      {/* Global Context-Aware Clausentis Assistant */}
      <ClausentisAssistant role="tender_authority" />
    </div>
  );
}
