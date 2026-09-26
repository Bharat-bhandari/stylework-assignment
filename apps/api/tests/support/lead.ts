import type { Lead, LeadActivity, LeadStatus } from '@prisma/client';
import type { Response } from 'supertest';
import { prismaClient } from '../../src/config/db.js';
import { AD_ID, FORM_ID, PAGE_ID } from './webhook.js';

type Serialised<T> = Omit<T, 'createdAt' | 'updatedAt'> & { createdAt: string; updatedAt?: string };

export type LeadRow = Serialised<Omit<Lead, 'rawData'>>;
export type ActivityRow = Serialised<LeadActivity>;

export type LeadListData = {
  leads: LeadRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export type LeadDetailData = {
  lead: LeadRow;
  activities: ActivityRow[];
  allowedNextStatuses: LeadStatus[];
};

export type LeadStatusData = { lead: LeadRow; allowedNextStatuses: LeadStatus[] };

export type ErrorBody = {
  success: boolean;
  message: string;
  errors: { path: string; message: string }[];
  data?: { allowedNextStatuses: LeadStatus[] };
};

export const dataOf = <T>(response: Response): T => (response.body as { data: T }).data;

export const errorOf = (response: Response): ErrorBody => response.body as ErrorBody;

type SeedLead = {
  fullName?: string;
  email?: string;
  phone?: string;
  status?: LeadStatus;
  isTest?: boolean;
};

let sequence = 0;

export const seedLead = (lead: SeedLead = {}): Promise<Lead> => {
  sequence += 1;

  return prismaClient.lead.create({
    data: {
      metaLeadId: `seed-${sequence}`,
      pageId: PAGE_ID,
      formId: FORM_ID,
      adId: AD_ID,
      campaignId: '384756102938475',
      platform: 'fb',
      fullName: lead.fullName ?? 'Arjun Menon',
      email: lead.email ?? 'arjun.menon@example.com',
      phone: lead.phone ?? '+919845012345',
      answers: { city: 'Bengaluru' },
      rawData: {},
      status: lead.status ?? 'NEW',
      isTest: lead.isTest ?? false,
      // Distinct, increasing timestamps so the createdAt ordering is unambiguous.
      createdAt: new Date(Date.UTC(2026, 0, 1) + sequence * 60_000),
    },
  });
};

export const activitiesOf = (leadId: string): Promise<LeadActivity[]> =>
  prismaClient.leadActivity.findMany({ where: { leadId }, orderBy: { createdAt: 'asc' } });
