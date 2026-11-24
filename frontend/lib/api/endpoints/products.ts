// Products (API.md §4.3). Public reads; staff create/update/delete (soft).
import { http } from '../http';
import type { Page, PageParams } from '@/lib/types/common';
import type { ProductRequest, ProductResponse } from '@/lib/types/catalog';

export type ProductListParams = PageParams & {
  categoryId?: number;
};

export const productsApi = {
  list: (params?: ProductListParams) =>
    http.get<Page<ProductResponse>>('/api/products', { query: params, auth: false }),

  get: (id: number) => http.get<ProductResponse>(`/api/products/${id}`, { auth: false }),

  getBySlug: (slug: string) =>
    http.get<ProductResponse>(`/api/products/slug/${encodeURIComponent(slug)}`, { auth: false }),

  // ---- staff ----
  create: (body: ProductRequest) => http.post<ProductResponse>('/api/products', body),

  update: (id: number, body: ProductRequest) =>
    http.put<ProductResponse>(`/api/products/${id}`, body),

  remove: (id: number) => http.del<void>(`/api/products/${id}`),
};
