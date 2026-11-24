// Server-side admin catalog data: category tree + product list, and a single product's
// full editing view (product + variants + images). Public catalog reads via api.*;
// nothing here is owner-scoped (staff role is enforced by the backend on writes).
import { api } from "@/lib/api";
import type {
  CategoryResponse,
  ProductImageResponse,
  ProductResponse,
  ProductVariantResponse,
} from "@/lib/api";

export interface CatalogCategory extends CategoryResponse {
  depth: number;
}

export interface CatalogProductRow {
  id: number;
  name: string;
  slug: string;
  categoryName: string;
  basePrice: number;
  active: boolean;
  variantCount: number;
  lowStock: number;
  outOfStock: number;
}

export interface AdminCatalog {
  categories: CategoryResponse[];
  categoryTree: CatalogCategory[];
  products: CatalogProductRow[];
}

/** Flatten the category tree with depth for indented display. */
function flatten(nodes: CategoryResponse[], depth: number, out: CatalogCategory[]): void {
  for (const n of nodes) {
    out.push({ ...n, depth });
    if (n.children && n.children.length) flatten(n.children, depth + 1, out);
  }
}

export async function getAdminCatalog(categoryId?: number): Promise<AdminCatalog> {
  const [tree, flatCats, page] = await Promise.all([
    api.categories.tree().catch(() => [] as CategoryResponse[]),
    api.categories.list().catch(() => [] as CategoryResponse[]),
    api.products.list({ categoryId, size: 100 }).catch(() => null),
  ]);

  const catName = new Map(flatCats.map((c) => [c.id, c.name]));
  const categoryTree: CatalogCategory[] = [];
  flatten(tree, 0, categoryTree);

  const products: CatalogProductRow[] = await Promise.all(
    (page?.content ?? ([] as ProductResponse[])).map(async (p) => {
      const variants = await api.variants.listForProduct(p.id).catch(() => [] as ProductVariantResponse[]);
      const active = variants.filter((v) => v.active);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        categoryName: catName.get(p.categoryId) ?? "—",
        basePrice: p.basePrice,
        active: p.active,
        variantCount: variants.length,
        lowStock: active.filter((v) => v.stockQuantity > 0 && v.stockQuantity < v.restockLevel).length,
        outOfStock: active.filter((v) => v.stockQuantity === 0).length,
      };
    }),
  );

  return { categories: flatCats, categoryTree, products };
}

export interface AdminProductDetail {
  product: ProductResponse;
  categoryName: string;
  variants: ProductVariantResponse[];
  images: ProductImageResponse[];
}

export async function getAdminProductDetail(id: number): Promise<AdminProductDetail | null> {
  let product: ProductResponse;
  try {
    product = await api.products.get(id);
  } catch {
    return null;
  }
  const [variants, images, cats] = await Promise.all([
    api.variants.listForProduct(id).catch(() => [] as ProductVariantResponse[]),
    api.images.listForProduct(id).catch(() => [] as ProductImageResponse[]),
    api.categories.list().catch(() => [] as CategoryResponse[]),
  ]);
  return {
    product,
    categoryName: cats.find((c) => c.id === product.categoryId)?.name ?? "—",
    variants,
    images,
  };
}
