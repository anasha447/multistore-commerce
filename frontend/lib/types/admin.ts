// Admin user/staff DTOs (API.md §4.12, §5). user-service, ADMIN only.
import type { Role } from './common';

export interface CreateStaffRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface UpdateUserStatusRequest {
  /** false = ban, true = un-ban. */
  enabled: boolean;
}

export interface AdminUserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  roles: Role[];
  enabled: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}
