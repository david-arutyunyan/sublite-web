import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth';
import { clearToken, getToken, setToken as persistToken, UNAUTHORIZED_EVENT } from '../api/client';
import type { MeResponse } from '../api/types';

interface AuthContextValue {
  user: MeResponse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  // Starts true: a token from a previous visit sitting in localStorage
  // doesn't mean it's still valid (expired, or a local backend restarted
  // with a fresh dev signing key) - until /auth/me below either confirms
  // or clears it, ProtectedRoute has to wait rather than bounce straight
  // to /login and back.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      setUser(null);
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  async function login(email: string, password: string) {
    const response = await authApi.login(email, password);
    persistToken(response.accessToken);
    setUser(await authApi.me());
  }

  async function register(email: string, password: string) {
    const response = await authApi.register(email, password);
    persistToken(response.accessToken);
    setUser(await authApi.me());
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
