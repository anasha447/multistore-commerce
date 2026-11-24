# ADR-0006: Stock and coupons change inside the order transaction

Status: accepted, 24 November 2026

## Context

Asynchronous stock decrements once let two buyers pay for the last unit.

## Decision

Guarded updates inside checkout. No reservation, no expiry for cash on delivery. A movement ledger records every change.

## Consequences

Online payment needs a timed hold (phase 2).
