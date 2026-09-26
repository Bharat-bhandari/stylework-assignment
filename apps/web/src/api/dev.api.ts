import { apiRequest } from './client';

export const simulateLead = (): Promise<{ leadgenId: string }> =>
  apiRequest<{ leadgenId: string }>('/dev/simulate-lead', {
    method: 'POST',
    body: JSON.stringify({}),
  });
