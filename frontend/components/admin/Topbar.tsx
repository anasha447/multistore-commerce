"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function pageMeta(path: string): { h1: string; crumb: string } {
  if (/^\/admin\/orders\/[^/]+$/.test(path)) return { h1: "Orders", crumb: "Orders / Detail" };
  if (path.startsWith("/admin/orders")) return { h1: "Orders", crumb: "Operate" };
  if (/^\/admin\/catalog\/[^/]+$/.test(path)) return { h1: "Catalog", crumb: "Catalog / Product" };
  if (path.startsWith("/admin/catalog")) return { h1: "Catalog", crumb: "Sell" };
  if (path.startsWith("/admin/promos")) return { h1: "Promotions", crumb: "Sell" };
  if (path.startsWith("/admin/staff")) return { h1: "Staff", crumb: "People · Admin only" };
  if (path.startsWith("/admin/customers")) return { h1: "Customers", crumb: "People · Admin only" };
  if (path.startsWith("/admin/account")) return { h1: "Account", crumb: "Your profile" };
  return { h1: "Dashboard", crumb: "Overview" };
}

export function AdminTopbar({
  firstName,
  lastName,
  isAdmin,
  onMenu,
}: {
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  onMenu?: () => void;
}) {
  const pathname = usePathname();
  const meta = pageMeta(pathname);
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`;

  return (
    <header className="adm-topbar">
      <button type="button" className="adm-menu-btn" onClick={onMenu} aria-label="Open menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      <h1>{meta.h1}</h1>
      <span className="crumb">{meta.crumb}</span>
      <div className="topbar-user">
        <Link className="user-chip" href="/admin/account" style={{ textDecoration: "none", color: "inherit" }}>
          <div>
            <div className="nm">
              {firstName} {lastName}
            </div>
            <div className="rl">{isAdmin ? "Admin" : "Manager"}</div>
          </div>
          <div className="user-avatar">{initials}</div>
        </Link>
      </div>
    </header>
  );
}
