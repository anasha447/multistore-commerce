// Sign-in through the running storefront and app. Prints statuses only, never secrets.
// The first run changes the seeded admin password and stores the new one in backend/.env.
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const WEB = "http://localhost:3100";
const ENV = fileURLToPath(new URL("../../backend/.env", import.meta.url));
const env = () => Object.fromEntries(readFileSync(ENV, "utf8").split(/\r?\n/).filter((l) => /^\w+=/.test(l)).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
let failures = 0;
const check = (name, ok, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${name} ${detail}`); };

class Browser {
  jar = {};
  async call(method, path, body, headers = {}) {
    const r = await fetch(WEB + path, {
      method, redirect: "manual",
      headers: { "sec-fetch-site": "same-origin", ...(body ? { "content-type": "application/json" } : {}), cookie: Object.entries(this.jar).map(([k, v]) => `${k}=${v}`).join("; "), ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    for (const c of r.headers.getSetCookie()) {
      const [pair] = c.split(";"); const i = pair.indexOf("="); const k = pair.slice(0, i), v = pair.slice(i + 1);
      if (v === "" || /max-age=0/i.test(c)) delete this.jar[k]; else this.jar[k] = v;
      this.lastCookie = c;
    }
    const text = await r.text();
    let json = null; try { json = JSON.parse(text); } catch {}
    return { status: r.status, json, text, location: r.headers.get("location") };
  }
}
const secret = () => randomBytes(18).toString("hex");

// shopper
const b = new Browser(); const email = `shopper-${Date.now()}@example.com`; const password = secret();
let r = await b.call("POST", "/api/session/register", { email, password, firstName: "Asha", lastName: "Rao" });
check("register signs in", r.status === 201 && r.json.autoLogin, r.status);
check("cookies are httpOnly and SameSite", /httponly/i.test(b.lastCookie) && /samesite=lax/i.test(b.lastCookie));
check("no token in the answer", !/eyJ/.test(r.text));
r = await b.call("GET", "/api/bff/api/users/me"); check("me", r.status === 200 && r.json.email === email, r.status);
r = await b.call("GET", "/account"); check("account page", r.status === 200, r.status);
r = await b.call("PUT", "/api/bff/api/users/me", { firstName: "Mira", lastName: "Das", phone: null }); check("profile change", r.status === 200 && r.json.firstName === "Mira", r.status);
r = await b.call("POST", "/api/bff/api/users/me/addresses", { line1: "12 MG Road", city: "Bengaluru", state: "Karnataka", postalCode: "560001", country: "India", type: "HOME", isDefault: true }); check("address added", r.status === 201 && r.json.isDefault, r.status);
r = await b.call("POST", "/api/session/register", { email, password, firstName: "A", lastName: "B" }); check("same email again", r.status === 409 && /Sign in instead/.test(r.json.message), r.status);

// expiry: the access cookie is gone or useless, the refresh cookie remains
let before = b.jar.mt_refresh; b.jar.mt_access = b.jar.mt_access.slice(0, -6) + "AAAAAA";
r = await b.call("GET", "/api/bff/api/users/me"); check("bad access token is refreshed by the BFF", r.status === 200 && b.jar.mt_refresh !== before, r.status);
before = b.jar.mt_refresh; delete b.jar.mt_access;
r = await b.call("GET", "/account"); check("page without access token stays signed in", r.status === 200 && b.jar.mt_refresh !== before, r.status);
r = await b.call("GET", "/api/bff/api/admin/users"); check("shopper is kept out of admin", r.status === 403, r.status);

// logout
const old = { ...b.jar };
r = await b.call("POST", "/api/session/logout"); check("logout clears cookies", r.status < 400 && !b.jar.mt_access, r.status);
b.jar = { mt_refresh: old.mt_refresh };
r = await b.call("GET", "/api/bff/api/users/me"); check("refresh token is dead after logout", r.status === 401, r.status);
b.jar = {};
r = await b.call("POST", "/api/session/login", { email, password: secret() }); check("wrong password", r.status === 401 && r.json.message === "Invalid email or password.", r.status);
r = await b.call("POST", "/api/session/login", { email: email.toUpperCase(), password }); check("sign in, any case", r.status === 200 && r.json.roles.join() === "CUSTOMER", r.status);
r = await b.call("POST", "/api/session/login", { email, password }, { "sec-fetch-site": "cross-site" }); check("cross-site sign-in refused", r.status === 403, r.status);
r = await b.call("GET", "/api/bff/api/auth/login"); check("auth not reachable through the BFF", r.status === 404, r.status);

// first admin: forced password change
const a = new Browser(); const settings = env();
r = await a.call("POST", "/api/session/login", { email: settings.ADMIN_EMAIL, password: settings.ADMIN_PASSWORD });
check("admin signs in", r.status === 200 && r.json.roles.includes("ADMIN"), `${r.status} mustChange=${r.json?.mustChangePassword}`);
if (r.json?.mustChangePassword) {
  r = await a.call("GET", "/api/bff/api/admin/users"); check("closed until the password is changed", r.status === 403, r.status);
  const next = secret();
  r = await a.call("PUT", "/api/bff/api/users/me/password", { currentPassword: settings.ADMIN_PASSWORD, newPassword: next }); check("forced change", r.status === 204, r.status);
  if (r.status === 204) writeFileSync(ENV, readFileSync(ENV, "utf8").replace(/^ADMIN_PASSWORD=.*$/m, `ADMIN_PASSWORD=${next}`), { mode: 0o600 });
  r = await a.call("POST", "/api/session/login", { email: settings.ADMIN_EMAIL, password: next }); check("signs in again", r.status === 200 && !r.json.mustChangePassword, r.status);
}
r = await a.call("GET", "/api/bff/api/admin/users?size=1000"); check("staff list, size 1000", r.status === 200 && r.json.page.size === 1000, r.status);
r = await a.call("GET", "/admin/staff"); check("staff page renders", r.status === 200, r.status);
const m = { email: `manager-${Date.now()}@example.com`, password: secret(), firstName: "Dev", lastName: "Nair" };
r = await a.call("POST", "/api/bff/api/admin/users", m); check("manager created", r.status === 201 && r.json.mustChangePassword, r.status);
const managerId = r.json?.id;
const g = new Browser();
r = await g.call("POST", "/api/session/login", { email: m.email, password: m.password }); check("manager signs in, must change", r.status === 200 && r.json.mustChangePassword, r.status);
r = await a.call("PUT", `/api/bff/api/admin/users/${managerId}/status`, { enabled: false }); check("manager disabled", r.status === 200, r.status);
r = await g.call("GET", "/api/bff/api/users/me"); check("manager is out at once", r.status === 401, r.status);
console.log(failures === 0 ? "ALL OK" : `${failures} FAILED`);
process.exitCode = failures === 0 ? 0 : 1;
