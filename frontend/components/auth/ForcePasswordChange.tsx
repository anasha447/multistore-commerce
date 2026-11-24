"use client";

// Mandatory first-login password change (provisioned managers). Not dismissable —
// setting a new password is the only way out, then onDone() routes to the dashboard.
import { useState } from "react";
import { api, ApiError } from "@/lib/api";

export function ForcePasswordChange({ email, current, onDone }: { email: string; current: string; onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) return setError("Use at least 8 characters.");
    if (pw !== confirm) return setError("The two passwords don't match.");
    if (pw === current) return setError("Choose a password different from the temporary one.");
    setBusy(true);
    try {
      await api.users.changePassword({ currentPassword: current, newPassword: pw });
      // The change revokes every session, and tokens issued while a change is pending carry no
      // staff roles. Sign in again with the new password to get a full session.
      const relogin = await fetch("/api/session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      });
      if (!relogin.ok) {
        setError("Password updated — please sign in again with your new password.");
        setBusy(false);
        return;
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update your password — try again.");
      setBusy(false);
    }
  };

  const field = "w-full rounded-xl border border-gray-300 px-4 py-3 font-body outline-none focus:border-green";

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-5" role="dialog" aria-modal="true" aria-label="Set a new password">
      <form onSubmit={submit} className="w-full max-w-sm rounded-[22px] bg-white p-6 shadow-2xl">
        <h2 className="mb-1 font-heading text-xl font-bold text-darkgreen">Set a new password</h2>
        <p className="mb-4 font-body text-sm text-gray-500">Choose a password to replace your temporary one.</p>
        <div className="grid gap-3">
          <input className={field} type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
          <input className={field} type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <p className="font-body text-sm text-orange">{error}</p>}
          <button type="submit" disabled={busy} className="rounded-full bg-green py-3 font-body font-bold text-white transition-colors hover:bg-orange disabled:opacity-40">
            {busy ? "Saving…" : "Save & continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
