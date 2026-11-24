import { NextResponse, type NextRequest } from "next/server";
import { GATEWAY, setAuthCookies, STORE_HEADERS } from "@/lib/session/cookies";
import { clientIp, rejectCrossSite } from "@/lib/server/guard";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** POST the login, retrying only transient failures. A 400/401 is a definitive answer
 *  (bad credentials) and returns immediately; a 5xx / timeout / network error (the
 *  gateway breaker tripping while userService warms up) is retried a few times. Returns
 *  the Response, or null if the upstream stayed unreachable. */
async function loginUpstream(email: string, password: string, ipHeader: Record<string, string>): Promise<Response | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`${GATEWAY}/api/auth/login`, {
        method: "POST",
        headers: { ...STORE_HEADERS, ...ipHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      if (r.ok || r.status === 400 || r.status === 401) return r; // definitive
      if (attempt < 2) await sleep(700 * (attempt + 1)); // 5xx → retry
    } catch {
      if (attempt < 2) await sleep(700 * (attempt + 1)); // timeout/network → retry
    }
  }
  return null;
}

/** Exchange email/password for a session: calls the gateway and stores the token pair
 *  in httpOnly cookies. Never returns the tokens to the client. */
export async function POST(req: NextRequest) {
  const blocked = rejectCrossSite(req); // login-CSRF / cross-site form posts
  if (blocked) return blocked;
  const ip = clientIp(req);
  const ipHeader: Record<string, string> = ip ? { "X-Forwarded-For": ip } : {};
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  const upstream = await loginUpstream(email, password, ipHeader);
  if (!upstream) {
    return NextResponse.json(
      { message: "Our servers are busy warming up — please try again in a moment." },
      { status: 503 },
    );
  }

  if (!upstream.ok) {
    const fallback =
      upstream.status === 401 ? "Invalid email or password." : "Couldn't sign you in — please try again.";
    const body = await upstream.json().catch(() => ({ message: fallback }));
    return NextResponse.json(body, { status: upstream.status });
  }

  const tokens = await upstream.json();

  // Fetch the user with the fresh token so the client can route by role
  // (staff → /admin, customer → /account) and enforce a first-login password change.
  // Non-fatal: if it fails, the client falls back to customer routing.
  let roles: string[] = [];
  let mustChangePassword = false;
  try {
    const me = await fetch(`${GATEWAY}/api/users/me`, {
      headers: { ...STORE_HEADERS, Authorization: `Bearer ${tokens.accessToken}` },
      cache: "no-store",
    });
    if (me.ok) {
      const u = await me.json();
      roles = Array.isArray(u.roles) ? u.roles : [];
      mustChangePassword = !!u.mustChangePassword;
    }
  } catch {
    /* ignore — routing falls back to customer default */
  }

  const res = NextResponse.json({ ok: true, roles, mustChangePassword });
  setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
  return res;
}
