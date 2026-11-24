"use client";

import { useRouter } from "next/navigation";
import { StatusBadge } from "./ui";
import { formatMoney } from "@/lib/utils/money";
import { orderStatusLabel } from "@/lib/utils/orderStatus";
import type { OrderSummaryResponse } from "@/lib/api";

function shortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Admin orders table with keyboard-accessible clickable rows → order detail. */
export function OrdersTable({ orders }: { orders: OrderSummaryResponse[] }) {
  const router = useRouter();
  const open = (orderNumber: string) => router.push(`/admin/orders/${orderNumber}`);

  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th scope="col">Order</th>
            <th scope="col">Customer</th>
            <th scope="col">Status</th>
            <th scope="col">Payment</th>
            <th scope="col">Shipping</th>
            <th scope="col" className="num">Total</th>
            <th scope="col">Placed</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr
              key={o.id}
              className="is-link"
              tabIndex={0}
              role="link"
              aria-label={`Open order ${o.orderNumber}`}
              onClick={() => open(o.orderNumber)}
              onKeyDown={(e) => {
                if (e.key === "Enter") open(o.orderNumber);
              }}
            >
              <td className="id-cell">{o.orderNumber}</td>
              <td className="muted">Customer #{o.userId}</td>
              <td>
                <StatusBadge value={o.status} label={orderStatusLabel(o.status)} />
              </td>
              <td>
                <StatusBadge value={o.paymentStatus} />
              </td>
              <td>
                <StatusBadge value={o.shippingStatus} />
              </td>
              <td className="num money">{formatMoney(o.total)}</td>
              <td className="muted">{shortDate(o.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
