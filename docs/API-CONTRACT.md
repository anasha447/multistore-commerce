# API contract

91 endpoints, frozen for v1. Extracted from the old backend's source and checked against what both storefronts call.
Exact fields and validation are in `CONTRACT-DTOS.md`.

## 1. Conventions every endpoint follows

- Base path and port: the app listens on `8080`; the storefront calls it through `API_GATEWAY_URL`.
- JSON, UTF-8. Dates are ISO-8601 UTC. Money is a JSON number with two decimals.
- `X-Tenant-ID` is required on `/api/**` and must equal this app's `STORE_ID`. Otherwise `400`. Not required on `/media/**`.
- `Authorization: Bearer <access token>`. A missing or bad token on a protected path is `401`. A valid token without the role,
  or from another store, is `403`. Someone else's resource is `404`.
- An invalid or expired bearer token is `401` **even on a public path**, as the old gateway did. The BFF relies on that answer to refresh the session and retry. No token at all on a public path is fine.
- Pages: `?page=0&size=20&sort=field,dir`. Answer: `{ "content": [], "page": { "size", "number", "totalElements", "totalPages" } }`.
  **Page size must allow 1000**: the admin dashboard and staff page ask for `size=1000`. Keep the maximum at 2000. Unknown sort fields answer `400`.
- **Ids are opaque.** JSON numbers of 16 digits, random, inside JavaScript's safe integers. Never derive meaning or order from them.
- Lists without a `sort` come in creation order (oldest first), as the old system effectively did; orders, contact queries and subscribers come newest first.
- Success codes are in the tables. `DELETE` and logout answer `204` with no body.
- Error body: `timestamp, status, error, message, path`, plus `fieldErrors` (validation) and `code` (when the client must react). Null ones are omitted.

| Status | When |
|---|---|
| 400 | validation, empty cart, illegal order status move, wrong current password, bad store header |
| 401 | no or expired token, wrong login (a locked account answers the same) |
| 403 | role missing, token of another store |
| 404 | missing, or not yours |
| 409 | duplicate slug, code, email or review; out of stock; coupon not applicable; concurrent edit; already cancelled or shipped; `REQUEST_IN_PROGRESS` |
| 413, 415 | upload too large, wrong content type |
| 422 | `IDEMPOTENCY_KEY_REUSED` |
| 429 | rate limit, with `Retry-After` |
| 503 | database unavailable, or the whole-store limit |

## 2. Access words

| Word | Meaning |
|---|---|
| public | no token needed |
| customer | any signed-in account |
| self | signed in; only ever touches the caller's own data |
| owner | signed in and owns the resource, else 404 |
| owner or staff | owner, or MANAGER or ADMIN |
| staff | MANAGER or ADMIN |
| admin | ADMIN only |

An account whose password must be changed gets a token without roles: it can read `/api/users/me` and change its password, nothing staff-only.

## 3. Endpoints

"Read from" is the cache lifetime (`CACHING.md`); "live" means Postgres every time. "Limit" names a rule in `SECURITY.md`.

### identity (15)

| Method | Path | Access | Returns | Status | Read from | Limit |
|---|---|---|---|---|---|---|
| GET | `/api/users/me/addresses` | self | `Page<AddressResponse>` | 200 | 5 min, per user |  |
| POST | `/api/users/me/addresses` | self | `AddressResponse` | 201 |  |  |
| PUT | `/api/users/me/addresses/{id}` | self | `AddressResponse` | 200 |  |  |
| DELETE | `/api/users/me/addresses/{id}` | self | `void` | 204 |  |  |
| POST | `/api/admin/users` | admin | `AdminUserResponse` | 201 |  |  |
| GET | `/api/admin/users` | admin | `Page<AdminUserResponse>` | 200 | live |  |
| GET | `/api/admin/users/{id}` | admin | `AdminUserResponse` | 200 | live |  |
| PUT | `/api/admin/users/{id}/status` | admin | `AdminUserResponse` | 200 |  |  |
| POST | `/api/auth/register` | public | `UserResponse` | 201 |  | register |
| POST | `/api/auth/login` | public | `TokenResponse` | 200 |  | login |
| POST | `/api/auth/refresh` | public | `TokenResponse` | 200 |  | refresh |
| POST | `/api/auth/logout` | public | `void` | 204 |  |  |
| GET | `/api/users/me` | self | `UserResponse` | 200 | 5 min, per user |  |
| PUT | `/api/users/me` | self | `UserResponse` | 200 |  |  |
| PUT | `/api/users/me/password` | self | `void` | 204 |  | password |

### catalog (23)

| Method | Path | Access | Returns | Status | Read from | Limit |
|---|---|---|---|---|---|---|
| GET | `/api/categories` | public | `List<CategoryResponse>` | 200 | 1 h |  |
| GET | `/api/categories/tree` | public | `List<CategoryResponse>` | 200 | 1 h |  |
| GET | `/api/categories/{id}` | public | `CategoryResponse` | 200 | 1 h |  |
| GET | `/api/categories/{id}/children` | public | `List<CategoryResponse>` | 200 | 1 h |  |
| POST | `/api/categories` | staff | `CategoryResponse` | 201 |  |  |
| PUT | `/api/categories/{id}` | staff | `CategoryResponse` | 200 |  |  |
| DELETE | `/api/categories/{id}` | staff | `void` | 204 |  |  |
| GET | `/api/products` | public | `Page<ProductResponse>` | 200 | 10 min |  |
| GET | `/api/products/{id}` | public | `ProductResponse` | 200 | 10 min |  |
| GET | `/api/products/slug/{slug}` | public | `ProductResponse` | 200 | 10 min |  |
| POST | `/api/products` | staff | `ProductResponse` | 201 |  |  |
| PUT | `/api/products/{id}` | staff | `ProductResponse` | 200 |  |  |
| DELETE | `/api/products/{id}` | staff | `void` | 204 |  |  |
| GET | `/api/products/{productId}/images` | public | `List<ProductImageResponse>` | 200 | 10 min |  |
| POST | `/api/products/{productId}/images` | staff | `ProductImageResponse` | 201 |  |  |
| POST | `/api/products/{productId}/images/upload` | staff | `ProductImageResponse` | 201 |  | upload |
| PUT | `/api/images/{imageId}` | staff | `ProductImageResponse` | 200 |  |  |
| DELETE | `/api/images/{imageId}` | staff | `void` | 204 |  |  |
| GET | `/api/products/{productId}/variants` | public | `List<ProductVariantResponse>` | 200 | 10 min + stock 30 s |  |
| POST | `/api/products/{productId}/variants` | staff | `ProductVariantResponse` | 201 |  |  |
| GET | `/api/variants/{id}` | public | `VariantPriceStockResponse` | 200 | 10 min + stock 30 s |  |
| PUT | `/api/variants/{id}` | staff | `ProductVariantResponse` | 200 |  |  |
| DELETE | `/api/variants/{id}` | staff | `void` | 204 |  |  |

### media (1)

| Method | Path | Access | Returns | Status | Read from | Limit |
|---|---|---|---|---|---|---|
| GET | `/media/{store}/{32 hex}.webp` | public | `ResponseEntity<byte[]>` | 200 | edge 1 y |  |

### promotions (11)

| Method | Path | Access | Returns | Status | Read from | Limit |
|---|---|---|---|---|---|---|
| GET | `/api/coupons` | staff | `Page<CouponResponse>` | 200 | live |  |
| GET | `/api/coupons/{id}` | staff | `CouponResponse` | 200 | live |  |
| POST | `/api/coupons` | staff | `CouponResponse` | 201 |  |  |
| PUT | `/api/coupons/{id}` | staff | `CouponResponse` | 200 |  |  |
| DELETE | `/api/coupons/{id}` | staff | `void` | 204 |  |  |
| POST | `/api/coupons/validate` | public | `CouponValidationResponse` | 200 |  | coupon |
| GET | `/api/products/{productId}/discounts` | public | `List<DiscountResponse>` | 200 | 10 min |  |
| GET | `/api/discounts/{id}` | public | `DiscountResponse` | 200 | 10 min |  |
| POST | `/api/discounts` | staff | `DiscountResponse` | 201 |  |  |
| PUT | `/api/discounts/{id}` | staff | `DiscountResponse` | 200 |  |  |
| DELETE | `/api/discounts/{id}` | staff | `void` | 204 |  |  |

### engagement (13)

| Method | Path | Access | Returns | Status | Read from | Limit |
|---|---|---|---|---|---|---|
| POST | `/api/contact` | public | `ContactQueryResponse` | 201 |  | form |
| GET | `/api/contact` | staff | `Page<ContactQueryResponse>` | 200 | live |  |
| PATCH | `/api/contact/{id}/status` | staff | `ContactQueryResponse` | 200 |  |  |
| GET | `/api/products/{productId}/reviews` | public | `Page<ReviewResponse>` | 200 | 5 min |  |
| GET | `/api/products/{productId}/reviews/summary` | public | `ReviewSummaryResponse` | 200 | 5 min |  |
| POST | `/api/products/{productId}/reviews` | customer | `ReviewResponse` | 201 |  | review |
| PUT | `/api/reviews/{reviewId}` | owner | `ReviewResponse` | 200 |  |  |
| DELETE | `/api/reviews/{reviewId}` | owner or staff | `void` | 204 |  |  |
| POST | `/api/subscribers` | public | `SubscribeResponse` | 201 |  | form |
| GET | `/api/subscribers` | staff | `Page<SubscriberResponse>` | 200 | live |  |
| GET | `/api/wishlist` | self | `WishlistResponse` | 200 | 10 min, per user |  |
| POST | `/api/wishlist/items` | self | `WishlistItemResponse` | 201 |  |  |
| DELETE | `/api/wishlist/items/{itemId}` | self | `void` | 204 |  |  |

### cart (6)

| Method | Path | Access | Returns | Status | Read from | Limit |
|---|---|---|---|---|---|---|
| GET | `/api/cart` | self | `CartResponse` | 200 | 10 min, per user |  |
| POST | `/api/cart/price` | public | `CartResponse` | 200 |  | price |
| POST | `/api/cart/items` | self | `CartResponse` | 201 |  |  |
| PUT | `/api/cart/items/{itemId}` | self | `CartResponse` | 200 |  |  |
| DELETE | `/api/cart/items/{itemId}` | self | `void` | 204 |  |  |
| DELETE | `/api/cart` | self | `void` | 204 |  |  |

### orders (12)

| Method | Path | Access | Returns | Status | Read from | Limit |
|---|---|---|---|---|---|---|
| POST | `/api/orders` | self | `OrderResponse` | 201 |  | checkout |
| POST | `/api/orders/guest` | public | `OrderResponse` | 201 |  | checkout |
| GET | `/api/orders/payment-methods` | public | `Map<String, List<PaymentMethod>>` | 200 | memory |  |
| GET | `/api/orders/track` | public | `OrderResponse` | 200 | live | track |
| GET | `/api/orders` | self | `Page<OrderSummaryResponse>` | 200 | live |  |
| GET | `/api/orders/{id}` | owner or staff | `OrderResponse` | 200 | live |  |
| GET | `/api/orders/by-number/{orderNumber}` | owner or staff | `OrderResponse` | 200 | live |  |
| POST | `/api/orders/{id}/cancel` | owner or staff | `OrderResponse` | 200 |  |  |
| GET | `/api/orders/{id}/history` | owner or staff | `List<OrderStatusHistoryResponse>` | 200 | live |  |
| GET | `/api/orders/admin` | staff | `Page<OrderSummaryResponse>` | 200 | live |  |
| PUT | `/api/orders/{id}/status` | staff | `OrderResponse` | 200 |  |  |
| PUT | `/api/orders/{id}/shipping` | staff | `OrderResponse` | 200 |  |  |

### analytics (10)

| Method | Path | Access | Returns | Status | Read from | Limit |
|---|---|---|---|---|---|---|
| GET | `/api/analytics/catalog` | staff | `CatalogAnalyticsResponse` | 200 | 60 s |  |
| GET | `/api/analytics/catalog/low-stock` | staff | `List<LowStockItemResponse>` | 200 | 60 s |  |
| GET | `/api/analytics/catalog/top-rated` | staff | `List<TopRatedProductResponse>` | 200 | 60 s |  |
| GET | `/api/analytics/catalog/most-wishlisted` | staff | `List<MostWishlistedResponse>` | 200 | 60 s |  |
| GET | `/api/analytics/sales` | staff | `SalesAnalyticsResponse` | 200 | 60 s |  |
| GET | `/api/analytics/sales/revenue-trend` | staff | `List<RevenueTrendPoint>` | 200 | 60 s |  |
| GET | `/api/analytics/sales/top-products` | staff | `List<TopProductResponse>` | 200 | 60 s |  |
| GET | `/api/analytics/sales/top-customers` | staff | `List<TopCustomerResponse>` | 200 | 60 s |  |
| GET | `/api/analytics/sales/orders-by-state` | staff | `List<StateOrderCountResponse>` | 200 | 60 s |  |
| GET | `/api/analytics/customers` | admin | `CustomerAnalyticsResponse` | 200 | 60 s |  |

## 4. Behaviour that the types do not show

More rules and the exact messages are in `BUSINESS-RULES.md`; what the storefronts send is in `STOREFRONT-INTEGRATION.md`.

**Identity**
- Emails are trimmed and lower-cased on every write and lookup. Register with a known email is `409`.
- Login answers `{ accessToken, refreshToken, tokenType: "Bearer", expiresIn: 900 }`. The storefront reads `exp` from the token payload.
- Refresh rotates the token. Reusing an old one revokes its whole family, except within 10 s (two tabs).
- Logout revokes every refresh token of that sign-in and answers `204` even if the token is unknown.
- `POST /api/admin/users` creates a MANAGER with `mustChangePassword = true`. An admin cannot change their own status (`409`).
- Disabling an account revokes its refresh tokens and denies its access token at once.
- Changing the password revokes all refresh tokens; the storefront signs in again.
- The JSON name of the default-address flag is `isDefault`.

**Catalog**
- `GET /api/products` lists active products; `categoryId` filters exactly that category, not its children.
- `GET /api/products/{id}` and `/slug/{slug}` answer inactive products too, with `active: false`. Keep it: old order pages link to them.
- `GET /api/products/{id}/variants` lists active variants, including an active default variant, in creation order, with `listPrice` and `effectivePrice`.
- `GET /api/variants/{id}`: `available` is true when product and variant are active. It does **not** depend on stock.
- SKUs are generated, never taken from the request, and never change. `DELETE` on the default variant is `400`.
- `stockQuantity` in the product request matters only on create.
- Saving a product, variant or category makes it active again.
- Image upload: multipart field `file`, at most 8 MB and 4096 px per side, any readable format, stored as WebP. Path: `/media/<store>/<32 hex>.webp`.
- An image `url` must be one of this store's `/media` paths or `https://`.

**Promotions**
- Exactly one of `productId` and `categoryId` on a discount, else `400`. Percentages at most 100. End after start.
- Deleting a coupon deactivates it. Deleting a discount removes it.
- Validate answers `200` with `valid: false` and a message for bad codes, not an error status.

**Engagement**
- One review per account per product (`409` on the second). Summary average has two decimals.
- A repeat newsletter sign-up answers `201` with `couponCode: null` and a message: never reveal an existing code.
- Contact form and newsletter work for guests.

**Cart and orders**
- `GET /api/cart` creates an empty cart if none exists. Adding an existing variant adds to its quantity.
- Adding an unavailable variant is `400`; an unavailable line already in the cart is shown with `available: false` and left out of the subtotal.
- In `POST /api/cart/price`, `cartId` and `userId` are null and a line's `id` is its variant id.
- `shippingAddress` in `OrderResponse` is a **string containing JSON**. The storefront parses it.
- `GET /api/orders/payment-methods` answers `{ "methods": ["COD"] }` in production.
- Tracking needs `number` and `email` and finds guest orders only.
- `shippingMethod` is free text, at most 64 characters.

**Analytics**
- Formulas are in `BUSINESS-RULES.md`, section 6. Money figures count orders with payment `COMPLETED`; orders by state count every order except cancelled ones.

## 5. Who calls what

Both storefronts have client code for everything above, except that Adventure has none for `/api/analytics/sales/orders-by-state`.
Browser calls go through `/api/bff/...`; login, register and logout through `/api/session/...`; public catalog reads come
from the storefront's server. The client address arrives in `X-Forwarded-For` for browser calls, but **not** for
token refresh or server-rendered reads.

## 6. Phase 2 additions (not in v1)

Password reset, email verification, Turnstile token on forms, Razorpay webhook and order creation, `expectedStock` on
variant edits, batch order export for the dashboard instead of `size=1000`, shipping and tax fields, returns.
