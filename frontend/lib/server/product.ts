// Server-side product-detail assembly for the PDP: product + images + variants +
// review summary, mapped into one view model. Public endpoints (no auth). Returns
// null when the product doesn't exist so the route can render notFound().
import { api } from "@/lib/api";
import type { CategoryResponse, ProductImageResponse, ProductResponse } from "@/lib/api";

export interface ProductVariantView {
  id: number;
  size: string | null;
  color: string | null;
  sku: string;
  stock: number;
  available: boolean;
  price: number;
}

export interface ProductImageView {
  url: string;
  alt: string;
}

export interface ProductDetail {
  id: number;
  slug: string;
  name: string;
  categoryName: string;
  brand: string;
  description: string | null;
  /** lowest variant price, or the product base price */
  price: number;
  /** display SKU (variant SKU with the size suffix stripped) */
  sku: string;
  images: ProductImageView[];
  variants: ProductVariantView[];
  rating: number | null;
  reviewCount: number;
}

const FALLBACK_IMAGE = "/brand/leaf-pattern-light.webp";

export async function getProductDetail(id: number): Promise<ProductDetail | null> {
  try {
    return await assemble(await api.products.get(id));
  } catch {
    return null;
  }
}

/** PDP by slug — used for opaque, SEO-friendly product URLs (/product/<slug>). */
export async function getProductDetailBySlug(slug: string): Promise<ProductDetail | null> {
  try {
    return await assemble(await api.products.getBySlug(slug));
  } catch {
    return null;
  }
}

async function assemble(product: ProductResponse): Promise<ProductDetail> {
  const id = product.id;
  const [images, variants, summary, cats] = await Promise.all([
    api.images.listForProduct(id).catch(() => [] as ProductImageResponse[]),
    api.variants.listForProduct(id).catch(() => []),
    api.reviews.summary(id).catch(() => null),
    api.categories.list().catch(() => [] as CategoryResponse[]),
  ]);

  const categoryName = cats.find((c) => c.id === product.categoryId)?.name ?? "Gear";

  const variantViews: ProductVariantView[] = variants.map((v) => ({
    id: v.id,
    size: v.size,
    color: v.color,
    sku: v.sku,
    stock: v.stockQuantity,
    available: v.active && v.stockQuantity > 0,
    price: v.effectivePrice,
  }));

  const prices = variantViews.map((v) => v.price).filter((p): p is number => typeof p === "number");
  const price = prices.length ? Math.min(...prices) : product.basePrice;

  const imageViews: ProductImageView[] = [...images]
    .sort((a, b) => Number(b.primary) - Number(a.primary) || a.displayOrder - b.displayOrder)
    .map((i) => ({ url: i.url, alt: i.altText || product.name }));
  if (imageViews.length === 0) imageViews.push({ url: FALLBACK_IMAGE, alt: product.name });

  const sku = (variantViews[0]?.sku ?? "").replace(/-(XS|S|M|L|XL|XXL|OS)$/i, "");

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    categoryName,
    brand: product.brand,
    description: product.description,
    price,
    sku,
    images: imageViews,
    variants: variantViews,
    rating: summary?.averageRating ?? null,
    reviewCount: summary?.reviewCount ?? 0,
  };
}
