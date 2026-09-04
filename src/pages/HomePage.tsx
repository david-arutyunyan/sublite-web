import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client';
import { subscriptionsApi } from '../api/subscriptions';
import type { MySubscription } from '../api/types';
import { useAuth } from '../auth/AuthContext';

/**
 * Deliberately only a compact summary of the subscription - the full
 * picture (visual timeline) is /subscription (SubscriptionPage). This
 * just has to know enough to decide "browse plans" vs "you already have
 * one," since GET /subscriptions/me is what that decision needs either way.
 */
export function HomePage() {
  const { user, logout } = useAuth();
  const [subscription, setSubscription] = useState<MySubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    subscriptionsApi
      .getMine()
      .then(setSubscription)
      .catch((err) => {
        // 404 just means "nothing purchased yet" - the normal state for a
        // brand new account, not a failure worth surfacing.
        if (!(err instanceof ApiError && err.status === 404)) {
          console.error('Failed to load subscription', err);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Sublite</h1>
        <button onClick={logout}>Log out</button>
      </header>
      <p>
        Logged in as <strong>{user?.email}</strong> ({user?.role}).
      </p>

      <p>
        <Link to="/loyalty">Loyalty points</Link>
      </p>

      {user?.role === 'ADMIN' && (
        <p>
          <Link to="/admin">Admin</Link>
        </p>
      )}

      {isLoading && <p className="page-status">Loading your subscription…</p>}

      {!isLoading && subscription && (
        <div className="card">
          <h2>{subscription.planName}</h2>
          <p>
            {subscription.status} · {subscription.amount} {subscription.currency} /{' '}
            {subscription.billingPeriod.toLowerCase()}
          </p>
          <Link to="/subscription">View details</Link>
        </div>
      )}

      {!isLoading && !subscription && (
        <div className="card">
          <p>You don't have a subscription yet.</p>
          <Link to="/plans">Browse plans</Link>
        </div>
      )}
    </div>
  );
}
