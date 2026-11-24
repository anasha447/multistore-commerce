// Money is sent as 2-dp JSON numbers (server-side BigDecimal). Per API.md §3 we never
// do money arithmetic on the client — totals always come from the server. This helper
// is display-only.
// Matessa brand rule (BRAND.md §6): ₹ always, no decimals shown — ₹499, never ₹499.00.
export function formatMoney(amount: number, currency = 'INR', locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Compact money for chart axes / tight labels, e.g. ₹1.2k, ₹34L. */
export function formatMoneyShort(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`;
  if (abs >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`;
  if (abs >= 1_000) return `₹${(amount / 1_000).toFixed(1)}k`;
  return `₹${Math.round(amount)}`;
}
