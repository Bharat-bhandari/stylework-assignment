import { z } from 'zod';
import { env } from '../../config/env.js';
import { fieldDataSchema } from '../../schema/metaWebhook.schema.js';
import type { LeadDetailsProvider } from './index.js';

const REQUEST_TIMEOUT_MS = 10_000;

const LEAD_FIELDS =
  'id,created_time,ad_id,ad_name,adset_id,campaign_id,form_id,platform,is_organic,field_data';

const graphLeadSchema = z.object({
  id: z.string(),
  created_time: z.string(),
  ad_id: z.string().optional(),
  ad_name: z.string().optional(),
  adset_id: z.string().optional(),
  campaign_id: z.string().optional(),
  form_id: z.string().optional(),
  platform: z.string().optional(),
  is_organic: z.boolean().optional(),
  field_data: fieldDataSchema.default([]),
});

export const graphLeadProvider: LeadDetailsProvider = {
  fetchLead: async (leadgenId, hint) => {
    if (!env.META_ACCESS_TOKEN) {
      throw new Error('META_ACCESS_TOKEN is required when LEAD_PROVIDER=graph');
    }

    const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/${leadgenId}`);
    url.searchParams.set('fields', LEAD_FIELDS);

    const response = await fetch(url, {
      // The token travels in a header so it never reaches a proxy access log or an error URL.
      headers: { authorization: `Bearer ${env.META_ACCESS_TOKEN}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Graph API responded ${response.status} for lead ${leadgenId}`);
    }

    const lead = graphLeadSchema.parse(await response.json());

    return {
      leadgenId: lead.id,
      formId: lead.form_id ?? hint?.form_id ?? null,
      adId: lead.ad_id ?? hint?.ad_id ?? null,
      campaignId: lead.campaign_id ?? null,
      platform: lead.platform ?? (lead.is_organic === true ? 'organic' : null),
      createdTime: new Date(lead.created_time),
      fieldData: lead.field_data,
      raw: lead,
    };
  },
};
