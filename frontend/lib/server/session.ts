// Server-side session access for Server Components. Reads the httpOnly access cookie
// and calls the gateway with a Bearer header. Returns null when unauthenticated or on
// error so pages can redirect / render a signed-out state.
import { cookies } from "next/headers";
import { ACCESS_COOKIE, GATEWAY, STORE_HEADERS } from "@/lib/session/cookies";
import type { UserResponse } from "@/lib/api";

export async function getAccessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
}

export async function getCurrentUser(): Promise<UserResponse | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const r = await fetch(`${GATEWAY}/api/users/me`, {
      headers: { ...STORE_HEADERS, Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!r.ok) return null;
    return (await r.json()) as UserResponse;
  } catch {
    return null;
  }
}

/** Authed server-side GET for owner-only resources (cart, orders, addresses…). */
export async function serverGet<T>(path: string): Promise<T | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const r = await fetch(`${GATEWAY}${path}`, {
      headers: { ...STORE_HEADERS, Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const text = await r.text();
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}
