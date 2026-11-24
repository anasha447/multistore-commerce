"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useCart } from "@/components/cart/CartContext";
import type { UserResponse } from "@/lib/api";

const inputCls =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-body text-darkgreen outline-none transition-colors focus:border-green disabled:bg-gray-50 disabled:text-gray-400";
const labelCls = "mb-1.5 block font-body text-sm font-bold text-darkgreen";

function OrdersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 2l1.5 2h9L18 2M4 6h16l-1.2 12.2a2 2 0 01-2 1.8H7.2a2 2 0 01-2-1.8L4 6z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 11a3 3 0 006 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Storefront account page: identity + editable profile, change password, and a
 *  My-orders shortcut (no wishlist, per the brief). */
export function AccountView({ user }: { user: UserResponse }) {
  const router = useRouter();
  const { refresh } = useCart();

  const [profile, setProfile] = useState({
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    phone: user.phone ?? "",
  });
  const [pErr, setPErr] = useState<Record<string, string>>({});
  const [busyProfile, setBusyProfile] = useState(false);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwErr, setPwErr] = useState<Record<string, string>>({});
  const [busyPw, setBusyPw] = useState(false);

  const [note, setNote] = useState<string | null>(null);
  const flash = (m: string) => {
    setNote(m);
    setTimeout(() => setNote(null), 2800);
  };

  const initials = `${(user.firstName?.[0] ?? "").toUpperCase()}${(user.lastName?.[0] ?? "").toUpperCase()}` || user.email[0]?.toUpperCase();
  const displayName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!profile.firstName.trim()) errs.firstName = "First name is required.";
    if (!profile.lastName.trim()) errs.lastName = "Last name is required.";
    setPErr(errs);
    if (Object.keys(errs).length) return;
    setBusyProfile(true);
    try {
      await api.users.updateProfile({
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        phone: profile.phone.trim() || null,
      });
      flash("Profile updated.");
      router.refresh();
    } catch (err) {
      setPErr({ _form: err instanceof ApiError ? err.message : "Couldn't update your profile." });
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
    } catch (err) {
      setPwErr(
        err instanceof ApiError && err.isValidation
          ? { current: "Current password is incorrect." }
          : { _form: err instanceof ApiError ? err.message : "Couldn't change your password." },
      );
    } finally {
      setBusyPw(false);
    }
  };

  const logout = async () => {
    await fetch("/api/session/logout", { method: "POST" }).catch(() => {});
    await refresh();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 nav:px-8">
      {note && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-darkgreen px-5 py-2.5 font-body text-sm font-bold text-craemy shadow-2xl"
        >
          {note}
        </div>
      )}

      <h1 className="font-heading text-3xl font-bold text-darkgreen md:text-4xl">My Account</h1>
      <p className="mt-1 font-body text-sm text-gray-500">
        Signed in as <span className="font-bold text-darkgreen">{user.email}</span>
      </p>

      {/* Identity + shortcuts */}
      <div className="mt-8 rounded-[22px] bg-white p-6 shadow-lg">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-16 w-16 flex-none place-items-center rounded-full bg-green font-heading text-2xl font-bold text-craemy">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-xl font-bold text-darkgreen">{displayName}</p>
            <p className="truncate font-body text-sm text-gray-500">{user.email}</p>
            {user.phone && <p className="font-body text-sm text-gray-500">{user.phone}</p>}
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 rounded-full bg-green px-5 py-2.5 font-body font-bold text-white transition-colors hover:bg-orange"
            >
              <OrdersIcon /> My orders
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border-2 border-gray-300 px-5 py-2.5 font-body font-bold text-darkgreen transition-colors hover:border-orange hover:text-orange"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Profile details */}
      <div className="mt-6 rounded-[22px] bg-white p-6 shadow-lg">
        <h2 className="font-heading text-lg font-bold text-darkgreen">Profile details</h2>
        <p className="mt-1 font-body text-sm text-gray-500">Update your name and contact number.</p>
        <form onSubmit={saveProfile} noValidate className="mt-5">
          {pErr._form && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 font-body text-sm text-red-600">{pErr._form}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls} htmlFor="ac-first">First name</label>
              <input
                id="ac-first"
                className={inputCls}
                value={profile.firstName}
                onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                autoComplete="given-name"
              />
              {pErr.firstName && <p className="mt-1 font-body text-xs text-orange">{pErr.firstName}</p>}
            </div>
            <div>
              <label className={labelCls} htmlFor="ac-last">Last name</label>
              <input
                id="ac-last"
                className={inputCls}
                value={profile.lastName}
                onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                autoComplete="family-name"
              />
              {pErr.lastName && <p className="mt-1 font-body text-xs text-orange">{pErr.lastName}</p>}
            </div>
          </div>
          <div className="mt-4">
            <label className={labelCls} htmlFor="ac-email">Email</label>
            <input id="ac-email" className={inputCls} value={user.email} disabled />
          </div>
          <div className="mt-4">
            <label className={labelCls} htmlFor="ac-phone">
              Phone <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="ac-phone"
              className={inputCls}
              type="tel"
              placeholder="+91 ..."
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              autoComplete="tel"
            />
          </div>
          <button
            type="submit"
            disabled={busyProfile}
            className="mt-6 rounded-full bg-green px-7 py-3 font-body font-bold text-white transition-colors hover:bg-orange disabled:opacity-50"
          >
            {busyProfile ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="mt-6 rounded-[22px] bg-white p-6 shadow-lg">
        <h2 className="font-heading text-lg font-bold text-darkgreen">Change password</h2>
        <p className="mt-1 font-body text-sm text-gray-500">Choose a strong password you don&apos;t use elsewhere.</p>
        <form onSubmit={savePw} noValidate className="mt-5">
          {pwErr._form && <p className="mb-4 rounded-xl bg-red-50 px-4 py-2.5 font-body text-sm text-red-600">{pwErr._form}</p>}
          <div className="grid gap-4">
            <div>
              <label className={labelCls} htmlFor="ac-cur">Current password</label>
              <input
                id="ac-cur"
                className={inputCls}
                type="password"
                value={pw.current}
                onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                autoComplete="current-password"
              />
              {pwErr.current && <p className="mt-1 font-body text-xs text-orange">{pwErr.current}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls} htmlFor="ac-new">New password</label>
                <input
                  id="ac-new"
                  className={inputCls}
                  type="password"
                  value={pw.next}
                  onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                  autoComplete="new-password"
                />
                {pwErr.next && <p className="mt-1 font-body text-xs text-orange">{pwErr.next}</p>}
              </div>
              <div>
                <label className={labelCls} htmlFor="ac-confirm">Confirm new password</label>
                <input
                  id="ac-confirm"
                  className={inputCls}
                  type="password"
                  value={pw.confirm}
                  onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                  autoComplete="new-password"
                />
                {pwErr.confirm && <p className="mt-1 font-body text-xs text-orange">{pwErr.confirm}</p>}
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={busyPw}
            className="mt-6 rounded-full bg-green px-7 py-3 font-body font-bold text-white transition-colors hover:bg-orange disabled:opacity-50"
          >
            {busyPw ? "Changing…" : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
}
