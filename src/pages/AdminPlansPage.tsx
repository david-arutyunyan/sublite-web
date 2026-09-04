import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client';
import { adminPlansApi } from '../api/admin';
import type { AdminPlan, AdminPlanPrice, BillingPeriod } from '../api/types';

const BILLING_PERIODS: BillingPeriod[] = ['MONTHLY', 'YEARLY'];

interface CreatePlanForm {
  code: string;
  name: string;
  description: string;
  billingPeriod: BillingPeriod;
  amount: string;
  currency: string;
}

const EMPTY_CREATE_FORM: CreatePlanForm = {
  code: '',
  name: '',
  description: '',
  billingPeriod: 'MONTHLY',
  amount: '',
  currency: 'USD',
};

export function AdminPlansPage() {
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [prices, setPrices] = useState<Record<string, AdminPlanPrice[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreatePlanForm>(EMPTY_CREATE_FORM);
  const [isCreating, setIsCreating] = useState(false);
  const [priceForms, setPriceForms] = useState<Record<string, { billingPeriod: BillingPeriod; amount: string; currency: string }>>({});
  const [togglingPlanIds, setTogglingPlanIds] = useState<Set<string>>(new Set());

  function loadPlans() {
    setIsLoading(true);
    setLoadError(null);
    adminPlansApi
      .list()
      .then(async (list) => {
        setPlans(list);
        const entries = await Promise.all(list.map(async (plan) => [plan.id, await adminPlansApi.listPrices(plan.id)] as const));
        setPrices(Object.fromEntries(entries));
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Could not load plans.'))
      .finally(() => setIsLoading(false));
  }

  useEffect(loadPlans, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    const amount = Number(createForm.amount);
    if (!Number.isFinite(amount)) {
      setMutationError('Amount must be a number.');
      return;
    }
    setMutationError(null);
    setIsCreating(true);
    try {
      await adminPlansApi.create({
        code: createForm.code,
        name: createForm.name,
        description: createForm.description,
        billingPeriod: createForm.billingPeriod,
        amount,
        currency: createForm.currency,
      });
      setCreateForm(EMPTY_CREATE_FORM);
      loadPlans();
    } catch (err) {
      setMutationError(err instanceof ApiError ? err.message : 'Could not create the plan.');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleToggleActive(plan: AdminPlan) {
    setMutationError(null);
    setTogglingPlanIds((current) => new Set(current).add(plan.id));
    try {
      const updated = await adminPlansApi.setActive(plan.id, !plan.active);
      setPlans((current) => current.map((p) => (p.id === updated.id ? updated : p)));
    } catch (err) {
      setMutationError(err instanceof ApiError ? err.message : 'Could not update the plan.');
    } finally {
      setTogglingPlanIds((current) => {
        const next = new Set(current);
        next.delete(plan.id);
        return next;
      });
    }
  }

  function priceForm(planId: string) {
    return priceForms[planId] ?? { billingPeriod: 'MONTHLY' as BillingPeriod, amount: '', currency: 'USD' };
  }

  async function handleAddPrice(event: FormEvent, planId: string) {
    event.preventDefault();
    const form = priceForm(planId);
    const amount = Number(form.amount);
    if (!Number.isFinite(amount)) {
      setMutationError('Amount must be a number.');
      return;
    }
    setMutationError(null);
    try {
      const newPrice = await adminPlansApi.addPrice(planId, {
        billingPeriod: form.billingPeriod,
        amount,
        currency: form.currency,
      });
      setPrices((current) => ({ ...current, [planId]: [...(current[planId] ?? []), newPrice] }));
      setPriceForms((current) => ({ ...current, [planId]: { billingPeriod: 'MONTHLY', amount: '', currency: 'USD' } }));
    } catch (err) {
      setMutationError(err instanceof ApiError ? err.message : 'Could not add the price.');
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Admin: Plans</h1>
        <Link to="/admin">Back</Link>
      </header>

      {mutationError && <p className="form-error">{mutationError}</p>}

      <div className="card">
        <h2>New plan</h2>
        <form onSubmit={handleCreate} className="auth-form">
          <label>
            Code
            <input
              value={createForm.code}
              onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
              required
            />
          </label>
          <label>
            Name
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              required
            />
          </label>
          <label>
            Description
            <input
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
            />
          </label>
          <label>
            Billing period
            <select
              value={createForm.billingPeriod}
              onChange={(e) => setCreateForm({ ...createForm, billingPeriod: e.target.value as BillingPeriod })}
            >
              {BILLING_PERIODS.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </label>
          <label>
            Amount
            <input
              type="number"
              step="0.01"
              min="0"
              value={createForm.amount}
              onChange={(e) => setCreateForm({ ...createForm, amount: e.target.value })}
              required
            />
          </label>
          <label>
            Currency
            <input
              value={createForm.currency}
              onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value.toUpperCase() })}
              maxLength={3}
              required
            />
          </label>
          <button type="submit" disabled={isCreating}>
            Create plan
          </button>
        </form>
      </div>

      {isLoading && <p className="page-status">Loading plans…</p>}
      {loadError && <p className="form-error">{loadError}</p>}

      {!isLoading && !loadError && (
        <div className="plan-list">
          {plans.map((plan) => {
            const form = priceForm(plan.id);
            const isToggling = togglingPlanIds.has(plan.id);
            return (
              <div key={plan.id} className="plan-card">
                <div className="subscription-title">
                  <h2>{plan.name}</h2>
                  <span className={`status-badge ${plan.active ? 'status-active' : 'status-paused'}`}>
                    {plan.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="page-status">{plan.code}</p>
                {plan.description && <p>{plan.description}</p>}

                <ul className="price-list">
                  {(prices[plan.id] ?? []).map((price) => (
                    <li key={price.id}>
                      <span>
                        {price.amount} {price.currency} / {price.billingPeriod.toLowerCase()}
                      </span>
                    </li>
                  ))}
                </ul>

                <form onSubmit={(e) => handleAddPrice(e, plan.id)} className="button-row">
                  <select
                    value={form.billingPeriod}
                    onChange={(e) =>
                      setPriceForms({ ...priceForms, [plan.id]: { ...form, billingPeriod: e.target.value as BillingPeriod } })
                    }
                  >
                    {BILLING_PERIODS.map((period) => (
                      <option key={period} value={period}>
                        {period}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Amount"
                    value={form.amount}
                    onChange={(e) => setPriceForms({ ...priceForms, [plan.id]: { ...form, amount: e.target.value } })}
                    required
                  />
                  <input
                    placeholder="Currency"
                    value={form.currency}
                    onChange={(e) =>
                      setPriceForms({ ...priceForms, [plan.id]: { ...form, currency: e.target.value.toUpperCase() } })
                    }
                    maxLength={3}
                    required
                  />
                  <button type="submit" className="button-secondary">
                    Add price
                  </button>
                </form>

                <div className="button-row">
                  <button className="button-secondary" onClick={() => handleToggleActive(plan)} disabled={isToggling}>
                    {isToggling ? 'Saving…' : plan.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
