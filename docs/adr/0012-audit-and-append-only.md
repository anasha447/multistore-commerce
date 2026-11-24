# ADR-0012: Append-only audit and stock ledger

Status: accepted, 24 November 2026

## Context

Managers can change prices, stock and orders, and nothing recorded it.

## Decision

`audit_entry` and `stock_movement` are written in the same transaction. The app's database role has no UPDATE or DELETE on them; migrations run under a different role.

## Consequences

Two database roles per store. Services call `AuditService.record` in their own transaction; a test fails when a staff write is added without a test of its entry.
