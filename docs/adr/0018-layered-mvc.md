# ADR-0018: Layered MVC packages instead of modules

Status: accepted, 24 November 2026. Replaces the package structure of ADR-0001; the rest of ADR-0001 (one app, no microservices) stands. Services are changed by ADR-0019.

## Context

The code was organised as fourteen Spring Modulith modules, each with an `internal` package. For one small team it produced many small files and hand-written infrastructure that Spring Boot and Spring Security already provide. The owner wants the familiar Spring layout.

## Decision

Packages by layer at the root of `com.ecommerce.store`: `controller`, `service`, `repository`, `model` (enums in `model.enums`), `dto` (`request`, `response`), `exception`, `security`, `config`. Spring auto-configuration first; own code only where the contract needs something Spring does not do. Lombok everywhere except DTOs, which are records. Spring Modulith stays only for stored events.

## Consequences

Fewer files, and a structure every Spring developer knows. Lost: the build no longer stops one feature from reaching into another. In its place a layer test keeps the direction controller, service, repository, and the rule "a repository is used by the service that owns the table" is kept in review. Splitting a feature out later is more work than with modules.
