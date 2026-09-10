'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Files, 
  BarChart3, 
  Settings, 
  LogOut,
  X,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logout } from '@/app/auth/actions';
import { Button } from '@/components/ui/button';

const routes = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Find Tenders', path: '/tenders/discover', icon: Search },
  { name: 'Tenders', path: '/tenders', icon: FileText },
  { name: 'Documents', path: '/documents', icon: Files },
  { name: 'Reports', path: '/reports', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

function SidebarContent({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <>
      {/* Brand Header */}
      <div className="flex h-16 items-center border-b border-[#E5E5E5] px-6 gap-3 justify-between">
        <Link href="/dashboard" className="flex items-center text-[#111111]" onClick={onClose}>
          <span className="text-sm font-semibold tracking-[0.2em] uppercase font-sans">
            CLAUSENTIS
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="md:hidden flex items-center justify-center h-8 w-8 rounded-lg text-[#555555] hover:text-[#111111] hover:bg-[#F7F7F7] transition-colors" aria-label="Close menu">
            <X className="h-5 w-5 stroke-[1.5]" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-3">
        <div className="px-3 mb-3 text-[10px] font-mono uppercase tracking-widest text-[#777777]">
          NAVIGATION
        </div>
        <nav className="grid gap-1">
          {routes.map((route) => {
            const isActive = pathname === route.path || (route.path !== '/dashboard' && pathname.startsWith(route.path));
            const Icon = route.icon;

            return (
              <Link
                key={route.path}
                href={route.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm transition-colors relative",
                  isActive 
                    ? "bg-[#F5F5F5] border border-[#E5E5E5] text-[#111111] font-medium" 
                    : "text-[#555555] hover:bg-[#F7F7F7] hover:text-[#111111] font-normal border border-transparent"
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

      {/* Sign Out Footer */}
      <div className="border-t border-[#E5E5E5] p-4">
        <form action={logout}>
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-xs sm:text-sm font-normal text-[#555555] hover:text-[#111111] hover:bg-[#F7F7F7] h-9" 
            type="submit"
          >
            <LogOut className="h-4 w-4 stroke-[1.5]" />
            Sign Out
          </Button>
        </form>
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex h-full w-64 flex-col border-r border-[#E5E5E5] bg-white z-20 select-none shrink-0">
      <SidebarContent pathname={pathname} />
    </aside>
  );
}

export function MobileSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className="fixed inset-y-0 left-0 w-72 flex flex-col bg-white border-r border-[#E5E5E5] z-50 md:hidden shadow-lg"
      >
        <SidebarContent pathname={pathname} onClose={onClose} />
      </aside>
    </>
  );
}