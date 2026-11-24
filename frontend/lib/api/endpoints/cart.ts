// Cart (API.md §4.9). All auth, owner-only, live-priced — re-render from each response.
import { http } from '../http';
import type {
  AddCartItemRequest,
  CartResponse,
  UpdateCartItemRequest,
} from '@/lib/types/cart';

export const cartApi = {
  get: () => http.get<CartResponse>('/api/cart'),

  /** Live-price a set of lines with no server cart (guest cart). Public — no auth. */
  price: (items: AddCartItemRequest[]) =>
    http.post<CartResponse>('/api/cart/price', { items }, { auth: false }),

  addItem: (body: AddCartItemRequest) => http.post<CartResponse>('/api/cart/items', body),

  updateItem: (id: number, body: UpdateCartItemRequest) =>
    http.put<CartResponse>(`/api/cart/items/${id}`, body),

  removeItem: (id: number) => http.del<void>(`/api/cart/items/${id}`),

  clear: () => http.del<void>('/api/cart'),
};
