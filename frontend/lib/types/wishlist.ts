// Wishlist DTOs (API.md §4.7, §5). order-service-adjacent; private to the owner.

export interface WishlistItemResponse {
  id: number;
  productVariantId: number;
  addedAt: string;
}

export interface WishlistResponse {
  userId: number;
  items: WishlistItemResponse[];
}

export interface AddWishlistItemRequest {
  productVariantId: number;
}
