# How the storefronts use the backend

What the two frozen Next.js storefronts expect, so the new backend fits without a change on their side.

## 1. Two storefronts

| | Matessa | Adventure |
|---|---|---|
| Folder in the storefront repository | `frontend` | `second-frontend` |
| `X-Tenant-ID` it always sends (fixed in its code) | `matessa` | `adventure` |
| Cookies | `mt_access`, `mt_refresh` | `ad_access`, `ad_refresh` |
| Port in its container | 3100 | 3000 |
| API address in development when nothing is set | `http://localhost:9080` | `http://localhost:9080` |

## 2. Settings they read

| Setting | Used by | Value in production |
|---|---|---|
| `API_GATEWAY_URL` | sign-in routes, BFF, middleware, signed-in server pages | `http://<store>-app:8080` |
| `NEXT_PUBLIC_API_BASE_URL` | server-side public catalog reads; must be set too, or they go to `localhost:9080` | same. Not secret: it may end up in browser files |
| `TRUST_PROXY_IP_HEADER` | passing the shopper's address on | `true`, because Caddy sets `X-Real-IP` |

`/media/*` is forwarded by a Next.js rewrite whose target is fixed **when the image is built**. The build gives no address, so let Caddy
send `/media/*` to the app instead (`DEPLOYMENT.md`).

## 3. Three ways in

| Path | Who calls the backend | Sends |
|---|---|---|
| Browser to `/api/bff/<path>` | the BFF, server side | method, body bytes, `Content-Type`, `X-Tenant-ID`, `Authorization` from the cookie, `Idempotency-Key`, `X-Forwarded-For` |
| Browser to `/api/session/login`, `register`, `logout` | the sign-in routes | `X-Tenant-ID`, `X-Forwarded-For`, JSON |
| A page rendered on the server | server components, middleware | `X-Tenant-ID`, and `Authorization` for own data. **No** `X-Forwarded-For` |

**BFF allow-list:** `/api/admin`, `analytics`, `cart`, `categories`, `contact`, `coupons`, `discounts`, `images`, `orders`, `products`, `reviews`,
`subscribers`, `users`, `variants`, `wishlist`. Never `/api/auth`. It also refuses cross-site writes and any body type other than JSON or multipart.
A new endpoint outside these areas cannot be called by the browser without a storefront change.

## 4. Sign-in and session

1. Login route posts `{email, password}` to `/api/auth/login` (15 s limit; repeats up to 3 times on a network error or any answer other than 2xx, 400 or 401. So 429 is repeated too: keep the login limit above 3 a minute).
2. It then reads `/api/users/me` with the new token for `roles` and `mustChangePassword`, and sends staff to `/admin`, others to `/account`.
3. Tokens go into httpOnly, SameSite=Lax cookies, Secure in production, for 7 days. Browser scripts never see them.
4. Expiry: the middleware decodes `exp` from the token without checking the signature. So the access token **must be a JWT with a numeric `exp`**, and the payload must be base64url JSON.
5. When it is expired, the middleware (page loads) or the BFF (on 401) posts `{refreshToken}` to `/api/auth/refresh` and expects `accessToken` and `refreshToken` back.
6. If refresh answers anything but success, the middleware **clears both cookies: the shopper is signed out.** Never limit refresh by address (they all come from one container), and don't answer 5xx lightly.
7. Register route: registers, then logs in. Logout route: posts the refresh token, ignores the result, clears cookies.

The BFF repeats a call after refreshing **only on 401**. So an expired token must answer 401, also on public paths, never 403.

## 5. Checkout page

- One idempotency key per visit, up to 80 characters, sent as `Idempotency-Key`; 20 s limit, then "check your orders".
- Shows only the methods from `GET /api/orders/payment-methods`.
- What Matessa's page does with each failure:

| Answer | Page says | Key |
|---|---|---|
| `code` `REQUEST_IN_PROGRESS` | still being placed, check your orders | stays locked |
| `code` `IDEMPOTENCY_KEY_REUSED` | check your orders before trying again | stays locked |
| other 409 | the basket changed; prices and stock are fetched again | free |
| 401, 429, 503 | sign in again, wait, try later | free |
| anything else | the backend's `message` | free |
| no answer in 20 s | may have gone through; trying again is safe | stays locked |

- **Rule for the backend:** any answer other than the two codes tells the page "there is definitely no order", and the key may then move to a changed
  basket. So if the result of the commit is **unknown** (connection lost while committing), answer 409 `REQUEST_IN_PROGRESS`, never 500 or 503.
- `fieldErrors` keys are paths such as `shippingAddress.postalCode`. Matessa validates in the page first and shows only `message` from the server. Keep the paths anyway.
- Sends `shippingMethod: "Standard"`.
- Matessa checks Indian mobile numbers and PIN codes in the page; the backend stays general.
- The guest basket lives in the browser and is priced through `POST /api/cart/price`. It keeps variant ids, so ids must never change.
- After success it goes to `/order-confirmed?number=...` (Matessa).

## 6. What it calls heavily (cache these first)

| Page | Calls |
|---|---|
| every page, signed in | `GET /api/users/me` |
| shop, Adventure home | categories, the product list, and images **per product card**; Adventure home also one product list per category (`size=1`, for the count). Cards show `basePrice` |
| product | by slug, variants, images, reviews, summary; signed in on Matessa also `GET /api/orders?size=100` and **one order detail per delivered order**, to decide whether the shopper may review |
| search | `GET /api/products?size=100`, filtered in the page |
| admin home | sales, trend, top lists, catalog, `GET /api/orders/admin?size=1000&sort=createdAt,desc`, coupons, staff lists with `size=1000` |

A list of eight cards is at least ten backend reads for one visitor. Without the cache each is at least one database round trip.

## 7. Ids

Everything is a JavaScript number. Admin pages convert the id in the address with `Number(...)`, and `/shop?category=` accepts digits only.
Ids must therefore be whole numbers up to 9,007,199,254,740,991. Admin screens print customer ids ("Customer #...").
No page sorts by id.

## 8. Security the storefronts already have

Content-Security-Policy with scripts only from the own origin, no framing, nosniff, strict referrer, HSTS in production, `connect-src 'self'`.
Consequences: Turnstile, Razorpay or any outside script needs a storefront change in phase 2; the browser can never call the backend directly.

## 9. Both storefronts must keep working: check

- [ ] Sign up, sign in, wait for expiry, keep browsing, sign out
- [ ] Product images show
- [ ] Guest and signed-in checkout, double click, retry
- [ ] Admin: product with upload, variants, coupon, discount, order steps, staff, forced password change
- [ ] A shopper's token from one store is refused by the other
