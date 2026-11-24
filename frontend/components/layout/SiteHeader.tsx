import Link from "next/link";
import Image from "next/image";
import { createHash } from "node:crypto";
import { getCurrentUser } from "@/lib/server/session";
import { AccountIcon } from "@/components/ui/icons";
import { CartButton } from "@/components/cart/CartButton";
import { NavLinks } from "./NavLinks";
import { MobileDrawer, type DrawerUser } from "./MobileDrawer";


/** Gravatar avatar for the drawer auth block: SHA-256 of the normalized email,
 *  identicon fallback for accounts without a Gravatar. */
function gravatarUrl(email: string): string {
  const hash = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  return `https://gravatar.com/avatar/${hash}?d=identicon&s=80`;
}

/** The v4 header: 3-column grid (nav · centered logo · account/cart), max-w 1360px.
 *  `overlay` floats transparent over a hero (home + Our Story); `solid` sits in flow on
 *  every other page as a dark-green band with cream nav + the cream logo. Server
 *  component — resolves the session itself so the drawer auth block is correct. */
export async function SiteHeader({ variant = "solid" }: { variant?: "overlay" | "solid" }) {
  const me = await getCurrentUser();
  const user: DrawerUser | null = me
    ? {
        name: `${me.firstName ?? ""} ${me.lastName ?? ""}`.trim() || me.email,
        avatarUrl: gravatarUrl(me.email),
        staff: me.roles.includes("ADMIN") || me.roles.includes("MANAGER"),
      }
    : null;

  // Off-home pages get the dark-green header; overlay pages (home, Our Story) keep the
  // transparent header floating over their hero.
  const dark = variant === "solid";

  return (
    <header
      className={
        variant === "overlay"
          ? "absolute inset-x-0 top-0 z-40 bg-transparent"
          : "relative z-40 bg-darkgreen shadow-[0_1px_0_rgba(234,219,162,0.12)]"
      }
    >
      <div className="mx-auto grid h-14 nav:h-20 max-w-[1360px] grid-cols-[1fr_auto_1fr] items-center px-4 nav:px-6">
        {/* Left: desktop links / mobile hamburger */}
        <div className="flex items-center">
          <NavLinks dark={dark} />
          <MobileDrawer user={user} dark={dark} />
        </div>

        {/* Center: logo — cream mark on the dark header, gold-tinted-green on overlay */}
        <Link href="/" aria-label="Matessa home" className="justify-self-center">
          <Image
            src={dark ? "/brand/logo-cream.webp" : "/brand/logo.webp"}
            alt="Matessa"
            width={160}
            height={56}
            priority
            className={`h-[46px] nav:h-[56px] w-auto transition-transform duration-500 hover:scale-105 ${
              dark ? "" : "[filter:brightness(0.62)_sepia(0.35)]"
            }`}
          />
        </Link>

        {/* Right: account + cart */}
        <div className="flex items-center justify-end gap-1 nav:gap-2">
          <Link
            href={user ? (user.staff ? "/admin" : "/account") : "/login"}
            aria-label={user ? "My account" : "Sign in"}
            className={`hidden nav:grid h-10 w-10 place-items-center rounded-full transition-colors duration-300 hover:text-orange ${
              dark ? "text-craemy" : "text-darkgreen"
            }`}
          >
            <AccountIcon size={22} />
          </Link>
          <CartButton dark={dark} />
        </div>
      </div>
    </header>
  );
}
