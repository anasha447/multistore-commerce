"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";
import type { CartItem, CartResponse } from "@/lib/api";

export const CART_PLACEHOLDER = "/brand/leaf-pattern-light.webp";
const GUEST_KEY = "ad_guest_cart";

/** Display snapshot captured when an item is added, so the guest cart can render
 *  (name, price, image, size) without a server round-trip. */
export interface CartItemMeta {
  name?: string;
  price?: number;
  image?: string;
  size?: string;
  sku?: string;
}

/** A guest cart line kept in localStorage. `/api/cart/price` is still the source of
 *  truth for totals, but the captured meta lets the drawer show items instantly and
 *  survive a transient pricing outage instead of looking empty. */
type GuestLine = { productVariantId: number; quantity: number } & CartItemMeta;

function cleanMeta(meta?: CartItemMeta): CartItemMeta {
  if (!meta) return {};
  const out: CartItemMeta = {};
  if (typeof meta.name === "string") out.name = meta.name;
  if (typeof meta.price === "number") out.price = meta.price;
  if (typeof meta.image === "string") out.image = meta.image;
  if (typeof meta.size === "string") out.size = meta.size;
  if (typeof meta.sku === "string") out.sku = meta.sku;
  return out;
}

function readGuest(): GuestLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(GUEST_KEY) || "[]");
    return Array.isArray(raw)
      ? raw
          .filter((l) => l && typeof l.productVariantId === "number" && typeof l.quantity === "number")
          .map((l) => ({ productVariantId: l.productVariantId, quantity: l.quantity, ...cleanMeta(l) }))
      : [];
  } catch {
    return [];
  }
}
function writeGuest(lines: GuestLine[]) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(lines));
  } catch {
    /* storage unavailable — cart is best-effort for guests */
  }
}

/** Empty the guest cart (e.g. after a guest order is placed). Call refresh() after. */
export function clearGuestCart() {
  writeGuest([]);
}
const EMPTY_GUEST_CART: CartResponse = { cartId: null, userId: null, items: [], subtotal: 0 };

/** Build a cart from the local guest snapshot (guest items are keyed by variant id,
 *  matching setQty/removeItem). Prices are best-effort until the server re-prices. */
function guestCartToResponse(lines: GuestLine[]): CartResponse {
  const items: CartItem[] = lines.map((l) => ({
    id: l.productVariantId,
    productVariantId: l.productVariantId,
    productName: l.name ?? "Item",
    sku: l.sku ?? "",
    unitPrice: l.price ?? 0,
    quantity: l.quantity,
    lineTotal: (l.price ?? 0) * l.quantity,
    available: true,
    stockQuantity: 99,
  }));
  return { cartId: null, userId: null, items, subtotal: items.reduce((s, it) => s + it.lineTotal, 0) };
}

/** Retry a transient cart call — the gateway circuit breaker briefly 503s cart ops when
 *  order-service GC-pauses; a short retry rides through it instead of erroring the user. */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastErr;
}

interface CartContextValue {
  cart: CartResponse | null;
  images: Record<number, string>;
  /** weight/size label per productVariantId, e.g. "250g" (enriched from the variant). */
  sizes: Record<number, string>;
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  refresh: () => Promise<void>;
  /** Adds to the server cart (signed in) or the local guest cart. `meta` captures a
   *  display snapshot so the guest cart renders without/before a server round-trip.
   *  Does not open the drawer. */
  addItem: (productVariantId: number, quantity?: number, meta?: CartItemMeta) => Promise<void>;
  setQty: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
}

const CartCtx = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}

/** `authed` is derived server-side from the session cookie (see the root layout). It flips
 *  to true after login via router.refresh(), which triggers the guest→account cart merge. */
export function CartProvider({ children, authed }: { children: ReactNode; authed: boolean }) {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [images, setImages] = useState<Record<number, string>>({});
  const [sizes, setSizes] = useState<Record<number, string>>({});
  const [isOpen, setIsOpen] = useState(false);
  const imgCache = useRef<Map<number, string>>(new Map());
  const sizeCache = useRef<Map<number, string>>(new Map());

  // Resolve a primary image + the weight/size label per cart line (backend cart lines
  // carry neither). Cached by productVariantId.
  const enrich = useCallback(async (c: CartResponse) => {
    const missing = c.items.filter((i) => !imgCache.current.has(i.productVariantId));
    await Promise.all(
      missing.map(async (i) => {
        try {
          const ps = await api.variants.getPriceStock(i.productVariantId);
          const [imgs, variants] = await Promise.all([
            api.images.listForProduct(ps.productId),
            // the price/stock endpoint has no size; the variant list carries the label
            api.variants.listForProduct(ps.productId).catch(() => []),
          ]);
          const size = variants.find((v) => v.id === i.productVariantId)?.size;
          if (size) sizeCache.current.set(i.productVariantId, size);
          const primary = imgs.find((x) => x.primary) ?? imgs[0];
          imgCache.current.set(i.productVariantId, primary?.url ?? CART_PLACEHOLDER);
        } catch {
          imgCache.current.set(i.productVariantId, CART_PLACEHOLDER);
        }
      }),
    );
    if (missing.length > 0) {
      setImages(Object.fromEntries(imgCache.current));
      setSizes(Object.fromEntries(sizeCache.current));
    }
  }, []);

  const apply = useCallback(
    async (c: CartResponse) => {
      setCart(c);
      await enrich(c);
    },
    [enrich],
  );

  // Render the guest cart from the local snapshot — instant, and works with no network.
  // Seeds images/sizes from the captured meta so the drawer is complete offline.
  const applyGuestLocal = useCallback((lines: GuestLine[]) => {
    let seeded = false;
    for (const l of lines) {
      if (l.image && !imgCache.current.has(l.productVariantId)) {
        imgCache.current.set(l.productVariantId, l.image);
        seeded = true;
      }
      if (l.size && !sizeCache.current.has(l.productVariantId)) {
        sizeCache.current.set(l.productVariantId, l.size);
        seeded = true;
      }
    }
    if (seeded) {
      setImages(Object.fromEntries(imgCache.current));
      setSizes(Object.fromEntries(sizeCache.current));
    }
    setCart(guestCartToResponse(lines));
  }, []);

  // Guest cart: show the local snapshot immediately (so it's never empty right after an
  // add), then upgrade to server-authoritative pricing when the gateway is reachable.
  // A transient 503 (order-service GC pause) just leaves the local snapshot in place.
  const priceGuest = useCallback(async () => {
    const lines = readGuest();
    if (lines.length === 0) {
      setCart(EMPTY_GUEST_CART);
      return;
    }
    applyGuestLocal(lines);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await apply(await api.cart.price(lines));
        return;
      } catch {
        if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
    // server unavailable — keep the local snapshot already shown
  }, [apply, applyGuestLocal]);

  const refresh = useCallback(async () => {
    if (authed) {
      try {
        await apply(await api.cart.get());
      } catch {
        setCart(null); // transient error → treat as empty
      }
    } else {
      await priceGuest();
    }
  }, [authed, apply, priceGuest]);

  // Mount + auth transitions. On sign-in, merge any guest cart into the server cart first.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (authed) {
        const guest = readGuest();
        if (guest.length > 0) {
          for (const l of guest) {
            try {
              await api.cart.addItem({ productVariantId: l.productVariantId, quantity: l.quantity });
            } catch {
              /* skip lines that can't be added (gone/out of stock) */
            }
          }
          writeGuest([]);
        }
        try {
          const c = await api.cart.get();
          if (!cancelled) await apply(c);
        } catch {
          if (!cancelled) setCart(null);
        }
      } else if (!cancelled) {
        await priceGuest();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed]);

  const addItem = useCallback(
    async (productVariantId: number, quantity = 1, meta?: CartItemMeta) => {
      if (authed) {
        await apply(await withRetry(() => api.cart.addItem({ productVariantId, quantity })));
        return;
      }
      const lines = readGuest();
      const existing = lines.find((l) => l.productVariantId === productVariantId);
      if (existing) {
        existing.quantity += quantity;
        Object.assign(existing, cleanMeta(meta)); // refresh the display snapshot
      } else {
        lines.push({ productVariantId, quantity, ...cleanMeta(meta) });
      }
      writeGuest(lines);
      await priceGuest();
    },
    [authed, apply, priceGuest],
  );

  const setQty = useCallback(
    async (itemId: number, quantity: number) => {
      if (authed) {
        if (quantity <= 0) {
          await api.cart.removeItem(itemId);
          await refresh();
        } else {
          await apply(await api.cart.updateItem(itemId, { quantity }));
        }
        return;
      }
      // guest lines are keyed by productVariantId (see /api/cart/price)
      let lines = readGuest();
      if (quantity <= 0) lines = lines.filter((l) => l.productVariantId !== itemId);
      else {
        const l = lines.find((x) => x.productVariantId === itemId);
        if (l) l.quantity = quantity;
      }
      writeGuest(lines);
      await priceGuest();
    },
    [authed, apply, refresh, priceGuest],
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      if (authed) {
        await api.cart.removeItem(itemId);
        await refresh();
        return;
      }
      writeGuest(readGuest().filter((l) => l.productVariantId !== itemId));
      await priceGuest();
    },
    [authed, refresh, priceGuest],
  );

  const count = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  const subtotal = cart?.subtotal ?? 0;

  return (
    <CartCtx.Provider
      value={{
        cart,
        images,
        sizes,
        count,
        subtotal,
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        refresh,
        addItem,
        setQty,
        removeItem,
      }}
    >
      {children}
    </CartCtx.Provider>
  );
}
