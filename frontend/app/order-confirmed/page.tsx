import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { OrderConfirmed } from "@/components/checkout/OrderConfirmed";

// The checkout replaces its history entry with this page, so Back from here goes to where
// the shopper was before checkout, never to a filled form that could be submitted again.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Order placed — Matessa",
  robots: { index: false, follow: false },
};

export default function OrderConfirmedPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[70svh]">
        <Suspense fallback={null}>
          <OrderConfirmed />
        </Suspense>
      </main>
      <SiteFooter variant="minimal" />
    </>
  );
}
