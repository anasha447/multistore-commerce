// Server-side cart read for the Cart page. The cart is owner-only (read via serverGet
// with the session cookie); backend cart lines carry no image, so we enrich each line
// with its product's primary image via the public catalog endpoints (cached per
// product to avoid refetching shared products).
import { api } from "@/lib/api";
import { serverGet } from "@/lib/server/session";
import type { CartItem, CartResponse } from "@/lib/api";

export interface CartLineView extends CartItem {
  image: string;
}
export interface CartViewData {
  /** null for a guest (unsaved) cart. */
  cartId: number | null;
  userId: number | null;
  items: CartLineView[];
  subtotal: number;
}

const PLACEHOLDER = "/brand/leaf-pattern-light.webp";

async function imageForVariant(variantId: number, cache: Map<number, string>): Promise<string> {
  try {
    const ps = await api.variants.getPriceStock(variantId);
    if (cache.has(ps.productId)) return cache.get(ps.productId)!;
    const imgs = await api.images.listForProduct(ps.productId);
    const primary = imgs.find((i) => i.primary) ?? imgs[0];
    const url = primary?.url ?? PLACEHOLDER;
    cache.set(ps.productId, url);
    return url;
  } catch {
    return PLACEHOLDER;
  }
}

/** Authed cart, with a primary image resolved for each line. Null when unauthenticated. */
export async function getCartView(): Promise<CartViewData | null> {
  const cart = await serverGet<CartResponse>("/api/cart");
  if (!cart) return null;
  const productImageCache = new Map<number, string>();
  const items = await Promise.all(
    cart.items.map(async (item) => ({
      ...item,
      image: await imageForVariant(item.productVariantId, productImageCache),
    })),
  );
  return { cartId: cart.cartId, userId: cart.userId, items, subtotal: cart.subtotal };
}
