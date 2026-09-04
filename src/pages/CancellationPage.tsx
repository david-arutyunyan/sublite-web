import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { cancellationApi } from '../api/cancellation';
import type { CancellationAttempt, CurrentStep } from '../api/types';

function describeOffer(step: CurrentStep): string {
  const params = step.offerParameters ?? {};
  switch (step.offerType) {
    case 'DISCOUNT_PERCENT':
      return `Get ${params.percent}% off for the next ${params.periods} period(s) if you stay.`;
    case 'PAUSE_SUBSCRIPTION':
      return 'Pause your subscription instead of cancelling it - pick back up whenever you like.';
    case 'LOYALTY_POINTS':
      return `Get ${params.points} loyalty points to stay.`;
    default:
      return 'A special offer to stay with us.';
  }
}

/**
 * One page for the whole flow, branching on currentStep.type, rather than
 * a route per step: the sequence and even the number of steps is admin-
 * configured (see RetentionFlowConfigService on the backend) - the
 * frontend has no business assuming "survey then offer then confirm" is
 * fixed, it just renders whatever step the backend says is current.
 */
export function CancellationPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<CancellationAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!attemptId) {
      return;
    }
    cancellationApi
      .get(attemptId)
      .then(setAttempt)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load this cancellation.'))
      .finally(() => setIsLoading(false));
  }, [attemptId]);

  async function run(action: (id: string) => Promise<CancellationAttempt>) {
    if (!attemptId) {
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      setAttempt(await action(attemptId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleReasonSubmit(event: FormEvent) {
    event.preventDefault();
    await run((id) => cancellationApi.submitReason(id, reason));
  }

  if (isLoading) {
    return <p className="page-status">Loading…</p>;
  }
  if (error && !attempt) {
    return <p className="form-error">{error}</p>;
  }
  if (!attempt) {
    return null;
  }

  const step = attempt.currentStep;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Cancel subscription</h1>
        <Link to="/subscription">Back</Link>
      </header>

      {error && <p className="form-error">{error}</p>}

      <div className="card">
        {attempt.status === 'RETAINED' && (
          <p>You&apos;re staying subscribed{attempt.acceptedOfferId ? ' — the offer has been applied.' : '.'}</p>
        )}
        {attempt.status === 'CANCELLED' && <p>Your subscription has been cancelled.</p>}

        {attempt.status === 'IN_PROGRESS' && step?.type === 'SURVEY' && (
          <form onSubmit={handleReasonSubmit} className="auth-form">
            <label>
              Why are you leaving?
              <input value={reason} onChange={(e) => setReason(e.target.value)} required autoFocus />
            </label>
            <button type="submit" disabled={isSubmitting}>
              Continue
            </button>
          </form>
        )}

        {attempt.status === 'IN_PROGRESS' && step?.type === 'OFFER' && (
          <>
            <p>{describeOffer(step)}</p>
            <div className="button-row">
              <button onClick={() => run((id) => cancellationApi.acceptOffer(id))} disabled={isSubmitting}>
                Accept offer
              </button>
              <button
                className="button-secondary"
                onClick={() => run((id) => cancellationApi.declineOffer(id))}
                disabled={isSubmitting}
              >
                No thanks, continue cancelling
              </button>
            </div>
          </>
        )}

        {attempt.status === 'IN_PROGRESS' && step?.type === 'CONFIRMATION' && (
          <>
            <p>Are you sure you want to cancel your subscription?</p>
            <div className="button-row">
              <button
                className="button-danger"
                onClick={() => run((id) => cancellationApi.confirm(id))}
                disabled={isSubmitting}
              >
                Yes, cancel my subscription
              </button>
              <Link to="/subscription">Never mind, keep my subscription</Link>
            </div>
          </>
        )}
      </div>

      {(attempt.status === 'RETAINED' || attempt.status === 'CANCELLED') && (
        <p>
          <button onClick={() => navigate('/')}>Back to home</button>
        </p>
      )}
    </div>
  );
}
