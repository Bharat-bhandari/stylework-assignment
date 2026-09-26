import type { LeadDetail, LeadListResult, LeadStatus, LeadStatusUpdate } from '../types/api';
import { apiRequest, toQuery } from './client';

export type LeadListParams = {
  page: number;
  limit: number;
  status?: LeadStatus;
  q?: string;
  includeTest: boolean;
};

export type LeadStatusChange = {
  status: LeadStatus;
  note?: string;
};

export const fetchLeads = (params: LeadListParams): Promise<LeadListResult> =>
  apiRequest<LeadListResult>(`/leads${toQuery({ ...params })}`);

export const fetchLead = (id: string): Promise<LeadDetail> =>
  apiRequest<LeadDetail>(`/leads/${id}`);

export const changeLeadStatus = (
  id: string,
  change: LeadStatusChange,
): Promise<LeadStatusUpdate> =>
  apiRequest<LeadStatusUpdate>(`/leads/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(change),
  });
