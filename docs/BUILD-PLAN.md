# Build plan

Each milestone ends with everything green and something you can run. Don't start the next before that.

| # | Milestone | Done when |
|---|---|---|
| 0 | **Foundation and contract.** Repository, frozen storefront, CI on every push, the 91 endpoints and their JSON read by tests (ADR-0017), local environment | every endpoint is listed with its shapes; CI green; storefront reaches the app |
| 1 | **Skeleton.** Project on Java 21 with layers (ADR-0018), first migration, random ids, Testcontainers, CI, error shape, request id, store check | CI green; health is up; wrong store answers 400; the role and race checks in `DATA-MODEL.md` are tests |
| 2 | **Identity and access.** Tokens, login, refresh, register, profile, addresses, staff, access policy, matrix test, audit | 15 contract checks green; the Matessa storefront signs in against the new app |
| 3 | **Rate limits and cache base.** Redis, keys, fallback, generation counters, after-commit clearing | limit tests and Redis-down tests green |
| 4 | **Catalog, media, inventory.** Categories, products, variants, images, stock ledger | 24 contract checks green; admin catalog screens work; second GET runs zero SQL |
| 5 | **Promotions and pricing.** Discounts, coupons, quote | contract checks green; pricing rules tested; no entry outlives a discount |
| 6 | **Cart.** Server cart, guest pricing | contract checks green; 50-line cart uses a fixed number of queries |
| 7 | **Checkout and orders.** Transaction, idempotency, states, tracking, staff actions | contract checks green; every concurrency and rollback test green |
| 8 | **Engagement, analytics, email.** Reviews, wishlist, contact, newsletter, dashboards, mails | all 91 contract checks green; mails seen in the fake |
| 9 | **Production shape.** Image, Compose, Caddy, backups, restore, load test, 59 checks with both storefront images | memory within budget; restore done; 59/59 |
| 10 | **Cloudflare and launch.** Tunnel, Access, rules, R2, alerts, go-live list | every box in `CLOUDFLARE.md` 12 and `SECURITY.md` 10 ticked |

## Cut-over

The new platform starts empty. Keep the old one running until: products are entered, a real order was placed, paid on delivery and
cancelled on the new one, the backup was restored once. Then move DNS. Keep the old server's data for the period your tax rules require.

## Phase 2, in order of value

1. Password reset and email verification (new screens)
2. Cash-on-delivery states and `expectedStock` (small admin changes)
3. Turnstile on forms
4. Razorpay with webhooks, holds, refunds
5. Shipping charges, GST invoice, returns
6. Staff authenticator codes; audit screen
7. Verified-purchase reviews
8. Dashboard summary endpoint instead of `size=1000`

## Open decisions (do not block the start)

| # | Question | Default until answered |
|---|---|---|
| 1 | SMTP provider | any SMTP service with an Indian-friendly limit; settings only |
| 2 | Repository name (package is `com.ecommerce.store`) | `multistore-commerce` |
| 3 | Are prices tax-inclusive? | yes |
| 4 | Order cancellation window for customers | until shipped, as today |
| 5 | How long to keep personal data | as in `DATA-MODEL.md` |
| 6 | Which countries may open `/admin` | India |
| 7 | WebP encoder | test the current library's version first |
