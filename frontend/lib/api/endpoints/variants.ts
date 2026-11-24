// Variants (API.md §4.4). Public reads & live price/stock; staff create/update/delete.
import { http } from '../http';
import type {
  ProductVariantRequest,
  ProductVariantResponse,
  VariantPriceStockResponse,
} from '@/lib/types/catalog';

export const variantsApi = {
  listForProduct: (productId: number) =>
    http.get<ProductVariantResponse[]>(`/api/products/${productId}/variants`, { auth: false }),

  /** Authoritative purchasable price/stock for a selected variant (PDP & cart). */
  getPriceStock: (id: number) =>
    http.get<VariantPriceStockResponse>(`/api/variants/${id}`, { auth: false }),

  // ---- staff ----
  createForProduct: (productId: number, body: ProductVariantRequest) =>
    http.post<ProductVariantResponse>(`/api/products/${productId}/variants`, body),

  update: (id: number, body: ProductVariantRequest) =>
    http.put<ProductVariantResponse>(`/api/variants/${id}`, body),

  remove: (id: number) => http.del<void>(`/api/variants/${id}`),
};
