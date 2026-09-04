import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { cancellationApi } from '../api/cancellation';
import { subscriptionsApi } from '../api/subscriptions';
import type { MySubscription, SubscriptionStatus } from '../api/types';

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Active',
  GRACE_PERIOD: 'Payment issue',
  PAUSED: 'Paused',
  CANCELLED: 'Cancelled',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Still no standalone "pause" button: pausing only ever happens as the
 * effect of accepting a PAUSE_SUBSCRIPTION retention offer, there's no
 * direct endpoint for it. Cancelling starts the retention flow
 * (POST /subscriptions/{id}/cancellation) and hands off to CancellationPage,
 * which renders whatever step the backend says is current.
 */
export function SubscriptionPage() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<MySubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useEffect(() => {
    subscriptionsApi
      .getMine()
      .then(setSubscription)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          navigate('/plans', { replace: true });
          return;
        }
        setError(err instanceof ApiError ? err.message : 'Could not load your subscription.');
      })
      .finally(() => setIsLoading(false));
  }, [navigate]);

  if (isLoading) {
    return <p className="page-status">Loading your subscription…</p>;
  }
  if (error) {
    return <p className="form-error">{error}</p>;
  }
  if (!subscription) {
    // Already navigating to /plans (no active subscription) - nothing to render.
    return null;
  }

  async function handleCancelClick(subscriptionId: string) {
    setCancelError(null);
    setIsCancelling(true);
    try {
      const attempt = await cancellationApi.start(subscriptionId);
      navigate(`/cancellation/${attempt.id}`);
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : 'Could not start cancellation. Try again.');
      setIsCancelling(false);
    }
  }

  const now = new Date();
  const start = new Date(subscription.currentPeriodStart);
  const end = new Date(subscription.currentPeriodEnd);
  const totalDays = Math.max(1, daysBetween(start, end));
  const elapsedDays = Math.min(totalDays, Math.max(0, daysBetween(start, now)));
  const progressPercent = Math.round((elapsedDays / totalDays) * 100);
  const daysLeft = Math.max(0, daysBetween(now, end));

  let caption: string;
  if (subscription.status === 'GRACE_PERIOD') {
    caption = `Payment failed — access continues until ${formatDate(subscription.currentPeriodEnd)} while we retry.`;
  } else if (subscription.status === 'PAUSED') {
    caption = `Paused. Resumes ${formatDate(subscription.currentPeriodEnd)}.`;
  } else {
    caption = `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in this period.`;
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>My subscription</h1>
        <Link to="/">Back</Link>
      </header>

      <div className="card">
        <div className="subscription-title">
          <h2>{subscription.planName}</h2>
          <span className={`status-badge status-${subscription.status.toLowerCase()}`}>
            {STATUS_LABELS[subscription.status]}
          </span>
        </div>
        <p className="page-status">
          {subscription.amount} {subscription.currency} / {subscription.billingPeriod.toLowerCase()}
        </p>

        {subscription.trialEndsAt && <p className="page-status">Trial ends {formatDate(subscription.trialEndsAt)}</p>}

        <div className="timeline">
          <div className="timeline-track">
            <div className="timeline-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="timeline-labels">
            <span>{formatDate(subscription.currentPeriodStart)}</span>
            <span>{formatDate(subscription.currentPeriodEnd)}</span>
          </div>
        </div>

        <p className="timeline-caption">{caption}</p>

        {subscription.cancelAtPeriodEnd && (
          <p className="form-error">This subscription will not renew after the current period.</p>
        )}

        {cancelError && <p className="form-error">{cancelError}</p>}

        {subscription.status !== 'CANCELLED' && !subscription.cancelAtPeriodEnd && (
          <div className="button-row">
            <button
              className="button-danger"
              onClick={() => handleCancelClick(subscription.id)}
              disabled={isCancelling}
            >
              Cancel subscription
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
