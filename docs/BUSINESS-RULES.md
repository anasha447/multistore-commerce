# Business rules

The rules of the old system that are not visible in the endpoint list, written so the new backend can be built without reading
the old code. Prices, checkout, orders, coupons and stock are in `CHECKOUT-AND-ORDERS.md`.

Messages in quotes are shown to people by the storefronts. Keep their wording.

## 1. Accounts

| Action | Rule |
|---|---|
| Email | trimmed and lower-cased before every write and lookup |
| Register | role CUSTOMER, enabled. Known email: 409 "An account with this email already exists. Sign in instead." The storefront signs the new account in right away with a second call |
| Login | any failure (unknown email, wrong password, locked, disabled): 401 with one and the same message. Unknown email still runs a BCrypt comparison |
| Lock | 5 wrong passwords: locked for 15 minutes and the counter goes back to 0. A locked account is refused even with the right password, and attempts while locked don't extend the lock. Success clears counter and lock |
| Failure counter | must be saved although the request fails: the transaction may not roll back on this error |
| Refresh | single use. Unknown: 401 "Invalid refresh token". Expired or used: 401 "Refresh token expired or revoked". Disabled account: 401 |
| Reuse | a used token shown again later than 10 s after its exchange revokes **every** token of that sign-in (its family). Within 10 s it is just 401, so two tabs refreshing together don't end the session |
| Logout | revokes the **whole family** of the given token; 204 even when the token is unknown |
| Change password | wrong current password: 400 "Current password is incorrect". Success clears the must-change flag and revokes all refresh tokens |
| Create staff (admin) | role MANAGER, must change password. Known email: 409 "An account with this email already exists." |
| Change status (admin) | own account: 409 "You cannot change the status of your own account". Disabling revokes refresh tokens and denies the access token at once |
| List users (admin) | filters `role` and `enabled`, both optional; users with several roles appear once |
| Addresses | at most one default per account; setting one clears the other. Someone else's address: 404 |
| First admin | created at first start from settings, roles ADMIN and MANAGER |

Refresh token: 32 random bytes, base64url without padding; only its SHA-256 hex is stored.

## 2. Catalog

**Categories**
- Tree of any depth. Lists are active only, ordered by `displayOrder`, then name.
- `GET /api/categories`: top level, with empty `children`. `/tree`: nested. `/{id}/children`: one level. `/{id}`: also finds inactive ones.
- Slug unique: 409 "Category slug already exists: ...". Parent must exist (400 "Parent category not found: ...") and not be itself (400 "A category cannot be its own parent"). New: refuse longer loops too.
- Saving a category makes it active again. Delete sets it inactive.

**Products**
- Slug unique: 409 "Product slug already exists: ...". Category must exist: 400 "Category not found: ...".
- Create also creates the default variant with a generated SKU and the given `stockQuantity` (0 if missing).
- Saving a product makes it active again. Delete sets it inactive. List shows active ones only; reads by id or slug also show inactive ones.

**Variants**
- List: active only, in creation order.
- Create: generated SKU; deactivates the default variant if it was active.
- Update: SKU never changes; the default variant keeps size and colour empty; saving makes it active.
- Delete: inactive. On the default variant: 400 "This is the product's own stock; set it to 0 instead, or delete the product." Removing the last real variant reactivates the default variant with stock 0, creating it if missing.
- `listPrice` = override or base price. `effectivePrice` = after the best discount.

**SKU**
1. Product code: initials of the words, upper case, at most 4, when there are at least two words (VENOM ATLAS HELMET gives VAH); otherwise the first 4 letters or digits; `SKU` if the name has none.
2. Then `-` and the colour's first 3 letters or digits if there is a colour; then `-` and the size's first 3 if there is a size. Upper case.
3. Then `-01`, `-02`, ... until free. Two products can share the start; the number keeps them apart.

**Images**
- Ordered by `displayOrder`, then creation. At most one primary per product: a new primary clears the others.
- A variant on an image must belong to that product: 400 "Variant ... does not belong to product ...".
- Upload order: convert, store the file, then save the row. A failed conversion leaves no row.
- Address rule: this store's `/media/<store>/<32 hex>.webp`, or `https://` up to 2048 characters without spaces. Else 400 "Image URL must be an upload from this store or an https:// address".
- Messages: "No image file was provided." · "Image exceeds the 8 MB upload limit." · "Unsupported or corrupt image file. Upload a PNG, JPEG, or WebP." · "Could not store the image. Please try again."
- WebP quality 0.82. Delete removes the row; remove the file afterwards, outside the transaction.

## 3. Discounts and coupons

- Discount: exactly one target (400 "Set exactly one of productId or categoryId"); target must exist; "validTo must be after validFrom"; "A percentage discount cannot exceed 100". `active` missing means true. Delete removes it.
- `GET /api/products/{id}/discounts`: active and inside their dates now, for the product and every category above it.
- Coupon: code unique (409 "Coupon code already exists: ..."); "validUntil must be after validFrom"; `active` missing means true; delete deactivates.
- Validate, checked in this order, all answers 200 with `valid: false`: "Coupon not found" · "Coupon is not active" · "Coupon is expired or not yet valid" · "Coupon usage limit reached" · "Subtotal is below the minimum spend of ...". Valid: message "Valid". `discountAmount` is 0.00 when invalid.
- At checkout a bad coupon is 409 "Coupon not applicable: ..." with the same reason.

## 4. Reviews, wishlist, contact, newsletter

- Review: product must exist (404). One per account per product (409 "You have already reviewed this product"). Edit: author only. Delete: author or staff. Others get 404.
- Summary: average rounded to two decimals, 0 when there are none.
- Wishlist: created on first use; newest first. Unknown variant 400; already there 409 "Variant already in wishlist: ..."; someone else's item 404.
- Contact: stored as OPEN; staff set OPEN or RESOLVED; newest first.
- Newsletter: first time creates a single-use 15% coupon (30 days, one per customer, code `WELCOME15-` + 6) and the subscriber in one transaction, answer contains the code and "Welcome aboard! Use this code for 15% off your first order." Again: `couponCode` null and "You're already on the list — your welcome code was issued when you first signed up."

## 5. Cart

- One cart per account, created when first needed. Lines in the order they were added.
- Adding an existing variant adds the quantities. New: never above 20.
- Adding an unavailable variant: 400 "Variant is not available: ...". Stock is not checked when adding; the line shows `stockQuantity` and checkout decides.
- Line: `unitPrice` is the effective price; `lineTotal` is null and the line is left out of the subtotal when `available` is false.
- A variant that no longer exists appears with null name, SKU and price, `available: false`, stock 0.
- Deleting another account's line: 404 "Cart item not found: ...".

## 6. Dashboards

Counted as paid: `paymentStatus = COMPLETED`. Old boundaries are in **UTC**; the new backend uses `Asia/Kolkata` so "today" means the shop's day (differences only near midnight).

**`/api/analytics/sales`**

| Field | Meaning |
|---|---|
| `revenue.today`, `thisWeek` (from Monday), `thisMonth`, `thisYear`, `allTime` | sum of `total` of paid orders created since then |
| `revenue.monthOverMonthPct` | (this month − last month) ÷ last month × 100, one decimal; null when last month is 0 |
| `totalOrders`, `ordersByStatus` | all orders; a status with none is missing from the map |
| `averageOrderValue` | paid revenue ÷ paid orders, two decimals; 0.00 when none |
| `totalDiscountsGiven` | sum of `discountAmount` of paid orders |
| `couponRedemptions` | paid orders with a coupon code |
| `refunds` | count and total of orders with payment REFUNDED |
| `revenueByPaymentMethod` | paid orders with a method, grouped |
| `operations.awaitingPayment`, `awaitingShipment` | orders PENDING, orders PAID |
| `operations.avgHoursToShip` | average time from creation to the SHIPPED history entry, hours, one decimal; null when none |

- `revenue-trend?months=12`: 1 to 36 months, paid revenue per `YYYY-MM`, oldest first, months without revenue missing.
- `top-products`, `top-customers` (accounts only, no guests): by paid revenue, limit 1 to 100.
- `orders-by-state`: **every order except cancelled**, not only paid (cash on delivery would be invisible); no state is "Other"; largest first.

**`/api/analytics/catalog`**

| Field | Meaning |
|---|---|
| `counts` | active products, active variants (default variants included), active categories |
| `inventory.totalValue` | sum over active variants of active products: stock × list price |
| `inventory.lowStock` | active variants with a `restockLevel` and stock at or below it |
| `inventory.outOfStock` | active variants with stock 0 |
| `totalReviews` | all reviews |
| `promotions.activeCoupons` | coupons marked active, dates ignored |
| `promotions.activeDiscounts` | discounts active and inside their dates |

- `low-stock`: as above, lowest stock first. `top-rated`: products by average rating. `most-wishlisted`: variants by wishlist count.

**`/api/analytics/customers`** (admin): `totalUsers` all accounts; `totalCustomers` with role CUSTOMER; `newThisMonth`, `newThisYear` by creation; `usersByRole` counts an account once per role.

## 7. Emails (new in v1)

| Mail | When | To |
|---|---|---|
| Order confirmation | order placed | account email or guest email |
| Shipped, delivered | order status | same; shipping method and tracking number when known |
| Cancelled | order cancelled | same |
| Welcome coupon | newsletter sign-up | subscriber; the code is also shown on the page as today |
| Staff account created | admin creates staff | the manager: a notice without the password |
| Low stock | stock at or below `restockLevel` after a sale | staff alert address, at most once per variant per day |

Plain text and simple HTML. Store name, colours and logo per store (`BRAND.md` for Matessa; Adventure's own brand is kept in its storefront).
Links use the store's public address. Guests get the `/track` link with the order number only, never the email in the address.
Never in a mail: passwords, tokens, full payment data.
