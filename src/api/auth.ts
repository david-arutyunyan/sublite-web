import { api } from './client';
import type { AuthResponse, MeResponse } from './types';

export const authApi = {
  login: (email: string, password: string) => api.post<AuthResponse>('/auth/login', { email, password }),
  register: (email: string, password: string) => api.post<AuthResponse>('/auth/register', { email, password }),
  me: () => api.get<MeResponse>('/auth/me'),
};
