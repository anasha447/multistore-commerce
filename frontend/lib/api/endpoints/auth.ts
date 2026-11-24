// Auth endpoints (API.md §4.1). All public (no token). Token storage is the caller's
// job — wire login/refresh into the TokenStore in the auth UI phase.
import { http } from '../http';
import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserResponse,
} from '@/lib/types/auth';

export const authApi = {
  register: (body: RegisterRequest) =>
    http.post<UserResponse>('/api/auth/register', body, { auth: false }),

  login: (body: LoginRequest) =>
    http.post<TokenResponse>('/api/auth/login', body, { auth: false }),

  refresh: (refreshToken: string) =>
    http.post<TokenResponse>('/api/auth/refresh', { refreshToken }, { auth: false }),

  logout: (refreshToken: string) =>
    http.post<void>('/api/auth/logout', { refreshToken }, { auth: false }),
};
