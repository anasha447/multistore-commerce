import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProductCard } from "@/components/product/ProductCard";
import { PillLink } from "@/components/ui/brand";
import { getCurrentUser } from "@/lib/server/session";
import { getWishlist } from "@/lib/server/wishlist";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Wishlist — Matessa" };

export default async function WishlistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/wishlist");

  const entries = (await getWishlist()) ?? [];

  return (
    <>
      <SiteHeader />
      <main className="min-h-[70svh]">
        <div className="mx-auto max-w-[1200px] px-5 py-12 nav:px-8">
          <h1 className="mb-8 font-heading text-3xl font-bold text-darkgreen md:text-4xl">Wishlist</h1>
          {entries.length === 0 ? (
            <div className="rounded-[22px] bg-white p-10 text-center shadow-lg">
              <p className="mb-6 text-gray-600">Nothing saved yet — tap the heart on a blend you love.</p>
              <PillLink href="/shop">Browse blends</PillLink>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 nav:grid-cols-3 nav:gap-7 lg:grid-cols-4">
              {entries.map((e) => (
                <ProductCard key={e.wishlistItemId} product={e.product} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter variant="minimal" />
    </>
  );
}
