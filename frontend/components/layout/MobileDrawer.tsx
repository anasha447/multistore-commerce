"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloseIcon, MenuIcon, UserIcon } from "@/components/ui/icons";
import { NAV_ITEMS } from "./NavLinks";

/** Session info the drawer needs — computed server-side (SiteHeader) and passed down. */
export interface DrawerUser {
  name: string;
  /** Gravatar URL derived from the account email (SHA-256, identicon fallback). */
  avatarUrl: string;
  staff: boolean;
}

// Storefront nav (DESIGN-SYSTEM.md §4): the header items + track order.
const DRAWER_NAV = [
  { label: "Home", href: "/" },
  ...NAV_ITEMS,
  { label: "Track order", href: "/track" },
];

/** Left slide-in mobile menu (no bottom tab bar — DESIGN-SYSTEM.md §4).
 *  Hamburger trigger + overlay + drawer panel; auth block pinned at the bottom. */
export function MobileDrawer({ user, dark = false }: { user: DrawerUser | null; dark?: boolean }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const close = useCallback(() => setOpen(false), []);

  // Route change closes the drawer (link taps navigate client-side).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(close, [pathname, close]);

  // Esc closes; body scroll locks while open; focus moves into the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("button, a")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      <button
        className={`nav:hidden grid h-10 w-10 place-items-center rounded-full transition-colors duration-300 hover:text-orange ${
          dark ? "text-craemy" : "text-darkgreen"
        }`}
        type="button"
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-drawer"
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </button>

      <div className={`mdrawer-overlay${open ? " is-open" : ""}`} onClick={close} aria-hidden="true" />

      <div
        id="mobile-drawer"
        ref={panelRef}
        className={`mdrawer${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="mdrawer-head">
          <span className="mdrawer-brand">Matessa</span>
          <button className="mdrawer-close" type="button" aria-label="Close menu" onClick={close}>
            <CloseIcon />
          </button>
        </div>

        <nav className="mdrawer-nav" aria-label="Main">
          {DRAWER_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mdrawer-link${pathname === item.href ? " is-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mdrawer-auth">
          {user ? (
            <>
              <Link className="mdrawer-account" href={user.staff ? "/admin" : "/account"}>
                {/* Gravatar: plain <img> — external host, tiny, and next/image remote config isn't warranted for this */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="mdrawer-avatar" src={user.avatarUrl} alt="" width={40} height={40} />
                <span className="mdrawer-account-text">
                  <strong>{user.staff ? "Dashboard" : "My account"}</strong>
                  <small>{user.name}</small>
                </span>
              </Link>
              {user.staff && (
                <Link className="mdrawer-sublink" href="/account">
                  My account
                </Link>
              )}
            </>
          ) : (
            <>
              <Link className="mdrawer-signup" href="/login?mode=register">
                <UserIcon size={18} />
                <span>Sign up</span>
              </Link>
              <Link className="mdrawer-sublink" href="/login">
                Already have an account? Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
