import Link from "next/link";
import type { CategoryNavItem } from "@/lib/server/catalog";

/** Category tabs fed by the API (never hardcoded — BRAND.md §10.6). */
export function ShopTabs({
  categories,
  activeId,
}: {
  categories: CategoryNavItem[];
  activeId?: number;
}) {
  const tab = (label: string, href: string, active: boolean) => (
    <Link
      key={href}
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full px-5 py-2 font-body text-sm font-bold transition-colors duration-300 ${
        active ? "bg-darkgreen text-craemy" : "bg-white text-darkgreen hover:text-orange"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="Categories" className="flex flex-wrap items-center justify-center gap-2.5">
      {tab("All", "/shop", activeId == null)}
      {categories.map((c) => tab(c.name, `/shop?category=${c.id}`, activeId === c.id))}
    </nav>
  );
}
