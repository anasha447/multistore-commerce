import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ShopHero } from "@/components/shop/ShopHero";
import { ShopTabs } from "@/components/shop/ShopTabs";
import { ProductCard } from "@/components/product/ProductCard";
import { getCategoryNav, getProductsPage } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Shop — Matessa" };

const PAGE_SIZE = 24;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const categoryId = params.category && /^\d+$/.test(params.category) ? Number(params.category) : undefined;
  const page = params.page && /^\d+$/.test(params.page) ? Number(params.page) : 0;

  const [categories, { items, total }] = await Promise.all([
    getCategoryNav(),
    getProductsPage({ categoryId, page, size: PAGE_SIZE }),
  ]);
  const activeName = categoryId ? categories.find((c) => c.id === categoryId)?.name : undefined;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <SiteHeader />
      <main className="min-h-[70svh]">
        <ShopHero title={activeName ?? "Products"} />
        <div className="mx-auto max-w-[1200px] px-5 py-10 nav:px-8 nav:py-14">
          <ShopTabs categories={categories} activeId={categoryId} />

          {items.length === 0 ? (
            <p className="py-24 text-center text-gray-500">Nothing here yet — new blends are on their way.</p>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-4 nav:grid-cols-3 nav:gap-7 lg:grid-cols-4">
              {items.map((p) => (
                <ProductCard key={p.href} product={p} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav aria-label="Pages" className="mt-12 flex items-center justify-center gap-2">
              {Array.from({ length: pages }).map((_, i) => {
                const qs = new URLSearchParams();
                if (categoryId) qs.set("category", String(categoryId));
                if (i > 0) qs.set("page", String(i));
                const href = `/shop${qs.size ? `?${qs}` : ""}`;
                return (
                  <a
                    key={i}
                    href={href}
                    aria-current={i === page ? "page" : undefined}
                    className={`grid h-9 w-9 place-items-center rounded-full font-body text-sm font-bold transition-colors ${
                      i === page ? "bg-darkgreen text-craemy" : "bg-white text-darkgreen hover:text-orange"
                    }`}
                  >
                    {i + 1}
                  </a>
                );
              })}
            </nav>
          )}
        </div>
      </main>
      <SiteFooter variant="full" />
    </>
  );
}
