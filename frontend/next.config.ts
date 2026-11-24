import type { NextConfig } from "next";
import { securityHeaders } from "./lib/security/headers.mjs";

// Server-side gateway base (same resolution as lib/session/cookies.ts).
const GATEWAY =
  process.env.API_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:9080";

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle (.next/standalone) so the app ships as a small
  // Docker image (see frontend/Dockerfile). No effect on `next dev`.
  output: "standalone",
  // CSP, framing, sniffing, referrer and HSTS for every route (lib/security/headers.mjs).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    return [
      // Uploaded product images are stored as relative paths (/media/products/*.webp)
      // and served by commercial-service behind the gateway. The browser only sees the
      // frontend origin (:3100), so proxy /media/* to the gateway — otherwise <img> 404s
      // and shows alt text. Target is env-configurable for prod.
      { source: "/media/:path*", destination: `${GATEWAY}/media/:path*` },
    ];
  },
};

export default nextConfig;
