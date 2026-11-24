import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderTracker } from "@/components/orders/OrderTracker";
import { getCurrentUser, serverGet } from "@/lib/server/session";
import { formatMoney } from "@/lib/utils/money";
import type { OrderResponse } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order — Matessa" };

interface Address {
  recipientName?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

export default async function OrderDetailPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/orders/${encodeURIComponent(orderNumber)}`);

  const order = await serverGet<OrderResponse>(`/api/orders/by-number/${encodeURIComponent(orderNumber)}`);
  if (!order) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-[70svh]">
          <div className="mx-auto max-w-2xl px-6 py-24 text-center">
            <h1 className="font-heading text-3xl font-bold text-darkgreen">Order not found</h1>
            <p className="mt-3 text-gray-600">We couldn&apos;t find {orderNumber}.</p>
            <Link href="/orders" className="mt-6 inline-block font-body font-bold text-green hover:text-orange">
              Back to my orders
            </Link>
          </div>
        </main>
        <SiteFooter variant="minimal" />
      </>
    );
  }

  let addr: Address = {};
  try {
    addr = JSON.parse(order.shippingAddress) as Address;
  } catch {
    // snapshot may be malformed on legacy orders — show what we have
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-[70svh]">
        <div className="mx-auto max-w-3xl px-5 py-12 nav:px-8">
          <Link href="/orders" className="font-body text-sm text-gray-500 hover:text-orange">
            ← My orders
          </Link>

          <div className="mt-4 flex items-center justify-between">
            <h1 className="font-heading text-3xl font-bold text-darkgreen">{order.orderNumber}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 font-body text-sm text-gray-500">
            Placed {new Date(order.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <div className="mt-8 rounded-[22px] bg-white p-6 shadow-lg">
            <OrderTracker status={order.status} />
          </div>

          <div className="mt-6 grid gap-6 nav:grid-cols-[1fr_280px]">
            {/* Items */}
            <div className="rounded-[22px] bg-white p-6 shadow-lg">
              <h2 className="mb-4 font-heading text-lg font-bold text-darkgreen">Items</h2>
              <ul className="space-y-3">
                {order.items.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3 font-body text-sm">
                    <span className="text-gray-700">
                      {i.productName} <span className="text-gray-400">× {i.quantity}</span>
                    </span>
                    <span className="font-bold text-green">{formatMoney(i.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 font-body text-sm">
                <Row label="Subtotal" value={formatMoney(order.subtotal)} />
                {order.discountAmount > 0 && <Row label="Discount" value={`− ${formatMoney(order.discountAmount)}`} />}
                <Row label="Total" value={formatMoney(order.total)} strong />
              </div>
            </div>

            {/* Shipping + payment */}
            <aside className="space-y-6">
              <div className="rounded-[22px] bg-white p-6 shadow-lg">
                <h2 className="mb-3 font-heading text-lg font-bold text-darkgreen">Shipping</h2>
                <address className="font-body text-sm not-italic leading-relaxed text-gray-600">
                  {addr.recipientName}
                  <br />
                  {addr.line1}
                  {addr.line2 ? (
                    <>
                      <br />
                      {addr.line2}
                    </>
                  ) : null}
                  <br />
                  {[addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")}
                  <br />
                  {addr.country}
                </address>
                {order.trackingNumber && (
                  <p className="mt-3 font-body text-sm text-gray-500">
                    Tracking: <span className="font-bold text-darkgreen">{order.trackingNumber}</span>
                  </p>
                )}
              </div>
              <div className="rounded-[22px] bg-white p-6 shadow-lg">
                <h2 className="mb-3 font-heading text-lg font-bold text-darkgreen">Payment</h2>
                <p className="font-body text-sm text-gray-600">
                  {order.paymentMethod} · {order.paymentStatus}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter variant="minimal" />
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className={strong ? "font-bold text-darkgreen" : "text-gray-500"}>{label}</span>
      <span className={strong ? "font-heading text-lg font-bold text-green" : "font-bold text-darkgreen"}>{value}</span>
    </div>
  );
}
