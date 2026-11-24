// Orders & checkout DTOs (API.md §4.10, §5). order-service.
import type { OrderStatus, PaymentMethod, PaymentStatus, ShippingStatus } from './common';

/** Inline shipping address captured at checkout (distinct from a saved AddressResponse). */
export interface CheckoutShippingAddress {
  recipientName: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface CheckoutRequest {
  shippingAddress: CheckoutShippingAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string | null;
  shippingMethod: string;
}

/** Guest checkout: no account, lines supplied inline (re-priced server-side). */
export interface GuestCheckoutRequest {
  guestEmail: string;
  items: { productVariantId: number; quantity: number }[];
  shippingAddress: CheckoutShippingAddress;
  paymentMethod: PaymentMethod;
  couponCode?: string | null;
  shippingMethod?: string | null;
}

export interface OrderItem {
  id: number;
  productVariantId: number;
  /** Snapshot frozen at purchase time — don't re-fetch live catalog data for past orders. */
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  userId: number;
  status: OrderStatus;
  subtotal: number;
  discountAmount: number;
  total: number;
  couponCode: string | null;
  /** JSON **string** snapshot — JSON.parse for display. */
  shippingAddress: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId: string | null;
  shippingStatus: ShippingStatus;
  shippingMethod: string;
  trackingNumber: string | null;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderSummaryResponse {
  id: number;
  orderNumber: string;
  userId: number;
  status: OrderStatus;
  total: number;
  paymentStatus: PaymentStatus;
  shippingStatus: ShippingStatus;
  createdAt: string;
}

// NOTE: API.md §4.10 returns OrderStatusHistoryResponse[] but §5 doesn't define its
// shape. Derived from the order-service OrderStatusHistory entity — verify against the
// live response (GET /api/orders/{id}/history) during the smoke check.
export interface OrderStatusHistoryResponse {
  id: number;
  orderId: number;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedBy: number | null;
  changedAt: string;
  note?: string | null;
}

// ---- Staff order management (phase 2; API.md §4.10) ----

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  note?: string | null;
}

export interface UpdateShippingRequest {
  shippingMethod: string;
  trackingNumber?: string | null;
}
