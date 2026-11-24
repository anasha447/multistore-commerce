// Checkout field rules for an Indian storefront. The server re-validates everything; these
// exist to give the shopper a precise message next to the field before anything is sent.

import { INDIAN_STATES_AND_UTS } from "@/lib/constants/indianStates";

/** Per-line quantity the order API accepts (order-service CartItemRequest @Max). */
export const MAX_LINE_QUANTITY = 20;
/** Distinct lines the order API accepts in one order. */
export const MAX_LINES = 50;

export interface CheckoutFields {
  email: string;
  phone: string;
  fullName: string;
  line1: string;
  city: string;
  region: string;
  postalCode: string;
}

export type FieldErrors = Partial<Record<keyof CheckoutFields, string>>;

/** "+91 98765 43210", "098765-43210" → "9876543210"; anything else unchanged. */
export function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MOBILE = /^[6-9]\d{9}$/;
const PIN = /^[1-9]\d{5}$/;

export function validateCheckout(f: CheckoutFields, needEmail: boolean): FieldErrors {
  const e: FieldErrors = {};
  if (needEmail && !EMAIL.test(f.email.trim())) e.email = "Enter a valid email — we send your confirmation there.";
  if (!MOBILE.test(normalisePhone(f.phone))) e.phone = "Enter a 10-digit Indian mobile number.";
  if (f.fullName.trim().length < 2) e.fullName = "Enter the recipient's full name.";
  if (f.line1.trim().length < 4) e.line1 = "Enter the street address.";
  if (f.city.trim().length < 2) e.city = "Enter the city.";
  if (!(INDIAN_STATES_AND_UTS as readonly string[]).includes(f.region)) e.region = "Choose a state or union territory.";
  if (!PIN.test(f.postalCode.trim())) e.postalCode = "Enter a 6-digit PIN code.";
  return e;
}
