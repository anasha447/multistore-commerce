// Auth & account DTOs (API.md §4.1, §5). user-service.
import type { AddressType, Role } from './common';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  /** Access-token lifetime in seconds (~900 = 15 min). */
  expiresIn: number;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  roles: Role[];
  /** When true, force the user through PUT /api/users/me/password before continuing. */
  mustChangePassword: boolean;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AddressRequest {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  type: AddressType;
  /** JSON key is `isDefault` (API.md §5 note). */
  isDefault: boolean;
}

export interface AddressResponse {
  id: number;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  type: AddressType;
  isDefault: boolean;
}
