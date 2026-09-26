import type { LeadStatus } from '@prisma/client';

const TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['CONVERTED', 'LOST'],
  CONVERTED: [],
  LOST: [],
};

export const allowedNextStatuses = (status: LeadStatus): LeadStatus[] => TRANSITIONS[status];

export const canTransition = (from: LeadStatus, to: LeadStatus): boolean =>
  TRANSITIONS[from].includes(to);
