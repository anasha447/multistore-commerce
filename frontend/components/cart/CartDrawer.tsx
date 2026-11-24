/* eslint-disable @next/next/no-img-element */
"use client";

// Slide-in cart drawer (right side; full-width on mobile, ~400px on desktop).
// Global — driven by the cart context; add-to-cart opens it automatically.
import { useEffect } from "react";
import Link from "next/link";
import { CloseIcon, MinusIcon, PlusIcon } from "@/components/ui/icons";
import { CART_PLACEHOLDER, useCart } from "./CartContext";
import { formatMoney } from "@/lib/utils/money";
import { mediaUrl } from "@/lib/utils/media";

const fmt = (n: number | null | undefined) => (typeof n === "number" ? formatMoney(n) : "—");

function variantLabel(sku: string | null | undefined): string | null {
  if (!sku) return null;
  const m = sku.match(/-(\d+\s?g|\d+\s?kg|XS|S|M|L|XL|XXL)$/i);
  if (m) return m[1].toUpperCase();
  if (/-OS$/i.test(sku)) return "One size";
  return null;
}

export function CartDrawer() {
  const { cart, images, sizes, count, subtotal, isOpen, close, setQty, removeItem } = useCart();
  const items = cart?.items ?? [];

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  return (
    <>
      <div
        className={`fixed inset-0 z-[98] bg-[rgba(15,35,20,0.45)] backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={close}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-[99] flex w-[min(84vw,340px)] flex-col overflow-hidden rounded-l-[var(--radius-2xl)] bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Shopping cart"
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="font-heading text-xl font-bold text-darkgreen">
            Cart <span className="font-body text-sm font-normal text-gray-500">{count} item{count === 1 ? "" : "s"}</span>
          </h2>
          <button
            className="grid h-9 w-9 place-items-center rounded-full text-darkgreen transition-colors hover:text-orange"
            type="button"
            aria-label="Close cart"
            onClick={close}
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <p className="py-16 text-center font-body text-gray-500">Your cart is empty. Find a blend worth the ritual.</p>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => {
                const label = sizes[item.productVariantId] ?? variantLabel(item.sku);
                return (
                  <li key={item.id} className="flex gap-3">
                    <img
                      src={mediaUrl(images[item.productVariantId] ?? CART_PLACEHOLDER)}
                      alt=""
                      className="h-20 w-20 rounded-2xl bg-gray-100 object-contain mix-blend-multiply"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading font-bold text-darkgreen">{item.productName}</p>
                      {label && <p className="font-body text-xs text-gray-500">{label}</p>}
                      <div className="mt-1.5 flex items-center gap-3">
                        <div className="flex items-center rounded-full border border-gray-300">
                          <button
                            type="button"
                            aria-label="Decrease"
                            onClick={() => (item.quantity <= 1 ? removeItem(item.id) : setQty(item.id, item.quantity - 1))}
                            className="grid h-7 w-7 place-items-center text-darkgreen hover:text-orange"
                          >
                            <MinusIcon size={15} />
                          </button>
                          <span className="w-6 text-center font-body text-sm font-bold">{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase"
                            onClick={() => setQty(item.id, item.quantity + 1)}
                            className="grid h-7 w-7 place-items-center text-darkgreen hover:text-orange"
                          >
                            <PlusIcon size={15} />
                          </button>
                        </div>
                        <span className="ml-auto font-body font-bold text-green">{fmt(item.lineTotal)}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-200 px-5 py-4">
            <div className="mb-3 flex items-center justify-between font-body">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-heading text-xl font-bold text-green">{fmt(subtotal)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={close}
              className="block rounded-full bg-green py-3 text-center font-body font-bold text-white transition-colors duration-300 hover:bg-orange"
            >
              Checkout
            </Link>
            <Link
              href="/cart"
              onClick={close}
              className="mt-2 block text-center font-body text-sm text-gray-500 transition-colors hover:text-orange"
            >
              View full cart
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
