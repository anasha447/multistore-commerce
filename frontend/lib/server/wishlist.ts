// Server-side wishlist assembly: the backend wishlist stores only variant ids, so we
// resolve each to a product card (name, price, image, category) via public endpoints.
// Owner-only — reads the cookie session. Returns null when signed out.
import { api } from "@/lib/api";
import type { CategoryResponse, WishlistResponse } from "@/lib/api";
import type { ProductCardData } from "@/lib/types/product-card";
import { getAccessToken, serverGet } from "./session";

const PLACEHOLDER = "/brand/leaf-pattern-light.webp";

export interface WishlistEntry {
  wishlistItemId: number;
  variantId: number;
  product: ProductCardData;
}

export async function getWishlist(): Promise<WishlistEntry[] | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const wl = await serverGet<WishlistResponse>("/api/wishlist");
  if (!wl) return [];

  const cats = await api.categories.list().catch(() => [] as CategoryResponse[]);
  const nameById = new Map(cats.map((c) => [c.id, c.name]));

  const entries = await Promise.all(
    wl.items.map(async (it): Promise<WishlistEntry | null> => {
      try {
        const ps = await api.variants.getPriceStock(it.productVariantId);
        const [product, imgs] = await Promise.all([
          api.products.get(ps.productId).catch(() => null),
          api.images.listForProduct(ps.productId).catch(() => []),
        ]);
        const primary = imgs.find((i) => i.primary) ?? imgs[0];
        return {
          wishlistItemId: it.id,
          variantId: it.productVariantId,
          product: {
            name: ps.productName,
            category: product ? (nameById.get(product.categoryId) ?? "Gear") : "Gear",
            price: ps.effectivePrice,
            image: primary?.url ?? PLACEHOLDER,
            alt: ps.productName,
            href: product?.slug ? `/product/${product.slug}` : "#",
          },
        };
      } catch {
        return null;
      }
    }),
  );

  return entries.filter((e): e is WishlistEntry => e !== null);
}
