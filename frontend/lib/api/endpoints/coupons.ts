// Coupons (API.md §4.8). validate = auth (checkout preview); CRUD = staff.
import { http } from '../http';
import type { Page, PageParams } from '@/lib/types/common';
import type {
  CouponRequest,
  CouponResponse,
  CouponValidationRequest,
  CouponValidationResponse,
} from '@/lib/types/catalog';

export const couponsApi = {
  validate: (body: CouponValidationRequest) =>
    http.post<CouponValidationResponse>('/api/coupons/validate', body, { auth: false }),

  // ---- staff ----
  list: (params?: PageParams) =>
    http.get<Page<CouponResponse>>('/api/coupons', { query: params }),

  get: (id: number) => http.get<CouponResponse>(`/api/coupons/${id}`),

  create: (body: CouponRequest) => http.post<CouponResponse>('/api/coupons', body),

  update: (id: number, body: CouponRequest) =>
    http.put<CouponResponse>(`/api/coupons/${id}`, body),

  remove: (id: number) => http.del<void>(`/api/coupons/${id}`),
};
