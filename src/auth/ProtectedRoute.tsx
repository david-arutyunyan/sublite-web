import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

/** Wraps every route that needs a logged-in user - see App.tsx. */
export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <p className="page-status">Loading...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
