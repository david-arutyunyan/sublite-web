import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { adminRetentionApi } from '../api/admin';
import { ApiError } from '../api/client';
import type { RetentionOffer, RetentionOfferType, RetentionStep, RetentionStepType } from '../api/types';

const OFFER_TYPES: RetentionOfferType[] = ['DISCOUNT_PERCENT', 'PAUSE_SUBSCRIPTION', 'LOYALTY_POINTS'];
const STEP_TYPES: RetentionStepType[] = ['SURVEY', 'OFFER', 'CONFIRMATION'];

export function AdminRetentionPage() {
  const [offers, setOffers] = useState<RetentionOffer[]>([]);
  const [steps, setSteps] = useState<RetentionStep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [offerCode, setOfferCode] = useState('');
  const [offerType, setOfferType] = useState<RetentionOfferType>('DISCOUNT_PERCENT');
  const [offerParameters, setOfferParameters] = useState('{}');
  const [isCreatingOffer, setIsCreatingOffer] = useState(false);

  const [stepOrder, setStepOrder] = useState('');
  const [stepType, setStepType] = useState<RetentionStepType>('SURVEY');
  const [stepOfferId, setStepOfferId] = useState('');
  const [isCreatingStep, setIsCreatingStep] = useState(false);

  function loadAll() {
    setIsLoading(true);
    Promise.all([adminRetentionApi.listOffers(), adminRetentionApi.listSteps()])
      .then(([offerList, stepList]) => {
        setOffers(offerList);
        setSteps(stepList);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load retention config.'))
      .finally(() => setIsLoading(false));
  }

  useEffect(loadAll, []);

  async function handleCreateOffer(event: FormEvent) {
    event.preventDefault();
    setError(null);
    let parameters: Record<string, unknown>;
    try {
      parameters = JSON.parse(offerParameters);
    } catch {
      setError('Parameters must be valid JSON.');
      return;
    }
    setIsCreatingOffer(true);
    try {
      await adminRetentionApi.createOffer({ code: offerCode, type: offerType, parameters });
      setOfferCode('');
      setOfferParameters('{}');
      loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the offer.');
    } finally {
      setIsCreatingOffer(false);
    }
  }

  async function handleCreateStep(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsCreatingStep(true);
    try {
      await adminRetentionApi.createStep({
        stepOrder: Number(stepOrder),
        type: stepType,
        offerId: stepType === 'OFFER' ? stepOfferId || null : null,
      });
      setStepOrder('');
      setStepOfferId('');
      loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the step.');
    } finally {
      setIsCreatingStep(false);
    }
  }

  async function handleToggleStep(step: RetentionStep) {
    setError(null);
    try {
      const updated = await adminRetentionApi.setStepActive(step.id, !step.active);
      setSteps((current) => current.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update the step.');
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Admin: Retention flow</h1>
        <Link to="/admin">Back</Link>
      </header>

      {error && <p className="form-error">{error}</p>}

      <div className="card">
        <h2>New offer</h2>
        <p className="page-status">
          Parameters depend on type: DISCOUNT_PERCENT wants percent+periods, LOYALTY_POINTS wants points,
          PAUSE_SUBSCRIPTION needs none (use {'{}'}).
        </p>
        <form onSubmit={handleCreateOffer} className="auth-form">
          <label>
            Code
            <input value={offerCode} onChange={(e) => setOfferCode(e.target.value)} required />
          </label>
          <label>
            Type
            <select value={offerType} onChange={(e) => setOfferType(e.target.value as RetentionOfferType)}>
              {OFFER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label>
            Parameters (JSON)
            <input value={offerParameters} onChange={(e) => setOfferParameters(e.target.value)} required />
          </label>
          <button type="submit" disabled={isCreatingOffer}>
            Create offer
          </button>
        </form>
      </div>

      {!isLoading && (
        <div className="card">
          <h2>Offers</h2>
          {offers.length === 0 && <p className="page-status">No offers configured yet.</p>}
          <ul className="loyalty-history">
            {offers.map((offer) => (
              <li key={offer.id}>
                <div>
                  <span className="loyalty-amount">{offer.code}</span>
                  <span className="loyalty-reason">
                    {offer.type} · {JSON.stringify(offer.parameters)}
                  </span>
                </div>
                <span className={`status-badge ${offer.active ? 'status-active' : 'status-paused'}`}>
                  {offer.active ? 'Active' : 'Inactive'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2>New step</h2>
        <form onSubmit={handleCreateStep} className="auth-form">
          <label>
            Step order
            <input type="number" min="1" step="1" value={stepOrder} onChange={(e) => setStepOrder(e.target.value)} required />
          </label>
          <label>
            Type
            <select value={stepType} onChange={(e) => setStepType(e.target.value as RetentionStepType)}>
              {STEP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          {stepType === 'OFFER' && (
            <label>
              Offer
              <select value={stepOfferId} onChange={(e) => setStepOfferId(e.target.value)} required>
                <option value="" disabled>
                  Select an offer
                </option>
                {offers.map((offer) => (
                  <option key={offer.id} value={offer.id}>
                    {offer.code}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button type="submit" disabled={isCreatingStep}>
            Create step
          </button>
        </form>
      </div>

      {!isLoading && (
        <div className="card">
          <h2>Steps</h2>
          {steps.length === 0 && <p className="page-status">No steps configured yet.</p>}
          <ul className="loyalty-history">
            {steps
              .slice()
              .sort((a, b) => a.stepOrder - b.stepOrder)
              .map((step) => (
                <li key={step.id}>
                  <div>
                    <span className="loyalty-amount">
                      #{step.stepOrder} {step.type}
                    </span>
                    {step.offerId && (
                      <span className="loyalty-reason">
                        offer: {offers.find((o) => o.id === step.offerId)?.code ?? step.offerId}
                      </span>
                    )}
                  </div>
                  <button className="button-secondary" onClick={() => handleToggleStep(step)}>
                    {step.active ? 'Deactivate' : 'Activate'}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
