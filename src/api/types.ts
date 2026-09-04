// Mirrors the response shapes sublite-core's REST API actually returns -
// see AuthController/LoginResponse/MeResponse, PlanController/
// PublicPlanResponse, billing.api.SubscriptionController/
// MySubscriptionResponse in the backend repo. Kept as plain interfaces
// here rather than generated from the OpenAPI spec: for a project this
// size, hand-writing a handful of shapes is simpler than wiring up a
// codegen step.

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface MeResponse {
  userId: string;
  email: string;
  role: UserRole;
}

export type BillingPeriod = 'MONTHLY' | 'YEARLY';

export interface PlanPrice {
  id: string;
  billingPeriod: BillingPeriod;
  amount: number;
  currency: string;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  prices: PlanPrice[];
}

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'GRACE_PERIOD' | 'PAUSED' | 'CANCELLED';

export interface MySubscription {
  id: string;
  planCode: string;
  planName: string;
  billingPeriod: BillingPeriod;
  amount: number;
  currency: string;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
}

export type CancellationAttemptStatus = 'IN_PROGRESS' | 'RETAINED' | 'CANCELLED';
export type RetentionStepType = 'SURVEY' | 'OFFER' | 'CONFIRMATION';
export type RetentionOfferType = 'DISCOUNT_PERCENT' | 'PAUSE_SUBSCRIPTION' | 'LOYALTY_POINTS';

export interface CurrentStep {
  type: RetentionStepType;
  offerId: string | null;
  offerCode: string | null;
  offerType: RetentionOfferType | null;
  offerParameters: Record<string, unknown> | null;
}

export interface CancellationAttempt {
  id: string;
  subscriptionId: string;
  status: CancellationAttemptStatus;
  reason: string | null;
  acceptedOfferId: string | null;
  startedAt: string;
  completedAt: string | null;
  // null once status isn't IN_PROGRESS anymore - see
  // CancellationAttemptResponse's own javadoc in sublite-core.
  currentStep: CurrentStep | null;
}
