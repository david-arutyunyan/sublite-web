import { api } from './client';
import type { MySubscription } from './types';

export const subscriptionsApi = {
  purchase: (planPriceId: string) => api.post<MySubscription>('/subscriptions', { planPriceId }),
  // Callers should expect this to reject with ApiError(404) when the
  // customer has never subscribed (or their only subscription is
  // CANCELLED) - that's the normal "nothing yet" state, not a real error.
  getMine: () => api.get<MySubscription>('/subscriptions/me'),
};
