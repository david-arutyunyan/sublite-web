import { api } from './client';
import type { CancellationAttempt } from './types';

export const cancellationApi = {
  start: (subscriptionId: string) => api.post<CancellationAttempt>(`/subscriptions/${subscriptionId}/cancellation`),
  get: (attemptId: string) => api.get<CancellationAttempt>(`/cancellation/${attemptId}`),
  submitReason: (attemptId: string, reason: string) =>
    api.post<CancellationAttempt>(`/cancellation/${attemptId}/reason`, { reason }),
  acceptOffer: (attemptId: string) => api.post<CancellationAttempt>(`/cancellation/${attemptId}/accept-offer`),
  declineOffer: (attemptId: string) => api.post<CancellationAttempt>(`/cancellation/${attemptId}/decline-offer`),
  confirm: (attemptId: string) => api.post<CancellationAttempt>(`/cancellation/${attemptId}/confirm`),
};
