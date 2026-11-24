"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "./ui";
import { api, ApiError } from "@/lib/api";
import type { Role, UserResponse } from "@/lib/api";

function RoleBadge({ roles }: { roles: Role[] }) {
  const t = roles.includes("ADMIN") ? "ADMIN" : roles.includes("MANAGER") ? "MANAGER" : "CUSTOMER";
  const cls = t === "ADMIN" ? "st-paid" : t === "MANAGER" ? "st-shipped" : "st-neutral";
  return <span className={`st-badge ${cls}`}>{t.charAt(0) + t.slice(1).toLowerCase()}</span>;
}

export function AccountView({ user }: { user: UserResponse }) {
  const router = useRouter();
  const [profile, setProfile] = useState({ firstName: user.firstName, lastName: user.lastName, phone: user.phone ?? "" });
  const [pErr, setPErr] = useState<Record<string, string>>({});
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwErr, setPwErr] = useState<Record<string, string>>({});
  const [note, setNote] = useState<string | null>(null);
  const [busyProfile, setBusyProfile] = useState(false);
  const [busyPw, setBusyPw] = useState(false);

  const flash = (m: string) => {
    setNote(m);
    setTimeout(() => setNote(null), 2800);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!profile.firstName.trim()) errs.firstName = "First name is required.";
    if (!profile.lastName.trim()) errs.lastName = "Last name is required.";
    setPErr(errs);
    if (Object.keys(errs).length) return;
    setBusyProfile(true);
    try {
      await api.users.updateProfile({ firstName: profile.firstName.trim(), lastName: profile.lastName.trim(), phone: profile.phone.trim() || null });
      flash("Profile updated.");
      router.refresh();
    } catch (e2) {
      setPErr({ _form: e2 instanceof ApiError ? e2.message : "Couldn't update your profile." });
    } finally {
      setBusyProfile(false);
    }
  };

  const savePw = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!pw.current) errs.current = "Enter your current password.";
    if (pw.next.length < 8 || pw.next.length > 100) errs.next = "New password must be 8–100 characters.";
    if (pw.confirm !== pw.next) errs.confirm = "Passwords don't match.";
    setPwErr(errs);
    if (Object.keys(errs).length) return;
    setBusyPw(true);
    try {
      await api.users.changePassword({ currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: "", next: "", confirm: "" });
      flash("Password changed.");
    } catch (e2) {
      setPwErr(
        e2 instanceof ApiError && e2.isValidation
          ? { current: "Current password is incorrect." }
          : { _form: e2 instanceof ApiError ? e2.message : "Couldn't change your password." },
      );
    } finally {
      setBusyPw(false);
    }
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
          <p>Manage your profile and password. Signed in as <span className="mono" style={{ fontSize: 12.5 }}>{user.email}</span>.</p>
        </div>
      </div>

      <div className="dash-row cols-1-1" style={{ alignItems: "start" }}>
        <div className="card">
          <div className="card-head"><h3>Profile</h3><RoleBadge roles={user.roles} /></div>
          <div className="card-body">
            <form onSubmit={saveProfile} noValidate>
              {pErr._form && <p className="co-error">{pErr._form}</p>}
              <div className="field-row">
                <Field label="First name" error={pErr.firstName}><input className="text-input" value={profile.firstName} onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))} autoComplete="given-name" /></Field>
                <Field label="Last name" error={pErr.lastName}><input className="text-input" value={profile.lastName} onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))} autoComplete="family-name" /></Field>
              </div>
              <Field label="Email" hint="Ask an admin to change your email."><input className="text-input" value={user.email} disabled /></Field>
              <Field label="Phone (optional)"><input className="text-input" type="tel" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} autoComplete="tel" /></Field>
              <button className="btn btn-primary" type="submit" disabled={busyProfile} style={{ marginTop: 6 }}>{busyProfile ? "Saving…" : "Save profile"}</button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Password</h3></div>
          <div className="card-body">
            <form onSubmit={savePw} noValidate>
              {pwErr._form && <p className="co-error">{pwErr._form}</p>}
              <Field label="Current password" error={pwErr.current}><input className="text-input" type="password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} autoComplete="current-password" /></Field>
              <Field label="New password" error={pwErr.next} hint="8–100 characters."><input className="text-input" type="password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} autoComplete="new-password" /></Field>
              <Field label="Confirm new password" error={pwErr.confirm}><input className="text-input" type="password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} autoComplete="new-password" /></Field>
              <button className="btn btn-primary" type="submit" disabled={busyPw} style={{ marginTop: 6 }}>{busyPw ? "Changing…" : "Change password"}</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
