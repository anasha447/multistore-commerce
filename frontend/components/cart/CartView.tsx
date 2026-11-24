/* eslint-disable @next/next/no-img-element */
"use client";

// Full cart page (works for guest + authed via the cart context).
import Link from "next/link";
import { CloseIcon, MinusIcon, PlusIcon } from "@/components/ui/icons";
import { CART_PLACEHOLDER, useCart } from "./CartContext";
import { formatMoney } from "@/lib/utils/money";
import { mediaUrl } from "@/lib/utils/media";
import { PillLink } from "@/components/ui/brand";

const fmt = (n: number | null | undefined) => (typeof n === "number" ? formatMoney(n) : "—");

export function CartView() {
  const { cart, images, sizes, count, subtotal, setQty, removeItem } = useCart();
  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="font-heading text-3xl font-bold text-darkgreen">Your cart is empty</h1>
        <p className="mt-3 text-gray-600">Find a blend worth the ritual.</p>
        <div className="mt-8">
          <PillLink href="/shop">Shop blends</PillLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-10 nav:px-8">
      <h1 className="mb-8 font-heading text-3xl font-bold text-darkgreen md:text-4xl">
        Cart <span className="font-body text-lg font-normal text-gray-500">{count} item{count === 1 ? "" : "s"}</span>
      </h1>

      <div className="grid gap-10 nav:grid-cols-[1fr_320px]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 rounded-[22px] bg-white p-4 shadow-lg">
              <img
                src={mediaUrl(images[item.productVariantId] ?? CART_PLACEHOLDER)}
                alt=""
                className="h-24 w-24 rounded-2xl bg-gray-100 object-contain mix-blend-multiply"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-heading font-bold text-darkgreen">{item.productName}</p>
                    {sizes[item.productVariantId] && (
                      <p className="font-body text-xs text-gray-500">{sizes[item.productVariantId]}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => removeItem(item.id)}
                    className="text-gray-400 transition-colors hover:text-orange"
                  >
                    <CloseIcon size={18} />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center rounded-full border border-gray-300">
                    <button
                      type="button"
                      aria-label="Decrease"
                      onClick={() => (item.quantity <= 1 ? removeItem(item.id) : setQty(item.id, item.quantity - 1))}
                      className="grid h-8 w-8 place-items-center text-darkgreen hover:text-orange"
                    >
                      <MinusIcon size={16} />
                    </button>
                    <span className="w-7 text-center font-body text-sm font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase"
                      onClick={() => setQty(item.id, item.quantity + 1)}
                      className="grid h-8 w-8 place-items-center text-darkgreen hover:text-orange"
                    >
                      <PlusIcon size={16} />
                    </button>
                  </div>
                  <span className="ml-auto font-body font-bold text-green">{fmt(item.lineTotal)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-[22px] bg-white p-6 shadow-lg nav:sticky nav:top-24">
          <h2 className="mb-4 font-heading text-lg font-bold text-darkgreen">Order summary</h2>
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 font-body">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-bold text-darkgreen">{fmt(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between py-3 font-body text-sm text-gray-500">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <Link
            href="/checkout"
            className="mt-3 block rounded-full bg-green py-3 text-center font-body font-bold text-white transition-colors duration-300 hover:bg-orange"
          >
            Checkout
          </Link>
          <Link href="/shop" className="mt-3 block text-center font-body text-sm text-gray-500 hover:text-orange">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
