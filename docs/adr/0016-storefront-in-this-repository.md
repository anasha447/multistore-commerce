# ADR-0016: The Matessa storefront lives in this repository

Status: accepted, 24 November 2026

## Context

The documents assumed a backend-only repository. The owner wants the backend checked against the real storefront on every push.

## Decision

`frontend/` holds the Matessa storefront, imported once and tagged `storefront-baseline`. It stays frozen for v1: CI fails a change under `frontend/` that is not a declared storefront change. Adventure stays outside and launches later.

## Consequences

One clone runs the whole shop. Storefront lint findings stay open until the freeze ends, so lint reports and does not block.
