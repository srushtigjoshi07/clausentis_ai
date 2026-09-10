export interface Profile {
  id: string;
  email: string;
  fullName?: string;
  companyName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  userId?: string;
  tenderId?: string;
  eventType: string;
  eventData?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
