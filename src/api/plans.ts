import { api } from './client';
import type { Plan } from './types';

export const plansApi = {
  list: () => api.get<Plan[]>('/plans'),
};
