# ADR-0005: Stored events instead of Kafka

Status: accepted, 24 November 2026

## Context

Side effects are email, audit and cache clearing. Nothing outside the app consumes events.

## Decision

Modulith's JDBC event registry: events saved in the transaction, delivered after commit, retried.

## Consequences

No broker to run. No replay for future consumers; add a broker when a consumer lives outside the app.
