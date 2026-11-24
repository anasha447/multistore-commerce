"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV_ITEMS = [
  { label: "Shop", href: "/shop" },
  { label: "What is mate?!", href: "/what-is-mate" },
  { label: "Our Story", href: "/about" },
  { label: "Contact Us", href: "/contact" },
] as const;

/** Desktop nav links (left column of the header). Active page = orange; hover = orange.
 *  `dark` = the dark-green header used off the home page → cream links. */
export function NavLinks({ dark = false }: { dark?: boolean }) {
  const pathname = usePathname();
  return (
    <div className="hidden nav:flex items-center gap-7">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`font-body font-bold text-lg transition-colors duration-300 hover:text-orange-hover ${
              active ? "text-orange" : dark ? "text-craemy" : "text-darkgreen"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
