# Testing

"Works" means proven here. The HTTP interface is the main test surface: the 77 tests of the old backend already speak HTTP,
so most of them move with small changes.

## 1. Layers

| Layer | Tools | Proves |
|---|---|---|
| Rules | JUnit, AssertJ, no Spring | pricing, coupons, order states, SKU and order numbers |
| Module | `@ApplicationModuleTest`, Testcontainers Postgres | one module through its interface |
| HTTP | `@SpringBootTest(RANDOM_PORT)`, `RestTestClient`, Testcontainers Postgres and Redis | filters, JSON, status codes |
| Contract | `contract/*.json` | paths, status codes, JSON fields and types as documented |
| Structure | `ApplicationModules.verify()` | no forbidden dependency, no cycle |
| Storefront smoke | both storefront images + app in Compose | nothing in the frontend broke |
| Load | k6 from another machine | memory, response times, cache hit rate |

No H2, no mocked repositories. Mail, R2 and later Razorpay use fakes at their seams, plus one test each against a real protocol (MinIO container, GreenMail, WireMock).

## 2. Contract tests

Nothing is recorded from the old system (ADR-0017). The documents and the storefront's own types are the reference.

1. `src/test/resources/contract/endpoints.json` lists all 91 endpoints: method, path, access, response type, success status, limit.
   `dtos.json` lists every request and response field in order, with its type and validation. Both are generated from
   `API-CONTRACT.md` and `CONTRACT-DTOS.md`; a test fails when they drift apart.
2. Every path the storefront calls must be in `endpoints.json`.
3. Each endpoint gets HTTP tests for a success and every documented failure, checking status, every field name, JSON type,
   null or missing, enum text, error `message` and `code`, and page shape.
4. An endpoint that exists in the app but not in the list, or the other way round once its milestone is done, fails the build.

A difference is a bug in the app unless the owner accepts it and the document is changed with it.

## 3. Tests that must exist

**Access matrix.** For every endpoint in the app's handler mapping × {guest, customer, manager, admin, other store's token, must-change-password token,
disabled account}: expected status class. A new endpoint without a row fails.

**Concurrency** (real threads, real Postgres):
- 50 buyers, 1 unit: exactly 1 order, level 0, 49 × 409, ledger balanced
- 20 identical submits with one key: 1 order
- two orders with the same variants in opposite order: no deadlock
- 10 customers, coupon with 1 use: 1 success
- same customer twice at once, `perUserLimit` 1: 1 success
- cancel twice at once: stock returned once
- sale during a staff stock edit: both visible in the ledger, level never negative

**Rollback.** A failure injected after each checkout step leaves no order, no key, unchanged stock and coupon. A connection cut during commit answers `REQUEST_IN_PROGRESS`, and the retry gives one order.

**No database on GET.** Count SQL statements. First call of each cached endpoint: some. Second call: **zero**. After the matching write: fresh value on the next read.

**Cache safety.**
- checkout uses the new price even when the cache holds the old one
- an entry never outlives a discount's end
- user A's cached `me`, `cart`, `wishlist` is never served to B
- Redis stopped: every endpoint still answers
- reader racing a writer never keeps an old value beyond its lifetime

**Rate limits.** Each rule, its key and its message. 100 shoppers refreshing at once: nobody is limited. Redis stopped: still limited.

**Client address.** Forged `X-Forwarded-For` from another container is ignored.

**Ids.** No answer of any endpoint contains an id below 1,000,000,000,000,000 or above 9,007,199,254,740,991; two records created in a row are not neighbours; every list keeps its order although ids are random; putting someone else's valid id into any URL answers 404.

**Audit.** Every staff endpoint writes one entry; the app's database role cannot update or delete one.

**Two stores.** Two apps, two databases: a token, cookie, image or Redis key of one is useless in the other.

**Startup.** Blank secrets in `prod` stop the app. Migrations run from empty.

## 4. Storefront smoke (the 59 checks, again)

Port the live script from 17 November 2026: sign-up, sign-in, refresh, cart, registered and guest checkout, replay, tracking, oversell refusal, admin product
with image upload, staff creation, forced password change, role refusals, cross-store refusals, security headers, account lock. Both storefronts, production images,
through Caddy with a fake Cloudflare header. Include: product images load, and a page opened with an expired access cookie stays signed in.

## 5. Targets on the 4 GB server

| Measure | Target |
|---|---|
| Cached GET at the app, p95 | 20 ms |
| Checkout, p95 | 300 ms |
| 50 shoppers browsing for 10 minutes | no error, hit rate ≥ 95% |
| 10 checkouts per second for 1 minute | no oversell, p95 < 800 ms |
| App memory after the run | below 600 MB |

## 6. Running

```bash
./mvnw verify
```

On the owner's Windows machine set `JAVA_HOME` to JDK 21, `TESTCONTAINERS_RYUK_DISABLED=true` and
`JAVA_TOOL_OPTIONS=-Djava.net.preferIPv6Addresses=true`. Linux CI needs only JDK 21 and Docker.
