import Link from "next/link";
import { getCurrentUser } from "@/lib/server/session";
import { getDashboardData } from "@/lib/server/analytics";
import { formatMoney } from "@/lib/utils/money";
import {
  Donut,
  Gauge,
  Heatmap,
  KpiCard,
  Pie,
  StatusBadge,
  type DonutSegment,
  type HeatCell,
} from "@/components/admin/ui";
import { TrendChart } from "@/components/admin/TrendChart";
import { OrdersOverTimeChart } from "@/components/admin/OrdersOverTimeChart";
import { IndiaOrdersMap } from "@/components/admin/IndiaOrdersMap";
import { orderStatusLabel } from "@/lib/utils/orderStatus";
import { icons } from "@/components/admin/icons";

export const dynamic = "force-dynamic";

const PM_LABEL: Record<string, string> = { CARD: "Card", PAYPAL: "PayPal", COD: "Cash on delivery" };
// Status semantics on the Matessa palette: orange = needs action, greens = healthy flow.
const STATUS_COLOR: Record<string, string> = {
  PENDING: "#F26323",
  PAID: "#E0A92E",
  SHIPPED: "#2E9CC4",
  DELIVERED: "#3F8F5B",
  CANCELLED: "#D24B3E",
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthShort = (ym: string) => MONTHS[Number(ym.slice(5, 7)) - 1] ?? ym;

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();
  const isAdmin = user?.roles.includes("ADMIN") ?? false;
  const { sales, catalog, trend, topProducts, topCustomers, customers, ordersByState, orderTimestamps } =
    await getDashboardData(isAdmin);

  if (!sales || !catalog) {
    return (
      <div className="adm-content">
        <div className="empty-block">
          <div className="wing" />
          <h4>Couldn&apos;t load analytics</h4>
          <p>The analytics service didn&apos;t respond. Refresh, or try again shortly.</p>
        </div>
      </div>
    );
  }

  const statusSegments: DonutSegment[] = Object.entries(sales.ordersByStatus)
    .filter(([, v]) => (v ?? 0) > 0)
    .map(([k, v]) => ({ label: orderStatusLabel(k), value: v ?? 0, color: STATUS_COLOR[k] ?? "#7A9D3E" }));
  const paySegments: DonutSegment[] = sales.revenueByPaymentMethod.map((p, i) => ({
    label: PM_LABEL[p.paymentMethod] ?? p.paymentMethod,
    value: p.revenue,
    color: ["#3E5F2D", "#7A9D3E", "#F26323"][i % 3],
  }));

  // Gauges — fulfilment rate + month-over-month growth.
  const delivered = sales.ordersByStatus.DELIVERED ?? 0;
  const cancelled = sales.ordersByStatus.CANCELLED ?? 0;
  const fulfilRate = delivered / Math.max(1, sales.totalOrders - cancelled);
  // monthOverMonthPct is null when there's no prior-month baseline.
  const momRaw = sales.revenue.monthOverMonthPct;
  const mom = momRaw ?? 0;
  const momFrac = (Math.max(-50, Math.min(50, mom)) + 50) / 100;
  const momDisplay = momRaw == null ? "—" : `${momRaw >= 0 ? "+" : ""}${momRaw.toFixed(1)}%`;
  const momColor = momRaw == null ? "var(--text-secondary)" : momRaw >= 0 ? "#3F8F5B" : "#D24B3E";

  // Heatmap — a fixed last-12-months grid (zero-filled) so it reads as a grid even
  // before a full year of revenue has accrued.
  const trendByMonth = new Map(trend.map((t) => [t.month, t.revenue]));
  const now = new Date();
  const heatCells: HeatCell[] = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { label: monthShort(ym), value: trendByMonth.get(ym) ?? 0 };
  });

  return (
    <div className="adm-content">
      {/* Headline KPIs (kpi-dashboard-design: 5-second executive scan — money now,
          money trend, volume, and the alert that needs action today). */}
      <div className="kpi-grid">
        <KpiCard accent label="Revenue · this month" value={sales.revenue.thisMonth} money delta={sales.revenue.monthOverMonthPct} sub="vs last month" />
        <KpiCard label="Revenue · today" value={sales.revenue.today} money sub={`week ${formatMoney(sales.revenue.thisWeek)}`} />
        <KpiCard label="Revenue · this year" value={sales.revenue.thisYear} money sub={`all time ${formatMoney(sales.revenue.allTime)}`} />
        <KpiCard label="Total orders" value={sales.totalOrders} sub={`AOV ${formatMoney(sales.averageOrderValue)}`} />
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Fulfilment health</h3>
          <span className="sub">at a glance</span>
        </div>
        <div className="card-body">
          <div className="gauge-row">
            <Gauge value={fulfilRate} max={1} display={`${Math.round(fulfilRate * 100)}%`} label="Delivered rate" color="#3F8F5B" />
            <Gauge value={momFrac} max={1} display={momDisplay} label="MoM growth" color={momColor} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Ops queue</h3>
          <span className="sub">needs action</span>
        </div>
        <div className="card-body">
          <div className="ops-queue">
            <Link className="ops-item" href="/admin/orders?status=PENDING">
              <span className="ops-n">{sales.operations.awaitingPayment}</span>
              <span className="ops-t">
                <b>New orders</b>
                <small>Placed orders to process and dispatch</small>
              </span>
              {icons.arrowR}
            </Link>
            <Link className="ops-item is-cool" href="/admin/orders?status=PAID">
              <span className="ops-n">{sales.operations.awaitingShipment}</span>
              <span className="ops-t">
                <b>Ready for transit</b>
                <small>Dispatched orders awaiting courier pickup</small>
              </span>
              {icons.arrowR}
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Orders over time</h3>
          <span className="sub">week · month · 6 months · year</span>
        </div>
        <div className="card-body">
          <OrdersOverTimeChart timestamps={orderTimestamps} />
        </div>
      </div>

      <div className="dash-row cols-3-2">
        <div className="card">
          <div className="card-head">
            <h3>Revenue trend</h3>
            <span className="sub">last 12 months</span>
          </div>
          <div className="card-body">
            <TrendChart data={trend} />
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Orders by status</h3>
            <span className="sub">{sales.totalOrders.toLocaleString()} total</span>
          </div>
          <div className="card-body">
            {statusSegments.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No orders yet.</p>
            ) : (
              <Donut
                size={150}
                centerValue={sales.totalOrders.toLocaleString()}
                centerLabel="orders"
                segments={statusSegments}
              />
            )}
          </div>
        </div>
      </div>

      <div className="dash-row cols-1-1">
        <div className="card">
          <div className="card-head">
            <h3>Revenue by payment method</h3>
            <span className="sub">share of revenue</span>
          </div>
          <div className="card-body">
            {paySegments.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No revenue yet.</p>
            ) : (
              <Pie segments={paySegments} />
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Catalog health</h3>
            <Link href="/admin/catalog" style={{ fontSize: 13, fontWeight: 600 }}>
              Manage catalog
            </Link>
          </div>
          <div className="card-body">
            <div className="kpi-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <KpiCard label="Inventory value" value={catalog.inventory.totalValue} money />
              <KpiCard
                label="Active promos"
                value={catalog.promotions.activeCoupons + catalog.promotions.activeDiscounts}
                sub={`${catalog.promotions.activeCoupons} coupons · ${catalog.promotions.activeDiscounts} discounts`}
              />
            </div>
            <div className="stat-rows" style={{ marginTop: 12 }}>
              <div className="stat-row">
                <span className="lbl">Low stock variants</span>
                <StatusBadge value="LOW" label={`${catalog.inventory.lowStock} low`} />
              </div>
              <div className="stat-row">
                <span className="lbl">Out of stock</span>
                <StatusBadge value="OUT" label={`${catalog.inventory.outOfStock} out`} />
              </div>
              <div className="stat-row">
                <span className="lbl">Products · variants · categories</span>
                <span className="val mono" style={{ fontSize: 13 }}>
                  {catalog.counts.products} · {catalog.counts.variants} · {catalog.counts.categories}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Revenue heat</h3>
          <span className="sub">last 12 months · intensity</span>
        </div>
        <div className="card-body">
          {heatCells.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>Not enough data yet.</p>
          ) : (
            <Heatmap cells={heatCells} money />
          )}
        </div>
      </div>

      <div className={`dash-row ${isAdmin ? "cols-1-1-1" : "cols-1-1"}`}>
        <div className="card">
          <div className="card-head">
            <h3>Top products</h3>
            <span className="sub">by revenue</span>
          </div>
          <div className="card-body">
            <div className="stat-rows">
              {topProducts.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No sales yet.</p>
              ) : (
                topProducts.map((p, i) => (
                  <div className="stat-row" key={p.productVariantId}>
                    <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                    <span className="lbl">
                      {p.productName}
                      <span className="mono" style={{ fontSize: 10.5, color: "var(--text-secondary)", marginLeft: 8 }}>
                        {p.unitsSold} sold
                      </span>
                    </span>
                    <span className="val">{formatMoney(p.revenue)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3>Top customers</h3>
            {isAdmin && (
              <Link href="/admin/customers" style={{ fontSize: 13, fontWeight: 600 }}>
                Customer analytics
              </Link>
            )}
          </div>
          <div className="card-body">
            <div className="stat-rows">
              {topCustomers.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No customers yet.</p>
              ) : (
                topCustomers.map((c, i) => (
                  <div className="stat-row" key={c.userId}>
                    <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                    <span className="lbl">
                      Customer #{c.userId}
                      <span className="mono" style={{ fontSize: 10.5, color: "var(--text-secondary)", marginLeft: 8 }}>
                        {c.orders} orders
                      </span>
                    </span>
                    <span className="val">{formatMoney(c.totalSpent)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        {isAdmin && customers && (
          <div className="card">
            <div className="card-head">
              <h3>Customers</h3>
              <span className="sub">admin only</span>
            </div>
            <div className="card-body">
              <Donut
                size={148}
                centerValue={customers.totalUsers.toLocaleString()}
                centerLabel="users"
                segments={[
                  { label: "Customers", value: customers.usersByRole.CUSTOMER ?? 0, color: "#3E5F2D" },
                  { label: "Managers", value: customers.usersByRole.MANAGER ?? 0, color: "#7A9D3E" },
                  { label: "Admins", value: customers.usersByRole.ADMIN ?? 0, color: "#F26323" },
                ]}
              />
              <div className="stat-rows" style={{ marginTop: 8 }}>
                <div className="stat-row">
                  <span className="lbl">New this month</span>
                  <span className="val">{customers.newThisMonth}</span>
                </div>
                <div className="stat-row">
                  <span className="lbl">New this year</span>
                  <span className="val">{customers.newThisYear}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Orders across India</h3>
          <span className="sub">by shipping state · excludes cancelled</span>
        </div>
        <div className="card-body">
          <IndiaOrdersMap data={ordersByState} />
        </div>
      </div>
    </div>
  );
}
