// Proactively refresh the session on page navigations: if the access JWT is expired
// but a refresh token is present, exchange it, set fresh cookies, and rewrite this
// request's Cookie header so the current render is already authenticated. Runs on page
// routes only (the BFF /api/* handles its own refresh). Fails open.
import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  isAccessExpired,
  refreshTokens,
  setAuthCookies,
} from "@/lib/session/cookies";

export async function middleware(req: NextRequest) {
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = req.cookies.get(REFRESH_COOKIE)?.value;

  if (!refresh || !isAccessExpired(access)) return NextResponse.next();

  const tokens = await refreshTokens(refresh);
  if (!tokens) {
    const res = NextResponse.next();
    clearAuthCookies(res);
    return res;
  }

  const pairs = req.cookies.getAll().map((c) =>
    c.name === ACCESS_COOKIE
      ? `${ACCESS_COOKIE}=${tokens.accessToken}`
      : c.name === REFRESH_COOKIE
        ? `${REFRESH_COOKIE}=${tokens.refreshToken}`
        : `${c.name}=${c.value}`,
  );
  if (!req.cookies.get(ACCESS_COOKIE)) pairs.push(`${ACCESS_COOKIE}=${tokens.accessToken}`);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("cookie", pairs.join("; "));

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  return res;
}

export const config = {
  // Page routes only — exclude Next internals, static design assets, and all /api/*.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|design/|api/).*)"],
};
