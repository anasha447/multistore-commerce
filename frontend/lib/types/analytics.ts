// Analytics DTOs for the admin/manager dashboard (API.md §4.11, §5).
import type { OrderStatus, PaymentMethod, Role } from './common';

export interface SalesAnalyticsResponse {
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    thisYear: number;
    allTime: number;
    monthOverMonthPct: number;
  };
  totalOrders: number;
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  averageOrderValue: number;
  totalDiscountsGiven: number;
  couponRedemptions: number;
  refunds: { count: number; amount: number };
  revenueByPaymentMethod: Array<{
    paymentMethod: PaymentMethod;
    orders: number;
    revenue: number;
  }>;
  operations: {
    awaitingPayment: number;
    awaitingShipment: number;
    avgHoursToShip: number;
  };
}

export interface RevenueTrendPoint {
  /** "YYYY-MM". */
  month: string;
  revenue: number;
}

export interface TopProductResponse {
  productVariantId: number;
  sku: string;
  productName: string;
  unitsSold: number;
  revenue: number;
}

export interface TopCustomerResponse {
  userId: number;
  orders: number;
  totalSpent: number;
}

export interface StateOrderCount {
  /** Canonical Indian state/UT name; "Other" groups orders with no state. */
  state: string;
  orderCount: number;
}

export interface CatalogAnalyticsResponse {
  counts: { products: number; variants: number; categories: number };
  inventory: { totalValue: number; lowStock: number; outOfStock: number };
  totalReviews: number;
  promotions: { activeCoupons: number; activeDiscounts: number };
}

export interface LowStockItemResponse {
  variantId: number;
  sku: string;
  stockQuantity: number;
  restockLevel: number;
}

export interface TopRatedProductResponse {
  productId: number;
  productName: string;
  averageRating: number;
  reviewCount: number;
}

export interface MostWishlistedResponse {
  productVariantId: number;
  sku: string;
  wishlistCount: number;
}

export interface CustomerAnalyticsResponse {
  totalUsers: number;
  totalCustomers: number;
  newThisMonth: number;
  newThisYear: number;
  usersByRole: Partial<Record<Role, number>>;
}
