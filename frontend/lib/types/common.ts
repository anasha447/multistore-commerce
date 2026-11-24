// Shared primitives, enums, and envelope types used across the API client.
// Hand-written from API.md §3 (conventions) and §5 (schema reference). TS types only.

// ---- Enums (API.md §5). Each is a const tuple + derived union: the tuple is
// handy for dropdowns/iteration, the union is the type used everywhere else. ----

export const ROLES = ['CUSTOMER', 'MANAGER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const ADDRESS_TYPES = ['HOME', 'WORK', 'OTHER'] as const;
export type AddressType = (typeof ADDRESS_TYPES)[number];

export const DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED_AMOUNT'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const ORDER_STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// ONLINE = gateway-hosted payment (Razorpay / PayPal); charge is mocked in v1.
// CARD / PAYPAL are retained so historical orders still map, but the checkout form
// now only offers COD + ONLINE.
export const PAYMENT_METHODS = ['CARD', 'PAYPAL', 'COD', 'ONLINE'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const SHIPPING_STATUSES = ['PENDING', 'SHIPPED', 'DELIVERED', 'RETURNED'] as const;
export type ShippingStatus = (typeof SHIPPING_STATUSES)[number];

// ---- Pagination (API.md §3). List endpoints accept these params and return a
// Spring PagedModel: { content, page: { size, number, totalElements, totalPages } }. ----

// `type` (not `interface`) so it gains an implicit index signature and stays
// assignable to the query-string builder's QueryParams.
export type PageParams = {
  page?: number;
  size?: number;
  /** e.g. "createdAt,desc" — repeatable for multi-sort. */
  sort?: string | string[];
};

export interface Page<T> {
  content: T[];
  page: {
    size: number;
    number: number;
    totalElements: number;
    totalPages: number;
  };
}

// ---- Error envelope (API.md §3). One consistent shape across all services.
// `fieldErrors` is present only on 400 validation failures. ----

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
  /** Machine-readable reason, when the server gives one (e.g. IDEMPOTENCY_KEY_REUSED). */
  code?: string;
}
