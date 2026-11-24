import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Cart — Matessa" };

export default function CartPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[70svh]">
        <CartView />
      </main>
      <SiteFooter variant="full" />
    </>
  );
}
