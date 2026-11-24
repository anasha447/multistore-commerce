// Wishlist (API.md §4.7). All auth, private to the owner; auto-created on first read.
import { http } from '../http';
import type {
  AddWishlistItemRequest,
  WishlistItemResponse,
  WishlistResponse,
} from '@/lib/types/wishlist';

export const wishlistApi = {
  get: () => http.get<WishlistResponse>('/api/wishlist'),

  addItem: (body: AddWishlistItemRequest) =>
    http.post<WishlistItemResponse>('/api/wishlist/items', body),

  removeItem: (id: number) => http.del<void>(`/api/wishlist/items/${id}`),
};
