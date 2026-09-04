import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { plansApi } from '../api/plans';
import { ApiError } from '../api/client';
import { subscriptionsApi } from '../api/subscriptions';
import type { Plan } from '../api/types';

export function PlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Tracks which specific price is mid-purchase, not just "something is
  // purchasing" - a plan can have both a monthly and a yearly price, and
  // only the button actually clicked should show "Subscribing..." /
  // disable itself.
  const [purchasingPriceId, setPurchasingPriceId] = useState<string | null>(null);

  useEffect(() => {
    plansApi
      .list()
      .then(setPlans)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load plans.'))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSubscribe(planPriceId: string) {
    setError(null);
    setPurchasingPriceId(planPriceId);
    try {
      await subscriptionsApi.purchase(planPriceId);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // CustomerAlreadySubscribedException on the backend - a plain
        // English rephrasing reads better here than the raw ProblemDetail
        // message, which is written for a developer reading logs.
        setError('You already have an active subscription.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Could not complete the purchase.');
      }
      setPurchasingPriceId(null);
    }
  }

  if (isLoading) {
    return <p className="page-status">Loading plans…</p>;
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Plans</h1>
        <Link to="/">Back</Link>
      </header>

      {error && <p className="form-error">{error}</p>}
      {plans.length === 0 && <p className="page-status">No plans available right now.</p>}

      <div className="plan-list">
        {plans.map((plan) => (
          <div key={plan.id} className="plan-card">
            <h2>{plan.name}</h2>
            {plan.description && <p>{plan.description}</p>}
            <ul className="price-list">
              {plan.prices.map((price) => (
                <li key={price.id}>
                  <span>
                    {price.amount} {price.currency} / {price.billingPeriod.toLowerCase()}
                  </span>
                  <button onClick={() => handleSubscribe(price.id)} disabled={purchasingPriceId !== null}>
                    {purchasingPriceId === price.id ? 'Subscribing…' : 'Subscribe'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
