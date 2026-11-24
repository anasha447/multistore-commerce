import Link from "next/link";
import { getAdminOrders } from "@/lib/server/adminOrders";
import { OrdersTable } from "@/components/admin/OrdersTable";
import { AdminPager } from "@/components/admin/AdminPager";
import { EmptyBlock } from "@/components/admin/ui";
import { orderStatusLabel } from "@/lib/utils/orderStatus";
import type { OrderStatus } from "@/lib/api";

export const dynamic = "force-dynamic";

const ORDER_STATUSES: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const status =
    sp.status && ORDER_STATUSES.includes(sp.status as OrderStatus) ? sp.status : "";
  const page = sp.page && /^\d+$/.test(sp.page) ? Number(sp.page) : 0;

  const { items, total, page: pg, totalPages, totalAll, counts } = await getAdminOrders({
    status,
    page,
    size: 8,
  });

  return (
    <div className="adm-content">
      <div className="page-head">
        <div className="ttl">
          <p>{totalAll} orders · click a row for detail and actions.</p>
        </div>
      </div>

      <div className="filter-row" role="group" aria-label="Filter by status">
        <Link className={`f-chip${!status ? " is-active" : ""}`} href="/admin/orders">
          All <span className="cnt">{totalAll}</span>
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            className={`f-chip${status === s ? " is-active" : ""}`}
            href={`/admin/orders?status=${s}`}
          >
            {orderStatusLabel(s)} <span className="cnt">{counts[s] ?? 0}</span>
          </Link>
        ))}
      </div>

      <div className="card">
        {items.length === 0 ? (
          <EmptyBlock title="No orders on this trail">
            {status ? `No ${status.toLowerCase()} orders right now.` : "No orders yet."} Try another
            status filter.
          </EmptyBlock>
        ) : (
          <OrdersTable orders={items} />
        )}
        <AdminPager
          page={pg}
          totalPages={totalPages}
          total={total}
          size={8}
          basePath="/admin/orders"
          params={status ? { status } : {}}
        />
      </div>
    </div>
  );
}
