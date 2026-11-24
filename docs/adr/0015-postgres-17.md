# ADR-0015: Postgres 17

Status: accepted, 24 November 2026

## Context

The old system used 16. The new one starts empty.

## Decision

Postgres 17, for the `MAINTAIN` privilege: the app can refresh dashboards without owning anything.

## Consequences

Backups are taken and restored with version 17 tools.
