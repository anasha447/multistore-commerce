// Catalog DTOs: categories, products, variants, images, reviews, discounts,
// and coupon validation (API.md §4.2–4.8, §5). commercial-service.
import type { DiscountType } from './common';

// ---- Categories ----

export interface CategoryRequest {
  parentId: number | null;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
}

export interface CategoryResponse {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  displayOrder: number;
  active: boolean;
  /** Present on /categories/tree (nested) — omitted/empty on flat lists. */
  children?: CategoryResponse[];
}

// ---- Products ----

export interface ProductRequest {
  categoryId: number;
  name: string;
  slug: string;
  description?: string | null;
  basePrice: number;
  brand: string;
  /** Create only: stock for a product sold without variations (held on its default variant). */
  stockQuantity?: number;
}

export interface ProductResponse {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  description: string | null;
  basePrice: number;
  brand: string;
  active: boolean;
  createdAt: string;
}

// ---- Variants ----
// size/color are typed nullable: a product may vary on only one axis (or none,
// e.g. artwork). priceOverride null = inherit the product base price.

export interface ProductVariantRequest {
  /** Generated server-side (SkuGenerator); omit on create. */
  sku?: string;
  size: string | null;
  color: string | null;
  priceOverride?: number | null;
  stockQuantity: number;
  restockLevel: number;
}

export interface ProductVariantResponse {
  id: number;
  productId: number;
  sku: string;
  size: string | null;
  color: string | null;
  priceOverride: number | null;
  /** Pre-discount price. */
  listPrice: number;
  /** After the best active discount — show a strikethrough on listPrice when lower. */
  effectivePrice: number;
  stockQuantity: number;
  restockLevel: number;
  active: boolean;
  /** The hidden variant of a product sold without variations: it holds the product's own stock. */
  defaultVariant: boolean;
}

/** Authoritative live price/stock for one variant — use on PDP & cart (GET /api/variants/{id}). */
export interface VariantPriceStockResponse {
  variantId: number;
  productId: number;
  sku: string;
  productName: string;
  effectivePrice: number;
  stockQuantity: number;
  available: boolean;
}

// ---- Images ----

export interface ProductImageRequest {
  /** null = general product photo; set = scoped to a variant. */
  variantId: number | null;
  url: string;
  altText: string;
  displayOrder: number;
  primary: boolean;
}

export interface ProductImageResponse {
  id: number;
  productId: number;
  variantId: number | null;
  url: string;
  altText: string;
  displayOrder: number;
  primary: boolean;
}

// ---- Reviews ----

export interface ReviewRequest {
  /** 1..5. */
  rating: number;
  text: string;
}

export interface ReviewResponse {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  text: string;
  createdAt: string;
}

export interface ReviewSummaryResponse {
  productId: number;
  averageRating: number;
  reviewCount: number;
}

// ---- Discounts (automatic markdowns; already baked into effectivePrice) ----

export interface DiscountResponse {
  id: number;
  productId: number | null;
  categoryId: number | null;
  type: DiscountType;
  value: number;
  validFrom: string;
  validTo: string;
  active: boolean;
  createdBy: number;
}

// ---- Coupons (checkout preview only in phase 1) ----

export interface CouponValidationRequest {
  code: string;
  subtotal: number;
}

export interface CouponValidationResponse {
  valid: boolean;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  message: string;
}

// ---- Staff-managed promotion DTOs (phase 2) ----

export interface CouponRequest {
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minSpend: number;
  /** null = unlimited uses. The backend rejects 0 (@Min(1)); omit/null for unlimited. */
  maxUses: number | null;
  perUserLimit: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
}

export interface CouponResponse {
  id: number;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minSpend: number;
  /** null = unlimited uses. */
  maxUses: number | null;
  usedCount: number;
  perUserLimit: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
}

/** Set EXACTLY ONE of productId / categoryId (API.md §5). */
export interface DiscountRequest {
  productId: number | null;
  categoryId: number | null;
  type: DiscountType;
  value: number;
  validFrom: string;
  validTo: string;
  active: boolean;
}
