import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { GATEWAY, REFRESH_COOKIE, clearAuthCookies, STORE_HEADERS } from "@/lib/session/cookies";
import { clientIp, rejectCrossSite } from "@/lib/server/guard";

/** Revoke the refresh token at the gateway and clear the session cookies. */
export async function POST(req: NextRequest) {
  const blocked = rejectCrossSite(req); // login-CSRF / cross-site form posts
  if (blocked) return blocked;
  const ip = clientIp(req);
  const ipHeader: Record<string, string> = ip ? { "X-Forwarded-For": ip } : {};
  const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (refresh) {
    await fetch(`${GATEWAY}/api/auth/logout`, {
      method: "POST",
      headers: { ...STORE_HEADERS, ...ipHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
      cache: "no-store",
    }).catch(() => {});
  }
  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}
