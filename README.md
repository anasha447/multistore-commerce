# Multistore commerce

Backend of a small e-commerce platform and the Matessa storefront it serves.

| Folder | What |
|---|---|
| `backend/` | Spring Boot application in layers (controller, service, repository), Java 21. One running copy and one database per store |
| `frontend/` | Matessa storefront, Next.js. Frozen: the backend fits it, not the other way round |
| `docs/` | Architecture, API contract, business rules, decisions |
| `CONTEXT.md` | The words used in code and documents |

Postgres 17 holds the truth, Redis answers repeated reads and rate limits, images live in Cloudflare R2.

## Run it locally

Needs JDK 21, Node 22 or newer and Docker.

```bash
node scripts/setup-local.mjs                     # once: writes local settings with random passwords
cd backend
docker compose up -d --wait                      # Postgres on 5434, Redis on 6381, this machine only
./mvnw spring-boot:run -Dspring-boot.run.profiles=local   # the app on port 9080
cd ../frontend && npm ci && npm run dev          # the storefront on port 3100
```

`./mvnw verify` in `backend/` runs every test; it starts its own containers. With app and storefront running,
`node scripts/smoke/sign-in.mjs` checks sign-in through the storefront; `limits.mjs` checks limits by visitor address
(storefront started with `TRUST_PROXY_IP_HEADER=true`). The first admin is in `backend/.env`.

## Work

Work is tracked in [milestones](https://github.com/anasha447/multistore-commerce/milestones), one per sprint.
The documents on security, Cloudflare and deployment are kept off this repository; links to them do not resolve here.
