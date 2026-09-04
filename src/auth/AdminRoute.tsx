import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

/** Nests inside ProtectedRoute - by the time this runs, user is non-null. */
export function AdminRoute() {
  const { user } = useAuth();

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
