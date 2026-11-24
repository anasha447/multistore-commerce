// Server-side promotions data for the admin: coupons (paginated) + all automatic
// discounts (gathered across products since there's no list-all-discounts endpoint).
// Staff only → serverGet (cookie session).
import { serverGet } from "./session";
import { api } from "@/lib/api";
import type {
  CategoryResponse,
  CouponResponse,
  DiscountResponse,
  Page,
  ProductResponse,
} from "@/lib/api";

export interface DiscountRow extends DiscountResponse {
  targetName: string;
  scope: "Product" | "Category";
}

export interface PromotionsData {
  coupons: CouponResponse[];
  discounts: DiscountRow[];
  products: { id: number; name: string }[];
  categories: { id: number; name: string; parentId: number | null }[];
}

export async function getPromotionsData(): Promise<PromotionsData> {
  const [couponPage, cats, prodPage] = await Promise.all([
    serverGet<Page<CouponResponse>>("/api/coupons?page=0&size=100"),
    api.categories.list().catch(() => [] as CategoryResponse[]),
    api.products.list({ size: 100 }).catch(() => null),
  ]);

  const products = prodPage?.content ?? ([] as ProductResponse[]);
  const prodName = new Map(products.map((p) => [p.id, p.name]));
  const catName = new Map(cats.map((c) => [c.id, c.name]));

  // No "list all discounts" endpoint — collect per-product automatic discounts.
  const discountLists = await Promise.all(
    products.map((p) => api.discounts.forProduct(p.id).catch(() => [] as DiscountResponse[])),
  );
  const seen = new Set<number>();
  const discounts: DiscountRow[] = [];
  for (const list of discountLists) {
    for (const d of list) {
      if (seen.has(d.id)) continue;
      seen.add(d.id);
      discounts.push({
        ...d,
        scope: d.productId != null ? "Product" : "Category",
        targetName:
          d.productId != null
            ? (prodName.get(d.productId) ?? `Product #${d.productId}`)
            : (catName.get(d.categoryId ?? -1) ?? `Category #${d.categoryId}`),
      });
    }
  }

  return {
    coupons: couponPage?.content ?? [],
    discounts,
    products: products.map((p) => ({ id: p.id, name: p.name })),
    categories: cats.map((c) => ({ id: c.id, name: c.name, parentId: c.parentId })),
  };
}

/** Coupon lifecycle state for the status badge. */
export function couponState(c: CouponResponse): "ACTIVE" | "INACTIVE" | "EXPIRED" | "EXHAUSTED" {
  if (!c.active) return "INACTIVE";
  if (new Date(c.validUntil) < new Date()) return "EXPIRED";
  if (c.maxUses != null && c.usedCount >= c.maxUses) return "EXHAUSTED";
  return "ACTIVE";
}
