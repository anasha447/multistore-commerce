# Caching

Goal set by the owner: **do not hit the database on every GET.** Target: at least 95% of storefront GETs answered
without a SQL statement, proven by a test that counts statements (`TESTING.md`).

## 1. What may be cached

| Endpoint | Cached | Lifetime | Cleared by |
|---|---|---|---|
| `GET /api/categories`, `/tree`, `/{id}`, `/{id}/children` | yes | 1 h | catalog change |
| `GET /api/products` (every page, size, sort, category) | yes | 10 min | catalog change |
| `GET /api/products/{id}`, `/slug/{slug}` | yes | 10 min | catalog change |
| `GET /api/products/{id}/variants` | yes, in two parts | 10 min + stock 30 s | catalog or promotion change; stock change |
| `GET /api/variants/{id}` | yes, in two parts | 10 min + stock 30 s | same |
| `GET /api/products/{id}/images` | yes | 10 min | catalog change |
| `GET /api/products/{id}/discounts`, `/api/discounts/{id}` | yes | 10 min | promotion change |
| `GET /api/products/{id}/reviews`, `/summary` | yes | 5 min | review change on that product |
| `GET /api/orders/payment-methods` | in memory | process life | restart |
| `GET /api/users/me` | yes, per user | 5 min | profile, password, role or status change |
| `GET /api/users/me/addresses` | yes, per user | 5 min | address change |
| `GET /api/cart` | lines per user | 10 min | cart change, order placed |
| `GET /api/wishlist` | yes, per user | 10 min | wishlist change |
| `GET /api/analytics/**` | yes | 60 s | time only |
| `GET /media/**` | Cloudflare and browser | 1 year, immutable | names never reused |
| `GET /api/orders`, `/{id}`, `/by-number`, `/history`, `/track` | **no** | | always live |
| `GET /api/orders/admin`, `/api/admin/users`, `/api/contact`, `/api/subscribers`, `/api/coupons` | **no** | | staff lists are live |

Staff lists stay live on purpose: a manager who just shipped an order must see it. Orders are live for the same reason.
They are indexed, low-volume reads.

**Never read from Redis:** anything at checkout, coupon limits, password or token checks.

## 2. Keys

```
s:<store>:gen:catalog                         a counter
s:<store>:v1:cat:<gen>:products:<hash of query>
s:<store>:v1:cat:<gen>:product:slug:<slug>
s:<store>:v1:stock:<variantId>
s:<store>:v1:rev:<productId>:<gen>:<page>
s:<store>:v1:me:<userId>
s:<store>:v1:cart:<userId>
s:<store>:rl:...                              rate limits (SECURITY.md)
s:<store>:deny:<userId>                       disabled accounts, 17 min
```

- Every store has its own Redis user, allowed to touch only `s:<store>:*`.
- `v1` is bumped when a cached shape changes, so a deploy never reads an old shape.

### Clearing a whole group: generation counters

Product lists have unlimited keys (page × sort × category). Deleting them one by one needs a scan. Instead a
write does one `INCR s:<store>:gen:catalog`; readers include the number in the key, so old entries are never read
again and expire by themselves. One command, no scan, no race.

### Why stock is separate

Stock changes with every order. If it lived inside the product entries, each order would empty the catalog cache.
Variant answers are put together from a catalog part (10 min) and stock values (`MGET`, 30 s, deleted on change).

### Discounts and time

A cached effective price must not outlive the discount. The lifetime of any entry containing prices is the smaller
of 10 minutes and the time until the next discount start or end that affects it.

## 3. Reading and writing

**Read (cache-aside):** get; on a miss load from Postgres, store, return. Misses for the same key inside one app
are merged, so an expired hot key costs one query, not fifty. Lifetimes get ±10% jitter so entries don't expire together.

**Unknown things are cached too:** a slug or id that does not exist is remembered as "missing" for 30 s, so a
scanner cannot turn 404s into database load.

**Write:** change Postgres, commit, then clear. Always after commit (`AfterCommit` helper), or a reader could store the
old value again during the gap. If clearing fails because Redis is down, the entry lives at most its lifetime; that
is why no lifetime for prices or stock is long.

**The remaining race:** a reader that loaded the old row just before the commit can still store it just after the
clear. Bounded by the lifetimes above, and harmless because checkout never reads the cache.

## 4. Redis settings

- `maxmemory 96mb`, policy `volatile-lru`. Entries have lifetimes and may be evicted; generation counters have none and stay.
- Persistence off for cache data. Losing Redis costs a few slow seconds and resets limit counters.
- Private network only, ACL users, `default` user off, dangerous commands (`FLUSHALL`, `KEYS`, `CONFIG`) denied.
- Client: 250 ms command timeout, circuit breaker. Redis down means reads go to Postgres and limits use local memory.

## 5. What is in an entry

JSON of the response DTO, type-bound. Never entities, passwords, hashes, tokens, or order data.
`me` and `addresses` contain personal data: Redis is not exposed, not persisted, and entries are short-lived.

`me` is for display. Permission decisions use the JWT and whether the account is still enabled: staff are looked up in Postgres on every
request, shoppers in the `deny` key (17 minutes, also kept in the memory of the copy that set it, because Redis may evict it) or in Postgres
while Redis is gone. Disabling takes effect at once.

## 6. The layers in front

| Layer | Answers |
|---|---|
| Browser | `/_next/static`, `/media`, brand images |
| Cloudflare | the same files for everyone; never HTML or API JSON |
| Next.js server | page rendering |
| Redis | the table above |
| Postgres | the rest, with indexes and a 10-connection pool |

## 7. Watch

Hit rate per group, keys evicted, Redis memory, and Postgres statements per request. Alert if the catalog hit rate
drops below 90% for 15 minutes, which usually means something clears too often.
