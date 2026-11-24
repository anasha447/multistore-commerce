# ADR-0002: One running copy and one database per store

Status: accepted, 24 November 2026

## Context

The owner runs 2 to 5 own stores. Schema-per-store in one app cost 1,311 lines of tenancy code, and one database role could read both stores.

## Decision

The same image runs once per store with its own database, role, network, Redis user and R2 bucket.

## Consequences

A breach or a bad migration is limited to one store. Costs about 500 MB per store; a third store needs an 8 GB server. Reopen if stores become self-service customers (SaaS).
