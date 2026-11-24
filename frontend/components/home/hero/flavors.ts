// Landing-hero flavor config: pack art, colors and the ingredient story for each blend.
// This is brand copy for the hero only — the sellable catalog still comes from the API.
//
// A flavor joins the hero once it has BOTH `front` and `back` pack art (see HERO_FLAVORS).

export interface HeroIngredient {
  name: string;
  /** One-line taste note shown when the ingredient is highlighted. No health claims. */
  benefit: string;
  /** Cut-outs that float around the pouch. Ingredients without one appear as a chip only. */
  imgs?: string[];
}

export interface HeroFlavor {
  slug: string;
  name: string;
  /** Accent for the italic H1 words. */
  deepText: string;
  /** Color-field circle behind the pouch. */
  circle: string;
  /** Flat pack art, cropped to the pouch face (public/brand/pack). */
  front?: string;
  back?: string;
  ingredients: HeroIngredient[];
}

/** Pouch face aspect ratio (width / height) of the cropped pack art. */
export const PACK_ASPECT = 1024 / 1711;

const MATE: HeroIngredient = {
  name: "Mate leaves",
  benefit: "The heart of every blend: smooth, earthy and naturally energising.",
  imgs: ["/brand/ing-mate-leaf1.webp", "/brand/ing-mate-leaf2.webp"],
};

export const FLAVORS: HeroFlavor[] = [
  {
    slug: "masala-mate",
    name: "Masala",
    deepText: "#C2500F",
    circle: "radial-gradient(circle at 32% 26%, #F8DCC2 0%, #F2BF92 100%)",
    front: "/brand/pack/masala-front.webp",
    back: "/brand/pack/masala-back.webp",
    ingredients: [
      MATE,
      { name: "Cinnamon", benefit: "Sweet warmth that rounds off the mate.", imgs: ["/brand/ing-cinnamon1.webp"] },
      { name: "Star anise", benefit: "A soft, liquorice-like sweetness.", imgs: ["/brand/ing-anise1.webp"] },
      { name: "Cardamom", benefit: "Bright and floral, the soul of masala.", imgs: ["/brand/ing-cardamom.png"] },
      { name: "Clove", benefit: "Deep, lingering spice.", imgs: ["/brand/ing-clove1.webp"] },
      { name: "Ginger", benefit: "A gentle heat on the finish.", imgs: ["/brand/ing-ginger1.png"] },
      { name: "Bay leaf", benefit: "A quiet herbal depth." },
      { name: "Black pepper", benefit: "A light peppery kick." },
      { name: "Nutmeg", benefit: "Nutty and mellow." },
    ],
  },
  {
    slug: "lemon-ginger-mate",
    name: "Lemon & Ginger",
    deepText: "#A58114",
    circle: "radial-gradient(circle at 32% 26%, #FAEBBB 0%, #F4D87D 100%)",
    front: "/brand/pack/lemon-front.webp",
    back: "/brand/pack/lemon-back.webp",
    ingredients: [
      MATE,
      { name: "Lemon", benefit: "Zesty lemon peel for a fresh lift.", imgs: ["/brand/ing-lemon2.webp", "/brand/ing-lemon1.png"] },
      { name: "Ginger", benefit: "Warming ginger to balance the citrus.", imgs: ["/brand/ing-ginger-slices.webp", "/brand/ing-ginger1.png"] },
    ],
  },
  {
    slug: "raw-mate",
    name: "Raw",
    deepText: "#8F7A33",
    circle: "radial-gradient(circle at 32% 26%, #F1E9D0 0%, #E4D5A8 100%)",
    // Front: cut from the product photo. Back: the shared back layout recoloured to Raw's
    // cream kraft (scratch build) until the printed Raw back art is supplied - replace
    // raw-back.webp with a 1280x2138 crop like the others.
    front: "/brand/pack/raw-front.webp",
    back: "/brand/pack/raw-back.webp",
    ingredients: [MATE],
  },
];

export type PackedFlavor = HeroFlavor & { front: string; back: string };

/** Flavors the hero can show: only those with both pack faces. */
export const HERO_FLAVORS: PackedFlavor[] = FLAVORS.filter((f): f is PackedFlavor => Boolean(f.front && f.back));

export interface HeroSprite {
  flavor: number;
  ingredient: string;
  src: string;
  /** First cut-out of its ingredient — the one that steps forward when selected. */
  primary: boolean;
}

/** Every floating cut-out, flattened, in a stable order. */
export const HERO_SPRITES: HeroSprite[] = HERO_FLAVORS.flatMap((f, flavor) =>
  f.ingredients.flatMap((ing) => (ing.imgs ?? []).map((src, k) => ({ flavor, ingredient: ing.name, src, primary: k === 0 }))),
);
