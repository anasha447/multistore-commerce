// View model consumed by product card components and assembled by lib/server/catalog.
// Lives in the lib layer (not in a component) so server helpers never depend on views.
export interface ProductCardData {
  name: string;
  /** display label, e.g. "Mate" / "Accessories" */
  category: string;
  price: number;
  image: string;
  alt: string;
  href: string;
  badge?: { label: string; tone?: "low" | "one" };
  /** optional CSS object-position for off-center crops */
  objectPosition?: string;
}
