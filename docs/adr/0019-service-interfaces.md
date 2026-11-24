# ADR-0019: Every service is an interface and an implementation

Status: accepted, 25 November 2026. Changes ADR-0018, which kept services as plain classes.

## Context

Services were classes without interfaces. The owner wants the usual Spring pattern: the contract of a service is an interface, the logic is a class that implements it.

## Decision

`service.interfaces` holds the interfaces, `service.impl` one class per interface, named `<Interface>Impl`. Implementations are not public: everybody else depends on the interface. What a method promises is written on the interface, how it is done on the implementation. (`interface` alone is a reserved word in Java and cannot be a package.)

## Consequences

Two files per service. A layer test fails the build on a service without an interface, an interface without its implementation, or a caller that knows an implementation.
