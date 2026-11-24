import { api } from "@/lib/api";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HeroFlavorCycler } from "@/components/home/HeroFlavorCycler";
import { CurvedMarquee } from "@/components/home/CurvedMarquee";
import { HealthFocus } from "@/components/home/HealthFocus";
import { BlendCards, type BlendCardData } from "@/components/home/BlendCards";
import { WhyDrinkMate } from "@/components/home/WhyDrinkMate";
import { EnergyComparison } from "@/components/home/EnergyComparison";
import { DomeGallery } from "@/components/home/DomeGallery";

export const dynamic = "force-dynamic";

// Design pouch art per blend slug (the cards use pouches, not pack shots);
// products outside this map fall back to their catalog image.
const POUCHES: Record<string, string> = {
  "masala-mate": "/brand/pouch-masala.webp",
  "lemon-ginger-mate": "/brand/pouch-lemon-ginger.webp",
  "raw-mate": "/brand/pouch-raw.webp",
};

/** The "Our Blends" cards come from the live catalog: products of the Mate category
 *  plus each product's first active variant for quick add-to-cart. */
async function getBlends(): Promise<BlendCardData[]> {
  try {
    const cats = await api.categories.list();
    const mate = cats.find((c) => c.name.toLowerCase() === "mate") ?? cats[0];
    if (!mate) return [];
    const page = await api.products.list({ categoryId: mate.id, size: 6 });
    // Design order: Masala → Lemon & Ginger → Raw; anything else follows.
    const order = ["masala-mate", "lemon-ginger-mate", "raw-mate"];
    page.content.sort((a, b) => {
      const ai = order.indexOf(a.slug);
      const bi = order.indexOf(b.slug);
      return (ai === -1 ? order.length : ai) - (bi === -1 ? order.length : bi);
    });
    return await Promise.all(
      page.content.map(async (p): Promise<BlendCardData> => {
        let variantId: number | null = null;
        let cardPrice = p.basePrice;
        let image = POUCHES[p.slug] ?? "";
        try {
          const variants = await api.variants.listForProduct(p.id);
          const active = variants.filter((v) => v.active);
          // default quick-add to the 100g pack (fall back to the first available)
          const chosen = active.find((v) => /100\s*g/i.test(v.size ?? "")) ?? active[0] ?? variants[0] ?? null;
          variantId = chosen?.id ?? null;
          if (chosen?.effectivePrice != null) cardPrice = chosen.effectivePrice;
        } catch {
          // quick-add disabled if variants can't load
        }
        if (!image) {
          try {
            const images = await api.images.listForProduct(p.id);
            image = (images.find((i) => i.primary) ?? images[0])?.url ?? "/brand/leaf-pattern-light.webp";
          } catch {
            image = "/brand/leaf-pattern-light.webp";
          }
        }
        return { name: p.name, slug: p.slug, price: cardPrice, image, variantId };
      }),
    );
  } catch {
    return [];
  }
}

/** Landing page — Matessa Landing v4, section for section. */
export default async function HomePage() {
  const blends = await getBlends();
  return (
    <>
      <SiteHeader variant="overlay" />
      <main>
        <HeroFlavorCycler />
        <CurvedMarquee />
        <HealthFocus />
        <BlendCards blends={blends} />
        <WhyDrinkMate />
        <EnergyComparison />
        <DomeGallery />
      </main>
      <SiteFooter variant="full" overlap />
    </>
  );
}
