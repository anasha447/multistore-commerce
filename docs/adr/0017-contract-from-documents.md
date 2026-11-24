# ADR-0017: The contract is proven from the documents, not from recordings

Status: accepted, 24 November 2026

## Context

The first plan was to run the old five-process system and record its answers as golden files. It is heavy to run and the owner wants new code with its own data.

## Decision

`API-CONTRACT.md`, `CONTRACT-DTOS.md` and the storefront's types are the reference. The tests read them directly, so there is one copy.

## Consequences

Behaviour the documents do not mention is not protected by a test. Storefront checks in the browser, at the end of each sprint that has screens, are the safety net.
