import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { PillLink } from "@/components/ui/brand";
import { getCurrentUser, serverGet } from "@/lib/server/session";
import { formatMoney } from "@/lib/utils/money";
import type { OrderSummaryResponse, Page as ApiPage } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Orders — Matessa" };

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/orders");

  const page = await serverGet<ApiPage<OrderSummaryResponse>>("/api/orders?size=50&sort=createdAt,desc");
  const orders = page?.content ?? [];

  return (
    <>
      <SiteHeader />
      <main className="min-h-[70svh]">
        <div className="mx-auto max-w-3xl px-5 py-12 nav:px-8">
          <h1 className="mb-8 font-heading text-3xl font-bold text-darkgreen md:text-4xl">My Orders</h1>

          {orders.length === 0 ? (
            <div className="rounded-[22px] bg-white p-10 text-center shadow-lg">
              <p className="mb-6 text-gray-600">No orders yet — your first ritual awaits.</p>
              <PillLink href="/shop">Shop blends</PillLink>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/orders/${encodeURIComponent(o.orderNumber)}`}
                    className="flex items-center justify-between gap-4 rounded-[18px] bg-white p-5 shadow-lg transition-shadow hover:shadow-2xl"
                  >
                    <div>
                      <p className="font-body font-bold text-green">{o.orderNumber}</p>
                      <p className="font-body text-sm text-gray-500">
                        {new Date(o.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <OrderStatusBadge status={o.status} />
                      <span className="font-heading font-bold text-darkgreen">{formatMoney(o.total)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <SiteFooter variant="minimal" />
    </>
  );
}
