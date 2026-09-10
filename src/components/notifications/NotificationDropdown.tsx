'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Check, ExternalLink, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { NotificationItem } from '@/types/auth-roles';
import { getNotifications, markNotificationAsRead } from '@/lib/actions/notifications';
import Link from 'next/link';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const items = await getNotifications();
        setNotifications(items);
        setUnreadCount(items.filter(i => !i.read).length);
      } catch (e) {
        console.error('Failed to load notifications', e);
      }
    }
    load();
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors cursor-pointer"
        aria-label="View notifications"
      >
        <Bell className="h-4 w-4 stroke-[1.5]" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-[#111111] dark:bg-white" />
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-background border border-border shadow-xl z-50 overflow-hidden">
            <div className="p-3.5 border-b border-border flex items-center justify-between bg-surface">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-foreground" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">Notifications</h4>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#111111] text-white dark:bg-white dark:text-[#111111] font-semibold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="max-h-[380px] overflow-y-auto divide-y divide-border">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No notifications at this time
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3.5 flex items-start gap-3 transition-colors ${
                      notif.read ? 'opacity-70 bg-transparent' : 'bg-surface'
                    } hover:bg-muted/10`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {notif.type === 'alert' && <AlertTriangle className="w-4 h-4 text-[#111111] dark:text-white" />}
                      {notif.type === 'warning' && <AlertTriangle className="w-4 h-4 text-[#111111] dark:text-white" />}
                      {notif.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#111111] dark:text-white" />}
                      {notif.type === 'info' && <Info className="w-4 h-4 text-[#555555] dark:text-[#AAAAAA]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                          {notif.createdAt}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1">
                        {notif.link ? (
                          <Link
                            href={notif.link}
                            onClick={() => setIsOpen(false)}
                            className="text-[10px] font-medium text-foreground hover:underline flex items-center gap-1"
                          >
                            <span>View details</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        ) : <span />}
                        {!notif.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(notif.id, e)}
                            className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark read</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
