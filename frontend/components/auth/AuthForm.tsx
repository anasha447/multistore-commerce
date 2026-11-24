"use client";

// Sign in / register (Matessa skin). Wiring per the original: posts to the same-origin
// session routes (which set httpOnly cookies), refreshes the cart, then routes by role
// (staff → /admin, customer → /account) unless ?next overrides. A provisioned manager
// with a temp password is forced through a password change first.
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNext } from "@/lib/utils/safeNext";
import { useCart } from "@/components/cart/CartContext";
import { ForcePasswordChange } from "./ForcePasswordChange";

type Mode = "login" | "register";
const isStaffRole = (roles: string[]) => roles.includes("ADMIN") || roles.includes("MANAGER");

export function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh: refreshCart } = useCart();
  // Only a path on this site: ?next comes from a URL anyone can craft (open redirect).
  const nextParam = safeNext(params.get("next"));

  const [mode, setMode] = useState<Mode>(params.get("mode") === "register" ? "register" : "login");
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forceChange, setForceChange] = useState<{ current: string; dest: string } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (params.get("mode") === "register") setMode("register");
  }, [params]);

  const go = (dest: string) => {
    router.push(dest);
    router.refresh();
  };
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const url = mode === "login" ? "/api/session/login" : "/api/session/register";
      const payload = mode === "login" ? { email: form.email, password: form.password } : form;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        return;
      }
      await refreshCart();
      const roles: string[] = Array.isArray(data.roles) ? data.roles : [];
      const dest = nextParam || (isStaffRole(roles) ? "/admin" : "/account");
      if (mode === "login" && data.mustChangePassword) {
        setForceChange({ current: form.password, dest });
        return;
      }
      // Register auto-logs-in; if it couldn't, send them to sign in.
      if (mode === "register" && data.autoLogin === false) {
        setMode("login");
        setError("Account created — please sign in.");
        return;
      }
      go(dest);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const field = "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-body outline-none focus:border-green";

  return (
    <>
      <div className="mx-auto w-full max-w-md rounded-[24px] bg-white p-7 shadow-lg">
        <h1 className="text-center font-heading text-2xl font-bold text-darkgreen mb-5">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>


        {/* Tabs */}
        <div className="mb-6 flex rounded-full bg-gray-100 p-1">
          {(["login", "register"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              aria-pressed={mode === m}
              className={`flex-1 rounded-full py-2 font-body text-sm font-bold transition-colors ${
                mode === m ? "bg-green text-white" : "text-darkgreen"
              }`}
            >
              {m === "login" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="grid gap-3">
          {mode === "register" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={field} placeholder="First name" value={form.firstName} onChange={set("firstName")} autoComplete="given-name" />
              <input className={field} placeholder="Last name" value={form.lastName} onChange={set("lastName")} autoComplete="family-name" />
            </div>
          )}
          <input className={field} type="email" placeholder="Email" value={form.email} onChange={set("email")} autoComplete="email" required />
          <input
            className={field}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={set("password")}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
          {error && <p className="font-body text-sm text-orange">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-full bg-green py-3 font-body font-bold text-white transition-colors duration-300 hover:bg-orange disabled:opacity-40"
          >
            {loading ? "One moment…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>

      {forceChange && <ForcePasswordChange email={form.email} current={forceChange.current} onDone={() => go(forceChange.dest)} />}
    </>
  );
}
