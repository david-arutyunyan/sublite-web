import { api } from './client';
import type {
  AdminPlan,
  AdminPlanPrice,
  BillingPeriod,
  LoyaltyEventType,
  LoyaltyRule,
  RetentionOffer,
  RetentionOfferType,
  RetentionStep,
  RetentionStepType,
} from './types';

export const adminPlansApi = {
  list: () => api.get<AdminPlan[]>('/admin/plans'),
  create: (input: { code: string; name: string; description: string; billingPeriod: BillingPeriod; amount: number; currency: string }) =>
    api.post<AdminPlan>('/admin/plans', input),
  setActive: (id: string, active: boolean) => api.patch<AdminPlan>(`/admin/plans/${id}/active`, { active }),
  listPrices: (id: string) => api.get<AdminPlanPrice[]>(`/admin/plans/${id}/prices`),
  addPrice: (id: string, input: { billingPeriod: BillingPeriod; amount: number; currency: string }) =>
    api.post<AdminPlanPrice>(`/admin/plans/${id}/prices`, input),
};

export const adminLoyaltyApi = {
  list: () => api.get<LoyaltyRule[]>('/admin/loyalty/rules'),
  setRule: (eventType: LoyaltyEventType, points: number) =>
    api.post<LoyaltyRule>('/admin/loyalty/rules', { eventType, points }),
};

export const adminRetentionApi = {
  listOffers: () => api.get<RetentionOffer[]>('/admin/retention/offers'),
  createOffer: (input: { code: string; type: RetentionOfferType; parameters: Record<string, unknown> }) =>
    api.post<RetentionOffer>('/admin/retention/offers', input),
  listSteps: () => api.get<RetentionStep[]>('/admin/retention/steps'),
  createStep: (input: { stepOrder: number; type: RetentionStepType; offerId: string | null }) =>
    api.post<RetentionStep>('/admin/retention/steps', input),
  setStepActive: (id: string, active: boolean) => api.patch<RetentionStep>(`/admin/retention/steps/${id}/active`, { active }),
};
