import type { MetaWebhookPayload } from '../schema/metaWebhook.schema.js';

type LeadgenPayloadOptions = {
  leadgenId: string;
  pageId: string;
  formId: string;
  adId?: string;
  adgroupId?: string;
  createdTime?: number;
  fields?: Record<string, string>;
};

export const buildLeadgenPayload = ({
  leadgenId,
  pageId,
  formId,
  adId,
  adgroupId,
  createdTime = Math.floor(Date.now() / 1000),
  fields,
}: LeadgenPayloadOptions): MetaWebhookPayload => ({
  object: 'page',
  entry: [
    {
      id: pageId,
      time: createdTime,
      changes: [
        {
          field: 'leadgen',
          value: {
            leadgen_id: leadgenId,
            page_id: pageId,
            form_id: formId,
            ...(adId === undefined ? {} : { ad_id: adId }),
            ...(adgroupId === undefined ? {} : { adgroup_id: adgroupId }),
            created_time: createdTime,
            ...(fields === undefined
              ? {}
              : {
                  field_data: Object.entries(fields).map(([name, value]) => ({
                    name,
                    values: [value],
                  })),
                }),
          },
        },
      ],
    },
  ],
});
