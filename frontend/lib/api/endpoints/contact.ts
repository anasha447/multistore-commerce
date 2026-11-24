// Contact queries (commercial-service). Public submit; staff list + resolve.
import { http } from '../http';
import type { Page, PageParams } from '@/lib/types/common';
import type {
  ContactQueryRequest,
  ContactQueryResponse,
  ContactQueryStatus,
} from '@/lib/types/contact';

export const contactApi = {
  /** Public: submit a storefront contact-form query (no account needed). */
  submit: (body: ContactQueryRequest) =>
    http.post<ContactQueryResponse>('/api/contact', body, { auth: false }),

  // ---- staff ----
  list: (params?: PageParams) =>
    http.get<Page<ContactQueryResponse>>('/api/contact', { query: params }),

  setStatus: (id: number, status: ContactQueryStatus) =>
    http.patch<ContactQueryResponse>(`/api/contact/${id}/status`, { status }),
};
