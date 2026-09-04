// Mirrors the response shapes sublite-core's REST API actually returns -
// see AuthController/LoginResponse, AuthController/MeResponse in the
// backend repo. Kept as plain interfaces here rather than generated from
// the OpenAPI spec: for a project this size, hand-writing a handful of
// shapes is simpler than wiring up a codegen step.

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface MeResponse {
  userId: string;
  email: string;
  role: UserRole;
}
