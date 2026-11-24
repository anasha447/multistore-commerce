"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyBlock } from "./ui";
import { Modal } from "./Modal";
import { AdminPager } from "./AdminPager";
import { ProvisionModal } from "./ProvisionModal";
import { icons } from "./icons";
import { api } from "@/lib/api";
import type { AdminUserResponse, Role } from "@/lib/api";
import type { AdminUsersPage } from "@/lib/server/adminUsers";

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
const top = (roles: Role[]): Role => (roles.includes("ADMIN") ? "ADMIN" : roles.includes("MANAGER") ? "MANAGER" : "CUSTOMER");

function RoleBadge({ roles }: { roles: Role[] }) {
  const t = top(roles);
  const cls = t === "ADMIN" ? "st-paid" : t === "MANAGER" ? "st-shipped" : "st-neutral";
  return <span className={`st-badge ${cls}`}>{t.charAt(0) + t.slice(1).toLowerCase()}</span>;
}
function StatusPill({ enabled }: { enabled: boolean }) {
  return <span className={`st-badge ${enabled ? "st-success" : "st-danger"}`}>{enabled ? "Active" : "Banned"}</span>;
}

export function StaffView({
  data,
  currentUserId,
  role,
  enabled,
}: {
  data: AdminUsersPage;
  currentUserId: number;
  role?: string;
  enabled?: string;
}) {
  const router = useRouter();
  const [provision, setProvision] = useState(false);
  const [detail, setDetail] = useState<AdminUserResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const params: Record<string, string> = {};
  if (role) params.role = role;
  if (enabled) params.enabled = enabled;

  const flash = (m: string) => {
    setNote(m);
    setTimeout(() => setNote(null), 3000);
  };

  const toggle = async (u: AdminUserResponse, next: boolean) => {
    if (u.id === currentUserId) return flash("You can't change your own access (409).");
    if (top(u.roles) === "ADMIN") return flash("Admin accounts can't be banned.");
    setBusy(true);
    try {
      await api.admin.updateUserStatus(u.id, { enabled: next });
      setDetail(null);
      flash(next ? `${u.firstName} un-banned.` : `${u.firstName} banned — their sessions were revoked.`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const filterHref = (key: "role" | "enabled", val: string) => {
    const p = new URLSearchParams(params);
    if (val) p.set(key, val);
    else p.delete(key);
    p.delete("page");
    const qs = p.toString();
    return `/admin/staff${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="adm-content">
      {note && (
        <div role="status" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 90, background: "var(--ink)", color: "var(--fog)", padding: "10px 16px", borderRadius: "var(--radius)", boxShadow: "var(--shadow-overlay)", fontSize: 14 }}>
          {note}
        </div>
      )}

      <div className="page-head">
        <div className="ttl">
          <p>
            Provision managers and manage staff access. Everything here maps to{" "}
            <span className="mono" style={{ fontSize: 12.5 }}>/api/admin/**</span> — admin only.
          </p>
        </div>
        <button className="btn btn-primary" type="button" onClick={() => setProvision(true)}>
          {icons.plus} Provision manager
        </button>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Staff directory</h3>
          <span className="sub">{data.total} staff</span>
        </div>
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="dir-filters">
            <div className="filter-row" role="group" aria-label="Filter by role">
              <a className={`f-chip${!role ? " is-active" : ""}`} href={filterHref("role", "")}>All staff</a>
              <a className={`f-chip${role === "MANAGER" ? " is-active" : ""}`} href={filterHref("role", "MANAGER")}>Managers</a>
              <a className={`f-chip${role === "ADMIN" ? " is-active" : ""}`} href={filterHref("role", "ADMIN")}>Admins</a>
            </div>
            <div className="filter-row" role="group" aria-label="Filter by status">
              <a className={`f-chip${!enabled ? " is-active" : ""}`} href={filterHref("enabled", "")}>Any status</a>
              <a className={`f-chip${enabled === "true" ? " is-active" : ""}`} href={filterHref("enabled", "true")}>Active</a>
              <a className={`f-chip${enabled === "false" ? " is-active" : ""}`} href={filterHref("enabled", "false")}>Banned</a>
            </div>
          </div>
        </div>
        {data.items.length === 0 ? (
          <EmptyBlock title="No staff match these filters">
            Try a different role or status, or provision a new manager.
          </EmptyBlock>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id} className="is-link" tabIndex={0} role="button" aria-label={`Open ${u.firstName} ${u.lastName}`} onClick={() => setDetail(u)} onKeyDown={(e) => e.key === "Enter" && setDetail(u)}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                      <div className="mono muted" style={{ fontSize: 11.5 }}>{u.email}</div>
                    </td>
                    <td><RoleBadge roles={u.roles} /></td>
                    <td className="muted">{u.phone || "—"}</td>
                    <td><StatusPill enabled={u.enabled} /></td>
                    <td className="muted">{fmtDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <AdminPager page={data.page} totalPages={data.totalPages} total={data.total} size={20} basePath="/admin/staff" params={params} />
      </div>

      {provision && (
        <ProvisionModal
          onClose={() => setProvision(false)}
          onCreated={() => {
            setProvision(false);
            flash("Manager provisioned — they'll set a new password on first login.");
            router.refresh();
          }}
        />
      )}

      {detail && (
        <Modal
          title="User detail"
          onClose={() => setDetail(null)}
          footer={
            <>
              <button className="btn btn-outline" type="button" onClick={() => setDetail(null)}>Close</button>
              {top(detail.roles) !== "ADMIN" && detail.id !== currentUserId && (
                detail.enabled ? (
                  <button className="btn btn-danger" type="button" disabled={busy} onClick={() => toggle(detail, false)}>Ban user</button>
                ) : (
                  <button className="btn btn-primary" type="button" disabled={busy} onClick={() => toggle(detail, true)}>Un-ban user</button>
                )
              )}
            </>
          }
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div className="user-avatar" style={{ width: 48, height: 48, fontSize: 17 }}>
              {(detail.firstName[0] ?? "") + (detail.lastName[0] ?? "")}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: 19, letterSpacing: ".02em", lineHeight: 1.1 }}>
                {detail.firstName} {detail.lastName}
              </div>
              <div className="mono" style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{detail.email}</div>
            </div>
          </div>
          <div className="stat-rows">
            <div className="stat-row"><span className="lbl" style={{ color: "var(--text-secondary)" }}>User ID</span><span className="val mono" style={{ fontSize: 13 }}>#{detail.id}</span></div>
            <div className="stat-row"><span className="lbl" style={{ color: "var(--text-secondary)" }}>Role</span><span className="val"><RoleBadge roles={detail.roles} /></span></div>
            <div className="stat-row"><span className="lbl" style={{ color: "var(--text-secondary)" }}>Phone</span><span className="val">{detail.phone || "—"}</span></div>
            <div className="stat-row"><span className="lbl" style={{ color: "var(--text-secondary)" }}>Status</span><span className="val"><StatusPill enabled={detail.enabled} /></span></div>
            <div className="stat-row"><span className="lbl" style={{ color: "var(--text-secondary)" }}>Password reset</span><span className="val">{detail.mustChangePassword ? "Pending — on next login" : "Done"}</span></div>
            <div className="stat-row"><span className="lbl" style={{ color: "var(--text-secondary)" }}>Member since</span><span className="val">{fmtDate(detail.createdAt)}</span></div>
          </div>
          {detail.id === currentUserId && (
            <div className="alert alert-info" style={{ marginTop: 14 }}>{icons.info}<span>This is your own account — you can&apos;t change your own access here (409).</span></div>
          )}
          {top(detail.roles) === "ADMIN" && detail.id !== currentUserId && (
            <div className="alert alert-info" style={{ marginTop: 14 }}>{icons.info}<span>Admin accounts can&apos;t be banned from the directory.</span></div>
          )}
          {!detail.enabled && (
            <div className="alert alert-danger" style={{ marginTop: 14 }}>{icons.warn}<span>Banned. Their sessions were revoked — the next silent refresh signs them out.</span></div>
          )}
        </Modal>
      )}
    </div>
  );
}
