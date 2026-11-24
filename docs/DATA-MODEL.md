# Data model

One Postgres 17 database per store, schema `shop`. Starts empty: no migration of old data (owner's decision).
Foreign keys are used inside the database, also between modules, because it is one database. A module still only
**reads and writes its own tables** in code.

**Ids.** Every table whose id appears in an answer has a random 16-digit `bigint` id, assigned by the app before the insert, with a `check` that it is at least 1,000,000,000,000,000. Tables that never leave the app (ledger, audit, mail log) use identity columns. Lists are ordered by `created_at` or their own order column, never by id.

Conventions: `timestamptz` in UTC, `numeric(12,2)` money, enum values as `varchar` with a
`check`, `created_at` and `updated_at` where useful. Lazy relations only. Queries that list must be indexed for their sort.

## identity

| Table | Columns | Rules |
|---|---|---|
| `users` | id, email, password_hash, first_name, last_name, phone, enabled, must_change_password, failed_logins, locked_until, created_at, updated_at | unique `lower(email)`; BCrypt strength 12 |
| `user_roles` | user_id FK, role | PK both; role in ADMIN, MANAGER, CUSTOMER |
| `refresh_tokens` | id, user_id FK, token_hash (SHA-256 hex), family_id, expires_at, revoked, rotated_at | unique token_hash; index family_id, user_id |
| `addresses` | id, user_id FK, line1, line2, city, state, postal_code, country, type, is_default, created_at | at most one default per user (partial unique index) |

## catalog

| Table | Columns | Rules |
|---|---|---|
| `categories` | id, parent_id FK, name, slug, description, image_url, display_order, active | unique slug; no cycles (checked on write) |
| `products` | id, category_id FK, name, slug, description (4000), base_price, brand, active, created_at | unique slug; base_price ≥ 0; index (category_id, active), (active, created_at desc) |
| `product_variants` | id, product_id FK, sku, size, color, price_override, restock_level, active, is_default, created_at, version | unique sku; one default per product (partial unique index); `@Version` |
| `product_images` | id, product_id FK, variant_id FK null, url, alt_text, display_order, is_primary | |

Unlike the old schema, the stock number is **not** in `product_variants`, so catalog edits and sales don't fight for one row.

## inventory

| Table | Columns | Rules |
|---|---|---|
| `stock_levels` | variant_id PK FK, quantity, version, updated_at | `check (quantity >= 0)`: the last line of defence |
| `stock_movements` | id, variant_id FK, delta, quantity_after, reason, reference, actor_id, created_at | append-only; unique (reference, variant_id, reason) where reference is not null |

`reference` is `order:<orderNumber>` for sales and cancellations, null for staff edits.

## promotions

| Table | Columns | Rules |
|---|---|---|
| `discounts` | id, product_id FK null, category_id FK null, type, value, valid_from, valid_to, active, created_by FK users | exactly one target (check); valid_to > valid_from; percentage ≤ 100 |
| `coupons` | id, code, discount_type, discount_value, min_spend, max_uses, used_count, per_user_limit, valid_from, valid_until, active | unique code; used_count ≥ 0; the limit is enforced by the guarded claim, so staff may lower `max_uses` later |
| `coupon_redemptions` | id, coupon_id FK, customer_key, order_number, returned_at, created_at | unique order_number; index (coupon_id, customer_key) where returned_at is null |

## cart

| Table | Columns | Rules |
|---|---|---|
| `carts` | id, user_id FK unique, created_at, updated_at | |
| `cart_items` | id, cart_id FK, variant_id FK, quantity, added_at | unique (cart_id, variant_id); quantity between 1 and 20 |

## orders

| Table | Columns | Rules |
|---|---|---|
| `orders` | id, order_number, user_id FK null, guest_email null, status, subtotal, discount_amount, total, coupon_code, shipping_address_snapshot jsonb, shipping_state, payment_status, payment_method, transaction_id, shipping_status, shipping_method, tracking_number, hold_expires_at null (phase 2), version, created_at, updated_at | unique order_number; exactly one of user_id and guest_email; total = subtotal − discount_amount (check); index (user_id, created_at desc), (status, created_at desc), (created_at desc), (shipping_state) |
| `order_items` | id, order_id FK, line_no, variant_id FK, product_name_snapshot, sku_snapshot, unit_price_snapshot, quantity | index order_id |
| `order_status_history` | id, order_id FK, from_status, to_status, note (500), changed_by, changed_at | append-only |
| `idempotency_requests` | idem_key PK (80), requester, request_hash, order_id FK, created_at | purge after 24 h |

`shipping_address_snapshot` is `jsonb` in the table and a string in the response.
The idempotency row is written in the order's transaction, so it needs no IN_PROGRESS state.

## payments

| Table | Columns | Rules |
|---|---|---|
| `payment_attempts` | id, order_id FK, provider, provider_ref, amount, currency, status, created_at, updated_at | unique (provider, provider_ref) |
| `payment_webhooks` (phase 2) | event_id PK, provider, received_at, outcome | de-duplicates webhooks |

## engagement

| Table | Columns | Rules |
|---|---|---|
| `reviews` | id, product_id FK, user_id FK, rating, review_text, created_at | unique (product_id, user_id); rating 1 to 5 |
| `wishlists`, `wishlist_items` | as in the old schema | unique user; unique (wishlist, variant) |
| `contact_queries` | id, email, query_type, message, status, created_at | index created_at desc |
| `subscribers` | id, email, coupon_code, source, created_at | unique lower(email) |

## analytics

Materialized views `mv_top_products`, `mv_top_customers`, `mv_revenue_trend`, each with a unique index, refreshed
`CONCURRENTLY` every 2 minutes under ShedLock. Only orders with payment `COMPLETED`.

## notifications, audit, platform

| Table | Columns | Rules |
|---|---|---|
| `sent_mail` | id, kind, recipient_hash, subject, dedupe_key, status, error, created_at | unique dedupe_key: an event delivered twice sends one mail |
| `audit_entries` | id, at, actor_id, actor_roles, action, entity, entity_id, before jsonb, after jsonb, client_ip, request_id | append-only; index (entity, entity_id, at), (actor_id, at); secrets and hashes never recorded |
| `event_publication` | Modulith's own table | completed rows removed after 7 days |
| `shedlock` | ShedLock's own table | |

## Database roles per store

| Role | May |
|---|---|
| `<store>_owner` | own the schema; used only by Flyway at startup |
| `<store>_app` | select, insert, update, delete on normal tables; **select and insert only** on `stock_movements`, `audit_entries`, `order_status_history`; `MAINTAIN` and `SELECT` on the three views |
| `<store>_backup` | read only, for dumps |

`CONNECT` is revoked from `PUBLIC` on every database. No role can connect to another store's database. No superuser in any app.

Refreshing a materialized view used to need its owner. Postgres 17 has the `MAINTAIN` privilege, so the app role can refresh the three views without owning anything (ADR-0015).

## Seed data

On first start the app creates one account with ADMIN and MANAGER from `ADMIN_EMAIL` and `ADMIN_PASSWORD`, with
`must_change_password = true` (the old seeder left the initial password in place). Existing accounts are never changed.
Demo products are loaded only with profile `demo`.

## Column sizes

| Kind | Type |
|---|---|
| money | `numeric(12,2)` |
| email of an account, guest email | `varchar(255)`; contact and newsletter email `varchar(320)` |
| names, slugs, address lines, city, state, country, SKU snapshot name | `varchar(255)` |
| postal code, phone, size, color | `varchar(50)` |
| SKU | `varchar(100)` |
| product description, review text | `varchar(4000)`; category description, image address `varchar(1000)` |
| coupon code | `varchar(64)`; order number `varchar(40)`; shipping state `varchar(80)`; shipping method, tracking number, transaction id `varchar(100)` |
| customer key and requester (`u:<id>` or `e:<email>`) | `varchar(330)` |
| idempotency key | `varchar(80)`; request hash, token hash `varchar(64)`; family id `varchar(36)` |
| contact query type | `varchar(120)`; message `text`; history note `varchar(500)` |

## Roles and their rights, in SQL terms

For each store, as superuser, once: create roles `<store>_owner`, `<store>_app`, `<store>_backup` (login, no superuser, no createdb, no createrole);
create the database owned by the owner; `revoke all on database ... from public` and grant `connect` to the three; in it, `revoke all on schema public from public`,
`create schema shop authorization <store>_owner`, grant `usage` on it to app and backup; default privileges so the backup role can read every new table.
For the app role set `statement_timeout = 15s` and `idle_in_transaction_session_timeout = 30s`.

Nothing is granted by default. Each migration grants the app role what its tables need: select, insert, update, delete, except `stock_movements`,
`audit_entries`, `order_status_history` (select and insert only) and the three views (select and maintain). A test compares every table in the schema with this rule.

This design was tried on Postgres 17.10: history could not be changed or deleted by the app, the stores could not connect to each other, the app could refresh
the views, 50 simultaneous guarded updates on one unit let exactly one through, and 20 simultaneous inserts of one idempotency key let exactly one through.

## Retention and privacy

- Carts untouched for 90 days, idempotency keys after 24 h, expired refresh tokens after 30 days: removed by jobs.
- Account deletion on request: names, phone and email replaced, addresses deleted, orders kept for tax law with their snapshots.
- Personal data lives in `users`, `addresses`, `orders`, `contact_queries`, `subscribers`. Nowhere else, including logs.
