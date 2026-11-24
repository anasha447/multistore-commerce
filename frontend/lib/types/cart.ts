// Cart DTOs (API.md §4.9, §5). order-service. Live-priced & owner-only:
// always re-render from CartResponse; never compute totals client-side.

export interface CartItem {
  id: number;
  productVariantId: number;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  /** false when the catalog couldn't price this line (render greyed-out, keep the rest). */
  available: boolean;
  stockQuantity: number;
}

export interface CartResponse {
  /** null for a guest (unsaved) cart priced via /api/cart/price. */
  cartId: number | null;
  userId: number | null;
  items: CartItem[];
  subtotal: number;
}

export interface AddCartItemRequest {
  productVariantId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
