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
  return new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * Plan billing periods are normally weeks/months long, where "N days
 * left" is the right granularity - but nothing stops a period from being
 * much shorter (an admin-adjusted demo subscription, say), and "0 days
 * left" for the whole last day of a normal period isn't informative
 * either. Steps down to whatever unit actually has a nonzero count left.
 */
function formatTimeLeft(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / (1000 * 60)));
  if (totalMinutes < 60) {
    return `${totalMinutes} minute${totalMinutes === 1 ? '' : 's'}`;
  }
  const totalHours = Math.round(totalMinutes / 60);
  if (totalHours < 24) {
    return `${totalHours} hour${totalHours === 1 ? '' : 's'}`;
  }
  const totalDays = Math.round(totalHours / 24);
  return `${totalDays} day${totalDays === 1 ? '' : 's'}`;
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
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  useEffect(() => {
    function load() {
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
    }

    load();
    // Re-polls rather than just computing a static countdown once: a
    // period can be short enough (an admin-adjusted demo subscription,
    // say) that status actually changes - ACTIVE renewing for another
    // period, or flipping to GRACE_PERIOD - while this page sits open,
    // and that transition should show up without a manual reload.
    const intervalId = setInterval(load, 15_000);
    return () => clearInterval(intervalId);
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

  async function handleRetryPaymentClick() {
    setRetryError(null);
    setIsRetryingPayment(true);
    try {
      setSubscription(await subscriptionsApi.retryPayment());
    } catch (err) {
      setRetryError(err instanceof ApiError ? err.message : 'Could not retry the payment. Try again.');
    } finally {
      setIsRetryingPayment(false);
    }
  }

  const now = new Date();
  const start = new Date(subscription.currentPeriodStart);
  const end = new Date(subscription.currentPeriodEnd);
  const totalMs = Math.max(1, end.getTime() - start.getTime());
  const elapsedMs = Math.min(totalMs, Math.max(0, now.getTime() - start.getTime()));
  const progressPercent = Math.round((elapsedMs / totalMs) * 100);
  const msLeft = Math.max(0, end.getTime() - now.getTime());

  let caption: string;
  if (subscription.status === 'GRACE_PERIOD') {
    caption = `Payment failed — access continues until ${formatDate(subscription.currentPeriodEnd)} while we retry.`;
  } else if (subscription.status === 'PAUSED') {
    caption = `Paused. Resumes ${formatDate(subscription.currentPeriodEnd)}.`;
  } else {
    caption = `${formatTimeLeft(msLeft)} left in this period.`;
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

        {retryError && <p className="form-error">{retryError}</p>}

        {subscription.status === 'GRACE_PERIOD' && (
          <div className="button-row">
            <button onClick={handleRetryPaymentClick} disabled={isRetryingPayment}>
              {isRetryingPayment ? 'Retrying…' : 'Retry payment'}
            </button>
          </div>
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
