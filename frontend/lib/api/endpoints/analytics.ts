// Analytics (API.md §4.11). staff = sales + catalog; customers = ADMIN only
// (handle 403 defensively for managers).
import { http } from '../http';
import type {
  CatalogAnalyticsResponse,
  CustomerAnalyticsResponse,
  LowStockItemResponse,
  MostWishlistedResponse,
  RevenueTrendPoint,
  SalesAnalyticsResponse,
  StateOrderCount,
  TopCustomerResponse,
  TopProductResponse,
  TopRatedProductResponse,
} from '@/lib/types/analytics';

export const analyticsApi = {
  // ---- sales (staff) ----
  sales: () => http.get<SalesAnalyticsResponse>('/api/analytics/sales'),

  revenueTrend: (months = 12) =>
    http.get<RevenueTrendPoint[]>('/api/analytics/sales/revenue-trend', { query: { months } }),

  topProducts: (limit = 10) =>
    http.get<TopProductResponse[]>('/api/analytics/sales/top-products', { query: { limit } }),

  topCustomers: (limit = 10) =>
    http.get<TopCustomerResponse[]>('/api/analytics/sales/top-customers', { query: { limit } }),

  ordersByState: () =>
    http.get<StateOrderCount[]>('/api/analytics/sales/orders-by-state'),

  // ---- catalog (staff) ----
  catalog: () => http.get<CatalogAnalyticsResponse>('/api/analytics/catalog'),

  lowStock: (limit = 20) =>
    http.get<LowStockItemResponse[]>('/api/analytics/catalog/low-stock', { query: { limit } }),

  topRated: (limit = 10) =>
    http.get<TopRatedProductResponse[]>('/api/analytics/catalog/top-rated', { query: { limit } }),

  mostWishlisted: (limit = 10) =>
    http.get<MostWishlistedResponse[]>('/api/analytics/catalog/most-wishlisted', {
      query: { limit },
    }),

  // ---- customers (ADMIN only) ----
  customers: () => http.get<CustomerAnalyticsResponse>('/api/analytics/customers'),
};
