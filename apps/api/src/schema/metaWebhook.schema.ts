import { z } from 'zod';

export const fieldDataSchema = z.array(
  z.object({
    name: z.string(),
    values: z.array(z.string()),
  }),
);

export const leadgenChangeValueSchema = z.object({
  leadgen_id: z.string().min(1),
  page_id: z.string().min(1),
  form_id: z.string().min(1),
  ad_id: z.string().optional(),
  adgroup_id: z.string().optional(),
  created_time: z.number().int().nonnegative(),
  // Meta itself never sends this; a caller may inline it so no Graph API call is needed.
  field_data: fieldDataSchema.optional(),
});

export const metaWebhookPayloadSchema = z.object({
  object: z.literal('page'),
  entry: z
    .array(
      z.object({
        id: z.string().optional(),
        time: z.number().optional(),
        // Other subscribed fields arrive on the same endpoint, so `value` stays loose here
        // and only leadgen changes are validated in full.
        changes: z.array(z.object({ field: z.string(), value: z.unknown() })),
      }),
    )
    .min(1),
});

export const metaHandshakeQuerySchema = z.object({
  'hub.mode': z.literal('subscribe'),
  'hub.verify_token': z.string().min(1),
  'hub.challenge': z.string().min(1),
});

export type FieldData = z.infer<typeof fieldDataSchema>;
export type LeadgenChangeValue = z.infer<typeof leadgenChangeValueSchema>;
export type MetaWebhookPayload = z.infer<typeof metaWebhookPayloadSchema>;

export const extractLeadgenValues = (payload: MetaWebhookPayload): LeadgenChangeValue[] =>
  payload.entry
    .flatMap((entry) => entry.changes)
    .filter((change) => change.field === 'leadgen')
    .map((change) => leadgenChangeValueSchema.parse(change.value));
