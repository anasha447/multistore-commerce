// Request guards shared by the BFF proxy and the session routes. Server-only.
//
// The BFF exists so the browser never holds a token. That only holds if the browser cannot
// use the BFF to reach things it must not: the auth endpoints (which hand back raw tokens),
// actuator, internal service routes, or a different path smuggled in with "..".
import { NextResponse, type NextRequest } from "next/server";

/** Gateway areas the storefront calls from the browser. Anything else is a 404. */
const ALLOWED_BASES = [
  "/api/admin",
  "/api/analytics",
  "/api/cart",
  "/api/categories",
  "/api/contact",
  "/api/coupons",
  "/api/discounts",
  "/api/images",
  "/api/orders",
  "/api/products",
  "/api/reviews",
  "/api/subscribers",
  "/api/users",
  "/api/variants",
  "/api/wishlist",
];

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

/**
 * The gateway path for `/api/bff/<segments>`, or null when the browser must not reach it.
 * Segments arrive already decoded by Next, so an encoded "%2e%2e" or "%2f" shows up here as
 * ".." or a "/" inside a segment — both refused. /api/auth/* (which returns raw tokens),
 * /actuator and /internal are simply not on the list.
 */
export function allowedGatewayPath(segments: string[]): string | null {
  if (segments.length === 0) return null;
  for (const s of segments) {
    if (s === "" || s === "." || s === ".." || s.includes("/") || s.includes("\\") || CONTROL_CHARS.test(s)) {
      return null;
    }
  }
  const path = "/" + segments.join("/");
  return ALLOWED_BASES.some((base) => path === base || path.startsWith(base + "/")) ? path : null;
}

/**
 * Cross-site request check for anything that changes state. SameSite=Lax cookies stop most
 * cross-site POSTs from carrying the session, but not all (top-level form posts, and a
 * login-CSRF needs no session at all). A same-origin fetch from our own pages always sends
 * Sec-Fetch-Site: same-origin (or an Origin equal to our host); a form on another site cannot
 * fake either. JSON/multipart only: text/plain and urlencoded are what cross-site forms send.
 */
export function rejectCrossSite(req: NextRequest): NextResponse | null {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return null;

  const site = req.headers.get("sec-fetch-site");
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const sameSite =
    site === "same-origin" || (site === null && origin !== null && host !== null && hostOf(origin) === host);
  if (!sameSite) {
    return NextResponse.json({ status: 403, error: "Forbidden", message: "Cross-site request refused." }, { status: 403 });
  }

  const type = (req.headers.get("content-type") ?? "").toLowerCase();
  if (type !== "" && !type.startsWith("application/json") && !type.startsWith("multipart/form-data")) {
    return NextResponse.json({ status: 415, error: "Unsupported Media Type", message: "Send JSON." }, { status: 415 });
  }
  return null;
}

function hostOf(origin: string): string | null {
  try {
    return new URL(origin).host;
  } catch {
    return null;
  }
}

/**
 * The client address to hand the gateway for rate limiting. Only Caddy (the reverse proxy in
 * front of this app on the VPS) sets X-Real-IP, and it overwrites whatever the client sent.
 * A browser-supplied X-Forwarded-For is never passed on: it would let a caller pick a fresh
 * rate-limit bucket on every request. With no proxy in front (local dev) nothing is
 * forwarded and the gateway sees this container's address.
 */
export function clientIp(req: NextRequest): string | null {
  // Believed only when this app is known to sit behind Caddy (docker-compose.prod.yml sets it);
  // without a proxy in front, any caller could set the header themselves.
  if (process.env.TRUST_PROXY_IP_HEADER !== "true") return null;
  const real = req.headers.get("x-real-ip");
  if (!real) return null;
  const ip = real.trim();
  return /^[0-9a-fA-F:.]{2,45}$/.test(ip) ? ip : null;
}
