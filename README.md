# Multistore commerce

Backend of a small e-commerce platform and the Matessa storefront it serves.

| Folder | What |
|---|---|
| `backend/` | Spring Boot modular monolith, Java 21. One running copy and one database per store |
| `frontend/` | Matessa storefront, Next.js. Frozen: the backend fits it, not the other way round |
| `docs/` | Architecture, API contract, business rules, decisions |
| `CONTEXT.md` | The words used in code and documents |

Postgres 17 holds the truth, Redis answers repeated reads and rate limits, images live in Cloudflare R2.

Work is tracked in [milestones](https://github.com/anasha447/multistore-commerce/milestones), one per sprint.
The documents on security, Cloudflare and deployment are kept off this repository; links to them do not resolve here.
