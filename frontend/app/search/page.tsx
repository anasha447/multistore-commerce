import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ProductCard } from "@/components/product/ProductCard";
import { getProductsPage } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search — Matessa" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim().toLowerCase();

  // The catalog API has no full-text search in v1; filter the product page client-side by name.
  const { items } = query ? await getProductsPage({ size: 100 }) : { items: [] };
  const results = query ? items.filter((p) => p.name.toLowerCase().includes(query)) : [];

  return (
    <>
      <SiteHeader />
      <main className="min-h-[70svh]">
        <div className="mx-auto max-w-[1200px] px-5 py-12 nav:px-8">
          <h1 className="mb-6 font-heading text-3xl font-bold text-darkgreen md:text-4xl">Search</h1>
          <form action="/search" method="get" className="mb-8 flex max-w-lg gap-2">
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search blends & accessories…"
              aria-label="Search"
              className="flex-1 rounded-full border border-gray-300 bg-white px-5 py-3 font-body outline-none focus:border-green"
            />
            <button className="rounded-full bg-green px-6 py-3 font-body font-bold text-white transition-colors hover:bg-orange">
              Search
            </button>
          </form>

          {!query ? (
            <p className="text-gray-500">Type to search the Matessa catalog.</p>
          ) : results.length === 0 ? (
            <p className="text-gray-500">
              No matches for “{q}”. Try <Link href="/shop" className="font-bold text-green hover:text-orange">the full shop</Link>.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 nav:grid-cols-3 nav:gap-7 lg:grid-cols-4">
              {results.map((p) => (
                <ProductCard key={p.href} product={p} />
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter variant="minimal" />
    </>
  );
}
