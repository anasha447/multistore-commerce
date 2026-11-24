# ADR-0001: One modular monolith instead of microservices

Status: accepted, 24 November 2026. The package structure is replaced by ADR-0018

## Context

The old system ran five JVMs and Kafka for a shop with under 100 orders a day. About 2,500 of 13,082 lines existed only because of the split, and stock and orders needed a saga because they sat in two databases.

## Decision

One Spring Boot app with modules enforced by Spring Modulith. Modules talk through interfaces and stored events.

## Consequences

Checkout becomes one transaction. A whole-app deploy replaces independent deploys. A bad module can take the app down; accepted at this size. Reopen when one module needs a different team or scale.
