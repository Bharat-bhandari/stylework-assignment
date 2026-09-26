export const LEAD_STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type ActivityType = 'LEAD_CREATED' | 'LEAD_UPDATED' | 'STATUS_CHANGED';

export type Lead = {
  id: string;
  metaLeadId: string;
  pageId: string;
  formId: string;
  adId: string | null;
  campaignId: string | null;
  platform: string | null;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  answers: Record<string, string>;
  isTest: boolean;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
};

export type LeadFieldChange = { from: unknown; to: unknown };

export type LeadActivity = {
  id: string;
  leadId: string;
  type: ActivityType;
  actor: string;
  fromStatus: LeadStatus | null;
  toStatus: LeadStatus | null;
  changes: Record<string, unknown> | null;
  createdAt: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type LeadListResult = {
  leads: Lead[];
  pagination: Pagination;
};

export type LeadDetail = {
  lead: Lead & { rawData: unknown };
  activities: LeadActivity[];
  allowedNextStatuses: LeadStatus[];
};

export type LeadStatusUpdate = {
  lead: Lead;
  allowedNextStatuses: LeadStatus[];
};

export type Health = {
  database: string;
  uptimeSeconds: number;
  demoTools: boolean;
};
