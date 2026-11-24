# `lib/` — backend data layer (portable contract)

Typed client for the Matessa backend, hand-written from [`API.md`](../../API.md).
**No UI here** — this is the data/contract layer the visual work consumes.

This layer is deliberately **portable**: it is shared between sibling store frontends by
**copying, not by a shared package** (each store owns its copy; drift between stores is
expected and fine as their backends diverge). This section is the contract for that copy.

## What to copy into a new store frontend

| Portability | Paths | Notes |
|---|---|---|
| **Portable as-is** | `lib/api/**` | config, http transport, errors, query builder, tokenStore, `api` façade, one endpoint module per resource |
| **Portable as-is** | `lib/types/**` | DTOs & enums by domain, barrel-exported |
| **Portable as-is** | `lib/utils/money.ts`, `lib/utils/media.ts` | display helpers |
| **Required companions** | `lib/session/cookies.ts`, `app/api/bff/[...path]/route.ts` | the browser client targets the same-origin `/api/bff` proxy, which holds the httpOnly token cookies and forwards Bearer headers to the gateway |
| **Per-store knobs** | see below | the only things that differ between stores |
| **Not portable** | `lib/server/**`, `lib/stubs/**` | app-coupled server helpers and brand fixture content — rebuild per store |

### Per-store knobs (change these, nothing else)

- **Gateway URL**: `NEXT_PUBLIC_API_BASE_URL` (and optional server-side `API_GATEWAY_URL`)
  in `.env.local`. This store: `http://localhost:9080`. Code fallbacks live in
  `api/config.ts`, `session/cookies.ts`, `utils/media.ts`, `next.config.ts`.
- **Cookie names**: `ACCESS_COOKIE` / `REFRESH_COOKIE` in `session/cookies.ts`
  (this store: `mt_access` / `mt_refresh`) — must be unique per store so two stores
  browsed on localhost don't clobber each other's sessions.
- **Currency/locale**: defaults in `utils/money.ts` (`formatMoney(amount, currency, locale)`;
  note `formatMoneyShort` hardcodes `$`).
- **Dev port**: `package.json` scripts (`next dev -p 3100` here; the original store owns 3000).

### Sync rule

When a backend contract changes, update **that store's** `lib/types` + endpoint module.
Do not try to keep the two stores' copies identical — they serve different backends.

## Usage

```ts
import { api, ApiError, type ProductResponse } from '@/lib/api';

// Public browse (no token)
const page = await api.products.list({ categoryId: 1, page: 0, size: 20 });
const product = await api.products.get(5);

// Authed (token comes from the configured TokenStore)
const cart = await api.cart.get();

// Errors are typed
try {
  await api.orders.checkout(req);
} catch (e) {
  if (e instanceof ApiError && e.isConflict) {
    // 409 — a line went out of stock
  }
}
```

## Layout

| Path | What |
|---|---|
| `api/config.ts` | Gateway base URL (`NEXT_PUBLIC_API_BASE_URL`, default `http://localhost:9080`) |
| `api/http.ts` | fetch transport: auth header, **401→refresh→retry**, JSON, `ApiError` |
| `api/errors.ts` | `ApiError` with `isValidation/isConflict/…` + `fieldErrors` |
| `api/query.ts` | query-string builder |
| `api/tokenStore.ts` | pluggable token storage (in-memory default; swap in the auth phase) |
| `api/endpoints/*` | one module per resource |
| `api/index.ts` | `api` façade + re-exports |
| `types/*` | DTOs & enums by domain |
| `utils/money.ts` | `formatMoney` (display only) |

## Conventions

- **Auth:** authed calls attach `Authorization: Bearer`; a 401 triggers one transparent
  refresh + retry. Tokens are read/written through `TokenStore` — call
  `configureTokenStore()` once the auth UI exists. `api.auth.login/refresh` do **not**
  persist tokens themselves (that's the session layer's job).
- **Money:** server-computed; never do client-side money arithmetic. `formatMoney` is
  display-only.
- **Pagination:** list endpoints take `{ page, size, sort }` and return `Page<T>`.

## Coverage — full API surface

Every endpoint in `API.md` §4 is wrapped:

- **Storefront:** auth · users/me + addresses · categories · products · variants ·
  images · reviews · discounts · coupon validate · cart · orders/checkout · wishlist ·
  contact · subscribers.
- **Staff/admin:** category/product/variant/image CRUD · coupon CRUD · discount CRUD ·
  order management (`listAll`/`updateStatus`/`updateShipping`) · analytics (sales,
  catalog, customers, orders-by-state) · admin users/staff (`createStaff`/`listUsers`/
  `getUser`/`updateUserStatus`) · contact queries.

Auth scope per call is set in each endpoint module (`auth: false` for public reads).
Role enforcement is server-side — gate staff/admin UI on the JWT `roles` claim, but
expect and handle `403`/`404` defensively.
