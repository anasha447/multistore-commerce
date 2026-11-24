// Server-side admin orders: the staff order list (paginated + status filter) and
// per-status counts (reused from sales analytics — the admin list endpoint doesn't
// return counts). Staff/admin only → serverGet (cookie session).
import { serverGet } from "./session";
import type {
  OrderStatus,
  OrderSummaryResponse,
  Page,
  SalesAnalyticsResponse,
} from "@/lib/api";

export interface AdminOrdersPage {
  items: OrderSummaryResponse[];
  total: number;
  page: number;
  totalPages: number;
  totalAll: number;
  counts: Partial<Record<OrderStatus, number>>;
}

export async function getAdminOrders(opts: {
  status?: string;
  page?: number;
  size?: number;
}): Promise<AdminOrdersPage> {
  const size = opts.size ?? 8;
  const page = opts.page ?? 0;
  const qs = new URLSearchParams();
  if (opts.status) qs.set("status", opts.status);
  qs.set("page", String(page));
  qs.set("size", String(size));
  qs.set("sort", "createdAt,desc");

  const [pageData, sales] = await Promise.all([
    serverGet<Page<OrderSummaryResponse>>(`/api/orders/admin?${qs.toString()}`),
    serverGet<SalesAnalyticsResponse>("/api/analytics/sales"),
  ]);

  return {
    items: pageData?.content ?? [],
    total: pageData?.page.totalElements ?? 0,
    page: pageData?.page.number ?? page,
    totalPages: pageData?.page.totalPages ?? 1,
    totalAll: sales?.totalOrders ?? pageData?.page.totalElements ?? 0,
    counts: sales?.ordersByStatus ?? {},
  };
}
