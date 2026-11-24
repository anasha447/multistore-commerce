// Server-side catalog data for storefront pages. Runs in Server Components: it calls
// the public catalog endpoints through @/lib/api (no auth needed) and assembles the
// backend DTOs into the view models the design components consume. Degrades gracefully
// to empty results if the backend is unreachable, so pages still render.
import { api } from "@/lib/api";
import type { CategoryResponse, ProductResponse } from "@/lib/api";
import type { ProductCardData } from "@/lib/types/product-card";

// Fallback image when a product has no images yet in the catalog.
const PLACEHOLDER_IMAGE = "/brand/leaf-pattern-light.webp";

export interface CategoryTile {
  name: string;
  count: number;
  href: string;
}

/** Top-level categories with a live product count, mapped to the nav tiles/tabs. */
export async function getStorefrontCategories(): Promise<CategoryTile[]> {
  try {
    const cats = await api.categories.list();
    return await Promise.all(
      cats.map(async (c): Promise<CategoryTile> => {
        let count = 0;
        try {
          count = (await api.products.list({ categoryId: c.id, size: 1 })).page.totalElements;
        } catch {
          // count is best-effort; leave 0 if the products call fails
        }
        return { name: c.name, count, href: `/shop?category=${c.id}` };
      }),
    );
  } catch {
    return [];
  }
}

/** Newest products assembled into product cards (name, price, primary image, category). */
export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  try {
    const [page, cats] = await Promise.all([
      api.products.list({ size: limit }),
      api.categories.list().catch(() => [] as CategoryResponse[]),
    ]);
    const nameById = new Map(cats.map((c) => [c.id, c.name]));
    return await Promise.all(
      page.content.map((p) => toProductCard(p, nameById.get(p.categoryId))),
    );
  } catch {
    return [];
  }
}

export interface CategoryNavItem {
  id: number;
  name: string;
}

/** Lightweight category nav (id + name) for the shop tabs. */
export async function getCategoryNav(): Promise<CategoryNavItem[]> {
  try {
    const cats = await api.categories.list();
    return cats.map((c) => ({ id: c.id, name: c.name }));
  } catch {
    return [];
  }
}

/** A page of products as cards, optionally filtered by category. */
export async function getProductsPage(
  opts: { categoryId?: number; page?: number; size?: number } = {},
): Promise<{ items: ProductCardData[]; total: number }> {
  try {
    const [page, cats] = await Promise.all([
      api.products.list({ categoryId: opts.categoryId, page: opts.page ?? 0, size: opts.size ?? 24 }),
      api.categories.list().catch(() => [] as CategoryResponse[]),
    ]);
    const nameById = new Map(cats.map((c) => [c.id, c.name]));
    const items = await Promise.all(
      page.content.map((p) => toProductCard(p, nameById.get(p.categoryId))),
    );
    return { items, total: page.page.totalElements };
  } catch {
    return { items: [], total: 0 };
  }
}

async function toProductCard(
  product: ProductResponse,
  categoryName?: string,
): Promise<ProductCardData> {
  let image = PLACEHOLDER_IMAGE;
  let alt = product.name;
  try {
    const images = await api.images.listForProduct(product.id);
    const primary = images.find((i) => i.primary) ?? images[0];
    if (primary) {
      image = primary.url;
      alt = primary.altText || product.name;
    }
  } catch {
    // no images endpoint / none set — keep the placeholder
  }
  return {
    name: product.name,
    category: categoryName ?? "Matessa",
    price: product.basePrice,
    image,
    alt,
    href: `/product/${product.slug}`,
  };
}
