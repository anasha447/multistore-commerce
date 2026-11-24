import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { CheckoutView } from "@/components/checkout/CheckoutView";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session/cookies";
import { getCurrentUser, serverGet } from "@/lib/server/session";
import type { CartResponse } from "@/lib/api";

// Rendered per request and never cached (Next sends Cache-Control: no-store for dynamic
// pages), so a filled checkout is not restored from the back/forward cache.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Checkout — Matessa",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ coupon?: string }>;
}) {
  const { coupon } = await searchParams;
  const initialCoupon = coupon && coupon.trim() ? coupon.trim().slice(0, 40) : null;

  const jar = await cookies();
  const authed = jar.has(ACCESS_COOKIE) || jar.has(REFRESH_COOKIE);
  const user = authed ? await getCurrentUser() : null;

  // Signed-in shoppers: an empty server cart never reaches the form. (A guest cart lives in
  // the browser, so CheckoutView applies the same guard client-side.)
  if (user) {
    const cart = await serverGet<CartResponse>("/api/cart");
    if (cart && cart.items.length === 0) redirect("/cart");
  }
  const userInfo = user ? { email: user.email, fullName: `${user.firstName} ${user.lastName}`.trim() } : null;

  return (
    <>
      <SiteHeader />
      <main className="min-h-[70svh]">
        <CheckoutView user={userInfo} initialCoupon={initialCoupon} guest={!authed} />
      </main>
      <SiteFooter variant="minimal" />
    </>
  );
}
