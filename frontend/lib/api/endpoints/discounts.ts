// Discounts (API.md §4.8). Public reads; staff create/update/delete.
import { http } from '../http';
import type { DiscountRequest, DiscountResponse } from '@/lib/types/catalog';

export const discountsApi = {
  forProduct: (productId: number) =>
    http.get<DiscountResponse[]>(`/api/products/${productId}/discounts`, { auth: false }),

  get: (id: number) => http.get<DiscountResponse>(`/api/discounts/${id}`, { auth: false }),

  // ---- staff ----
  create: (body: DiscountRequest) => http.post<DiscountResponse>('/api/discounts', body),

  update: (id: number, body: DiscountRequest) =>
    http.put<DiscountResponse>(`/api/discounts/${id}`, body),

  remove: (id: number) => http.del<void>(`/api/discounts/${id}`),
};
