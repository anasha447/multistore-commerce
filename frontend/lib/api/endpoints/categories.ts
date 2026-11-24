// Categories (API.md §4.2). Public reads; staff create/update/delete (soft).
import { http } from '../http';
import type { CategoryRequest, CategoryResponse } from '@/lib/types/catalog';

export const categoriesApi = {
  list: () => http.get<CategoryResponse[]>('/api/categories', { auth: false }),

  tree: () => http.get<CategoryResponse[]>('/api/categories/tree', { auth: false }),

  get: (id: number) => http.get<CategoryResponse>(`/api/categories/${id}`, { auth: false }),

  children: (id: number) =>
    http.get<CategoryResponse[]>(`/api/categories/${id}/children`, { auth: false }),

  // ---- staff ----
  create: (body: CategoryRequest) => http.post<CategoryResponse>('/api/categories', body),

  update: (id: number, body: CategoryRequest) =>
    http.put<CategoryResponse>(`/api/categories/${id}`, body),

  remove: (id: number) => http.del<void>(`/api/categories/${id}`),
};
