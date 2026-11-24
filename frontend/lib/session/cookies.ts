// Server-only session cookie helpers. The access/refresh tokens live in httpOnly
// cookies on the Next origin — never exposed to client JS. The BFF proxy and route
// handlers read them and talk to the gateway with a Bearer header.
import type { NextResponse } from "next/server";
import { STORE_HEADERS } from "@/lib/api/config";

export { STORE_HEADERS };

export const GATEWAY = (
  process.env.API_GATEWAY_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:9080"
).replace(/\/+$/, "");

export const ACCESS_COOKIE = "mt_access";
export const REFRESH_COOKIE = "mt_refresh";

const WEEK = 60 * 60 * 24 * 7;

const baseOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

/** Both cookies persist for a week; the access JWT itself expires sooner and is
 *  refreshed by the middleware / BFF as needed. */
export function setAuthCookies(res: NextResponse, accessToken: string, refreshToken: string): void {
  res.cookies.set(ACCESS_COOKIE, accessToken, { ...baseOptions, maxAge: WEEK });
  res.cookies.set(REFRESH_COOKIE, refreshToken, { ...baseOptions, maxAge: WEEK });
}

export function clearAuthCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, "", { ...baseOptions, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...baseOptions, maxAge: 0 });
}

/** True if the JWT is missing, unparseable, or within 10s of expiry. */
export function isAccessExpired(jwt: string | undefined): boolean {
  if (!jwt) return true;
  try {
    const payload = JSON.parse(Buffer.from(jwt.split(".")[1], "base64").toString());
    return typeof payload.exp !== "number" || payload.exp * 1000 < Date.now() + 10_000;
  } catch {
    return true;
  }
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Exchange a refresh token for a fresh pair via the gateway. Null if refresh fails. */
export async function refreshTokens(refreshToken: string): Promise<TokenPair | null> {
  try {
    const r = await fetch(`${GATEWAY}/api/auth/refresh`, {
      method: "POST",
      headers: { ...STORE_HEADERS, "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    if (!r.ok) return null;
    const t = await r.json();
    return { accessToken: t.accessToken, refreshToken: t.refreshToken };
  } catch {
    return null;
  }
}
