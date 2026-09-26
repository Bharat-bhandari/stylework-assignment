import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  changeLeadStatus,
  fetchLead,
  fetchLeads,
  type LeadListParams,
  type LeadStatusChange,
} from '../api/lead.api';

const POLL_INTERVAL_MS = 10_000;

export const leadKeys = {
  all: ['leads'] as const,
  list: (params: LeadListParams) => ['leads', 'list', params] as const,
  detail: (id: string) => ['leads', 'detail', id] as const,
};

export const useLeadsQuery = (params: LeadListParams) =>
  useQuery({
    queryKey: leadKeys.list(params),
    queryFn: () => fetchLeads(params),
    refetchInterval: POLL_INTERVAL_MS,
    // Paging and typing keep the previous page on screen instead of flashing a skeleton.
    placeholderData: keepPreviousData,
  });

export const useLeadQuery = (id: string) =>
  useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => fetchLead(id),
    refetchInterval: POLL_INTERVAL_MS,
  });

export const useLeadStatusMutation = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (change: LeadStatusChange) => changeLeadStatus(id, change),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: leadKeys.all }),
  });
};
