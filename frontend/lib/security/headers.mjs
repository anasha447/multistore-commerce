// Security headers for every response from this storefront (wired in next.config.ts).
//
// CSP notes:
//  - script-src keeps 'unsafe-inline' because Next.js inlines its hydration bootstrap; the
//    stricter nonce-based policy needs per-request middleware and is a later step. Even so,
//    the policy blocks scripts from any other origin, plugins, <base> hijacking and framing.
//  - 'unsafe-eval' and ws: are allowed in development only (React Refresh / HMR).
//  - Fonts are self-hosted by next/font, so no font CDN is needed.
//  - img-src allows https: for the few external images (country flags, avatars).

const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: http://localhost:*" : ""}`,
  "media-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

/** @type {{ key: string, value: string }[]} */
export const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // HSTS only when served over HTTPS in production (the VPS Caddy terminates TLS).
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
];
