// Orders & checkout (API.md §4.10). Auth + owner; staff order management.
import { http } from '../http';
import type { OrderStatus, Page, PageParams, PaymentMethod } from '@/lib/types/common';
import type {
  CheckoutRequest,
  GuestCheckoutRequest,
  OrderResponse,
  OrderStatusHistoryResponse,
  OrderSummaryResponse,
  UpdateOrderStatusRequest,
  UpdateShippingRequest,
} from '@/lib/types/order';

export type OrderAdminListParams = PageParams & {
  status?: OrderStatus;
};

export const ordersApi = {
  /** Place an order. Throws ApiError 409 if a line went out of stock. An optional
   *  idempotencyKey makes a retried submit return the same order instead of a duplicate. */
  checkout: (body: CheckoutRequest, idempotencyKey?: string, signal?: AbortSignal) =>
    http.post<OrderResponse>('/api/orders', body, {
      signal,
      ...(idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : {}),
    }),

  /** Guest checkout — no account. Public. Returns the order (incl. order number). */
  guestCheckout: (body: GuestCheckoutRequest, idempotencyKey?: string, signal?: AbortSignal) =>
    http.post<OrderResponse>('/api/orders/guest', body, {
      auth: false,
      signal,
      ...(idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : {}),
    }),

  /** Public: the payment methods this store accepts right now (COD-only until a real
   *  payment provider is connected). The checkout shows only these. */
  paymentMethods: () =>
    http.get<{ methods: PaymentMethod[] }>('/api/orders/payment-methods', { auth: false }),

  /** Public guest-order tracking by order number + the email it was placed with. */
  track: (orderNumber: string, email: string) =>
    http.get<OrderResponse>('/api/orders/track', {
      query: { number: orderNumber, email },
      auth: false,
    }),

  listMine: (params?: PageParams) =>
    http.get<Page<OrderSummaryResponse>>('/api/orders', { query: params }),

  get: (id: number) => http.get<OrderResponse>(`/api/orders/${id}`),

  /** Owner/staff lookup by the customer-facing order number (MA…). */
  getByNumber: (orderNumber: string) =>
    http.get<OrderResponse>(`/api/orders/by-number/${encodeURIComponent(orderNumber)}`),

  cancel: (id: number) => http.post<OrderResponse>(`/api/orders/${id}/cancel`),

  history: (id: number) =>
    http.get<OrderStatusHistoryResponse[]>(`/api/orders/${id}/history`),

  // ---- staff ----
  listAll: (params?: OrderAdminListParams) =>
    http.get<Page<OrderSummaryResponse>>('/api/orders/admin', { query: params }),

  updateStatus: (id: number, body: UpdateOrderStatusRequest) =>
    http.put<OrderResponse>(`/api/orders/${id}/status`, body),

  updateShipping: (id: number, body: UpdateShippingRequest) =>
    http.put<OrderResponse>(`/api/orders/${id}/shipping`, body),
};
