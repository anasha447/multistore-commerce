/**
 * A post-login destination is only ever a path on this site.
 *
 * `?next=` arrives from a URL anyone can craft, so `/login?next=https://evil.example` must not
 * send a freshly signed-in shopper off-site (an open redirect that makes phishing links look
 * legitimate). Accepted: "/account", "/checkout?coupon=X". Rejected: absolute URLs,
 * protocol-relative "//host", backslash tricks ("/\host"), and anything that resolves to
 * another origin.
 */
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 512) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\")) return null;
  if (/[\u0000-\u001f\u007f]/.test(raw)) return null;
  try {
    const base = "https://same.origin.invalid";
    const url = new URL(raw, base);
    if (url.origin !== base) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}
