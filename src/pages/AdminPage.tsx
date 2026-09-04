import { Link } from 'react-router-dom';

export function AdminPage() {
  return (
    <div className="page">
      <header className="page-header">
        <h1>Admin</h1>
        <Link to="/">Back</Link>
      </header>

      <div className="plan-list">
        <div className="plan-card">
          <h2>Plans</h2>
          <p>Create plans, version prices, activate or deactivate.</p>
          <Link to="/admin/plans">Manage plans</Link>
        </div>
        <div className="plan-card">
          <h2>Loyalty rules</h2>
          <p>Configure how many points each event awards.</p>
          <Link to="/admin/loyalty">Manage loyalty rules</Link>
        </div>
        <div className="plan-card">
          <h2>Retention flow</h2>
          <p>Configure cancellation-flow offers and steps.</p>
          <Link to="/admin/retention">Manage retention flow</Link>
        </div>
      </div>
    </div>
  );
}
