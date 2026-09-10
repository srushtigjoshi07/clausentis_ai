'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  FileCheck2, 
  History, 
  Settings, 
  LogOut,
  X,
  ShieldCheck, 
  Building2,
  ArrowRightLeft,
  Files,
  BarChart3,
  Bot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout, switchRole } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';

const routes = [
  { name: 'Dashboard', path: '/authority/dashboard', icon: LayoutDashboard },
  { name: 'Tenders', path: '/authority/tenders', icon: FileText },
  { name: 'Submitted Bids', path: '/authority/bids', icon: FileCheck2 },
  { name: 'Compliance', path: '/authority/compliance', icon: ShieldCheck },
  { name: 'Documents', path: '/authority/documents', icon: Files },
  { name: 'Reports', path: '/authority/reports', icon: BarChart3 },
  { name: 'Audit Trail', path: '/authority/audit', icon: History },
  { name: 'AI Assistant', path: '/authority/assistant', icon: Bot },
  { name: 'Settings', path: '/authority/settings', icon: Settings },
];

export function AuthoritySidebarContent({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <>
      {/* Brand Header */}
      <div className="flex h-16 items-center border-b border-border px-6 justify-between">
        <Link href="/authority/dashboard" className="flex items-center text-foreground" onClick={onClose}>
          <span className="text-sm font-semibold tracking-[0.2em] uppercase font-sans">
            CLAUSENTIS
          </span>
        </Link>
        {onClose && (
          <button 
            onClick={onClose} 
            className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors" 
            aria-label="Close menu"
          >
            <X className="h-5 w-5 stroke-[1.5]" />
          </button>
        )}
      </div>

      {/* Role Badge */}
      <div className="px-4 pt-4">
        <div className="p-3 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#111111] font-semibold flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#111111]" />
              Tender Authority
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" />
          </div>
          <p className="font-medium text-[#111111] text-xs mt-1.5 truncate">
            CPCL Procurement Cell
          </p>
          <p className="text-[11px] text-[#555555] font-mono truncate">
            Org ID: CPCL-REF-2026-HQ
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-widest text-[#555555]">
          AUTHORITY PORTAL
        </div>
        <nav className="grid gap-1">
          {routes.map((route) => {
            const isActive = pathname === route.path || (route.path !== '/authority/dashboard' && pathname.startsWith(route.path));
            const Icon = route.icon;

            return (
              <Link
                key={route.path}
                href={route.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3.5 py-2 text-sm transition-colors relative",
                  isActive 
                    ? "bg-[#F5F5F5] border border-[#E5E5E5] text-[#111111] font-medium" 
                    : "text-[#555555] hover:bg-[#FAFAFA] hover:text-[#111111] font-normal border border-transparent"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0 stroke-[1.5]", isActive ? "text-[#111111]" : "text-[#555555]")} />
                <span>{route.name}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#111111]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Role Switcher Demo Action */}
      <div className="p-3 border-t border-border space-y-2">
        <button
          type="button"
          onClick={() => switchRole('bidder')}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#FAFAFA] border border-[#E5E5E5] text-xs text-[#555555] hover:text-[#111111] hover:border-[#CCCCCC] transition-colors cursor-pointer"
          title="Switch role for demo grading"
        >
          <ArrowRightLeft className="w-3.5 h-3.5 text-[#111111]" />
          <span>Switch to Bidder</span>
        </button>

        <form action={logout}>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-xs font-normal text-[#555555] hover:text-[#111111] hover:bg-[#FAFAFA] h-8" 
            type="submit"
          >
            <LogOut className="h-3.5 w-3.5 stroke-[1.5]" />
            Sign Out
          </Button>
        </form>
      </div>
    </>
  );
}

export function AuthoritySidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex h-full w-64 flex-col border-r border-[#E5E5E5] bg-white z-20 select-none shrink-0">
      <AuthoritySidebarContent pathname={pathname} />
    </aside>
  );
}
