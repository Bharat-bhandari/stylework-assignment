import type { LeadStatus } from '../types/api';

export const STATUS_LABEL: Record<LeadStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  CONVERTED: 'Converted',
  LOST: 'Lost',
};

export const STATUS_ACTION_LABEL: Record<LeadStatus, string> = {
  NEW: 'Move back to new',
  CONTACTED: 'Mark contacted',
  QUALIFIED: 'Mark qualified',
  CONVERTED: 'Mark converted',
  LOST: 'Mark lost',
};

export const STATUS_TONE: Record<LeadStatus, { badge: string; dot: string }> = {
  NEW: { badge: 'bg-lead-new-soft text-lead-new-ink', dot: 'bg-lead-new' },
  CONTACTED: { badge: 'bg-lead-contacted-soft text-lead-contacted-ink', dot: 'bg-lead-contacted' },
  QUALIFIED: { badge: 'bg-lead-qualified-soft text-lead-qualified-ink', dot: 'bg-lead-qualified' },
  CONVERTED: { badge: 'bg-lead-converted-soft text-lead-converted-ink', dot: 'bg-lead-converted' },
  LOST: { badge: 'bg-lead-lost-soft text-lead-lost-ink', dot: 'bg-lead-lost' },
};

export const TERMINAL_STATUSES: LeadStatus[] = ['CONVERTED', 'LOST'];

export const isTerminalStatus = (status: LeadStatus): boolean =>
  TERMINAL_STATUSES.includes(status);
