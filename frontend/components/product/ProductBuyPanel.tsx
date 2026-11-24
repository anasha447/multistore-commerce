"use client";

// PDP buy panel (design: Product Page.dc.html) — flavor pills (cross-links between
// the three blends), size pills from real variants, 1–9 qty stepper, Add to Cart
// (green) + Buy Now (orange → checkout). Prices are per selected variant, ₹.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart/CartContext";
import { formatMoney } from "@/lib/utils/money";
import { MinusIcon, PlusIcon } from "@/components/ui/icons";
import type { ProductVariantView } from "@/lib/server/product";

// The three blends cross-link as "Flavor" pills; other products show none.
const FLAVOR_LINKS = [
  { label: "Masala", slug: "masala-mate" },
  { label: "Lemon & Ginger", slug: "lemon-ginger-mate" },
  { label: "Raw Mate", slug: "raw-mate" },
];

export function ProductBuyPanel({
  slug,
  productName,
  image,
  variants,
  basePrice,
}: {
  slug: string;
  productName: string;
  image?: string;
  variants: ProductVariantView[];
  basePrice: number;
}) {
  const router = useRouter();
  const { addItem, open } = useCart();
  const sized = variants.filter((v) => v.available);
  // default the selected size to the 100g pack (fall back to the first available)
  const default100 = sized.find((v) => /100\s*g/i.test(v.size ?? "")) ?? sized[0];
  const [variantId, setVariantId] = useState<number | null>(default100?.id ?? null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState<"add" | "buy" | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const active = useMemo(() => sized.find((v) => v.id === variantId) ?? null, [sized, variantId]);
  const price = active?.price ?? basePrice;
  const isBlend = FLAVOR_LINKS.some((f) => f.slug === slug);

  const add = async () => {
    if (!active) return false;
    try {
      await addItem(active.id, qty, {
        name: productName,
        price: active.price,
        image,
        size: active.size ?? undefined,
        sku: active.sku,
      });
      return true;
    } catch {
      setNote("Couldn't add to cart — please try again.");
      return false;
    }
  };

  return (
    <div>
      {/* Price */}
      <p className="mt-4 font-heading text-3xl font-bold text-green">{formatMoney(price)}</p>

      {/* Flavor pills */}
      {isBlend && (
        <div className="mt-6">
          <p className="mb-2 font-body text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Flavor</p>
          <div className="flex flex-wrap gap-2">
            {FLAVOR_LINKS.map((f) => (
              <Link
                key={f.slug}
                href={`/product/${f.slug}`}
                aria-current={f.slug === slug ? "page" : undefined}
                className={`rounded-full border-2 px-4 py-2 font-body text-sm font-bold transition-colors duration-300 ${
                  f.slug === slug
                    ? "border-darkgreen bg-darkgreen text-craemy"
                    : "border-gray-300 text-darkgreen hover:border-orange hover:text-orange"
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Size pills */}
      {sized.some((v) => v.size) && (
        <div className="mt-5">
          <p className="mb-2 font-body text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Size</p>
          <div className="flex flex-wrap gap-2">
            {sized.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                aria-pressed={v.id === variantId}
                className={`rounded-full border-2 px-4 py-2 font-body text-sm font-bold transition-colors duration-300 ${
                  v.id === variantId
                    ? "border-green bg-green text-white"
                    : "border-gray-300 text-darkgreen hover:border-orange hover:text-orange"
                }`}
              >
                {v.size ?? v.sku}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity + CTAs */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border-2 border-gray-300">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid h-11 w-11 place-items-center text-darkgreen transition-colors hover:text-orange"
          >
            <MinusIcon size={18} />
          </button>
          <span className="w-8 text-center font-body font-bold text-darkgreen" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setQty((q) => Math.min(9, q + 1))}
            className="grid h-11 w-11 place-items-center text-darkgreen transition-colors hover:text-orange"
          >
            <PlusIcon size={18} />
          </button>
        </div>

        <button
          type="button"
          disabled={!active || busy !== null}
          onClick={async () => {
            setBusy("add");
            setNote(null);
            const ok = await add();
            setBusy(null);
            if (ok) {
              setNote(`${qty} × added to cart`);
              open();
            }
          }}
          className="rounded-full bg-green px-7 py-3 font-body font-bold text-white transition-all duration-300 hover:bg-orange disabled:opacity-40"
        >
          {busy === "add" ? "Adding…" : "Add to Cart"}
        </button>

        <button
          type="button"
          disabled={!active || busy !== null}
          onClick={async () => {
            setBusy("buy");
            setNote(null);
            const ok = await add();
            setBusy(null);
            if (ok) router.push("/checkout");
          }}
          className="rounded-full bg-orange px-7 py-3 font-body font-bold text-white transition-all duration-300 hover:bg-orange-hover disabled:opacity-40"
        >
          {busy === "buy" ? "One moment…" : "Buy Now"}
        </button>
      </div>
      {note && (
        <p className="mt-3 font-body text-sm font-bold text-green" role="status">
          {note}
        </p>
      )}
      {active && !active.available && <p className="mt-2 text-sm text-orange">Out of stock</p>}

      {/* Trust row */}
      <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-200 pt-5 font-body text-[13px] font-semibold text-gray-500">
        <span>100% Natural · Vegan</span>
        <span>Ships across India</span>
        <span>Refill up to 10 times</span>
      </div>
    </div>
  );
}
