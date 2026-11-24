// Reviews (API.md §4.6). Reads are public; writes require auth (owner for edit/delete).
import { http } from '../http';
import type { Page, PageParams } from '@/lib/types/common';
import type {
  ReviewRequest,
  ReviewResponse,
  ReviewSummaryResponse,
} from '@/lib/types/catalog';

export const reviewsApi = {
  list: (productId: number, params?: PageParams) =>
    http.get<Page<ReviewResponse>>(`/api/products/${productId}/reviews`, {
      query: params,
      auth: false,
    }),

  summary: (productId: number) =>
    http.get<ReviewSummaryResponse>(`/api/products/${productId}/reviews/summary`, {
      auth: false,
    }),

  create: (productId: number, body: ReviewRequest) =>
    http.post<ReviewResponse>(`/api/products/${productId}/reviews`, body),

  update: (id: number, body: ReviewRequest) =>
    http.put<ReviewResponse>(`/api/reviews/${id}`, body),

  remove: (id: number) => http.del<void>(`/api/reviews/${id}`),
};
