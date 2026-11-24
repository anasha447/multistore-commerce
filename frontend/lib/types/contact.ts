// Contact queries + newsletter subscribers (commercial-service). TS types only.

export const CONTACT_QUERY_STATUSES = ['OPEN', 'RESOLVED'] as const;
export type ContactQueryStatus = (typeof CONTACT_QUERY_STATUSES)[number];

export interface ContactQueryRequest {
  email: string;
  queryType: string;
  message: string;
}

export interface ContactQueryResponse {
  id: number;
  email: string;
  queryType: string;
  message: string;
  status: ContactQueryStatus;
  createdAt: string;
}

export interface SubscribeRequest {
  email: string;
}

/** Returned to the storefront popup after signup. `couponCode` is null for a repeat
 *  signup — the backend never echoes an existing subscriber's stored code. */
export interface SubscribeResponse {
  email: string;
  couponCode: string | null;
  discountPercent: number;
  message: string;
}

/** Staff-facing subscriber row for the admin Contacts page. */
export interface SubscriberResponse {
  id: number;
  email: string;
  couponCode: string | null;
  createdAt: string;
}
