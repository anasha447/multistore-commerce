"use client";

import { EmptyBlock, Donut, KpiCard } from "./ui";
import { AdminPager } from "./AdminPager";
import type { AdminUserResponse, CustomerAnalyticsResponse } from "@/lib/api";
import type { AdminUsersPage } from "@/lib/server/adminUsers";

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export function CustomersView({
  analytics,
  directory,
  enabled,
}: {
  analytics: CustomerAnalyticsResponse | null;
  directory: AdminUsersPage;
  enabled?: string;
}) {
  const params: Record<string, string> = {};
  if (enabled) params.enabled = enabled;

  const chipHref = (val: string) => {
    const p = new URLSearchParams();
    if (val) p.set("enabled", val);
    const qs = p.toString();
    return `/admin/customers${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="adm-content">
      <div className="page-head">
        <div className="ttl">
          <p>Customer directory and analytics. Admin-only.</p>
        </div>
      </div>

      {analytics && (
        <>
          <div className="kpi-grid">
            <KpiCard accent label="Total users" value={analytics.totalUsers} />
            <KpiCard label="Customers" value={analytics.totalCustomers} />
            <KpiCard label="New this month" value={analytics.newThisMonth} />
            <KpiCard label="New this year" value={analytics.newThisYear} />
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Users by role</h3>
            </div>
            <div className="card-body">
              <Donut
                centerValue={analytics.totalUsers.toLocaleString()}
                centerLabel="users"
                segments={[
                  { label: "Customers", value: analytics.usersByRole.CUSTOMER ?? 0, color: "#33414F" },
                  { label: "Managers", value: analytics.usersByRole.MANAGER ?? 0, color: "#2E9CC4" },
                  { label: "Admins", value: analytics.usersByRole.ADMIN ?? 0, color: "#F26323" },
                ]}
              />
            </div>
          </div>
        </>
      )}

      <div className="card">
        <div className="card-head">
          <h3>Customer directory</h3>
          <span className="sub">{directory.total} customers</span>
        </div>
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="filter-row" role="group" aria-label="Filter by status">
            <a className={`f-chip${!enabled ? " is-active" : ""}`} href={chipHref("")}>Any status</a>
            <a className={`f-chip${enabled === "true" ? " is-active" : ""}`} href={chipHref("true")}>Active</a>
            <a className={`f-chip${enabled === "false" ? " is-active" : ""}`} href={chipHref("false")}>Banned</a>
          </div>
        </div>
        {directory.items.length === 0 ? (
          <EmptyBlock title="No customers yet">Customers appear here once people register and shop.</EmptyBlock>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {directory.items.map((u: AdminUserResponse) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                      <div className="mono muted" style={{ fontSize: 11.5 }}>{u.email}</div>
                    </td>
                    <td className="muted">{u.phone || "—"}</td>
                    <td>
                      <span className={`st-badge ${u.enabled ? "st-success" : "st-danger"}`}>{u.enabled ? "Active" : "Banned"}</span>
                    </td>
                    <td className="muted">{fmtDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AdminPager page={directory.page} totalPages={directory.totalPages} total={directory.total} size={20} basePath="/admin/customers" params={params} />
      </div>
    </div>
  );
}
