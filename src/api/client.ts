const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
const TOKEN_STORAGE_KEY = 'sublite_token';

/**
 * Carries the HTTP status through so callers can branch on it (a 409 on
 * purchase means "already subscribed," not a generic failure) without
 * parsing the message string.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/**
 * A 401 mid-session (an expired token, or a local backend restarted with a
 * fresh dev signing key) used to just surface as an inert ApiError on
 * whatever page triggered it - every retry would fail the same way, and
 * the only way out was manually clicking "Log out". AuthContext listens
 * for this and clears its user state, which ProtectedRoute already turns
 * into a redirect to /login - no direct dependency from this module (a
 * plain fetch wrapper) on React Router or AuthContext needed.
 */
export const UNAUTHORIZED_EVENT = 'sublite:unauthorized';

interface ProblemDetail {
  detail?: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    // Every error sublite-core returns is a Spring ProblemDetail body
    // ({..., "detail": "human readable message"}, see e.g.
    // AuthExceptionHandler) - fall back to statusText for the rare
    // response that has no JSON body at all (a bare 401 from the
    // security filter chain itself, before any controller runs).
    const body = (await response.json().catch(() => null)) as ProblemDetail | null;
    if (response.status === 401 && token) {
      // Only for a request that WAS carrying a token - a 401 on login/
      // register with a bad password is a normal auth failure the caller
      // already handles inline, not a session that just expired.
      clearToken();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(response.status, body?.detail ?? response.statusText ?? `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }),
};
