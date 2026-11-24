"use client";

import { CartIcon } from "@/components/ui/icons";
import { useCart } from "./CartContext";

/** Header cart trigger: opens the cart drawer; orange pill badge shows the line count.
 *  `dark` = cream icon for the dark-green off-home header. */
export function CartButton({ dark = false }: { dark?: boolean }) {
  const { count, open } = useCart();
  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
      className={`relative grid h-10 w-10 place-items-center rounded-full transition-colors duration-300 hover:text-orange ${
        dark ? "text-craemy" : "text-darkgreen"
      }`}
    >
      <CartIcon />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-[18px] place-items-center rounded-full bg-orange px-1 text-[11px] font-body font-bold leading-[18px] text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
