"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { AdminTopbar } from "./Topbar";

const LS_COLLAPSED = "ad_admin_sb_collapsed";

/** Client shell for the admin console: owns the desktop collapse state (icons-only
 *  rail, persisted) and the mobile off-canvas drawer. The server layout stays a thin
 *  auth guard and passes the rendered page in as children. */
export function AdminShell({
  isAdmin,
  firstName,
  lastName,
  children,
}: {
  isAdmin: boolean;
  firstName: string;
  lastName: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Restore the collapsed preference after mount. Starting from `false` on both server
  // and client keeps hydration stable; this one-time sync from localStorage is exactly
  // the "read external state on mount" case the lint rule exempts in spirit.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(localStorage.getItem(LS_COLLAPSED) === "1");
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(LS_COLLAPSED, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Escape closes the mobile drawer; lock body scroll while it's open.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <div
      className="adm-shell"
      data-collapsed={collapsed ? "true" : "false"}
      data-mobile-open={mobileOpen ? "true" : "false"}
    >
      <Sidebar
        isAdmin={isAdmin}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        onCloseMobile={closeMobile}
        onNavigate={closeMobile}
      />
      <div className="adm-main">
        <AdminTopbar
          firstName={firstName}
          lastName={lastName}
          isAdmin={isAdmin}
          onMenu={() => setMobileOpen(true)}
        />
        {children}
      </div>
      <button
        type="button"
        className="adm-scrim"
        aria-label="Close menu"
        tabIndex={mobileOpen ? 0 : -1}
        onClick={closeMobile}
      />
    </div>
  );
}
