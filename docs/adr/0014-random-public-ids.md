# ADR-0014: Ids that leave the app are random numbers

Status: accepted, 24 November 2026

## Context

Ids were 1, 2, 3. Product pages use slugs and orders use order numbers, but ids appear in `/shop?category=`, `/admin/catalog/`, API calls and JSON. Sequential ids reveal how many products, customers and orders exist and invite guessing. The storefronts are frozen and treat ids as JavaScript numbers, so text ids such as UUIDs are not possible.

## Decision

Primary keys of exposed tables are random integers from 1,000,000,000,000,000 to 9,007,199,254,740,991 (`SecureRandom`), always 16 digits and inside JavaScript's safe range. Assigned by the app before the insert. Lists never order by id.

## Consequences

An id still appears where the browser must name a thing (add to cart, admin page). It cannot be guessed or counted, and it grants nothing: role and ownership are checked every time. Admin screens show long customer numbers. Phase 2 may use slugs for categories and admin pages.
