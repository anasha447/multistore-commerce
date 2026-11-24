"use client";

// Unified checkout (guest + signed-in) driven by the cart context. Guests supply an email and
// submit to the public guest-checkout endpoint; signed-in shoppers submit their server cart.
//
// Guards, in the order a shopper meets them:
//  - Entry: an empty cart goes back to /cart (the page also redirects signed-in shoppers
//    server-side). Nothing is shown until the cart has loaded, so the form never flashes.
//  - Re-validation: the basket is re-priced by the server on arrival. Unavailable lines,
//    lines over stock or over the per-line limit, and price changes since the cart page are
//    listed above the form, with one button to fix the cart. Ordering is blocked until fixed.
//  - Idempotency: ONE key per checkout visit, minted on page load (lib/checkout/idempotency).
//    Every submit from this visit reuses it, so a double click, a retry or a reload can
//    never place a second order.
//  - Submit: one request in flight at a time; a leave-page warning only while it is in
//    flight; a 20 s client timeout that tells the shopper to check their orders, and makes
//    a retry safe because the key is unchanged.
//  - Payment: only the methods the server says are live (COD-only until a real provider).
//  - Success: history is replaced with the confirmation page, so Back cannot return to a
//    filled, submittable form.
//  - Form state survives a reload or a mid-checkout sign-in (sessionStorage, this tab only;
//    a guest's email is not kept).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import type { PaymentMethod } from "@/lib/api";
import { useCart, clearGuestCart } from "@/components/cart/CartContext";
import { cartFingerprint, useCheckoutKey } from "@/lib/checkout/idempotency";
import {
  MAX_LINE_QUANTITY,
  normalisePhone,
  validateCheckout,
  type CheckoutFields,
  type FieldErrors,
} from "@/lib/checkout/validation";
import { INDIAN_STATES_AND_UTS } from "@/lib/constants/indianStates";
import { formatMoney } from "@/lib/utils/money";

const PAYMENT_COPY: Record<string, { title: string; sub: string }> = {
  COD: { title: "Cash on delivery", sub: "Pay when it arrives" },
  ONLINE: { title: "Online payment", sub: "Card, UPI or Razorpay" },
};
const SUBMIT_TIMEOUT_MS = 20_000;
const FORM_KEY = "checkout:form";
export const PLACED_KEY = "checkout:placed";

type FormState = CheckoutFields & { line2: string };

const EMPTY_FORM: FormState = { email: "", phone: "", fullName: "", line1: "", line2: "", city: "", region: "", postalCode: "" };

function restoreForm(user: { email: string; fullName: string } | null): FormState {
  let saved: Partial<FormState> = {};
  try {
    saved = JSON.parse(sessionStorage.getItem(FORM_KEY) || "{}") as Partial<FormState>;
  } catch {
    /* unreadable — start empty */
  }
  return {
    ...EMPTY_FORM,
    ...saved,
    email: user?.email ?? "",
    fullName: saved.fullName || user?.fullName || "",
  };
}

interface Issue {
  variantId: number;
  name: string;
  kind: "unavailable" | "stock" | "limit" | "price";
  detail: string;
  /** Quantity that fixes it (0 = remove). Undefined for price-only notices. */
  fixTo?: number;
}

export function CheckoutView({
  user,
  initialCoupon,
  guest,
}: {
  user: { email: string; fullName: string } | null;
  initialCoupon: string | null;
  guest: boolean;
}) {
  const router = useRouter();
  const { cart, subtotal, count, refresh, setQty } = useCart();
  const checkoutKey = useCheckoutKey(); // minted once, on page load

  const [form, setForm] = useState<FormState>(() =>
    typeof window === "undefined" ? { ...EMPTY_FORM, email: user?.email ?? "", fullName: user?.fullName ?? "" } : restoreForm(user),
  );
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState<{ text: string; signIn?: boolean; checkOrders?: boolean } | null>(null);

  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [payment, setPayment] = useState<PaymentMethod>("COD");

  // Coupon: a stateless preview (api.coupons.validate) computes the discount; the code is
  // passed to the order so the server re-validates and redeems it authoritatively.
  const [coupon, setCoupon] = useState(initialCoupon ?? "");
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);

  // ── Load: re-price the basket and fetch the live payment methods ─────────────────────
  const [revalidated, setRevalidated] = useState(false);
  const firstPrices = useRef<Map<number, number> | null>(null);
  const [priceNotes, setPriceNotes] = useState<Issue[]>([]);

  useEffect(() => {
    // The cart shown on arrival may be what the cart page last fetched; capture its prices,
    // then re-price from the server and report anything that moved.
    if (cart && !firstPrices.current) {
      firstPrices.current = new Map(cart.items.map((i) => [i.productVariantId, i.unitPrice]));
    }
  }, [cart]);

  useEffect(() => {
    let cancelled = false;
    void refresh().finally(() => {
      if (!cancelled) setRevalidated(true);
    });
    api.orders
      .paymentMethods()
      .then((r) => {
        if (cancelled) return;
        const live = r.methods.filter((m) => m in PAYMENT_COPY);
        setMethods(live.length > 0 ? live : ["COD"]);
        if (!live.includes("COD") && live.length > 0) setPayment(live[0]);
      })
      .catch(() => {
        if (!cancelled) setMethods(["COD"]); // fail safe: COD needs no payment provider
      });
    return () => {
      cancelled = true;
    };
    // Mount only: this is the "on arrival" re-validation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!revalidated || !cart || !firstPrices.current) return;
    const notes: Issue[] = [];
    for (const i of cart.items) {
      const before = firstPrices.current.get(i.productVariantId);
      if (before !== undefined && Math.abs(before - i.unitPrice) >= 0.005) {
        notes.push({
          variantId: i.productVariantId,
          name: i.productName,
          kind: "price",
          detail: `now ${formatMoney(i.unitPrice)} (was ${formatMoney(before)})`,
        });
      }
    }
    setPriceNotes(notes);
  }, [revalidated, cart]);

  const items = useMemo(() => cart?.items ?? [], [cart]);

  const issues: Issue[] = useMemo(() => {
    const out: Issue[] = [];
    for (const i of items) {
      if (!i.available) {
        out.push({ variantId: i.productVariantId, name: i.productName, kind: "unavailable", detail: "is no longer available", fixTo: 0 });
      } else if (i.quantity > i.stockQuantity) {
        out.push({
          variantId: i.productVariantId,
          name: i.productName,
          kind: "stock",
          detail: i.stockQuantity > 0 ? `only ${i.stockQuantity} left` : "is out of stock",
          fixTo: Math.max(0, i.stockQuantity),
        });
      } else if (i.quantity > MAX_LINE_QUANTITY) {
        out.push({ variantId: i.productVariantId, name: i.productName, kind: "limit", detail: `limit ${MAX_LINE_QUANTITY} per order`, fixTo: MAX_LINE_QUANTITY });
      }
    }
    return out;
  }, [items]);

  // ── Entry guard: an empty cart has nothing to check out ──────────────────────────────
  const empty = revalidated && cart !== null && items.length === 0;
  useEffect(() => {
    if (empty) router.replace("/cart");
  }, [empty, router]);

  // ── Keep the form across reloads (never a guest's email) ─────────────────────────────
  useEffect(() => {
    try {
      const { email, ...rest } = form;
      sessionStorage.setItem(FORM_KEY, JSON.stringify(guest ? rest : { ...rest, email }));
    } catch {
      /* best effort */
    }
  }, [form, guest]);

  // ── Warn before leaving only while an order request is in flight ─────────────────────
  useEffect(() => {
    if (!submitting) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [submitting]);

  const fieldErrors: FieldErrors = touched ? validateCheckout(form, guest) : {};
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const discount = applied?.discount ?? 0;
  const total = Math.max(0, subtotal - discount);

  const applyCoupon = async () => {
    const code = coupon.trim();
    if (!code) return;
    setCouponBusy(true);
    setCouponMsg(null);
    try {
      const res = await api.coupons.validate({ code, subtotal });
      if (res.valid) {
        setApplied({ code: res.code, discount: res.discountAmount });
        setCouponMsg(`Applied — you saved ${formatMoney(res.discountAmount)}.`);
      } else {
        setApplied(null);
        setCouponMsg(res.message || "That coupon isn't valid for this order.");
      }
    } catch (e) {
      // If the live preview isn't available, still accept the code — the server
      // re-validates and applies it authoritatively at checkout.
      if (e instanceof ApiError && e.isUnauthorized) {
        setApplied({ code, discount: 0 });
        setCouponMsg("Code added — the discount is applied at checkout.");
      } else {
        setApplied(null);
        setCouponMsg("Couldn't check that coupon — please try again.");
      }
    } finally {
      setCouponBusy(false);
    }
  };

  const removeCoupon = () => {
    setApplied(null);
    setCoupon("");
    setCouponMsg(null);
  };

  const fixCart = async () => {
    for (const issue of issues) {
      if (issue.fixTo === undefined) continue;
      const line = items.find((i) => i.productVariantId === issue.variantId);
      if (line) await setQty(line.id, issue.fixTo);
    }
    setPriceNotes([]);
  };

  const placeOrder = useCallback(async () => {
    if (inFlight.current) return; // a second click or Enter while the first is in flight
    setError(null);
    setTouched(true);
    if (Object.keys(validateCheckout(form, guest)).length > 0) {
      setError({ text: "Please check the highlighted fields." });
      return;
    }
    if (items.length === 0 || issues.length > 0) {
      setError({ text: "Please fix the items listed above before placing your order." });
      return;
    }
    const chosen = methods?.includes(payment) ? payment : "COD";

    inFlight.current = true;
    setSubmitting(true);
    const lines = items.map((i) => ({ productVariantId: i.productVariantId, quantity: i.quantity }));
    const idemKey = checkoutKey.keyFor(cartFingerprint(lines, applied?.code ?? null));
    checkoutKey.lock(); // from here the outcome may be unknown: never rotate this key

    const shippingAddress = {
      recipientName: form.fullName.trim(),
      line1: form.line1.trim(),
      line2: form.line2.trim() || null,
      city: form.city.trim(),
      state: form.region,
      postalCode: form.postalCode.trim(),
      country: "India",
      phone: normalisePhone(form.phone),
    };
    const signal = AbortSignal.timeout(SUBMIT_TIMEOUT_MS);
    try {
      const order = guest
        ? await api.orders.guestCheckout(
            {
              guestEmail: form.email.trim(),
              items: lines,
              shippingAddress,
              paymentMethod: chosen,
              couponCode: applied?.code ?? null,
              shippingMethod: "Standard",
            },
            idemKey,
            signal,
          )
        : await api.orders.checkout(
            { shippingAddress, paymentMethod: chosen, couponCode: applied?.code ?? null, shippingMethod: "Standard" },
            idemKey,
            signal,
          );

      try {
        sessionStorage.setItem(
          PLACED_KEY,
          JSON.stringify({ orderNumber: order.orderNumber, guest, email: guest ? form.email.trim() : null, total: order.total }),
        );
        sessionStorage.removeItem(FORM_KEY);
      } catch {
        /* the confirmation page falls back to the order number alone */
      }
      checkoutKey.clear();
      if (guest) clearGuestCart();
      void refresh();
      inFlight.current = false;
      setSubmitting(false);
      // Replace, not push: Back must never land on a filled, submittable checkout.
      router.replace(`/order-confirmed?number=${encodeURIComponent(order.orderNumber)}`);
      return;
    } catch (e) {
      if (e instanceof ApiError) {
        const code = e.body?.code;
        if (code === "REQUEST_IN_PROGRESS") {
          setError({ text: "Your order is still being placed — give it a few seconds, then check your orders.", checkOrders: true });
        } else if (code === "IDEMPOTENCY_KEY_REUSED") {
          setError({
            text: "Your basket changed after an order attempt we couldn't confirm. Please check your orders before trying again.",
            checkOrders: true,
          });
        } else {
          // A definite "no order" answer: the key can move with the basket again.
          checkoutKey.unlock();
          if (e.isConflict) {
            setError({ text: "Something in your basket just changed — we've updated it below. Please review and place the order again." });
            await refresh();
          } else if (e.isUnavailable) {
            setError({ text: "The store is briefly unavailable. Please try again in a moment." });
          } else if (e.isUnauthorized) {
            setError({ text: "Your session expired — sign in again and your details will still be here.", signIn: true });
          } else if (e.status === 429) {
            setError({ text: "Too many attempts — please wait a minute and try again." });
          } else {
            setError({ text: e.message || "Couldn't place your order. Please try again." });
          }
        }
      } else {
        // Timeout or dropped connection: the order may exist. The key stays locked, so
        // trying again is safe — it returns the same order if it was placed.
        setError({
          text: "We couldn't confirm your order in time. It may still have gone through — check your orders, or try again: it won't be placed twice.",
          checkOrders: true,
        });
      }
    }
    inFlight.current = false;
    setSubmitting(false);
  }, [form, guest, items, issues, methods, payment, applied, checkoutKey, refresh, router]);

  // ── Render ───────────────────────────────────────────────────────────────────────────
  if (!revalidated || cart === null || empty) {
    return (
      <div className="mx-auto max-w-[1000px] px-5 py-16 nav:px-8" aria-busy="true">
        <p className="font-body text-gray-500">{empty ? "Your cart is empty — taking you back…" : "Checking your basket…"}</p>
      </div>
    );
  }

  const field = (bad?: string) =>
    `w-full rounded-xl border bg-white px-4 py-3 font-body outline-none focus:border-green ${bad ? "border-orange" : "border-gray-300"}`;
  const err = (k: keyof CheckoutFields) =>
    fieldErrors[k] ? (
      <p id={`err-${k}`} className="mt-1 font-body text-[13px] text-orange">
        {fieldErrors[k]}
      </p>
    ) : null;
  const a11y = (k: keyof CheckoutFields) => ({
    "aria-invalid": Boolean(fieldErrors[k]) || undefined,
    "aria-describedby": fieldErrors[k] ? `err-${k}` : undefined,
  });
  const notices = [...issues, ...priceNotes];

  return (
    <form
      className="mx-auto max-w-[1000px] px-5 py-10 nav:px-8"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void placeOrder();
      }}
    >
      <h1 className="mb-8 font-heading text-3xl font-bold text-darkgreen md:text-4xl">
        Checkout <span className="font-body text-lg font-normal text-gray-500">{count} item{count === 1 ? "" : "s"}</span>
      </h1>

      {notices.length > 0 && (
        <div role="status" className="mb-8 rounded-2xl border border-orange/40 bg-[#FFF4EC] p-5">
          <p className="font-body font-bold text-darkgreen">Your basket changed since you last saw it</p>
          <ul className="mt-2 space-y-1 font-body text-sm text-gray-700">
            {notices.map((n) => (
              <li key={`${n.kind}-${n.variantId}`}>
                <strong>{n.name}</strong> {n.detail}
              </li>
            ))}
          </ul>
          {issues.length > 0 ? (
            <button
              type="button"
              onClick={() => void fixCart()}
              className="mt-4 rounded-full bg-darkgreen px-5 py-2.5 font-body text-sm font-bold text-craemy transition-colors hover:bg-green"
            >
              Update my basket
            </button>
          ) : (
            <button type="button" onClick={() => setPriceNotes([])} className="mt-3 font-body text-sm font-bold text-green underline underline-offset-4">
              OK, got it
            </button>
          )}
        </div>
      )}

      <div className="grid gap-10 nav:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section>
            <h2 className="mb-4 font-heading text-xl font-bold text-darkgreen">Contact</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <input
                  className={`${field(fieldErrors.email)} ${guest ? "" : "bg-gray-50"}`}
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={set("email")}
                  readOnly={!guest}
                  autoComplete="email"
                  aria-label="Email"
                  required={guest}
                  {...a11y("email")}
                />
                {err("email")}
              </div>
              <div>
                <input
                  className={field(fieldErrors.phone)}
                  type="tel"
                  inputMode="tel"
                  placeholder="Mobile (10 digits)"
                  value={form.phone}
                  onChange={set("phone")}
                  autoComplete="shipping tel"
                  aria-label="Mobile number"
                  required
                  {...a11y("phone")}
                />
                {err("phone")}
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-heading text-xl font-bold text-darkgreen">Shipping address</h2>
            <div className="grid gap-3">
              <div>
                <input className={field(fieldErrors.fullName)} placeholder="Full name" value={form.fullName} onChange={set("fullName")} autoComplete="shipping name" aria-label="Full name" required {...a11y("fullName")} />
                {err("fullName")}
              </div>
              <div>
                <input className={field(fieldErrors.line1)} placeholder="House / flat, street" value={form.line1} onChange={set("line1")} autoComplete="shipping address-line1" aria-label="Street address" required {...a11y("line1")} />
                {err("line1")}
              </div>
              <input className={field()} placeholder="Area, landmark (optional)" value={form.line2} onChange={set("line2")} autoComplete="shipping address-line2" aria-label="Area or landmark" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <input className={field(fieldErrors.city)} placeholder="City" value={form.city} onChange={set("city")} autoComplete="shipping address-level2" aria-label="City" required {...a11y("city")} />
                  {err("city")}
                </div>
                <div>
                  <select className={field(fieldErrors.region)} value={form.region} onChange={set("region")} autoComplete="shipping address-level1" aria-label="State" required {...a11y("region")}>
                    <option value="" disabled>
                      Select state
                    </option>
                    {INDIAN_STATES_AND_UTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {err("region")}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <input
                    className={field(fieldErrors.postalCode)}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="PIN code"
                    value={form.postalCode}
                    onChange={set("postalCode")}
                    autoComplete="shipping postal-code"
                    aria-label="PIN code"
                    required
                    {...a11y("postalCode")}
                  />
                  {err("postalCode")}
                </div>
                <input className={`${field()} bg-gray-50`} value="India" readOnly aria-label="Country" />
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 font-heading text-xl font-bold text-darkgreen">Payment</h2>
            {methods === null ? (
              <p className="font-body text-sm text-gray-500">Loading payment options…</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
                {methods.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    onClick={() => setPayment(m)}
                    aria-checked={payment === m}
                    className={`rounded-xl border-2 p-4 text-left transition-colors ${
                      payment === m ? "border-green bg-[#E8F3E8]" : "border-gray-200 hover:border-orange"
                    }`}
                  >
                    <span className="block font-body font-bold text-darkgreen">{PAYMENT_COPY[m].title}</span>
                    <span className="block font-body text-sm text-gray-500">{PAYMENT_COPY[m].sub}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="h-fit rounded-[22px] bg-white p-6 shadow-lg nav:sticky nav:top-24">
          <h2 className="mb-4 font-heading text-lg font-bold text-darkgreen">Order summary</h2>
          <ul className="space-y-2 border-b border-gray-100 pb-3">
            {items.map((i) => (
              <li key={i.id} className={`flex justify-between gap-3 font-body text-sm ${i.available ? "text-gray-600" : "text-gray-400 line-through"}`}>
                <span className="truncate">
                  {i.productName} × {i.quantity}
                </span>
                <span className="whitespace-nowrap font-bold text-green">{formatMoney(i.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="border-b border-gray-100 py-4">
            {applied ? (
              <div className="flex items-center justify-between gap-2">
                <span className="font-body text-sm font-bold text-green">{applied.code} applied</span>
                <button type="button" onClick={removeCoupon} disabled={submitting} className="font-body text-sm text-gray-400 transition-colors hover:text-orange">
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault(); // Enter here applies the coupon, never submits the order
                      void applyCoupon();
                    }
                  }}
                  placeholder="Coupon code"
                  aria-label="Coupon code"
                  className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2.5 font-body text-sm uppercase outline-none focus:border-green"
                />
                <button
                  type="button"
                  onClick={() => void applyCoupon()}
                  disabled={couponBusy || !coupon.trim() || submitting}
                  className="rounded-xl bg-darkgreen px-4 py-2.5 font-body text-sm font-bold text-craemy transition-colors hover:bg-green disabled:opacity-40"
                >
                  {couponBusy ? "Checking…" : "Apply"}
                </button>
              </div>
            )}
            {couponMsg && <p className={`mt-2 font-body text-sm ${applied ? "text-green" : "text-orange"}`}>{couponMsg}</p>}
          </div>

          <div className="space-y-1.5 pt-4 font-body text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-semibold text-darkgreen">{formatMoney(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-green">
                <span>Discount</span>
                <span className="font-semibold">− {formatMoney(discount)}</span>
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-gray-100 py-4">
            <span className="font-body font-bold text-gray-700">Total</span>
            <span className="font-heading text-2xl font-bold text-green">{formatMoney(total)}</span>
          </div>

          {error && (
            <div role="alert" className="mb-3 font-body text-sm text-orange">
              <p>{error.text}</p>
              {error.signIn && (
                <Link href="/login?next=/checkout" className="mt-1 inline-block font-bold text-darkgreen underline underline-offset-4">
                  Sign in
                </Link>
              )}
              {error.checkOrders && (
                <Link href={guest ? "/track" : "/orders"} className="mt-1 inline-block font-bold text-darkgreen underline underline-offset-4">
                  {guest ? "Track an order" : "Check my orders"}
                </Link>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || issues.length > 0 || methods === null}
            aria-busy={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-green py-3.5 text-center font-body font-bold text-white transition-colors duration-300 hover:bg-orange disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {submitting ? "Placing order…" : `Place order · ${formatMoney(total)}`}
          </button>
          <p className="mt-3 text-center font-body text-xs text-gray-500">You can safely retry — your order is never placed twice.</p>
        </aside>
      </div>
    </form>
  );
}
