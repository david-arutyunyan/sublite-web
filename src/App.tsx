import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute } from './auth/AdminRoute';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AdminLoyaltyPage } from './pages/AdminLoyaltyPage';
import { AdminPage } from './pages/AdminPage';
import { AdminPlansPage } from './pages/AdminPlansPage';
import { AdminRetentionPage } from './pages/AdminRetentionPage';
import { CancellationPage } from './pages/CancellationPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { LoyaltyPage } from './pages/LoyaltyPage';
import { PlansPage } from './pages/PlansPage';
import { RegisterPage } from './pages/RegisterPage';
import { SubscriptionPage } from './pages/SubscriptionPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            {/* GET /plans is public on the backend (browsing doesn't need
                an account), but this app doesn't have a logged-out browsing
                experience built yet - purchasing needs auth regardless, so
                keeping the whole page behind ProtectedRoute for now is the
                simpler, honest scope rather than a half-built public path. */}
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/cancellation/:attemptId" element={<CancellationPage />} />
            <Route path="/loyalty" element={<LoyaltyPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/plans" element={<AdminPlansPage />} />
              <Route path="/admin/loyalty" element={<AdminLoyaltyPage />} />
              <Route path="/admin/retention" element={<AdminRetentionPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
