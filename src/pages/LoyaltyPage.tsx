import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client';
import { loyaltyApi } from '../api/loyalty';
import type { LoyaltyTransaction } from '../api/types';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LoyaltyPage() {
  const [balance, setBalance] = useState<number | null>(null);
  const [history, setHistory] = useState<LoyaltyTransaction[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loyaltyApi.getBalance(), loyaltyApi.getHistory()])
      .then(([balanceResponse, historyResponse]) => {
        setBalance(balanceResponse.balance);
        setHistory(historyResponse);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load your loyalty points.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <p className="page-status">Loading…</p>;
  }
  if (error) {
    return <p className="form-error">{error}</p>;
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Loyalty points</h1>
        <Link to="/">Back</Link>
      </header>

      <div className="card">
        <p className="page-status">Current balance</p>
        <p className="loyalty-balance">{balance} pts</p>
      </div>

      <div className="card">
        <h2>History</h2>
        {history && history.length === 0 && <p className="page-status">No point activity yet.</p>}
        {history && history.length > 0 && (
          <ul className="loyalty-history">
            {history.map((transaction) => (
              <li key={transaction.id}>
                <div>
                  <span className={`loyalty-amount loyalty-amount-${transaction.type.toLowerCase()}`}>
                    {transaction.type === 'EARN' ? '+' : '-'}
                    {transaction.points} pts
                  </span>
                  <span className="loyalty-reason">{transaction.reason}</span>
                </div>
                <span className="loyalty-date">{formatDateTime(transaction.occurredAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
