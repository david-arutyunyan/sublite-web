import { useAuth } from '../auth/AuthContext';

/**
 * Placeholder landing page - proves the auth skeleton works end to end
 * (register/login, protected route, /auth/me). Plans, purchase, "my
 * subscription," the cancellation flow, and loyalty balance all land
 * here in later steps.
 */
export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="page">
      <header className="page-header">
        <h1>Sublite</h1>
        <button onClick={logout}>Log out</button>
      </header>
      <p>
        Logged in as <strong>{user?.email}</strong> ({user?.role}).
      </p>
      <p className="page-status">Plans, subscription, and loyalty will live here next.</p>
    </div>
  );
}
