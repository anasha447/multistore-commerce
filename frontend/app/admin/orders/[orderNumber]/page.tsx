import { notFound, redirect } from "next/navigation";
import { getAccessToken, serverGet } from "@/lib/server/session";
import { formatMoney } from "@/lib/utils/money";
import { StatusBadge } from "@/components/admin/ui";
import { OrderActions } from "@/components/admin/OrderActions";
import { orderStatusLabel } from "@/lib/utils/orderStatus";
import type { OrderResponse, OrderStatusHistoryResponse } from "@/lib/api";

export const dynamic = "force-dynamic";

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

interface Address {
  name?: string;
  recipientName?: string;
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}
function parseAddress(json: string): Address | null {
  try {
    return JSON.parse(json) as Address;
  } catch {
    return null;
  }
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const token = await getAccessToken();
  if (!token) redirect(`/login?next=/admin/orders/${orderNumber}`);

  const order = await serverGet<OrderResponse>(`/api/orders/by-number/${encodeURIComponent(orderNumber)}`);
  if (!order) notFound();

  // history is keyed by the numeric id (an internal API path, not a browser URL)
  const history = (await serverGet<OrderStatusHistoryResponse[]>(`/api/orders/${order.id}/history`)) ?? [];
  const address = parseAddress(order.shippingAddress);

  return (
    <div className="adm-content">
      <div className="page-head">
        <div className="ttl">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h2 style={{ fontFamily: "var(--font-mono)", fontSize: 19, textTransform: "none", letterSpacing: ".02em" }}>
              {order.orderNumber}
            </h2>
            <StatusBadge value={order.status} label={orderStatusLabel(order.status)} />
          </div>
          <p>Customer #{order.userId} · placed {fmtDateTime(order.createdAt)}</p>
        </div>
        <OrderActions
          orderId={order.id}
          orderNumber={order.orderNumber}
          status={order.status}
          paymentStatus={order.paymentStatus}
          shippingMethod={order.shippingMethod}
          trackingNumber={order.trackingNumber}
        />
      </div>

      <div className="dash-row cols-3-2">
        {/* Items + totals */}
        <div className="card">
          <div className="card-head">
            <h3>Items</h3>
            <span className="sub">{order.items.length} line items</span>
          </div>
          <div className="tbl-wrap" style={{ marginTop: 10 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th className="num">Unit</th>
                  <th className="num">Qty</th>
                  <th className="num">Line</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it) => (
                  <tr key={it.id}>
                    <td style={{ fontWeight: 600 }}>{it.productName}</td>
                    <td className="id-cell muted">{it.sku}</td>
                    <td className="num">{formatMoney(it.unitPrice)}</td>
                    <td className="num mono" style={{ fontSize: 12.5 }}>×{it.quantity}</td>
                    <td className="num money">{formatMoney(it.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-body" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="stat-rows">
              <div className="stat-row">
                <span className="lbl" style={{ color: "var(--text-secondary)" }}>Subtotal</span>
                <span className="val">{formatMoney(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="stat-row">
                  <span className="lbl" style={{ color: "var(--text-secondary)" }}>
                    Discount
                    {order.couponCode && (
                      <span className="mono" style={{ marginLeft: 8, fontSize: 11, color: "var(--accent)" }}>
                        {order.couponCode}
                      </span>
                    )}
                  </span>
                  <span className="val" style={{ color: "var(--success)" }}>−{formatMoney(order.discountAmount)}</span>
                </div>
              )}
              <div className="stat-row" style={{ fontSize: 16 }}>
                <span className="lbl" style={{ fontWeight: 700 }}>Total</span>
                <span className="val" style={{ fontSize: 21, color: "var(--accent)" }}>{formatMoney(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Meta column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div className="card-head">
              <h3>Payment</h3>
              <StatusBadge value={order.paymentStatus} />
            </div>
            <div className="card-body">
              <div className="stat-rows">
                <div className="stat-row">
                  <span className="lbl" style={{ color: "var(--text-secondary)" }}>Method</span>
                  <span style={{ fontWeight: 600 }}>{order.paymentMethod}</span>
                </div>
                <div className="stat-row">
                  <span className="lbl" style={{ color: "var(--text-secondary)" }}>Transaction</span>
                  <span className="mono" style={{ fontSize: 12 }}>{order.transactionId || "—"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Shipping</h3>
              <StatusBadge value={order.shippingStatus} />
            </div>
            <div className="card-body">
              <div className="stat-rows">
                <div className="stat-row">
                  <span className="lbl" style={{ color: "var(--text-secondary)" }}>Method</span>
                  <span style={{ fontWeight: 600 }}>{order.shippingMethod || "—"}</span>
                </div>
                <div className="stat-row">
                  <span className="lbl" style={{ color: "var(--text-secondary)" }}>Tracking</span>
                  <span className="mono" style={{ fontSize: 12 }}>{order.trackingNumber || "—"}</span>
                </div>
              </div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <h3 style={{ fontSize: 13, marginBottom: 6 }}>Ship to</h3>
                {address ? (
                  <p style={{ fontSize: 14, lineHeight: 1.5 }}>
                    <b>{address.recipientName ?? address.name}</b>
                    <br />
                    {address.line1}
                    {address.line2 && (
                      <>
                        <br />
                        {address.line2}
                      </>
                    )}
                    <br />
                    {address.city}, {address.state} {address.postalCode}
                    <br />
                    {address.country}
                  </p>
                ) : (
                  <p style={{ fontSize: 13, color: "var(--danger)" }}>
                    Shipping address could not be parsed.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>History</h3>
            </div>
            <div className="card-body">
              {history.length === 0 ? (
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>No status changes recorded.</p>
              ) : (
                <div className="timeline">
                  {history.map((h, i) => (
                    <div key={h.id} className={`tl-item${i === history.length - 1 ? " is-current" : ""}`}>
                      <div className="tl-dot" />
                      <div className="tl-body">
                        <div className="tl-title">
                          {h.fromStatus
                            ? `${orderStatusLabel(h.fromStatus)} → ${orderStatusLabel(h.toStatus)}`
                            : orderStatusLabel(h.toStatus)}
                        </div>
                        <div className="tl-meta">
                          {fmtDateTime(h.changedAt)}
                          {h.changedBy != null && ` · #${h.changedBy}`}
                        </div>
                        {h.note && <div className="tl-note">{h.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
