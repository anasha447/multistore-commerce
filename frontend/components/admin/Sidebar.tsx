"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { icons } from "./icons";

interface NavItem {
  path: string;
  label: string;
  icon: keyof typeof icons;
  exact?: boolean;
}
interface NavGroup {
  section: string;
  adminOnly?: boolean;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    section: "Operate",
    items: [
      { path: "/admin", label: "Dashboard", icon: "dash", exact: true },
      { path: "/admin/orders", label: "Orders", icon: "orders" },
      { path: "/admin/contacts", label: "Contacts", icon: "inbox" },
    ],
  },
  {
    section: "Sell",
    items: [
      { path: "/admin/catalog", label: "Catalog", icon: "catalog" },
      { path: "/admin/promos", label: "Promotions", icon: "promo" },
    ],
  },
  {
    section: "People",
    adminOnly: true,
    items: [
      { path: "/admin/staff", label: "Staff", icon: "staff" },
      { path: "/admin/customers", label: "Customers", icon: "customers" },
    ],
  },
];

export function Sidebar({
  isAdmin,
  collapsed,
  onToggleCollapse,
  onCloseMobile,
  onNavigate,
}: {
  isAdmin: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (it: NavItem) =>
    it.exact ? pathname === it.path : pathname === it.path || pathname.startsWith(it.path + "/");

  const logout = async () => {
    onCloseMobile();
    await fetch("/api/session/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
    router.refresh();
  };

  const link = (it: NavItem | { path: string; label: string; icon: keyof typeof icons }, active: boolean) => (
    <Link
      key={it.path}
      href={it.path}
      className={`sb-link${active ? " is-active" : ""}`}
      aria-current={active ? "page" : undefined}
      data-label={it.label}
      title={collapsed ? it.label : undefined}
      onClick={onNavigate}
    >
      {icons[it.icon]}
      <span className="sb-label">{it.label}</span>
    </Link>
  );

  return (
    <aside className="sidebar">
      <div className="sb-top">
        <span className="sb-brand-name">
          <b>Matessa</b>
          <small>Console</small>
        </span>
        {/* desktop: collapse the rail to icons only */}
        <button
          type="button"
          className="sb-collapse"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand menu" : "Collapse menu"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {icons.chevL}
        </button>
        {/* mobile: close the drawer */}
        <button type="button" className="sb-close" onClick={onCloseMobile} aria-label="Close menu">
          {icons.close}
        </button>
      </div>

      <div className="sb-scroll">
        {NAV.filter((g) => !g.adminOnly || isAdmin).map((g) => (
          <div key={g.section} className="sb-group">
            <div className="sb-section">{g.section}</div>
            <nav className="sb-nav" aria-label={g.section}>
              {g.items.map((it) => link(it, isActive(it)))}
            </nav>
          </div>
        ))}

        <div className="sb-foot">
          {link({ path: "/admin/account", label: "Account", icon: "account" }, pathname.startsWith("/admin/account"))}
          {link({ path: "/", label: "View store", icon: "store" }, false)}
          <button
            type="button"
            className="sb-link sb-signout"
            onClick={logout}
            data-label="Sign out"
            title={collapsed ? "Sign out" : undefined}
          >
            {icons.logout}
            <span className="sb-label">Sign out</span>
          </button>
          <div className="sb-role-note">Signed in · {isAdmin ? "Admin" : "Manager"}</div>
        </div>
      </div>

      {/* Matessa pattern watermark backdrop, fading upward — the footer sits in front */}
      <div className="sb-pattern" aria-hidden="true" />
    </aside>
  );
}
