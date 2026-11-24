// Product images (API.md §4.5). Public reads; staff create/update/delete.
import { http } from '../http';
import type { ProductImageRequest, ProductImageResponse } from '@/lib/types/catalog';

export const imagesApi = {
  listForProduct: (productId: number) =>
    http.get<ProductImageResponse[]>(`/api/products/${productId}/images`, { auth: false }),

  // ---- staff ----
  createForProduct: (productId: number, body: ProductImageRequest) =>
    http.post<ProductImageResponse>(`/api/products/${productId}/images`, body),

  update: (id: number, body: ProductImageRequest) =>
    http.put<ProductImageResponse>(`/api/images/${id}`, body),

  remove: (id: number) => http.del<void>(`/api/images/${id}`),
};
