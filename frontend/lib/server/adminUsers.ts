// Server-side admin user management (ADMIN only). Staff directory, customer directory,
// and customer analytics — all via serverGet (cookie session).
import { serverGet } from "./session";
import type {
  AdminUserResponse,
  CustomerAnalyticsResponse,
  Page,
  Role,
} from "@/lib/api";

export interface AdminUsersPage {
  items: AdminUserResponse[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getAdminUsers(opts: {
  role?: Role;
  enabled?: boolean;
  page?: number;
  size?: number;
}): Promise<AdminUsersPage> {
  const size = opts.size ?? 20;
  const page = opts.page ?? 0;
  const qs = new URLSearchParams();
  if (opts.role) qs.set("role", opts.role);
  if (opts.enabled != null) qs.set("enabled", String(opts.enabled));
  qs.set("page", String(page));
  qs.set("size", String(size));

  const data = await serverGet<Page<AdminUserResponse>>(`/api/admin/users?${qs.toString()}`);
  return {
    items: data?.content ?? [],
    total: data?.page.totalElements ?? 0,
    page: data?.page.number ?? page,
    totalPages: data?.page.totalPages ?? 1,
  };
}

export function getCustomerAnalytics(): Promise<CustomerAnalyticsResponse | null> {
  return serverGet<CustomerAnalyticsResponse>("/api/analytics/customers");
}

/** The account's highest role, for display/badges. */
export function topRole(roles: Role[]): Role {
  if (roles.includes("ADMIN")) return "ADMIN";
  if (roles.includes("MANAGER")) return "MANAGER";
  return "CUSTOMER";
}
