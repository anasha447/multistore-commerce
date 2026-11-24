import { NextResponse, type NextRequest } from "next/server";
import { GATEWAY, setAuthCookies, STORE_HEADERS } from "@/lib/session/cookies";
import { clientIp, rejectCrossSite } from "@/lib/server/guard";

/** Register a CUSTOMER, then log them straight in (sets session cookies). */
export async function POST(req: NextRequest) {
  const blocked = rejectCrossSite(req); // login-CSRF / cross-site form posts
  if (blocked) return blocked;
  const ip = clientIp(req);
  const ipHeader: Record<string, string> = ip ? { "X-Forwarded-For": ip } : {};
  const body = await req.json().catch(() => ({}));
  const { email, password, firstName, lastName } = body;
  if (!email || !password || !firstName || !lastName) {
    return NextResponse.json({ message: "All fields are required." }, { status: 400 });
  }

  const reg = await fetch(`${GATEWAY}/api/auth/register`, {
    method: "POST",
    headers: { ...STORE_HEADERS, ...ipHeader, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, firstName, lastName, phone: body.phone ?? null }),
    cache: "no-store",
  });
  if (!reg.ok) {
    const err = await reg.json().catch(() => ({ message: "Registration failed." }));
    return NextResponse.json(err, { status: reg.status });
  }

  // Auto-login the new account.
  const login = await fetch(`${GATEWAY}/api/auth/login`, {
    method: "POST",
    headers: { ...STORE_HEADERS, ...ipHeader, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });
  if (!login.ok) {
    // Account was created but auto-login failed — let the client send them to sign in.
    return NextResponse.json({ ok: true, autoLogin: false }, { status: 201 });
  }

  const tokens = await login.json();
  const res = NextResponse.json({ ok: true, autoLogin: true }, { status: 201 });
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  return res;
}
