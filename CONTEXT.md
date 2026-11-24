# CONTEXT: the words of this domain

Use these words in code, tests, commits and documents.

**Store**
One shop with its own products, customers, staff and orders. A store is a running copy of the app with its own database. Identified by a store id (`matessa`, `adventure`).
_Avoid_: tenant, brand, site.

**Storefront**
The Next.js app a shopper sees. It belongs to exactly one store. Its server side is the **BFF**, the only caller of our API.

**Product**
The thing as presented: name, slug, description, base price, category. Holds no stock.

**Variant**
The thing actually sold and stocked: a size or colour of a product. A product without sizes has exactly one hidden **default variant**. Cart, checkout and stock always use variants.

**List price**
What a variant costs before any discount: the variant's override, else the product's base price.

**Effective price**
The list price after the single best active discount. This is what the shopper pays per unit.

**Discount**
An automatic markdown set by staff on a product, or on a category and everything below it. No code. Only the best one applies.

**Coupon**
A code the shopper types. Reduces the whole basket. Has limits. Applies on top of discounts.

**Welcome coupon**
A single-use 15% coupon minted when an address joins the newsletter. Valid 30 days.

**Quote**
The price of a basket at one moment: lines, subtotal, coupon amount, total. Produced only by the pricing module.

**Stock level**
How many units of a variant can be sold now.

**Stock movement**
One recorded change of a stock level, with its reason. Movements are never edited or deleted.

**Take / put back**
Removing units from a stock level for an order, and returning them. Both name the order, and repeating either changes nothing.

**Hold**
Stock taken for an order that is not paid yet, with an expiry time. Only online payment creates holds (phase 2). Cash on delivery has none.

**Cart**
A signed-in shopper's list of variants and quantities on the server. Stores no prices. A guest's cart lives in the browser and is priced by `POST /api/cart/price`.

**Checkout**
Turning a basket into an order. One database transaction.

**Idempotency key**
A value the storefront mints once per checkout visit. The same key with the same basket always gives the same order.

**Order**
A confirmed purchase. Holds **snapshots** (names, SKUs, prices, address) that never change.

**Public id**
The random 16-digit number that names a thing outside the app. Not a secret, not a permission, has no order.

**Order number**
The public name of an order: `MA261117-7K3QXD` (store prefix, date in India, six random characters).

**Order status**
`PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`. The admin screen labels the step PENDING to PAID "Mark dispatched" and PAID to SHIPPED "Mark in transit"; the stored names stay as they are.

**Guest order**
An order without an account, found again by order number plus email.

**Staff**
A MANAGER or an ADMIN. An ADMIN can also manage accounts and see customer analytics.

**Audit entry**
A permanent record of a staff change: who, when, what, before, after.

**Access policy**
The one table that says who may call each endpoint.
