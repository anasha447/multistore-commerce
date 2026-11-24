# ADR-0004: Redis for caching and limits, with one app copy

Status: accepted, 24 November 2026

## Context

With one copy, in-process caching would be enough. The owner wants most GETs to skip Postgres and to keep limits across deploys.

## Decision

One 96 MB Redis shared by the stores, separated by ACL user and key prefix. Generation counters for group clearing. Local memory as fallback for limits.

## Consequences

One more container. Ready for two copies without change.
