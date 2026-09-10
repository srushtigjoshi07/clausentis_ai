'use server';

import { NotificationItem, TenderCorrigendum } from '@/types/auth-roles';

// Pre-seeded dynamic notifications
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    userId: 'demo-user',
    role: 'bidder',
    title: 'Corrigendum No. 1 Published',
    message: 'Tender CPCL/ENG/2026/089: Bid submission deadline extended to 18-Sep-2026 15:00 IST.',
    type: 'warning',
    read: false,
    link: '/bidder/tenders',
    createdAt: '10 minutes ago'
  },
  {
    id: 'notif-2',
    userId: 'demo-user',
    role: 'bidder',
    title: 'Bid Compliance Verification Complete',
    message: 'Your bid dossier for Offshore Pipeline Maintenance scored 94.2% compliance (Stage 4 passed).',
    type: 'success',
    read: false,
    link: '/bidder/bids',
    createdAt: '1 hour ago'
  },
  {
    id: 'notif-3',
    userId: 'demo-user',
    role: 'tender_authority',
    title: 'New Bid Dossier Received',
    message: 'Apex Heavy Engineering has submitted technical and financial covers for CPCL/ENG/2026/089.',
    type: 'info',
    read: false,
    link: '/authority/bids',
    createdAt: '2 hours ago'
  },
  {
    id: 'notif-4',
    userId: 'demo-user',
    role: 'tender_authority',
    title: 'Critical Disqualification Alert',
    message: 'Vertex Marine Infrastructure bid contains expired ISO 45001 certification. Clarification advised.',
    type: 'alert',
    read: false,
    link: '/authority/tenders/tender-cpcl-089/compare-bids',
    createdAt: '3 hours ago'
  }
];

export async function getNotifications(role?: 'bidder' | 'tender_authority'): Promise<NotificationItem[]> {
  if (!role) return MOCK_NOTIFICATIONS;
  return MOCK_NOTIFICATIONS.filter(n => n.role === role);
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const notif = MOCK_NOTIFICATIONS.find(n => n.id === id);
  if (notif) {
    notif.read = true;
  }
}

export async function getTenderCorrigendums(tenderId: string): Promise<TenderCorrigendum[]> {
  return [
    {
      id: 'corr-01',
      tenderId,
      corrigendumNumber: 1,
      title: 'Corrigendum No. 1: Amendment to EMD & Submission Timeline',
      summary: 'Extended submission timeline to 18-Sep-2026 15:00 IST. Bank Guarantee confirmation via SFMS code MT760COV is now strictly mandatory.',
      affectedClauses: ['Clause 7.1: Earnest Money Deposit Format', 'Clause 12.3: Bid Submission Timetable'],
      publishedAt: '04-Sep-2026 11:30 IST',
      isAcknowledged: false
    }
  ];
}
