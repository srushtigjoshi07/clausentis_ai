'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Sidebar, MobileSidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';

interface DashboardShellProps {
  user: User | null;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-white text-[#111111] overflow-hidden antialiased font-sans relative">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer Sidebar */}
      <MobileSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col overflow-hidden z-10">
        <Topbar user={user} onMenuToggle={() => setMobileMenuOpen(true)} />
        <main 
          id="dashboard-main-scroll"
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative bg-white"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
