// Admin user/staff directory (API.md §4.12). ADMIN only. Also the only customer list
// (filter ?role=CUSTOMER). No create/revoke ADMIN and no user deletion in v1.
import { http } from '../http';
import type { Page, PageParams, Role } from '@/lib/types/common';
import type {
  AdminUserResponse,
  CreateStaffRequest,
  UpdateUserStatusRequest,
} from '@/lib/types/admin';

export type AdminUserListParams = PageParams & {
  role?: Role;
  enabled?: boolean;
};

export const adminApi = {
  /** Provision a MANAGER with a temp password (mustChangePassword=true). */
  createStaff: (body: CreateStaffRequest) =>
    http.post<AdminUserResponse>('/api/admin/users', body),

  listUsers: (params?: AdminUserListParams) =>
    http.get<Page<AdminUserResponse>>('/api/admin/users', { query: params }),

  getUser: (id: number) => http.get<AdminUserResponse>(`/api/admin/users/${id}`),

  /** Ban/un-ban. ApiError 409 if you target your own account. */
  updateUserStatus: (id: number, body: UpdateUserStatusRequest) =>
    http.put<AdminUserResponse>(`/api/admin/users/${id}/status`, body),
};
