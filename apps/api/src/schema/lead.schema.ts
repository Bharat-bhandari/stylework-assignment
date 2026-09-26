import { LeadStatus } from '@prisma/client';
import { z } from 'zod';

export const leadIdParamsSchema = z.object({
  id: z.uuid('Lead id must be a uuid'),
});

export const leadListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(LeadStatus).optional(),
  q: z.string().trim().min(1).max(200).optional(),
  includeTest: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export const updateLeadStatusSchema = z.object({
  status: z.enum(LeadStatus),
  note: z.string().trim().min(1).max(500).optional(),
});

export type LeadListQuery = z.infer<typeof leadListQuerySchema>;
export type UpdateLeadStatusBody = z.infer<typeof updateLeadStatusSchema>;
