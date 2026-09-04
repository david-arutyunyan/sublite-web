import { api } from './client';
import type { LoyaltyBalance, LoyaltyTransaction } from './types';

export const loyaltyApi = {
  getBalance: () => api.get<LoyaltyBalance>('/loyalty/me'),
  getHistory: () => api.get<LoyaltyTransaction[]>('/loyalty/me/transactions'),
};
