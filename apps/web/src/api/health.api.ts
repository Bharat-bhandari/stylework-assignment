import type { Health } from '../types/api';
import { apiRequest } from './client';

export const fetchHealth = (): Promise<Health> => apiRequest<Health>('/health');
