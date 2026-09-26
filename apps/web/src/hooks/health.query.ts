import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../api/health.api';

export const useHealthQuery = () =>
  useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    staleTime: 60_000,
    retry: 1,
  });
