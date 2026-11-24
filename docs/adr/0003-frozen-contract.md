# ADR-0003: The storefront contract is frozen for v1

Status: accepted, 24 November 2026

## Context

Two storefronts use 91 endpoints and must not change.

## Decision

Paths, JSON, status codes and error codes are kept exactly and proven with contract tests (ADR-0017).

## Consequences

Some oddities are kept: PAID labelled as dispatched, absolute stock edits, `X-Tenant-ID`. Features that need screens wait for phase 2.
