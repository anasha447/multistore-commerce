// Limits by visitor address through the running storefront, with the address set as Caddy sets it.
// Start the storefront with TRUST_PROXY_IP_HEADER=true and the app with TRUSTED_CALLER=localhost.
import { randomBytes } from "node:crypto";

const WEB = "http://localhost:3100";
let failures = 0;
const check = (name, ok, detail = "") => { if (!ok) failures++; console.log(`${ok ? "ok  " : "FAIL"} ${name} ${detail}`); };
const secret = () => randomBytes(16).toString("hex");
const address = () => `198.51.${Math.floor(Math.random() * 256)}.${1 + Math.floor(Math.random() * 254)}`;
const email = () => `limit-${secret()}@example.com`;

async function post(path, body, ip, more = {}) {
  const r = await fetch(WEB + path, {
    method: "POST",
    headers: { "sec-fetch-site": "same-origin", "content-type": "application/json", ...(ip ? { "x-real-ip": ip } : {}), ...more },
    body: JSON.stringify(body),
  });
  const json = await r.json().catch(() => null);
  return { status: r.status, json };
}
const register = (ip, more) => post("/api/session/register", { email: email(), password: secret(), firstName: "A", lastName: "B" }, ip, more);
const login = (ip) => post("/api/session/login", { email: email(), password: secret() }, ip);

const here = address();
const made = [];
for (let i = 0; i < 5; i++) made.push((await register(here)).status);
check("five accounts from one address", made.every((s) => s === 201), made.join(","));
let r = await register(here);
check("the sixth is refused", r.status === 429, `${r.status} ${r.json?.message ?? ""}`);
r = await register(here, { "x-forwarded-for": address() });
check("an address claimed by the browser is ignored", r.status === 429, r.status);
r = await register(address());
check("another address is not affected", r.status === 201, r.status);

const there = address();
const tried = [];
for (let i = 0; i < 20; i++) tried.push((await login(there)).status);
check("twenty sign-ins from one address", tried.every((s) => s === 401), [...new Set(tried)].join(","));
r = await login(there);
check("the next one is refused", r.status !== 401 && r.status >= 400, `${r.status} ${r.json?.message ?? ""}`);
r = await login(address());
check("sign-in from another address works on", r.status === 401, r.status);

const pages = await Promise.all(Array.from({ length: 40 }, () => fetch(WEB + "/shop").then((x) => x.status)));
check("pages the storefront renders are not limited", pages.every((s) => s === 200), [...new Set(pages)].join(","));
console.log(failures === 0 ? "ALL OK" : `${failures} FAILED`);
process.exitCode = failures === 0 ? 0 : 1;
