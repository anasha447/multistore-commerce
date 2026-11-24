"use client";

/**
 * One checkout idempotency key per checkout visit.
 *
 * The key exists so that a resubmitted checkout returns the original order instead of
 * placing a second one and taking a second payment. It is minted ONCE, when the checkout
 * page loads, and every submit from that visit reuses it: a double click, a retry after a
 * network error, a reload. It lives in sessionStorage so a reload keeps it, and the tab
 * closing discards it.
 *
 * It is bound to a fingerprint of what is being bought (basket + coupon). Before the first
 * submit, a changed basket simply gets a fresh key — nothing was sent with the old one.
 * After a submit whose outcome is unknown (timeout, dropped connection), the key is LOCKED:
 * the order may already exist, so the key is never rotated. If the shopper then changes the
 * basket, the server answers 422 IDEMPOTENCY_KEY_REUSED and the page tells them to check
 * their orders rather than risk a duplicate. A successful order clears it.
 *
 * Every storage access is wrapped: sessionStorage throws in some privacy modes, and a
 * storage failure must degrade to an in-memory key, never break checkout.
 */

import { useCallback, useRef, useState } from "react";

const STORAGE_KEY = "checkout:idempotency";

interface Saved {
  key: string;
  fingerprint: string | null;
  /** A request with this key was sent and its outcome is unknown. */
  locked: boolean;
}

export interface FingerprintLine {
  productVariantId: number;
  quantity: number;
}

/** Stable identity for "this basket, with this coupon". Order-independent. */
export function cartFingerprint(lines: FingerprintLine[], couponCode: string | null): string {
  const normalised = lines
    .map((line) => `${line.productVariantId}x${line.quantity}`)
    .sort()
    .join("|");
  return `${normalised}#${couponCode ?? ""}`;
}

function read(): Saved | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<Saved>;
    return typeof saved.key === "string"
      ? { key: saved.key, fingerprint: saved.fingerprint ?? null, locked: Boolean(saved.locked) }
      : null;
  } catch {
    return null;
  }
}

function write(saved: Saved): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    /* storage unwritable — the in-memory key still covers retries on this page */
  }
}

function mint(): Saved {
  const saved = { key: crypto.randomUUID(), fingerprint: null, locked: false };
  write(saved);
  return saved;
}

export interface CheckoutKey {
  /**
   * The key to send for a basket. Mints a fresh one only when the basket changed and no
   * request with the current key has gone out yet.
   */
  keyFor: (fingerprint: string) => string;
  /** Call right before sending: from now on the key must not change. */
  lock: () => void;
  /** Call when the server gave a definite "no order" answer (declined, out of stock…). */
  unlock: () => void;
  /** Call after the order is placed, so the next checkout starts clean. */
  clear: () => void;
}

/** Mints (or restores) the key once, on page load, and keeps it for the whole visit. */
export function useCheckoutKey(): CheckoutKey {
  // Lazy initialiser: runs once per mount. On the server there is no storage and the value
  // is never used (keys are only read from event handlers), so a placeholder is fine.
  const [initial] = useState<Saved>(() =>
    typeof window === "undefined" ? { key: "", fingerprint: null, locked: false } : read() ?? mint(),
  );
  const current = useRef<Saved>(initial);

  const keyFor = useCallback((fingerprint: string) => {
    const c = current.current;
    if (c.fingerprint === null) {
      current.current = { ...c, fingerprint };
      write(current.current);
    } else if (c.fingerprint !== fingerprint && !c.locked) {
      current.current = { key: crypto.randomUUID(), fingerprint, locked: false };
      write(current.current);
    }
    return current.current.key;
  }, []);

  const lock = useCallback(() => {
    current.current = { ...current.current, locked: true };
    write(current.current);
  }, []);

  const unlock = useCallback(() => {
    current.current = { ...current.current, locked: false };
    write(current.current);
  }, []);

  const clear = useCallback(() => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to do */
    }
    current.current = { key: crypto.randomUUID(), fingerprint: null, locked: false };
  }, []);

  return { keyFor, lock, unlock, clear };
}
