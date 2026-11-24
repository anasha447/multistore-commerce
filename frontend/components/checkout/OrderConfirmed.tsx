"use client";

// Order confirmation. Reads the snapshot the checkout left in sessionStorage (this tab only)
// for the guest email and total; with no snapshot (a shared link, a new tab) it still shows
// the order number from the URL and the way to track it, and nothing else.

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PLACED_KEY } from "@/components/checkout/CheckoutView";
import { formatMoney } from "@/lib/utils/money";

interface Placed {
  orderNumber: string;
  guest: boolean;
  email: string | null;
  total: number;
}

const noSubscribe = () => () => {};
/** The raw snapshot string (stable between renders), or null on the server. */
function readRaw(): string | null {
  try {
    return sessionStorage.getItem(PLACED_KEY);
  } catch {
    return null;
  }
}

export function OrderConfirmed() {
  const params = useSearchParams();
  const raw = params.get("number");
  const orderNumber = raw && /^[A-Z0-9-]{4,40}$/.test(raw) ? raw : null;
  // Read through useSyncExternalStore so the server render (no storage) and the first
  // client render agree, then the client fills in the snapshot without a hydration error.
  const stored = useSyncExternalStore(noSubscribe, readRaw, () => null);
  const placed = useMemo<Placed | null>(() => {
    if (!stored || !orderNumber) return null;
    try {
      const p = JSON.parse(stored) as Placed;
      return p.orderNumber === orderNumber ? p : null;
    } catch {
      return null;
    }
  }, [stored, orderNumber]);

  if (!orderNumber) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-20 text-center">
        <h1 className="font-heading text-3xl font-bold text-darkgreen">Nothing to confirm here</h1>
        <p className="mt-3 text-gray-600">Looking for an order? Track it with its number and your email.</p>
        <Link href="/track" className="mt-8 rounded-full bg-green px-6 py-3 font-body font-bold text-white transition-colors hover:bg-orange">
          Track an order
        </Link>
      </div>
    );
  }

  const guest = placed?.guest ?? true;
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-20 text-center">
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-green text-white">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h1 className="font-heading text-3xl font-bold text-darkgreen">Order placed</h1>
      <p className="mt-2 font-body text-lg font-bold tracking-wide text-green">{orderNumber}</p>
      {placed && <p className="mt-1 font-body text-sm text-gray-500">Total {formatMoney(placed.total)}</p>}
      <p className="mt-3 text-gray-600">
        {guest ? (
          <>
            Thanks!{" "}
            {placed?.email ? (
              <>
                Your confirmation is on its way to <strong>{placed.email}</strong>.
              </>
            ) : (
              <>Your confirmation is on its way by email.</>
            )}{" "}
            Keep your order number — you can track it anytime.
          </>
        ) : (
          <>Your blend is getting ready. Track it anytime from your orders.</>
        )}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href={guest ? `/track?number=${encodeURIComponent(orderNumber)}` : `/orders/${encodeURIComponent(orderNumber)}`}
          className="rounded-full border-2 border-darkgreen px-6 py-3 font-body font-bold text-darkgreen transition-colors hover:border-orange hover:text-orange"
        >
          {guest ? "Track order" : "View order"}
        </Link>
        <Link href="/shop" className="rounded-full bg-green px-6 py-3 font-body font-bold text-white transition-colors hover:bg-orange">
          Keep shopping
        </Link>
      </div>
    </div>
  );
}
