"use client";

// Guest newsletter popup (subscribers API). One-shot per browser (localStorage), shown
// after a short delay; returns a welcome discount code. Dark-green Matessa card.
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

const SEEN_KEY = "mt_newsletter_seen";

export function NewsletterPopup({ guest }: { guest: boolean }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ code: string | null; percent: number; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!guest) return;
    if (localStorage.getItem(SEEN_KEY)) return;
    const t = setTimeout(() => setOpen(true), 6000);
    return () => clearTimeout(t);
  }, [guest]);

  const close = () => {
    localStorage.setItem(SEEN_KEY, "1");
    setOpen(false);
  };

  const submit = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.subscribers.join({ email: email.trim() });
      setResult({ code: res.couponCode, percent: res.discountPercent, message: res.message });
      localStorage.setItem(SEEN_KEY, "1");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't subscribe — please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 p-5" role="dialog" aria-modal="true" aria-label="Newsletter">
      <div className="relative w-full max-w-md overflow-hidden rounded-[24px] bg-darkgreen p-8 text-center shadow-2xl">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "url('/brand/matessa-pattern.webp')", backgroundSize: "300px", mixBlendMode: "screen" }}
        />
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 text-craemy/70 transition-colors hover:text-orange"
        >
          ✕
        </button>

        {result ? (
          <div className="relative">
            <h2 className="font-heading text-2xl font-bold text-yellow">You&apos;re in!</h2>
            <p className="mt-3 font-body text-craemy/90">
              {result.code ? (
                <>
                  Use <span className="font-bold text-white">{result.code}</span> for {result.percent}% off your first order.
                </>
              ) : (
                result.message
              )}
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-6 rounded-full bg-craemy px-7 py-3 font-body font-bold text-darkgreen transition-colors hover:bg-yellow"
            >
              Start shopping
            </button>
          </div>
        ) : (
          <div className="relative">
            <h2 className="font-heading text-2xl font-bold text-yellow">Get 15% Off Your First Order</h2>
            <p className="mt-2 font-body text-craemy/85">Join the ritual — a sip from nature, straight to your inbox.</p>
            <div className="mt-6 grid gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                aria-label="Email"
                className="rounded-full border border-white/20 bg-white/10 px-5 py-3 font-body text-white outline-none placeholder:text-craemy/50 focus:border-yellow"
              />
              {error && <p className="font-body text-sm text-orange">{error}</p>}
              <button
                type="button"
                disabled={busy}
                onClick={submit}
                className="rounded-full bg-orange py-3 font-body font-bold text-white transition-colors hover:bg-orange-hover disabled:opacity-40"
              >
                {busy ? "Joining…" : "Get my 15% code"}
              </button>
              <button type="button" onClick={close} className="font-body text-sm text-craemy/60 hover:text-orange">
                No thanks
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
