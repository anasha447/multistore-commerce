// Current-user account & addresses (API.md §4.1). All require auth.
import { http } from '../http';
import type {
  AddressRequest,
  AddressResponse,
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserResponse,
} from '@/lib/types/auth';
import type { Page, PageParams } from '@/lib/types/common';

export const usersApi = {
  me: () => http.get<UserResponse>('/api/users/me'),

  updateProfile: (body: UpdateProfileRequest) => http.put<UserResponse>('/api/users/me', body),

  changePassword: (body: ChangePasswordRequest) =>
    http.put<void>('/api/users/me/password', body),

  listAddresses: (params?: PageParams) =>
    http.get<Page<AddressResponse>>('/api/users/me/addresses', { query: params }),

  createAddress: (body: AddressRequest) =>
    http.post<AddressResponse>('/api/users/me/addresses', body),

  updateAddress: (id: number, body: AddressRequest) =>
    http.put<AddressResponse>(`/api/users/me/addresses/${id}`, body),

  deleteAddress: (id: number) => http.del<void>(`/api/users/me/addresses/${id}`),
};
