import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { adminLoyaltyApi } from '../api/admin';
import { ApiError } from '../api/client';
import type { LoyaltyEventType, LoyaltyRule } from '../api/types';

const EVENT_TYPES: LoyaltyEventType[] = ['PAYMENT_SUCCESS'];

export function AdminLoyaltyPage() {
  const [rules, setRules] = useState<LoyaltyRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [eventType, setEventType] = useState<LoyaltyEventType>('PAYMENT_SUCCESS');
  const [points, setPoints] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function loadRules() {
    setIsLoading(true);
    setLoadError(null);
    adminLoyaltyApi
      .list()
      .then(setRules)
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Could not load loyalty rules.'))
      .finally(() => setIsLoading(false));
  }

  useEffect(loadRules, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaveError(null);
    setIsSaving(true);
    try {
      await adminLoyaltyApi.setRule(eventType, Number(points));
      setPoints('');
      loadRules();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : 'Could not save the rule.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Admin: Loyalty rules</h1>
        <Link to="/admin">Back</Link>
      </header>

      {saveError && <p className="form-error">{saveError}</p>}

      <div className="card">
        <h2>Set active rule</h2>
        <p className="page-status">
          Setting a rule for an event type deactivates whichever rule currently governs it - only one active rule per
          event type at a time.
        </p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Event type
            <select value={eventType} onChange={(e) => setEventType(e.target.value as LoyaltyEventType)}>
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label>
            Points
            <input type="number" min="1" step="1" value={points} onChange={(e) => setPoints(e.target.value)} required />
          </label>
          <button type="submit" disabled={isSaving}>
            Save rule
          </button>
        </form>
      </div>

      {isLoading && <p className="page-status">Loading rules…</p>}
      {loadError && <p className="form-error">{loadError}</p>}

      {!isLoading && !loadError && (
        <div className="card">
          <h2>All rules</h2>
          {rules.length === 0 && <p className="page-status">No rules configured yet.</p>}
          <ul className="loyalty-history">
            {rules.map((rule) => (
              <li key={rule.id}>
                <div>
                  <span className="loyalty-amount">{rule.eventType}</span>
                  <span className="loyalty-reason">{rule.points} pts</span>
                </div>
                <span className={`status-badge ${rule.active ? 'status-active' : 'status-paused'}`}>
                  {rule.active ? 'Active' : 'Inactive'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
