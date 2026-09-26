import type { Prisma } from '@prisma/client';
import { env } from '../../config/env.js';
import type { FieldData, LeadgenChangeValue } from '../../schema/metaWebhook.schema.js';
import { graphLeadProvider } from './graph.js';
import { mockLeadProvider } from './mock.js';

export type LeadDetails = {
  leadgenId: string;
  formId: string | null;
  adId: string | null;
  campaignId: string | null;
  platform: string | null;
  createdTime: Date;
  fieldData: FieldData;
  raw: Prisma.InputJsonValue;
};

export interface LeadDetailsProvider {
  fetchLead: (leadgenId: string, hint?: LeadgenChangeValue) => Promise<LeadDetails>;
}

export const getLeadProvider = (): LeadDetailsProvider =>
  env.LEAD_PROVIDER === 'graph' ? graphLeadProvider : mockLeadProvider;
