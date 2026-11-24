// Base URL for the API client. Server Components hit the gateway directly (public
// catalog reads need no auth); the browser routes through the same-origin BFF proxy
// (/api/bff) so the httpOnly session cookie authenticates owner-only calls without
// exposing tokens to client JS.
const GATEWAY = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:9080"
).replace(/\/+$/, "");

// Which store this storefront is. Every gateway call carries it as X-Tenant-ID; the backend
// maps it to that store's own schema (products, users, admins, orders are all per store).
// Deliberately NOT read from the environment: building both apps with the same value would
// silently merge two stores. Each storefront is one store, fixed in its code.
export const STORE_ID = "matessa" as const;
export const STORE_HEADERS = { "X-Tenant-ID": STORE_ID } as const;

export const API_BASE_URL = typeof window === "undefined" ? GATEWAY : "/api/bff";
