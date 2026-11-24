"use client";

// Guest order tracking (design purpose: /track) — order number + email lookup.
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { OrderResponse } from "@/lib/api";
import { formatMoney } from "@/lib/utils/money";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderTracker } from "./OrderTracker";

export function TrackView() {
  const sp = useSearchParams();
  const [number, setNumber] = useState(sp.get("number") ?? "");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lookup = async () => {
    setError(null);
    if (!number.trim() || !email.trim()) {
      setError("Enter your order number and the email you used.");
      return;
    }
    setBusy(true);
    try {
      setOrder(await api.orders.track(number.trim(), email.trim()));
    } catch (e) {
      setOrder(null);
      setError(e instanceof ApiError && e.isNotFound ? "No order found for that number and email." : "Couldn't look up that order.");
    } finally {
      setBusy(false);
    }
  };

  const field = "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-body outline-none focus:border-green";

  return (
    <div className="mx-auto max-w-xl px-6 py-14">
      <h1 className="mb-2 text-center font-heading text-3xl font-bold text-darkgreen md:text-4xl">Track your order</h1>
      <p className="mb-8 text-center font-body text-gray-500">Enter your order number and email to see its status.</p>

      <div className="grid gap-3 rounded-[22px] bg-white p-6 shadow-lg">
        <input className={field} placeholder="Order number (e.g. MA1407170817)" value={number} onChange={(e) => setNumber(e.target.value)} aria-label="Order number" />
        <input className={field} type="email" placeholder="Email used at checkout" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
        {error && <p className="font-body text-sm text-orange">{error}</p>}
        <button
          type="button"
          disabled={busy}
          onClick={lookup}
          className="rounded-full bg-green py-3 font-body font-bold text-white transition-colors duration-300 hover:bg-orange disabled:opacity-40"
        >
          {busy ? "Looking up…" : "Track order"}
        </button>
      </div>

      {order && (
        <div className="mt-8 rounded-[22px] bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <p className="font-body text-lg font-bold text-green">{order.orderNumber}</p>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="mt-6">
            <OrderTracker status={order.status} />
          </div>
          <ul className="mt-6 space-y-1.5 border-t border-gray-100 pt-4">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between font-body text-sm text-gray-600">
                <span>
                  {i.productName} × {i.quantity}
                </span>
                <span className="font-bold text-green">{formatMoney(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-gray-100 pt-4 font-body">
            <span className="text-gray-600">Total</span>
            <span className="font-heading text-xl font-bold text-green">{formatMoney(order.total)}</span>
          </div>
          {order.trackingNumber && (
            <p className="mt-4 font-body text-sm text-gray-500">
              Courier tracking: <span className="font-bold text-darkgreen">{order.trackingNumber}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
