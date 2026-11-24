// Newsletter subscribers (commercial-service). Public join; staff list.
import { http } from '../http';
import type { Page, PageParams } from '@/lib/types/common';
import type {
  SubscribeRequest,
  SubscribeResponse,
  SubscriberResponse,
} from '@/lib/types/contact';

export const subscribersApi = {
  /** Public: subscribe an email and get a welcome coupon back (idempotent per email). */
  join: (body: SubscribeRequest) =>
    http.post<SubscribeResponse>('/api/subscribers', body, { auth: false }),

  // ---- staff ----
  list: (params?: PageParams) =>
    http.get<Page<SubscriberResponse>>('/api/subscribers', { query: params }),
};
